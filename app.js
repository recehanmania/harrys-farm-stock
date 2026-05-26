// Harrys Farm V140 - Hilangkan Tulisan Card + Dashboard Menu Simple + Laporan Simple Staff + GSheet Realtime

(function(){
const app = document.getElementById("app");
const cfg = window.SUPABASE_CONFIG || {};
const SESSION_KEY = "harrys_farm_staff_session_v1";
const ADMIN_PIN_KEY = "harrys_farm_admin_pin_v55";
const state = { tab:"dashboard", stockView:"ringkasan", items:[], tx:[], attendance:[], employees:[], closings:[], recipes:[], attendanceDate:"", attendanceMonth:"", searchAbsen:"", payrollDaily:localStorage.getItem("hf_payroll_daily_v57")||"", payrollOvertime:localStorage.getItem("hf_payroll_overtime_v57")||"", payrollAlpha:localStorage.getItem("hf_payroll_alpha_v57")||"", roleMode:localStorage.getItem("harrys_farm_role_v52")||"staff", search:"", category:"Semua", statusFilter:"Semua", locationFilter:"Semua", reportDate:"", reportJenis:"Semua", reportGroup:"Semua", reportSearch:"", reportLimit:150, productionUsageLimit:12, productionBahanCategory:localStorage.getItem("hf_production_bahan_category_v121")||"Semua Bahan", usedBahanCategory:localStorage.getItem("hf_used_bahan_category_v129")||"Semua Bahan", factoryBahanCategory:localStorage.getItem("hf_factory_bahan_category_v119")||"Bahan Tambahan Pangan", loading:false, error:"", flash:"", posCategory:"Semua", posMode:"masuk", itemDraft:{category:"Produk Akhir",name:"",varian:"",ukuran:"",starting_stock:"",unit:"pcs",min_stock:"",pcs_per_dus:"",lokasi:"",supplier:"",qc_status:"OK",batch_lot:"",expired_date:"",deskripsi:"",image_url:""}, lastSync:"", factoryEditId:null, gsheetUrl:localStorage.getItem("hf_gsheet_webhook_url_v87")||"", gsheetAuto:localStorage.getItem("hf_gsheet_auto_sync_v133")==="1", session:loadSession(), loginLoading:false };
let stockSearchTimer = null;

function esc(s){return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

function showBootError(err){
  const msg = esc((err && (err.message || err.reason || err.error)) || err || "Aplikasi gagal dibuka.");
  try{
    app.innerHTML = `<div class="boot boot-error-v111" style="max-width:760px;margin:18px auto;padding:18px;border-radius:18px;background:#fff1f2;border:2px solid #ef4444;color:#7f1d1d;font-family:Arial,sans-serif;line-height:1.45">
      <h2 style="margin:0 0 8px">Aplikasi gagal loading</h2>
      <p style="margin:0 0 12px">${msg}</p>
      <p style="margin:0 0 12px"><b>Solusi cepat:</b> klik Reset Sesi, lalu login ulang. Kalau tetap gagal, buka mode incognito / hapus cache.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="location.reload()" style="padding:10px 14px;border-radius:12px;border:0;background:#0f172a;color:#fff;font-weight:800">Muat Ulang</button>
        <button onclick="localStorage.removeItem('harrys_farm_staff_session_v1');location.reload()" style="padding:10px 14px;border-radius:12px;border:0;background:#dc2626;color:#fff;font-weight:800">Reset Sesi / Login Ulang</button>
        <button onclick="if(window.caches){caches.keys().then(function(n){n.forEach(function(x){caches.delete(x)})}).finally(function(){location.reload()})}else{location.reload()}" style="padding:10px 14px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:800">Bersihkan Cache</button>
      </div>
    </div>`;
  }catch(_e){}
}
window.addEventListener("error", function(e){ showBootError(e.error || e.message || "Error aplikasi"); });
window.addEventListener("unhandledrejection", function(e){ showBootError(e.reason || "Error koneksi/data"); });
function fetchWithTimeout(url, options={}, ms=12000){
  if(typeof AbortController === "undefined"){
    return Promise.race([fetch(url, options), new Promise((_, reject)=>setTimeout(()=>reject(new Error("Koneksi terlalu lama. Cek internet / Supabase / login ulang.")), ms))]);
  }
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), ms);
  const finalOptions = Object.assign({}, options, {signal: controller.signal});
  return fetch(url, finalOptions).catch(err=>{
    if(err && err.name === "AbortError") throw new Error("Koneksi terlalu lama. Cek internet / Supabase / login ulang.");
    throw err;
  }).finally(()=>clearTimeout(timer));
}
function today(){return new Date().toISOString().slice(0,10);}
function nowTime(){return new Date().toTimeString().slice(0,5);}
function txTime(t){
  const raw = t && (t.jam_transaksi || t.transaction_time || "");
  if(raw) return String(raw).slice(0,5);
  if(t && t.created_at){
    try{return new Date(t.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}).replace(".",":");}catch{return "-";}
  }
  return "-";
}
function fmt(v){const n=Number(v||0);return Number.isInteger(n)?n.toLocaleString("id-ID"):n.toLocaleString("id-ID",{maximumFractionDigits:2});}
const ITEM_IMAGES_KEY = "hf_item_images_v127";
function itemImageMap(){ try{return JSON.parse(localStorage.getItem(ITEM_IMAGES_KEY)||"{}");}catch{return {};} }
function localItemImage(id){ const m=itemImageMap(); return String(m[String(id)] || "").trim(); }
function setLocalItemImage(id, src){ if(!id) return; const m=itemImageMap(); if(src){ m[String(id)] = src; } else { delete m[String(id)]; } localStorage.setItem(ITEM_IMAGES_KEY, JSON.stringify(m)); }
function validImageSrc(raw){ raw=String(raw || "").trim(); if(!raw) return ""; if(/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw; return ""; }
function itemImageSrc(item){ const raw=String(item && item.image_url || "").trim() || (item && item.id ? localItemImage(item.id) : ""); return validImageSrc(raw); }
function itemImageHtml(item, cls="stock-item-image-v125") { const src=itemImageSrc(item); return src ? `<div class="${cls}"><img src="${esc(src)}" alt="${esc(item && item.name || "gambar item")}" loading="lazy"></div>` : `<div class="${cls} placeholder"><span>📦</span></div>`; }
function isImageColumnError(e){ const msg=String(e && (e.message || e) || "").toLowerCase(); return msg.includes("image_url") || msg.includes("schema cache") || msg.includes("could not find") || msg.includes("column") || msg.includes("payload") || msg.includes("too large"); }
async function saveItemImage(id, src){
  if(!requireAdmin("Simpan gambar barang")) return;
  const clean = validImageSrc(src);
  setLocalItemImage(id, clean);
  try{
    await api("/items?id=eq."+encodeURIComponent(id), {method:"PATCH", headers:{"Prefer":"return=representation"}, body:JSON.stringify({image_url: clean || null})});
    await loadAll(true);
    state.flash = clean ? "Gambar barang berhasil disimpan ke database." : "Gambar barang berhasil dihapus.";
  }catch(e){
    if(isImageColumnError(e)){
      await loadAll(true);
      state.flash = clean ? "Gambar tersimpan sementara di browser. Jalankan SQL V127 supaya tersimpan permanen dan terlihat di semua staff." : "Gambar lokal dihapus. Jalankan SQL V127 kalau ingin database gambar aktif.";
    }else{
      alert("Gagal simpan gambar: "+e.message);
      return;
    }
  }
  render();
  setTimeout(()=>{state.flash=""; render();}, 3600);
}
async function resizeImageFileToDataUrl(file, maxSize=640){
  if(!file) throw new Error("File gambar tidak ditemukan.");
  if(!String(file.type||"").startsWith("image/")) throw new Error("File harus berupa gambar.");
  const rawDataUrl = await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error("Gagal membaca file gambar.")); r.readAsDataURL(file); });
  const optimized = await new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>{ try{ const max=Math.max(320, Number(maxSize||640)); let w=img.width||max, h=img.height||max; const ratio=Math.min(1, max/Math.max(w,h)); w=Math.max(1, Math.round(w*ratio)); h=Math.max(1, Math.round(h*ratio)); const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h; const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,w,h); let out=canvas.toDataURL("image/jpeg",0.82); if(out.length > 450000){ out=canvas.toDataURL("image/jpeg",0.68); } if(out.length > 850000){ out=canvas.toDataURL("image/jpeg",0.55); } resolve(out); }catch(err){ reject(err); } }; img.onerror=()=>reject(new Error("Gagal memproses gambar.")); img.src=rawDataUrl; });
  return optimized;
}
function configured(){return cfg.url && cfg.anonKey && !cfg.anonKey.includes("TEMPEL_") && !cfg.url.includes("TEMPEL_");}
function apiBase(){return cfg.url.replace(/\/$/,"") + "/rest/v1";}
function authBase(){return cfg.url.replace(/\/$/,"") + "/auth/v1";}
function loadSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}catch{return null;}}
function saveSession(s){state.session=s; if(s)localStorage.setItem(SESSION_KEY,JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY);}
function accessToken(){return state.session && state.session.access_token ? state.session.access_token : "";}
function userEmail(){return state.session && state.session.user && state.session.user.email ? state.session.user.email : "";}
function headers(extra){
  const auth = accessToken() ? ("Bearer " + accessToken()) : ("Bearer " + cfg.anonKey);
  return Object.assign({"apikey":cfg.anonKey,"Authorization":auth,"Content-Type":"application/json"}, extra || {});
}
async function authRequest(path, options={}){
  const res = await fetchWithTimeout(authBase()+path, Object.assign({}, options, {headers:Object.assign({"apikey":cfg.anonKey,"Content-Type":"application/json"}, options.headers||{})}), 12000);
  const text = await res.text();
  let data=null; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!res.ok){throw new Error((data && (data.msg || data.message || data.error_description || data.error)) || text || ("HTTP "+res.status));}
  return data;
}
async function api(path, options={}, retry=true){
  // V87 Export GSheet Harian: kalau JWT expired saat simpan/update, refresh token otomatis lalu ulangi request.
  const finalOptions = Object.assign({}, options, { headers: headers(options.headers) });
  const res = await fetchWithTimeout(apiBase()+path, finalOptions, 12000);
  const text = await res.text();
  let data = null; try{ data = text ? JSON.parse(text) : null; }catch{ data = text; }
  if(!res.ok){
    const msg = (data && (data.message || data.error || data.hint || data.details)) || text || ("HTTP "+res.status);
    const expired = String(msg).toLowerCase().includes("jwt expired") || String(msg).toLowerCase().includes("jwt") || res.status === 401;
    if(retry && expired && state.session && state.session.refresh_token){
      const refreshed = await tryRefreshSession();
      if(refreshed) return api(path, options, false);
    }
    if(expired){
      saveSession(null);
      renderLogin();
      throw new Error("Sesi login habis. Silakan login ulang.");
    }
    throw new Error(msg);
  }
  return data;
}
async function login(email, password){
  state.loginLoading = true; state.error=""; render();
  try{
    const data = await authRequest("/token?grant_type=password", {method:"POST", body:JSON.stringify({email, password})});
    saveSession(data);
    await loadAll();
  }catch(e){
    state.error = "Login gagal: " + (e.message || String(e));
    state.loginLoading = false; render();
  }
}
function logout(){
  saveSession(null);
  state.items=[]; state.tx=[]; state.error="";
  render();
}
async function tryRefreshSession(){
  if(!state.session || !state.session.refresh_token) return false;
  try{
    const data = await authRequest("/token?grant_type=refresh_token", {method:"POST", body:JSON.stringify({refresh_token:state.session.refresh_token})});
    saveSession(data);
    return true;
  }catch{
    saveSession(null);
    return false;
  }
}
function statusOf(stock,min){if(stock<=0)return{label:"HABIS",cls:"habis"}; if(stock<min)return{label:"DI BAWAH MINIMUM",cls:"kurang"}; return{label:"AMAN",cls:"aman"};}

// V97: batas minimum selalu ada. Kalau data lama min_stock masih 0/kosong, aplikasi pakai default sesuai kategori.
function defaultMinStock(item){
  const cat = (()=>{ try{return simpleStockCategory(item);}catch(e){return String(item && item.category || "");} })();
  const unit = String(item && item.unit || "").toLowerCase();
  const pcsDus = (()=>{ try{return pcsPerDus(item);}catch(e){return Number(item && item.pcs_per_dus || 0);} })();
  if(cat === "Produk Jadi"){
    if(unit === "pcs") return pcsDus > 0 ? pcsDus : 20;
    if(unit === "kg") return 10;
    return 10;
  }
  if(cat === "Bahan Baku"){
    if(unit === "kg") return 20;
    if(unit === "gr" || unit === "gram") return 1000;
    if(unit === "liter" || unit === "ltr") return 5;
    return 10;
  }
  if(cat === "Kemasan"){
    if(unit === "roll") return 2;
    if(unit === "pcs") return 100;
    return 20;
  }
  if(cat === "Bahan Penolong"){
    if(unit === "ml") return 250;
    if(unit === "liter" || unit === "ltr") return 2;
    if(unit === "roll") return 1;
    return 10;
  }
  if(unit === "gr" || unit === "gram") return 500;
  if(unit === "kg") return 5;
  if(unit === "pcs") return 10;
  return 5;
}
function minStockValue(item){
  const raw = Number(item && item.min_stock || 0);
  return raw > 0 ? raw : defaultMinStock(item);
}

function sortByName(a,b){
  return String(a.name || "").localeCompare(String(b.name || ""), "id-ID", {numeric:true, sensitivity:"base"});
}
function sortText(a,b){
  return String(a || "").localeCompare(String(b || ""), "id-ID", {numeric:true, sensitivity:"base"});
}

function isArchivedItem(item){
  const v = item && item.archived;
  return v === true || v === "true" || v === 1 || v === "1" || String(v).toLowerCase() === "yes";
}
function activeItems(){
  return (state.items || []).filter(i => !isArchivedItem(i)).slice().sort(sortByName);
}
function archivedItems(){
  return (state.items || []).filter(i => isArchivedItem(i)).slice().sort(sortByName);
}

function rows(){
  return activeItems().map(item=>{
    const related = state.tx.filter(t=>Number(t.item_id)===Number(item.id));
    const masuk = related.reduce((s,t)=>s+Number(t.masuk||0),0);
    const keluar = related.reduce((s,t)=>s+Number(t.keluar||0),0);
    const stock = Number(item.starting_stock||0)+masuk-keluar;
    const physical = item.physical_stock===null || item.physical_stock===undefined ? "" : Number(item.physical_stock);
    const selisih = physical==="" ? "" : physical-stock;
    const min_stock = minStockValue(item);
    const raw_min_stock = Number(item.min_stock || 0);
    const st = statusOf(stock, min_stock);
    return Object.assign({}, item, {min_stock, raw_min_stock, masuk, keluar, stock, physical, selisih, status:st, rekomendasi:Math.max(0, min_stock-stock)});
  });
}
async function loadAll(silent=false){
  if(!configured()) return renderSetup();
  if(!accessToken()) return renderLogin();
  try{
    if(!silent){state.loading=true; state.error=""; render();}
    const [items, tx] = await Promise.all([
      api("/items?select=*&order=id.asc"),
      api("/stock_transactions?select=*&order=date.desc,created_at.desc")
    ]);

    let attendance = [];
    let employees = [];
    let closings = [];
    try{
      attendance = await api("/employee_attendance?select=*&order=date.desc,created_at.desc");
    }catch(absenErr){
      attendance = [];
      console.warn("Tabel employee_attendance belum aktif. Jalankan SQL V48/V52.", absenErr);
    }

    try{
      employees = await api("/employee_master?select=*&order=name.asc");
    }catch(empErr){
      employees = [];
      console.warn("Tabel employee_master belum aktif. Jalankan SQL V48/V52.", empErr);
    }

    try{
      closings = await api("/daily_closing?select=*&order=date.desc");
    }catch(closeErr){
      closings = [];
      console.warn("Tabel daily_closing belum aktif. Jalankan SQL V52.", closeErr);
    }

    let recipes = [];
    try{
      recipes = await api("/product_recipes?select=*&order=product_id.asc,ingredient_name.asc");
    }catch(recipeErr){
      recipes = [];
      console.warn("Tabel product_recipes belum aktif. Jalankan SQL V56.", recipeErr);
    }

    state.items = (items || []).map(i => Object.assign({archived:false}, i)).slice().sort(sortByName);
    state.tx = tx || [];
    state.attendance = attendance || [];
    state.employees = (employees || []).filter(e => e.active !== false).slice().sort((a,b)=>sortText(a.name,b.name));
    state.closings = closings || [];
    state.recipes = recipes || [];
    state.lastSync = new Date().toLocaleTimeString("id-ID");
    state.loading=false; state.error=""; state.loginLoading=false;
    render();
  }catch(e){
    const msg = e.message || String(e);
    if(msg.includes("JWT") || msg.includes("expired") || msg.includes("invalid claim") || msg.includes("401")){
      const ok = await tryRefreshSession();
      if(ok) return loadAll(silent);
      state.error = "Sesi login habis. Silakan login ulang.";
    }else{
      state.error = msg;
    }
    state.loading=false; state.loginLoading=false; render();
  }
}

function extractMissingColumns(msg){
  const s = String(msg || "");
  const cols = new Set();
  let m;
  const patterns = [
    /Could not find the '([^']+)' column/gi,
    /column "([^"]+)" does not exist/gi,
    /column '([^']+)' does not exist/gi,
    /Could not find column ([A-Za-z0-9_]+)/gi
  ];
  for(const re of patterns){
    while((m = re.exec(s))){ cols.add(m[1]); }
  }
  return [...cols];
}


function normalizeNameText(s){
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}
function findDusPackagingItem(jenisDus){
  const jenis = normalizeNameText(jenisDus);
  const active = activeItems();

  // Prioritas utama: item bernama Kardus Polos / Kardus Sablon.
  let found = active.find(i => {
    const n = normalizeNameText(i.name);
    return n.includes("kardus") && n.includes(jenis);
  });
  if(found) return found;

  // Cadangan: Dus Polos / Dus Sablon.
  found = active.find(i => {
    const n = normalizeNameText(i.name);
    return /\bdus\b/.test(n) && n.includes(jenis);
  });
  if(found) return found;

  return null;
}
function packagingStockInfo(jenisDus){
  const item = findDusPackagingItem(jenisDus);
  if(!item) return {item:null, stock:null, label:"Item belum ada"};
  const row = stockRowByItemId(item.id);
  return {item, stock: row ? row.stock : Number(item.starting_stock || 0), label: `${fmt(row ? row.stock : item.starting_stock || 0)} ${item.unit || "pcs"}`};
}

function isPlasticPackagingItem(item){
  const n = normalizeNameText(item && item.name);
  const c = normalizeNameText(item && item.category);
  const area = normalizeNameText(simpleStockCategory(item || {}));
  if(!(n.includes("plastik") || n.includes("southmount") || n.includes("polos") || n.includes("hf"))) return false;
  if(n.includes("sarung tangan") || n.includes("masker") || n.includes("nurse cap") || n.includes("trashbag")) return false;
  if(area === "bahan penolong") return false;
  return area === "kemasan" || c.includes("kemas") || n.includes("plastik") || n.includes("southmount");
}
function plasticPackagingItems(){
  return activeItems()
    .filter(isPlasticPackagingItem)
    .sort((a,b)=> sortText(productSizeLabel(a), productSizeLabel(b)) || sortText(a.name || "", b.name || ""));
}
function plasticSelectedLabel(v){
  if(!v || v === "Auto") return "Auto";
  const m = String(v).match(/^ITEM:(\d+)$/);
  if(m){
    const item = itemById(m[1]);
    return item ? item.name : "Plastik terpilih";
  }
  return String(v);
}
function plastikOptions(){
  const plastics = plasticPackagingItems();
  return [
    {value:"Auto", label:"Auto - pilih plastik paling cocok"},
    ...plastics.map(i=>{
      const row = stockRowByItemId(i.id);
      const stock = row ? Number(row.stock || 0) : Number(i.starting_stock || 0);
      const status = stock <= 0 ? "HABIS" : (Number(i.min_stock || 0) && stock < Number(i.min_stock || 0) ? "DI BAWAH MIN" : "AMAN");
      return {value:`ITEM:${i.id}`, label:`${i.name} — stok ${fmt(stock)} ${i.unit || "pcs"} — ${status}`};
    })
  ];
}
function productSizeLabel(item){
  const n = normalizeNameText(item && item.name);
  if(/250\s*(gr|g)/.test(n) || n.includes("250gr") || n.includes("250 g")) return "250gr";
  if(/500\s*(gr|g)/.test(n) || n.includes("500gr") || n.includes("500 g")) return "500gr";
  if(n.includes("2 kg") || n.includes("2kg")) return "2kg";
  if(n.includes("1 kg") || n.includes("1kg")) return "1kg";
  return "";
}
function productFamilyWords(item){
  const stop = new Set(["plastik","uk","gr","g","kg","250","500","1","2","sablon","polos","hf","southmount","plain","seasoned"]);
  return normalizeNameText(item && item.name).replace(/[^a-z0-9]+/g," ").split(" ").filter(w=>w.length>=4 && !stop.has(w));
}
function inferPlasticBrand(item){
  const n = normalizeNameText(item && item.name);
  if(n.includes("southmount")) return "Southmount";
  if(n.includes("polos") || n.includes("plain")) return "Polos";
  if(n.includes("hf")) return "HF";
  return "Auto";
}
function plasticCandidateScore(plasticItem, productItem, selected){
  const pn = normalizeNameText(plasticItem && plasticItem.name);
  const productName = normalizeNameText(productItem && productItem.name);
  const size = productSizeLabel(productItem);
  const pSize = productSizeLabel(plasticItem);
  let score = 0;

  if(!isPlasticPackagingItem(plasticItem)) return -999;

  const selectedText = String(selected || "Auto");
  const exactId = selectedText.match(/^ITEM:(\d+)$/);
  if(exactId) return Number(plasticItem.id) === Number(exactId[1]) ? 10000 : -999;
  if(selectedText !== "Auto"){
    const s = normalizeNameText(selectedText);
    if(s && (pn === s || pn.includes(s))) score += 200;
  }

  const brand = selectedText && selectedText !== "Auto" ? selectedText : inferPlasticBrand(productItem);
  const brandNorm = normalizeNameText(brand);
  if(brand !== "Auto"){
    if(brandNorm.includes("southmount") && pn.includes("southmount")) score += 80;
    if(brandNorm === "hf" && pn.includes("hf")) score += 80;
    if(brandNorm.includes("polos") && pn.includes("polos")) score += 80;
    if(brandNorm.includes("baru") && pn.includes("baru")) score += 80;
  }else{
    if(productName.includes("southmount") && pn.includes("southmount")) score += 80;
    if(productName.includes("polos") && pn.includes("polos")) score += 60;
    if(productName.includes("hf") && pn.includes("hf")) score += 60;
  }

  if(size && pSize === size) score += 120;
  else if(size && pn.includes(size.replace("gr",""))) score += 90;

  productFamilyWords(productItem).forEach(w=>{ if(pn.includes(w)) score += 35; });

  if(pn.includes("sablon")) score += 12;
  if(pn.includes("plastik")) score += 5;
  return score;
}
function findPlasticPackagingItem(productItem, selectedPlastic){
  const selected = selectedPlastic || "Auto";
  const exactId = String(selected).match(/^ITEM:(\d+)$/);
  if(exactId){
    const item = itemById(exactId[1]);
    return item && isPlasticPackagingItem(item) ? item : null;
  }
  const candidates = plasticPackagingItems()
    .map(i => ({item:i, score:plasticCandidateScore(i, productItem, selected)}))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score || sortText(a.item.name||"", b.item.name||""));
  return candidates[0] ? candidates[0].item : null;
}
function plasticStockInfo(productItem, selectedPlastic){
  const item = findPlasticPackagingItem(productItem, selectedPlastic || "Auto");
  if(!item) return {item:null, stock:null, label:"Auto: belum ketemu"};
  const row = stockRowByItemId(item.id);
  return {item, stock: row ? row.stock : Number(item.starting_stock || 0), label: `${item.name}: ${fmt(row ? row.stock : item.starting_stock || 0)} ${item.unit || "pcs"}`};
}
function plasticStockListHtml(){
  const plastics = plasticPackagingItems();
  if(!plastics.length) return `<div class="warning">Master plastik belum ada di kategori Kemasan.</div>`;
  return `<div class="plastic-stock-list-v107">${plastics.map(i=>{
    const row = stockRowByItemId(i.id);
    const stock = row ? Number(row.stock || 0) : Number(i.starting_stock || 0);
    const min = Number(i.min_stock || 0);
    const cls = stock <= 0 ? "habis" : (min && stock < min ? "kurang" : "aman");
    const label = stock <= 0 ? "HABIS" : (min && stock < min ? "BAWAH MIN" : "AMAN");
    return `<div class="plastic-stock-chip-v107 ${cls}"><b>${esc(i.name)}</b><span>${fmt(stock)} ${esc(i.unit||"pcs")}</span><small>${label}</small></div>`;
  }).join("")}</div>`;
}

function autoCutDetail(productItem, keluarDus, keluarItem, jenisDus, jenisPlastik){
  const dus = Number(keluarDus || 0);
  const itemPcs = Number(keluarItem || 0);
  const totalProdukPcs = inputToPcs(dus, itemPcs, productItem);
  const dusItem = dus > 0 ? findDusPackagingItem(jenisDus || "Polos") : null;
  const plastikItem = totalProdukPcs > 0 ? findPlasticPackagingItem(productItem, jenisPlastik || "Auto") : null;

  return {
    produk: productItem || null,
    produkQty: totalProdukPcs,
    produkText: productItem ? `${productItem.name}: ${fmt(totalProdukPcs)} ${productItem.unit || "pcs"}` : "-",
    dusItem,
    dusQty: dus,
    dusText: dus > 0 ? `${dusItem ? dusItem.name : `Kardus ${jenisDus || "Polos"}`}: ${fmt(dus)} pcs` : "Tidak potong kardus",
    plastikItem,
    plastikQty: totalProdukPcs,
    plastikText: totalProdukPcs > 0 ? `${plastikItem ? plastikItem.name : "Plastik belum ketemu"}: ${fmt(totalProdukPcs)} pcs` : "Tidak potong plastik"
  };
}

function dataQualityChecks(){
  const active = activeItems();

  // V62 FIX:
  // Pcs/Dus Produk hanya mengecek kategori Produk Akhir / Produk Jadi.
  // Tidak lagi mengecek nama yang mengandung 1kg, 2kg, atau 500,
  // supaya plastik/kemasan seperti Southmount 500 atau HF 1kg/2kg tidak ikut merah.
  const produkTanpaDus = active.filter(i => {
    const c = String(i.category || "").toLowerCase().trim();
    const isProduk = c.includes("produk akhir") || c.includes("produk jadi");
    return isProduk && pcsPerDus(i) <= 0;
  });

  const kardusPolos = findDusPackagingItem("Polos");
  const kardusSablon = findDusPackagingItem("Sablon");
  const plastikCount = active.filter(i => {
    const n = normalizeNameText(i.name);
    const c = normalizeNameText(i.category);
    return n.includes("plastik") || n.includes("southmount") || c.includes("plastik");
  }).length;

  return {
    produkTanpaDus,
    kardusPolos,
    kardusSablon,
    plastikCount,
    ok: produkTanpaDus.length === 0 && kardusPolos && kardusSablon && plastikCount > 0
  };
}

function todaysProductionCount(){
  return productionRows().filter(t => t.date === today()).length;
}
function todaysFactoryInfo(){
  const rows = state.tx.filter(t => t.date === today() && String(t.jenis_transaksi||"").toLowerCase()==="keluar_pabrik");
  return {count: rows.length, dus: rows.reduce((s,t)=>s+Number(t.keluar_dus||0),0), pcs: rows.reduce((s,t)=>s+Number(t.keluar||0),0)};
}
function todaysUsedInfo(){
  const rows = dailyUsedRows(today());
  return {count: rows.length, qty: rows.reduce((s,t)=>s+Number(t.keluar||0),0)};
}
function dailyChecklist(){
  const r = rows();
  const low = r.filter(x=>x.status.label!=="AMAN").length;
  const employees = employeeRows().length;
  const absenToday = attendanceTodayRows().length;
  const produksiToday = todaysProductionCount();
  const factory = todaysFactoryInfo();
  const used = todaysUsedInfo();
  const dq = dataQualityChecks();

  return [
    {title:"Absen karyawan", value:`${absenToday}/${employees || 0}`, ok: employees ? absenToday >= employees : false, note: employees ? "target sesuai jumlah karyawan aktif" : "master karyawan belum ada", tab:"absen"},
    {title:"Produksi hari ini", value:`${produksiToday} transaksi`, ok: produksiToday > 0, note:"input hasil produksi jika ada produksi", tab:"produksi"},
    {title:"Barang dipakai", value:`${used.count} item`, ok: used.count > 0, note:"potong bahan/bumbu yang dipakai hari ini", tab:"pakaiBahan"},
    {title:"Keluar pabrik", value:`${fmt(factory.dus)} dus`, ok: factory.count > 0, note:"cek auto potong produk, dus, plastik", tab:"keluarPabrik"},
    {title:"Stok kritis", value:`${low} item`, ok: low === 0, note: low ? "perlu cek/beli/opname" : "stok aman", tab:"stock"},
    {title:"Master data", value: dq.ok ? "Lengkap" : "Perlu cek", ok: dq.ok, note:"cek pcs/dus, kardus, plastik", tab:"dashboard"},
    {title:"Laporan", value:"Siap print", ok:true, note:"export/print laporan harian", tab:"laporan"}
  ];
}
function recommendationList(){
  const r = rows();
  const low = r.filter(x=>x.status.label!=="AMAN");
  const minus = r.filter(x=>Number(x.stock)<0);
  const dq = dataQualityChecks();
  const employees = employeeRows().length;
  const factory = todaysFactoryInfo();
  const recs = [];

  if(minus.length) recs.push({level:"danger", title:"Ada stok minus", text:`${minus.length} item stok minus. Cek transaksi atau edit stok opname.` , tab:"stock"});
  if(low.length) recs.push({level:"warn", title:"Barang kurang/habis", text:`${low.length} item perlu dibeli/diopname. Prioritaskan barang paling kritis.`, tab:"stock"});
  if(dq.produkTanpaDus.length) recs.push({level:"warn", title:"Produk belum punya Pcs/Dus", text:`${dq.produkTanpaDus.length} produk belum lengkap. Auto potong dus bisa kurang akurat.`, tab:"stock"});
  if(!dq.kardusPolos || !dq.kardusSablon) recs.push({level:"warn", title:"Master kardus belum lengkap", text:"Pastikan Kardus Polos dan Kardus Sablon ada di stok.", tab:"stock"});
  if(dq.plastikCount <= 0) recs.push({level:"warn", title:"Master plastik belum ada", text:"Tambahkan item plastik agar auto potong plastik berjalan.", tab:"stock"});
  if(!employees) recs.push({level:"warn", title:"Master karyawan kosong", text:"Jalankan SQL V48/V49 atau tambah karyawan di menu Absen.", tab:"absen"});
  if(factory.count === 0) recs.push({level:"info", title:"Keluar pabrik hari ini belum ada", text:"Kalau ada pengiriman, input di menu Keluar agar produk/dus/plastik terpotong otomatis.", tab:"keluarPabrik"});
  if(todaysUsedInfo().count === 0) recs.push({level:"info", title:"Barang dipakai belum diinput", text:"Input bahan/bumbu/plastik/kentang yang dipakai hari ini supaya stok opname langsung berkurang.", tab:"pakaiBahan"});

  if(!recs.length) recs.push({level:"ok", title:"Sistem aman", text:"Data utama sudah lengkap. Lanjut input harian seperti biasa.", tab:"input"});
  return recs.slice(0,6);
}



function finalAuditChecklist(){
  const dq = dataQualityChecks();
  return [
    {name:"Stok Online Supabase", ok: configured() && !!accessToken()},
    {name:"Master Barang Aktif", ok: activeItems().length > 0},
    {name:"Pcs/Dus Produk", ok: dq.produkTanpaDus.length === 0},
    {name:"Kardus Polos", ok: !!dq.kardusPolos},
    {name:"Kardus Sablon", ok: !!dq.kardusSablon},
    {name:"Master Plastik", ok: dq.plastikCount > 0},
    {name:"Master Karyawan", ok: employeeRows().length > 0},
    {name:"Closing Harian", ok: true},
    {name:"Rekap Absen Bulanan", ok: true},
    {name:"Blok Stok Minus", ok: true},
    {name:"Cegah Absen Dobel", ok: true},
    {name:"Edit Absen", ok: true},
    {name:"PIN Admin", ok: true},
    {name:"Master Formula", ok: true},
    {name:"Edit Transaksi", ok: true},
    {name:"Laporan Gaji", ok: true},
    {name:"Barcode Ready", ok: true},
    {name:"Barcode UI", ok: true},
    {name:"Final Stable", ok: true},
    {name:"SQL Gabungan", ok: true},
    {name:"Paket Final", ok: true},
    {name:"V60 Fixed", ok: true},
    {name:"Supabase Online", ok: configured() && !!accessToken()}
  ];
}
function finalAuditScore(){
  const arr = finalAuditChecklist();
  return {ok: arr.filter(x=>x.ok).length, total: arr.length};
}

function currentMonth(){
  return new Date().toISOString().slice(0,7);
}
function adminPin(){
  return localStorage.getItem(ADMIN_PIN_KEY) || "1234";
}
function verifyAdminPin(){
  const pin = prompt("Masukkan PIN Admin:", "");
  if(pin === adminPin()) return true;
  alert("PIN Admin salah.");
  return false;
}
function changeAdminPin(){
  if(!verifyAdminPin()) return;
  const next = prompt("Masukkan PIN Admin baru minimal 4 angka:", "");
  if(!next || next.length < 4) return alert("PIN minimal 4 angka.");
  localStorage.setItem(ADMIN_PIN_KEY, next);
  alert("PIN Admin berhasil diganti.");
}
function roleLabel(){
  return (state.roleMode || "staff") === "admin" ? "Admin" : "Staff";
}
function isAdmin(){
  return (state.roleMode || "staff") === "admin";
}
function setRoleMode(v){
  const next = v === "staff" ? "staff" : "admin";
  if(next === "admin" && state.roleMode !== "admin"){
    if(!verifyAdminPin()){
      render();
      return;
    }
  }
  state.roleMode = next;
  localStorage.setItem("harrys_farm_role_v52", state.roleMode);
  state.flash = `Mode UI ${roleLabel()} aktif`;
  render();
  setTimeout(()=>{state.flash=""; render();}, 2200);
}
function requireAdmin(action){
  if(isAdmin()) return true;
  alert(`${action || "Aksi ini"} hanya boleh mode Admin. Ubah Mode UI ke Admin dan masukkan PIN.`);
  return false;
}
function isClosedDate(date){
  return (state.closings || []).some(c => c.date === date);
}
function closedDateLabel(date){
  const c = (state.closings || []).find(x => x.date === date);
  return c ? `Tanggal ${date} sudah closing oleh ${c.petugas || "-"}${c.note ? " | " + c.note : ""}` : "";
}
function guardDateOpen(date, action){
  if(!date) return true;
  if(isClosedDate(date)){
    alert(`${action || "Input"} diblok. ${closedDateLabel(date)}. Kalau perlu revisi, buka closing dulu di Dashboard.`);
    return false;
  }
  return true;
}
async function closeToday(){
  if(!requireAdmin("Closing harian")) return;
  const checklist = [
    "Absen karyawan hari ini sudah selesai?",
    "Produksi hari ini sudah diinput?",
    "Keluar pabrik sudah diinput?",
    "Stok kritis sudah dicek?",
    "Laporan/backup sudah siap?"
  ].join("\n");
  if(!confirm("Sebelum Closing Hari Ini, pastikan:\n\n" + checklist + "\n\nSetelah closing, data hari ini terkunci. Lanjut closing?")) return;
  const note = prompt("Catatan closing hari ini:", "Closing operasional harian selesai") || "";
  try{
    await api("/daily_closing", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify([{date:today(), note, petugas:userEmail() || "admin"}])
    });
    await loadAll(true);
    state.flash = "Closing hari ini berhasil. Data tanggal ini terkunci.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 3200);
  }catch(e){
    if(String(e.message||"").includes("duplicate") || String(e.message||"").includes("23505")){
      alert("Hari ini sudah closing.");
    }else{
      alert("Gagal closing. Jalankan SQL V55 dulu. Detail: " + e.message);
    }
  }
}
async function reopenTodayClosing(){
  if(!requireAdmin("Buka closing")) return;
  if(!confirm("Buka kembali closing hari ini? Setelah dibuka, data hari ini bisa diubah lagi.")) return;
  try{
    await api("/daily_closing?date=eq."+encodeURIComponent(today()), {method:"DELETE"});
    await loadAll(true);
    state.flash = "Closing hari ini dibuka kembali.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2600);
  }catch(e){
    alert("Gagal buka closing: " + e.message);
  }
}
function pad3(n){return String(n).padStart(3,"0");}
function prefixForStockTx(jenis){
  const j = String(jenis || "").toLowerCase();
  if(j.includes("produksi_hasil")) return "PROD";
  if(j.includes("produksi_bahan")) return "BAHAN";
  if(j.includes("barang_dipakai") || j.includes("keluar_bahan_pendukung")) return "PAKAI";
  if(j.includes("keluar_pabrik")) return "SJ";
  if(j.includes("keluar_dus")) return "DUS";
  if(j.includes("keluar_plastik")) return "PLS";
  if(j.includes("barang_masuk")) return "IN";
  if(j.includes("barang_keluar")) return "OUT";
  if(j.includes("audit")) return "AUDIT";
  return "TRX";
}
function nextStockCode(data, suffix=""){
  const date = data.date || today();
  const prefix = prefixForStockTx(data.jenis_transaksi);
  const base = `${prefix}-${String(date).replaceAll("-","")}`;
  const count = (state.tx || []).filter(t => String(t.transaction_code || "").startsWith(base)).length + 1;
  return `${base}-${pad3(count)}${suffix}`;
}
function nextAttendanceCode(date, idx=0){
  const d = date || today();
  const base = `ABSEN-${String(d).replaceAll("-","")}`;
  const count = (state.attendance || []).filter(a => String(a.attendance_code || "").startsWith(base)).length + 1 + idx;
  return `${base}-${pad3(count)}`;
}
function stockCheckList(payloads){
  const problems = [];
  const usage = {};
  (payloads || []).filter(Boolean).forEach(p => {
    const keluar = Number(p.keluar || 0);
    if(keluar <= 0) return;
    const id = Number(p.item_id);
    if(!id) return;
    const row = stockRowByItemId(id);
    if(!row) return;
    if(!usage[id]) usage[id] = {row, keluar:0};
    usage[id].keluar += keluar;
  });
  Object.values(usage).forEach(u => {
    const current = Number(u.row.stock || 0);
    if(u.keluar > current){
      problems.push(`${u.row.name}: stok ${fmt(current)} ${u.row.unit || ""}, diminta keluar ${fmt(u.keluar)} ${u.row.unit || ""}`);
    }
  });
  return problems;
}
function guardStockAvailable(payloads, action){
  const problems = stockCheckList(payloads);
  if(problems.length){
    alert(`${action || "Transaksi"} diblok supaya stok tidak minus:\\n\\n` + problems.join("\\n") + "\\n\\nSolusi: cek stok fisik, input barang masuk/produksi dulu, atau admin koreksi stok.");
    return false;
  }
  return true;
}
function attendanceMonthValue(){
  return state.attendanceMonth || currentMonth();
}
function monthlyAttendanceRows(){
  const m = attendanceMonthValue();
  return (state.attendance || []).filter(a => String(a.date || "").startsWith(m));
}
function monthlyAttendanceSummary(){
  const map = {};
  monthlyAttendanceRows().forEach(a => {
    const name = a.employee_name || "-";
    if(!map[name]) map[name] = {name, masuk:0, izin:0, sakit:0, alpha:0, lembur:0, lembur_hours:0, total:0};
    map[name].total += 1;
    const st = a.status || "";
    if(st === "Masuk") map[name].masuk += 1;
    if(st === "Izin") map[name].izin += 1;
    if(st === "Sakit") map[name].sakit += 1;
    if(st === "Alpha") map[name].alpha += 1;
    if(st === "Lembur" || a.overtime) map[name].lembur += 1;
    map[name].lembur_hours += Number(a.overtime_hours || 0);
  });
  return Object.values(map).sort((a,b)=>sortText(a.name,b.name));
}
function exportAttendanceMonthly(){
  csvDownload(`rekap-absen-bulanan-${attendanceMonthValue()}.csv`, [
    ["Bulan","Nama","Masuk","Izin","Sakit","Alpha","Lembur","Jam Lembur","Total Catatan"],
    ...monthlyAttendanceSummary().map(x => [attendanceMonthValue(), x.name, x.masuk, x.izin, x.sakit, x.alpha, x.lembur, x.lembur_hours, x.total])
  ]);
}
function todayProductionSummary(){
  const itemMap = Object.fromEntries(state.items.map(i=>[i.id,i]));
  const rows = (state.tx || []).filter(t => t.date === today() && String(t.jenis_transaksi || "").includes("produksi"));
  const hasil = rows.filter(t => t.jenis_transaksi === "produksi_hasil");
  const bahan = rows.filter(t => t.jenis_transaksi === "produksi_bahan");
  return {rows, hasil, bahan, itemMap};
}

function exportFullBackupJson(){
  const backup = {
    app:"Harrys Farm Stock Opname",
    version:"V133 GSheet Realtime",
    exported_at:new Date().toISOString(),
    items:state.items || [],
    stock_transactions:state.tx || [],
    employee_attendance:state.attendance || [],
    employee_master:state.employees || [],
    daily_closing:state.closings || []
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-harrys-farm-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}


function exportMonthlyBackupJson(){
  const month = prompt("Backup bulan berapa? Format YYYY-MM", currentMonth()) || currentMonth();
  const backup = {
    app:"Harrys Farm Stock Opname",
    version:"V133 GSheet Realtime",
    month,
    exported_at:new Date().toISOString(),
    items:state.items || [],
    stock_transactions:(state.tx || []).filter(t => String(t.date || "").startsWith(month)),
    employee_attendance:(state.attendance || []).filter(a => String(a.date || "").startsWith(month)),
    employee_master:state.employees || [],
    daily_closing:(state.closings || []).filter(c => String(c.date || "").startsWith(month))
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-harrys-farm-${month}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function printDailyFullReport(){
  const itemMap = Object.fromEntries(state.items.map(i=>[i.id,i]));
  const absen = attendanceTodayRows();
  const prod = todayProductionSummary();
  const used = dailyUsedRows(today());
  const keluar = factoryOutRows().filter(t=>t.date===today());
  const critical = rows().filter(r=>r.status.label!=="AMAN").slice(0,30);
  const htmlRows = arr => arr.join("");
  const html = `<!doctype html><html><head><title>Laporan Harian Harry's Farm ${today()}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}
      h1{margin:0 0 4px;font-size:24px} h2{margin:22px 0 8px;font-size:17px}
      .muted{color:#64748b;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
      th,td{border:1px solid #cbd5e1;padding:7px;text-align:left;vertical-align:top}
      th{background:#f1f5f9}
      .sign{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:40px}
      .line{border-top:1px solid #0f172a;margin-top:60px;text-align:center;padding-top:8px}
    </style></head><body>
      <h1>Harry's Farm — Laporan Harian Lengkap</h1>
      <div class="muted">Tanggal: ${today()} • Print: ${new Date().toLocaleString("id-ID")}</div>

      <h2>1. Absen Karyawan</h2>
      <table><thead><tr><th>Nama</th><th>Shift</th><th>Status</th><th>Masuk</th><th>Pulang</th><th>Lembur</th><th>Keterangan</th></tr></thead><tbody>
        ${htmlRows(absen.map(a=>`<tr><td>${esc(a.employee_name)}</td><td>${esc(a.shift_name||"-")}</td><td>${esc(a.status||"-")}</td><td>${esc(a.check_in||"-")}</td><td>${esc(a.check_out||"-")}</td><td>${a.overtime?`Ya, ${fmt(a.overtime_hours||0)} jam`:"Tidak"}</td><td>${esc(a.note||"-")}</td></tr>`)) || `<tr><td colspan="7">Belum ada absen hari ini.</td></tr>`}
      </tbody></table>

      <h2>2. Produksi Hari Ini</h2>
      <table><thead><tr><th>Kode</th><th>Jenis</th><th>Barang/Bahan</th><th>Masuk</th><th>Keluar</th><th>Keterangan</th></tr></thead><tbody>
        ${htmlRows(prod.rows.map(t=>{const i=itemMap[t.item_id]||{};return `<tr><td>${esc(t.transaction_code||"-")}</td><td>${esc((t.jenis_transaksi||"").replaceAll("_"," "))}</td><td>${esc(i.name||"-")}</td><td>${fmt(t.masuk||0)}</td><td>${fmt(t.keluar||0)}</td><td>${esc(t.note||"-")}</td></tr>`})) || `<tr><td colspan="6">Belum ada produksi hari ini.</td></tr>`}
      </tbody></table>

      <h2>3. Barang Dipakai Hari Ini</h2>
      <table><thead><tr><th>Kode</th><th>Jam</th><th>Barang/Bahan</th><th>Kategori</th><th>Jumlah Dipakai</th><th>Keterangan</th></tr></thead><tbody>
        ${htmlRows(used.map(t=>{const i=itemMap[t.item_id]||{};return `<tr><td>${esc(t.transaction_code||"-")}</td><td>${esc(txTime(t))}</td><td>${esc(i.name||"-")}</td><td>${esc(i.category||"-")}</td><td>${fmt(t.keluar||0)} ${esc(i.unit||"")}</td><td>${esc(t.note||"-")}</td></tr>`})) || `<tr><td colspan="6">Belum ada barang dipakai hari ini.</td></tr>`}
      </tbody></table>

      <h2>4. Keluar Pabrik</h2>
      <table><thead><tr><th>Kode</th><th>SJ/DO</th><th>Tujuan</th><th>Barang</th><th>Dus</th><th>Pcs</th><th>Plastik</th><th>Keterangan</th></tr></thead><tbody>
        ${htmlRows(keluar.map(t=>{const i=itemMap[t.item_id]||{};return `<tr><td>${esc(t.transaction_code||"-")}</td><td>${esc(t.no_surat_jalan||"-")}</td><td>${esc(t.tujuan||"-")}</td><td>${esc(i.name||"-")}</td><td>${fmt(t.keluar_dus||0)} ${esc(t.jenis_dus||"")}</td><td>${fmt(t.keluar||0)}</td><td>${esc(t.jenis_plastik||"-")}</td><td>${esc(t.note||"-")}</td></tr>`})) || `<tr><td colspan="8">Belum ada keluar pabrik hari ini.</td></tr>`}
      </tbody></table>

      <h2>5. Stok Kritis / Kurang</h2>
      <table><thead><tr><th>Barang</th><th>Kategori</th><th>Stok</th><th>Minimum</th><th>Status</th><th>Rekomendasi</th></tr></thead><tbody>
        ${htmlRows(critical.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${fmt(r.stock)} ${esc(r.unit||"")}</td><td>${fmt(r.min_stock||0)}</td><td>${esc(r.status.label)}</td><td>${formatDusItem(r.rekomendasi,r)}</td></tr>`)) || `<tr><td colspan="6">Semua stok aman.</td></tr>`}
      </tbody></table>

      <div class="sign">
        <div class="line">Petugas / Staff</div>
        <div class="line">Admin / Supervisor</div>
      </div>
    </body></html>`;
  const w = window.open("", "_blank");
  if(!w) return alert("Popup print diblok browser. Izinkan popup lalu coba lagi.");
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(()=>{w.focus(); w.print();}, 400);
}


function transactionJenisOptions(){
  const arr = Array.from(new Set((state.tx || []).map(t => t.jenis_transaksi || "stok_harian"))).sort(sortText);
  return ["Semua", ...arr];
}
function reportGroupOptions(){
  return ["Semua","Barang Masuk","Produksi / Dipakai","Barang Keluar","Opname / Koreksi"];
}
function txReportGroup(t){
  const j = String(t && t.jenis_transaksi || "stok_harian").toLowerCase();
  const keluar = Number(t && t.keluar || 0);
  const masuk = Number(t && t.masuk || 0);
  if(j.includes("opname") || j.includes("audit") || j.includes("koreksi") || j === "stok_harian") return "Opname / Koreksi";
  if(j.includes("produksi") || j.includes("pakai") || j.includes("dipakai") || j.includes("bahan_pendukung")) return "Produksi / Dipakai";
  if(j.includes("keluar") || keluar > 0) return "Barang Keluar";
  if(j.includes("masuk") || masuk > 0) return "Barang Masuk";
  return "Opname / Koreksi";
}
function txReportGroupIcon(group){
  if(group === "Barang Masuk") return "➕";
  if(group === "Produksi / Dipakai") return "🏭";
  if(group === "Barang Keluar") return "🚚";
  if(group === "Opname / Koreksi") return "🧮";
  return "📄";
}
function reportGroupCounts(rowsTx){
  const map = {};
  reportGroupOptions().forEach(g => map[g] = {group:g,count:0,keluar:0,masuk:0});
  (rowsTx || []).forEach(t => {
    const g = txReportGroup(t);
    if(!map[g]) map[g] = {group:g,count:0,keluar:0,masuk:0};
    map[g].count += 1;
    map[g].keluar += Number(t.keluar || 0);
    map[g].masuk += Number(t.masuk || 0);
    map["Semua"].count += 1;
    map["Semua"].keluar += Number(t.keluar || 0);
    map["Semua"].masuk += Number(t.masuk || 0);
  });
  return reportGroupOptions().map(g => map[g] || {group:g,count:0,keluar:0,masuk:0});
}
function reportGroupGuideText(group){
  const g = group || "Semua";
  if(g === "Barang Masuk") return "Barang datang: dus, plastik, bumbu, kentang, bahan baku, dan barang lain masuk gudang.";
  if(g === "Produksi / Dipakai") return "Bahan yang dipakai produksi: wedges/mashed/mix dan bahan lain yang otomatis atau manual kepotong.";
  if(g === "Barang Keluar") return "Barang keluar: produk akhir dikirim, dus/plastik keluar, sample, rusak, retur, atau pindah gudang.";
  if(g === "Opname / Koreksi") return "Catatan cek fisik, koreksi stok, edit stok, dan stock opname.";
  return "Semua transaksi digabung. Pakai tombol warna di bawah supaya staff cepat baca laporan.";
}
function reportHumanLabel(jenis){
  const raw = String(jenis || "stok_harian").toLowerCase();
  const map = {
    barang_masuk:"Barang Masuk",
    barang_keluar:"Barang Keluar",
    barang_dipakai_hari_ini:"Barang Dipakai",
    produksi_hasil:"Hasil Produksi",
    produksi_bahan:"Bahan Dipakai Produksi",
    keluar_pabrik:"Barang Keluar Pabrik",
    keluar_dus_pabrik:"Dus Keluar Pabrik",
    keluar_plastik_pabrik:"Plastik Keluar Pabrik",
    stock_opname:"Stock Opname",
    audit_edit_stok:"Audit Edit Stok",
    keluar_bahan_pendukung:"Bahan Pendukung Keluar"
  };
  return map[raw] || String(jenis || "stok_harian").replaceAll("_"," ");
}
function reportGroupButton(x){
  const active = String(state.reportGroup || "Semua") === String(x.group || "Semua");
  return `<button type="button" class="report-flow-card-v136 ${active?"active":""}" data-report-group="${esc(x.group)}"><i>${txReportGroupIcon(x.group)}</i><b>${esc(x.group)}</b><span>${fmt(x.count)} transaksi</span><small>Keluar ${fmt(x.keluar)} • Masuk ${fmt(x.masuk)}</small></button>`;
}



function timeNow(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
function employeeRows(){
  return (state.employees || []).slice().sort((a,b)=>sortText(a.name,b.name));
}
function employeeById(id){
  return (state.employees || []).find(e => Number(e.id) === Number(id)) || null;
}
function shiftOptions(){
  return ["Shift 1","Shift 2","Lembur","Custom"];
}
function shiftDefaults(shift){
  if(shift === "Shift 1") return {check_in:"07:00", check_out:"16:00", label:"Shift 1: 07:00 - 16:00"};
  if(shift === "Shift 2") return {check_in:"15:00", check_out:"00:00", label:"Shift 2: 15:00 - 00:00 / 12 malam"};
  if(shift === "Lembur") return {check_in:"16:00", check_out:"20:00", label:"Lembur: isi sesuai kebutuhan"};
  return {check_in:timeNow(), check_out:"", label:"Custom"};
}
function attendanceStatusOptions(){
  return ["Masuk","Izin","Sakit","Alpha","Lembur","Setengah Hari"];
}
function attendanceRows(){
  return (state.attendance || []).filter(a => {
    const matchDate = !state.attendanceDate || a.date === state.attendanceDate;
    const q = String(state.searchAbsen || "").toLowerCase();
    const matchSearch = !q || `${a.employee_name || ""} ${a.status || ""} ${a.note || ""} ${a.shift_name || ""}`.toLowerCase().includes(q);
    return matchDate && matchSearch;
  });
}
function attendanceTodayRows(){
  return (state.attendance || []).filter(a => a.date === today());
}
function attendanceSummary(){
  const rows = attendanceRows();
  return {
    total: rows.length,
    masuk: rows.filter(a => a.status === "Masuk").length,
    izin: rows.filter(a => a.status === "Izin").length,
    sakit: rows.filter(a => a.status === "Sakit").length,
    alpha: rows.filter(a => a.status === "Alpha").length,
    lembur: rows.filter(a => a.status === "Lembur" || a.overtime).length
  };
}
function attendancePayloadSafe(data){
  const out = Object.assign({}, data);
  if(!out.employee_name && out.employee_id){
    const e = employeeById(out.employee_id);
    if(e) out.employee_name = e.name;
  }
  return out;
}


function alreadyAttendance(date, employeeId, employeeName, ignoreId=null){
  return (state.attendance || []).find(a => {
    const sameDate = a.date === date;
    const sameEmp = (employeeId && Number(a.employee_id) === Number(employeeId)) || (!employeeId && employeeName && String(a.employee_name||"").toLowerCase() === String(employeeName||"").toLowerCase());
    const notIgnored = ignoreId === null || String(a.id) !== String(ignoreId);
    return sameDate && sameEmp && notIgnored;
  });
}
function guardAttendanceDuplicateList(dataList){
  const dupes = [];
  (dataList || []).forEach(d => {
    const found = alreadyAttendance(d.date, d.employee_id, d.employee_name);
    if(found) dupes.push(`${d.employee_name} (${d.date})`);
  });
  if(dupes.length){
    alert("Absen dobel diblok. Karyawan ini sudah absen di tanggal yang sama:\\n\\n" + dupes.join("\\n") + "\\n\\nKalau salah, edit/hapus data absen lama dulu.");
    return false;
  }
  return true;
}
async function updateAttendance(id, patch){
  if(!requireAdmin("Edit absen")) return;
  const old = (state.attendance || []).find(a => String(a.id) === String(id));
  if(old && !guardDateOpen(old.date, "Edit absen")) return;
  const dupe = alreadyAttendance(patch.date || old.date, patch.employee_id || old.employee_id, patch.employee_name || old.employee_name, id);
  if(dupe) return alert("Edit diblok karena akan membuat absen dobel di tanggal yang sama.");
  try{
    await api("/employee_attendance?id=eq."+encodeURIComponent(id), {
      method:"PATCH",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify(patch)
    });
    await loadAll(true);
    state.flash = "Absen berhasil diedit.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2500);
  }catch(e){
    alert("Gagal edit absen: " + e.message);
  }
}
async function editAttendancePrompt(id){
  const a = (state.attendance || []).find(x => String(x.id) === String(id));
  if(!a) return alert("Data absen tidak ditemukan.");
  const status = prompt("Status (Masuk/Izin/Sakit/Alpha/Lembur/Setengah Hari):", a.status || "Masuk");
  if(status === null) return;
  const shift = prompt("Shift (Shift 1 / Shift 2 / Lembur / Custom):", a.shift_name || "Shift 1");
  if(shift === null) return;
  const masuk = prompt("Jam masuk (HH:MM):", a.check_in || "");
  if(masuk === null) return;
  const pulang = prompt("Jam pulang (HH:MM):", a.check_out || "");
  if(pulang === null) return;
  const lemburJam = prompt("Jam lembur, isi 0 kalau tidak lembur:", a.overtime_hours || 0);
  if(lemburJam === null) return;
  const note = prompt("Keterangan:", a.note || "");
  if(note === null) return;
  const sched = shiftDefaults(shift);
  await updateAttendance(id, {
    status,
    shift_name:shift,
    check_in:masuk || null,
    check_out:pulang || null,
    scheduled_in:sched.check_in,
    scheduled_out:sched.check_out,
    overtime: Number(lemburJam || 0) > 0 || status === "Lembur",
    overtime_hours:Number(lemburJam || 0),
    note: note || null
  });
}

async function addBulkAttendance(dataList){
  if(!dataList.length) return alert("Pilih minimal 1 karyawan.");
  const date = dataList[0].date || today();
  if(!guardDateOpen(date, "Absen karyawan")) return;
  if(!guardAttendanceDuplicateList(dataList)) return;

  dataList = dataList.map((d, idx) => Object.assign({}, d, {attendance_code:d.attendance_code || nextAttendanceCode(d.date, idx)}));

  try{
    await api("/employee_attendance", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify(dataList)
    });
    await loadAll(true);
    state.tab = "absen";
    state.flash = `${dataList.length} absen karyawan berhasil disimpan.`;
    render();
    setTimeout(()=>{state.flash=""; render();}, 3000);
  }catch(e){
    alert("Gagal simpan absen banyak. Pastikan SQL V52 sudah jalan. Detail: " + e.message);
  }
}

async function addAttendance(data){
  if(!guardDateOpen(data.date, "Absen karyawan")) return;
  if(!guardAttendanceDuplicateList([data])) return;
  const payload = attendancePayloadSafe(Object.assign({}, data, {attendance_code:data.attendance_code || nextAttendanceCode(data.date)}));
  try{
    await api("/employee_attendance", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify([payload])
    });
    await loadAll(true);
    state.tab = "absen";
    state.flash = "Absen karyawan berhasil disimpan.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2600);
  }catch(e){
    const msg = String(e.message || e);
    // Kalau kolom shift/lembur/kode belum aktif, coba simpan basic + detail masuk keterangan.
    if(msg.includes("attendance_code") || msg.includes("employee_id") || msg.includes("shift_name") || msg.includes("scheduled_in") || msg.includes("scheduled_out") || msg.includes("overtime") || msg.includes("schema cache") || msg.includes("Could not find")){
      try{
        const basic = {
          date: payload.date,
          employee_name: payload.employee_name,
          status: payload.status,
          check_in: payload.check_in || null,
          check_out: payload.check_out || null,
          note: [payload.attendance_code ? `Kode: ${payload.attendance_code}` : "", payload.note, payload.shift_name ? `Shift: ${payload.shift_name}` : "", payload.overtime ? `Lembur ${payload.overtime_hours || 0} jam` : ""].filter(Boolean).join(" | "),
          petugas: payload.petugas || null
        };
        await api("/employee_attendance", {
          method:"POST",
          headers:{"Prefer":"return=representation"},
          body:JSON.stringify([basic])
        });
        await loadAll(true);
        state.tab = "absen";
        state.flash = "Absen tersimpan mode basic. Jalankan SQL V52 agar kolom shift/lembur/kode aktif penuh.";
        render();
        setTimeout(()=>{state.flash=""; render();}, 3600);
        return;
      }catch(e2){
        alert("Gagal simpan absen: "+e2.message);
        return;
      }
    }
    if(msg.includes("employee_attendance") || msg.includes("relation")){
      alert("Tabel Absen belum aktif. Jalankan SQL supabase-v52-all-fix-operasional.sql di Supabase.");
      return;
    }
    alert("Gagal simpan absen: " + msg);
  }
}
async function deleteAttendance(id){
  if(!requireAdmin("Hapus absen")) return;
  const a=(state.attendance||[]).find(x=>String(x.id)===String(id));
  if(a && !guardDateOpen(a.date, "Hapus absen")) return;
  if(!confirm("Hapus data absen ini?")) return;
  try{
    await api("/employee_attendance?id=eq."+encodeURIComponent(id), {method:"DELETE"});
    await loadAll();
  }catch(e){
    alert("Gagal hapus absen: " + e.message);
  }
}
async function addEmployee(data){
  if(!requireAdmin("Tambah karyawan")) return;
  try{
    await api("/employee_master", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify([data])
    });
    await loadAll(true);
    state.flash = "Karyawan berhasil ditambahkan.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2500);
  }catch(e){
    alert("Gagal tambah karyawan. Jalankan SQL V48 dulu. Detail: " + e.message);
  }
}
async function updateEmployee(id, data){
  if(!requireAdmin("Edit karyawan")) return;
  try{
    await api("/employee_master?id=eq."+encodeURIComponent(id), {
      method:"PATCH",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify(data)
    });
    await loadAll(true);
    state.flash = "Data karyawan berhasil diedit.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2500);
  }catch(e){
    alert("Gagal edit karyawan: " + e.message);
  }
}
async function archiveEmployee(id){
  if(!requireAdmin("Nonaktifkan karyawan")) return;
  if(!confirm("Nonaktifkan karyawan ini dari daftar absen?")) return;
  await updateEmployee(id, {active:false});
}
function exportAttendance(){
  csvDownload(`absen-karyawan-${today()}.csv`, [
    ["Tanggal","Nama Karyawan","Shift","Status","Jam Masuk","Jam Pulang","Lembur","Jam Lembur","Keterangan","Petugas"],
    ...attendanceRows().map(a => [a.date, a.employee_name, a.shift_name || "", a.status, a.check_in || "", a.check_out || "", a.overtime ? "Ya" : "Tidak", a.overtime_hours || 0, a.note || "", a.petugas || ""])
  ]);
}

function productionBahanCategories(){
  const cats = Array.from(new Set(activeItems()
    .map(i => i.category)
    .filter(Boolean)
  )).sort(sortText);

  // Prioritas kategori yang sering dipakai produksi.
  const preferred = [
    "Bahan Baku - Kentang",
    "Bahan Baku - Sayuran",
    "Bahan Baku - Dairy / Keju",
    "Bumbu & BTP - Kering",
    "Bumbu & BTP - Cair",
    "Bumbu & BTP - Minyak",
    "Bumbu & BTP - Seasoning Jadi",
    "Bahan Penolong - Produksi",
    "Bahan Penolong - APD & Alat Produksi",
    "Kemasan - Plastik Polos / Umum",
    "Kemasan - Plastik Sablon Produk",
    "Kemasan - Dus / Karton",
    "Bahan Tambahan Pangan",
    "Bahan Baku",
    "Bahan Kemas",
    "Bahan Penolong"
  ];

  const ordered = [];
  preferred.forEach(c => {
    if(cats.includes(c)) ordered.push(c);
  });
  cats.forEach(c => {
    if(!ordered.includes(c)) ordered.push(c);
  });

  return ["Semua Bahan", ...ordered];
}
function filteredProductionIngredients(productId){
  const cat = state.productionBahanCategory || "Bahan Tambahan Pangan";
  return productionIngredients(productId)
    .filter(i => cat === "Semua Bahan" || i.category === cat)
    .slice()
    .sort(sortByName);
}
function filteredFactoryOutMaterials(productId){
  const cat = state.factoryBahanCategory || "Bahan Tambahan Pangan";
  return productionIngredients(productId)
    .filter(i => cat === "Semua Bahan" || i.category === cat)
    .slice()
    .sort(sortByName);
}
function factorySupportRows(){
  return (state.tx || []).filter(t => String(t.jenis_transaksi || "").toLowerCase() === "keluar_bahan_pendukung");
}
function isDailyUsedTx(t){
  const j = String(t && t.jenis_transaksi || "").toLowerCase();
  return j === "barang_dipakai_hari_ini" || j === "keluar_bahan_pendukung";
}
function dailyUsedRows(date=""){
  return (state.tx || []).filter(t => isDailyUsedTx(t) && (!date || t.date === date)).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")) || String(txTime(b)).localeCompare(String(txTime(a))));
}
function usedBahanItems(){
  return activeItems().filter(i => {
    const c = String(i.category || "").toLowerCase();
    return !(c.includes("produk akhir") || c.includes("produk jadi"));
  }).slice().sort(sortByName);
}
function filteredUsedBahanItems(){
  const cat = state.usedBahanCategory || "Semua Bahan";
  return usedBahanItems().filter(i => cat === "Semua Bahan" || i.category === cat).slice().sort(sortByName);
}
function usedItemOptionHtml(i){
  const row = stockRowByItemId(i.id);
  const stock = row ? Number(row.stock || 0) : Number(i.starting_stock || 0);
  const status = stock <= 0 ? "HABIS" : (minStockValue(i) && stock < minStockValue(i) ? "KURANG" : "AMAN");
  return `<option value="${i.id}">${esc(i.name)} — stok ${fmt(stock)} ${esc(i.unit||"")} — ${status}</option>`;
}
async function addUsedTodayTx(payloads){
  const list = (payloads || []).filter(Boolean);
  if(!list.length) return alert("Pilih minimal 1 barang yang dipakai.");
  const date = list[0].date || today();
  if(!guardDateOpen(date, "Barang dipakai hari ini")) return;
  if(!guardStockAvailable(list, "Barang dipakai hari ini")) return;

  const mainCode = nextStockCode(list[0]);
  list.forEach((p, idx) => {
    p.transaction_code = p.transaction_code || (idx === 0 ? mainCode : `${mainCode}-B${idx+1}`);
    p.jam_transaksi = p.jam_transaksi || nowTime();
  });

  let fallback = false;
  for(const p of list){
    const res = await postStockTransactionSafe(p);
    fallback = fallback || !!res.fallback;
  }
  await loadAll(true);
  await autoSyncGSheet("barang_dipakai_hari_ini");
  state.tab = "pakaiBahan";
  state.flash = fallback
    ? `Barang dipakai tersimpan mode basic (${mainCode}). Stok tetap terpotong, tapi jalankan SQL V52 supaya kode/jam aktif penuh.`
    : `Barang dipakai hari ini berhasil disimpan (${mainCode}). Stok opname otomatis berkurang.`;
  render();
  setTimeout(()=>{state.flash=""; render();}, 4200);
}
function factorySupportPreviewFromForm(formData){
  const list = [];
  for(let n=1; n<=6; n++){
    const id = formData[`extra_bahan_${n}`];
    const qty = Number(formData[`extra_bahan_qty_${n}`] || 0);
    if(id && qty > 0){
      const bahan = itemById(id);
      if(bahan && bahan.id) list.push(`${bahan.name}: ${fmt(qty)} ${bahan.unit || ""}`);
    }
  }
  return list;
}




function lokasiOptions(){
  return [
  "Gudang Bahan Baku - Dry",
  "Gudang Bahan Baku - Chiller",
  "Chiller Bahan Baku - Dairy/Keju",
  "Freezer Bahan Baku - Kentang",
  "Freezer Bahan Baku - Sayuran",
  "Freezer Bahan Baku - Daging/Ikan",
  "Gudang Bumbu & BTP - Kering",
  "Gudang Bumbu & BTP - Cair",
  "Gudang Bahan Kemas - Plastik",
  "Gudang Bahan Kemas - Dus/Karton",
  "Gudang Bahan Kemas - Stiker/Label",
  "Gudang Bahan Kemas - Lakban/Seal",
  "Gudang Packaging",
  "Freezer Produk Jadi - 250gr",
  "Freezer Produk Jadi - 500gr",
  "Freezer Produk Jadi - 1kg",
  "Freezer Produk Jadi - 2kg",
  "Freezer Produk Jadi - Bulk/Curah",
  "Freezer Produk Jadi - Area A",
  "Freezer Produk Jadi - Area B",
  "Freezer Produk Jadi - Stok Siap Kirim",
  "Freezer Produk Jadi - Retur",
  "Freezer Produk Jadi - Sample",
  "Area Produksi - Raw Prep",
  "Area Produksi - Blanching",
  "Area Produksi - WIP",
  "Area Produksi - Seasoning",
  "Area Produksi - Packing",
  "Ruang Packing",
  "Perlengkapan Produksi - APD & Alat",
  "Barang Hold QC",
  "Barang Reject",
  "Barang Retur",
  "Barang Expired",
  "Sample / R&D",
  "Kebersihan & Sanitasi",
  "Sparepart & Maintenance",
  "Office / Perlengkapan Gudang"
];
}
function qcOptions(){
  return ["OK","HOLD","REJECT","EXPIRED","RETUR"];
}
function supplierOptions(){
  return [
  "Harry's Farm",
  "Produksi Internal",
  "Supplier Kentang",
  "Supplier Sayuran",
  "Supplier Dairy/Keju",
  "Supplier Daging/Ikan",
  "Supplier Bumbu/BTP",
  "Supplier Kemasan",
  "Supplier Plastik Southmount",
  "Supplier Karton",
  "Supplier APD & Alat",
  "Supplier Kebersihan",
  "Supplier Maintenance",
  "Gudang Pusat",
  "Retur Customer",
  "Supplier Luar",
  "Lainnya"
];
}
function stockLokasiValue(item){
  return item && (item.lokasi || item.location || "");
}
function stockLokasiLabel(item){
  return stockLokasiValue(item) || "Belum Diisi";
}
function stockAreaKind(item){
  const loc = String(stockLokasiValue(item) || "").toLowerCase();
  if(loc.includes("freezer")) return "Freezer";
  if(loc.includes("chiller")) return "Chiller";
  if(loc.includes("produksi") || loc.includes("packing")) return "Produksi/Packing";
  if(loc.includes("qc") || loc.includes("reject") || loc.includes("retur") || loc.includes("expired")) return "QC/Retur";
  if(loc.includes("gudang")) return "Gudang";
  return "Belum Diisi";
}
function simpleStockCategories(){
  return ["Semua","Produk Jadi","Bahan Baku","Bahan Penolong","Kemasan","Lainnya"];
}
function simpleStockCategory(item){
  const cat = String(item && item.category || "").toLowerCase();
  const name = String(item && item.name || "").toLowerCase();
  const loc = String(stockLokasiLabel(item || {}) || "").toLowerCase();
  const kind = String(stockAreaKind(item || {}) || "").toLowerCase();
  const txt = `${cat} ${name} ${loc} ${kind}`.toLowerCase();

  // Kategori dibuat simple untuk staff: pilih kategori dulu, baru input keluar/masuk/opname.
  if(cat.includes("bahan penolong")) return "Bahan Penolong";
  if(txt.match(/masker|nurse\s*cap|sarung\s*tangan|latex|spidol|sabun|apd|hairnet|hair\s*net|perlengkapan\s*produksi|sanitasi|kebersihan/)) return "Bahan Penolong";
  if(txt.match(/plastik|dus|karton|stiker|label|lakban|seal|kemasan|packaging/)) return "Kemasan";
  if(txt.match(/bahan\s*baku|kentang|sayur|sayuran|buncis|brokoli|wortel|bawang|cabai|dairy|keju|daging|ikan|tepung|bumbu|btp|minyak|garlic|onion|powder/)) return "Bahan Baku";
  if(txt.match(/produk\s*akhir|produk\s*jadi|frozen|freezer|wedges|nuggets|potato|mashed|skin\s*on|seasoned|cheesy|mix|4\s*ways/)) return "Produk Jadi";
  return "Lainnya";
}
function simpleCategoryCounts(list){
  const counts = {};
  simpleStockCategories().forEach(c=>counts[c]=0);
  (list || []).forEach(i=>{ const c = simpleStockCategory(i); counts[c] = (counts[c]||0)+1; counts.Semua = (counts.Semua||0)+1; });
  return counts;
}
function locationFilterOptions(list){
  const vals = Array.from(new Set((list || rows()).map(stockLokasiLabel))).sort(sortText);
  return ["Semua", ...vals];
}
function stockQcValue(item){
  return item && (item.qc_status || item.qc || "OK");
}
function stockSupplierValue(item){
  return item && (item.supplier || "");
}
function stockBatchValue(item){
  return item && (item.batch_lot || item.batch || item.lot || "");
}
function stockExpValue(item){
  return item && (item.expired_date || item.exp_date || "");
}
function factoryMetaHtml(x){
  return `<div class="factory-meta-grid">
    <div><span>Lokasi</span><b>${esc(stockLokasiValue(x) || "-")}</b></div>
    <div><span>QC</span><b class="qc-${esc(String(stockQcValue(x)).toLowerCase())}">${esc(stockQcValue(x) || "OK")}</b></div>
    <div><span>Supplier</span><b>${esc(stockSupplierValue(x) || "-")}</b></div>
    <div><span>Batch/Lot</span><b>${esc(stockBatchValue(x) || "-")}</b></div>
    <div><span>Expired</span><b>${esc(stockExpValue(x) || "-")}</b></div>
  </div>`;
}

function barcodeValue(item){
  return item && (item.barcode || item.sku || `HF-${String(item.id||"").padStart(5,"0")}`);
}
function generateBarcodeForItem(item){
  return `HF-${String(item.id||Date.now()).padStart(5,"0")}`;
}
async function updateTransaction(id, patch){
  if(!requireAdmin("Edit transaksi")) return;
  const old = (state.tx || []).find(t => String(t.id) === String(id));
  if(old && !guardDateOpen(old.date, "Edit transaksi")) return;
  try{
    await api("/stock_transactions?id=eq."+encodeURIComponent(id), {
      method:"PATCH",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify(patch)
    });
    await loadAll(true);
    await autoSyncGSheet("edit_transaksi");
    state.flash = "Transaksi berhasil diedit.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2500);
  }catch(e){
    alert("Gagal edit transaksi. Jalankan SQL V57 jika kolom belum lengkap. Detail: " + e.message);
  }
}
async function editTransactionPrompt(id){
  const t = (state.tx || []).find(x => String(x.id) === String(id));
  if(!t) return alert("Transaksi tidak ditemukan.");
  const item = itemById(t.item_id) || {};
  const tanggal = prompt("Tanggal transaksi:", t.date || today());
  if(tanggal === null) return;
  const jam = prompt("Jam transaksi (HH:MM):", txTime(t) === "-" ? nowTime() : txTime(t));
  if(jam === null) return;
  const masuk = prompt(`Masuk (${item.unit || ""}):`, t.masuk || 0);
  if(masuk === null) return;
  const keluar = prompt(`Keluar (${item.unit || ""}):`, t.keluar || 0);
  if(keluar === null) return;
  const note = prompt("Keterangan:", t.note || "");
  if(note === null) return;
  const tujuan = prompt("Tujuan/customer/SJ jika ada:", t.tujuan || "");
  if(tujuan === null) return;
  const noSj = prompt("No Surat Jalan/DO jika ada:", t.no_surat_jalan || "");
  if(noSj === null) return;

  const patch = {
    date:tanggal,
    jam_transaksi:jam || nowTime(),
    masuk:Number(masuk || 0),
    keluar:Number(keluar || 0),
    note:note || null,
    tujuan:tujuan || null,
    no_surat_jalan:noSj || null
  };

  // Blok stok minus hanya kalau menaikkan jumlah keluar.
  const row = stockRowByItemId(t.item_id);
  const oldKeluar = Number(t.keluar || 0);
  const newKeluar = Number(patch.keluar || 0);
  if(row && newKeluar > oldKeluar){
    const tambahan = newKeluar - oldKeluar;
    if(tambahan > Number(row.stock || 0)){
      return alert(`Edit diblok supaya stok tidak minus. Stok tersedia ${fmt(row.stock)} ${row.unit||""}, tambahan keluar ${fmt(tambahan)}.`);
    }
  }
  await updateTransaction(id, patch);
}
function payrollConfig(){
  return {
    daily:Number(state.payrollDaily || 0),
    overtime:Number(state.payrollOvertime || 0),
    alpha:Number(state.payrollAlpha || 0)
  };
}
function setPayrollConfig(daily, overtime, alpha){
  state.payrollDaily = String(daily || "");
  state.payrollOvertime = String(overtime || "");
  state.payrollAlpha = String(alpha || "");
  localStorage.setItem("hf_payroll_daily_v57", state.payrollDaily);
  localStorage.setItem("hf_payroll_overtime_v57", state.payrollOvertime);
  localStorage.setItem("hf_payroll_alpha_v57", state.payrollAlpha);
}
function payrollSummary(){
  const cfg = payrollConfig();
  return monthlyAttendanceSummary().map(x => {
    const hadir = x.masuk + x.lembur;
    const gajiPokok = hadir * cfg.daily;
    const uangLembur = Number(x.lembur_hours || 0) * cfg.overtime;
    const potonganAlpha = Number(x.alpha || 0) * cfg.alpha;
    const total = gajiPokok + uangLembur - potonganAlpha;
    return Object.assign({}, x, {hadir, gajiPokok, uangLembur, potonganAlpha, total});
  });
}
function exportPayrollMonthly(){
  const cfg = payrollConfig();
  csvDownload(`rekap-gaji-${attendanceMonthValue()}.csv`, [
    ["Bulan","Nama","Hadir","Masuk","Izin","Sakit","Alpha","Lembur","Jam Lembur","Gaji Harian","Upah Lembur/Jam","Potongan Alpha","Gaji Pokok","Uang Lembur","Total Potongan","Estimasi Total"],
    ...payrollSummary().map(x => [attendanceMonthValue(), x.name, x.hadir, x.masuk, x.izin, x.sakit, x.alpha, x.lembur, x.lembur_hours, cfg.daily, cfg.overtime, cfg.alpha, x.gajiPokok, x.uangLembur, x.potonganAlpha, x.total])
  ]);
}
function printBarcodeLabels(){
  const active = activeItems();
  const html = `<!doctype html><html><head><title>Label Barcode Harry's Farm</title>
    <style>
      body{font-family:Arial,sans-serif;margin:16px;color:#0f172a}
      h1{font-size:18px;margin:0 0 12px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .label{border:1px solid #cbd5e1;border-radius:12px;padding:10px;min-height:92px}
      .name{font-weight:700;font-size:13px;margin-bottom:6px}
      .cat{font-size:10px;color:#64748b;margin-bottom:8px}
      .code{font-family:monospace;font-size:18px;letter-spacing:2px;border:1px dashed #94a3b8;border-radius:8px;padding:8px;text-align:center}
      .small{font-size:10px;color:#64748b;margin-top:5px;text-align:center}
      @media print{body{margin:0}.label{break-inside:avoid}}
    </style></head><body>
      <h1>Harry's Farm - Label Kode Barang</h1>
      <div class="grid">
        ${active.map(i=>`<div class="label"><div class="name">${esc(i.name)}</div><div class="cat">${esc(i.category||"")} • ${esc(i.unit||"")}</div><div class="code">${esc(barcodeValue(i))}</div><div class="small">Tempel di rak/barang, bisa dicari di kolom search.</div></div>`).join("")}
      </div>
    </body></html>`;
  const w = window.open("", "_blank");
  if(!w) return alert("Popup print diblok browser. Izinkan popup lalu coba lagi.");
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(()=>{w.focus(); w.print();}, 400);
}


function recipesForProduct(productId){
  return (state.recipes || []).filter(r => Number(r.product_id) === Number(productId)).slice().sort((a,b)=>sortText(a.ingredient_name,b.ingredient_name));
}
function recipeIngredientRow(recipe){
  const item = itemById(recipe.ingredient_item_id);
  return item || {id:recipe.ingredient_item_id, name:recipe.ingredient_name || "-", unit:recipe.unit || ""};
}
function recipeBahanPayloads(product, qty, date, note, petugas){
  return recipesForProduct(product.id).map(r => {
    const ingredient = recipeIngredientRow(r);
    const needed = Number(r.qty_per_unit || 0) * Number(qty || 0);
    return {
      item_id:Number(r.ingredient_item_id),
      date,
      keluar:needed,
      masuk:0,
      jenis_transaksi:"produksi_bahan",
      note:`Auto resep/BOM untuk ${product.name} | ${ingredient.name}: ${fmt(needed)} ${ingredient.unit || r.unit || ""} | ${note || ""}`.trim(),
      jam_transaksi:nowTime(),
      petugas:petugas||null
    };
  }).filter(b => Number(b.keluar || 0) > 0);
}
async function addRecipe(data){
  if(!requireAdmin("Tambah formula resep")) return;
  try{
    await api("/product_recipes", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify([data])
    });
    await loadAll(true);
    state.flash = "Formula resep berhasil ditambah.";
    render();
    setTimeout(()=>{state.flash=""; render();}, 2500);
  }catch(e){
    alert("Gagal tambah formula. Jalankan SQL V56 dulu. Detail: " + e.message);
  }
}
async function deleteRecipe(id){
  if(!requireAdmin("Hapus formula resep")) return;
  if(!confirm("Hapus formula bahan ini?")) return;
  try{
    await api("/product_recipes?id=eq."+encodeURIComponent(id), {method:"DELETE"});
    await loadAll(true);
  }catch(e){
    alert("Gagal hapus formula: " + e.message);
  }
}
function selectedProductionProductId(){
  const products = productionProducts();
  return products[0] ? products[0].id : null;
}


function productionProducts(){
  return activeItems().filter(i => {
    const c = String(i.category || "").toLowerCase();
    return c.includes("produk akhir") || c.includes("produk jadi") || pcsPerDus(i) > 0;
  }).slice().sort(sortByName);
}
function productionIngredients(productId){
  return activeItems().filter(i => Number(i.id) !== Number(productId)).slice().sort(sortByName);
}
function productionRows(){
  return (state.tx || []).filter(t => String(t.jenis_transaksi || "").includes("produksi"));
}
function recentProductionRows(){
  return productionRows().slice(0, 20);
}
async function addProductionTx(productData, bahanList){
  if(!guardDateOpen(productData.date, "Input produksi")) return false;
  if(!guardStockAvailable(bahanList, "Input produksi bahan")) return false;

  const code = productData.transaction_code || nextStockCode(productData);
  productData.transaction_code = code;
  productData.jam_transaksi = productData.jam_transaksi || nowTime();
  bahanList = (bahanList || []).map((b, idx) => Object.assign({}, b, {transaction_code:b.transaction_code || `${code}-B${idx+1}`, jam_transaksi:b.jam_transaksi || productData.jam_transaksi || nowTime()}));

  const main = await postStockTransactionSafe(productData);
  let fallback = !!main.fallback;

  for(const b of bahanList){
    const res = await postStockTransactionSafe(b);
    fallback = fallback || !!res.fallback;
  }

  await loadAll();
  await autoSyncGSheet("produksi_pemakaian_bahan");
  state.tab = "produksi";
  state.flash = fallback
    ? `Produksi tersimpan mode basic (${code}). Jalankan SQL V52 kalau schema belum lengkap.`
    : `Produksi berhasil (${code}). Stok produk bertambah, bumbu/plastik/dus/bahan yang dipakai otomatis berkurang.`;
  render();
  setTimeout(()=>{state.flash=""; render();}, 4500);
  return true;
}
function printReport(){
  window.print();
}

function reportSearchNorm(v){
  return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
function reportTxSearchText(t,item){
  return reportSearchNorm(`${t.transaction_code||""} ${t.date||""} ${txTime(t)||""} ${t.jenis_transaksi||"stok_harian"} ${t.no_surat_jalan||""} ${t.tujuan||""} ${t.jenis_dus||""} ${t.jenis_plastik||""} ${t.note||""} ${t.petugas||""} ${item && item.name || ""} ${item && item.category || ""} ${item ? packInfo(item) : ""}`);
}
function filteredReportTx(){
  const itemMap = Object.fromEntries((state.items || []).map(i=>[i.id,i]));
  const q = reportSearchNorm(state.reportSearch || "");
  const terms = q.split(" ").filter(Boolean);
  return (state.tx || []).filter(t => {
    const matchDate = !state.reportDate || t.date === state.reportDate;
    const jenis = t.jenis_transaksi || "stok_harian";
    const matchJenis = state.reportJenis === "Semua" || jenis === state.reportJenis;
    const matchGroup = (state.reportGroup || "Semua") === "Semua" || txReportGroup(t) === state.reportGroup;
    const item = itemMap[t.item_id] || {};
    const hay = reportTxSearchText(t,item);
    const matchSearch = !terms.length || terms.every(term => hay.includes(term));
    return matchDate && matchJenis && matchGroup && matchSearch;
  }).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")) || String(txTime(b)||"").localeCompare(String(txTime(a)||"")) || String(b.id||"").localeCompare(String(a.id||"")));
}

function autoCutNote(detail){
  return [
    "RINCIAN AUTO POTONG",
    detail.produkText,
    detail.dusQty > 0 ? detail.dusText : "",
    detail.produkQty > 0 ? detail.plastikText : ""
  ].filter(Boolean).join(" | ");
}
function renderAutoCutPreview(){
  const form = document.getElementById("factoryOutForm");
  const box = document.getElementById("autoCutPreview");
  if(!form || !box) return;
  const d = Object.fromEntries(new FormData(form).entries());
  const item = itemById(d.item_id);
  if(!item){ box.innerHTML = "Pilih barang dulu."; return; }
  const detail = autoCutDetail(item, d.keluar_dus, d.keluar_item, d.jenis_dus, d.jenis_plastik);
  const supportList = factorySupportPreviewFromForm(d);
  box.innerHTML = `
    <div><b>Produk Jadi</b><span>${esc(detail.produkText)}</span></div>
    <div><b>Dus</b><span>${esc(detail.dusText)}</span></div>
    <div><b>Plastik</b><span>${esc(detail.plastikText)}</span></div>
    <div><b>Bahan Pendukung</b><span>${supportList.length ? esc(supportList.join(" | ")) : "Opsional: bumbu, label, lakban, plastik tambahan, dus tambahan, dll"}</span></div>
    <small>Rincian ini otomatis masuk laporan dan memotong stok opname.</small>
  `;
}



function jenisDusOptions(){
  return ["Polos", "Sablon"];
}
function jenisDusLabel(v){
  const s = String(v || "").trim();
  return s || "-";
}

function minimalTxPayload(data){
  const out = {
    item_id: Number(data.item_id),
    date: data.date,
    keluar: Number(data.keluar || 0),
    masuk: Number(data.masuk || 0)
  };
  if(data.note || data.jenis_dus || data.jenis_plastik || data.transaction_code || data.jam_transaksi) out.note = [data.transaction_code ? `Kode: ${data.transaction_code}` : "", data.jam_transaksi ? `Jam: ${data.jam_transaksi}` : "", data.note, data.jenis_dus ? `Jenis Dus: ${data.jenis_dus}` : "", data.jenis_plastik ? `Jenis Plastik: ${data.jenis_plastik}` : ""].filter(Boolean).join(" | ");
  if(data.petugas) out.petugas = data.petugas;
  return out;
}
async function postStockTransactionSafe(data){
  let payload = Object.assign({}, data);
  let fallback = false;

  for(let attempt=0; attempt<6; attempt++){
    try{
      await api("/stock_transactions", {
        method:"POST",
        headers:{"Prefer":"return=representation"},
        body:JSON.stringify([payload])
      });
      return {fallback};
    }catch(e){
      const msg = String(e.message || e);
      const missing = extractMissingColumns(msg);
      if(missing.length){
        missing.forEach(c => { delete payload[c]; });
        fallback = true;
        continue;
      }

      // Kalau schema cache Supabase belum update, simpan dulu data inti.
      if(msg.toLowerCase().includes("schema cache") || msg.toLowerCase().includes("could not find")){
        payload = minimalTxPayload(data);
        fallback = true;
        continue;
      }

      // Kalau note/petugas pun belum ada di schema lama, coba benar-benar minimal.
      if(fallback){
        try{
          const onlyCore = {
            item_id: Number(data.item_id),
            date: data.date,
            keluar: Number(data.keluar || 0),
            masuk: Number(data.masuk || 0)
          };
          await api("/stock_transactions", {
            method:"POST",
            headers:{"Prefer":"return=representation"},
            body:JSON.stringify([onlyCore])
          });
          return {fallback:true};
        }catch(e2){}
      }
      throw e;
    }
  }

  throw new Error("Gagal simpan transaksi. Jalankan SQL V39 di Supabase agar kolom keluar_dus/keluar_item aktif.");
}

async function quickStockMove(id, mode){
  const item = itemById(id);
  const row = stockRowByItemId(id);
  if(!item || !row) return alert("Barang tidak ditemukan.");
  const m = ["masuk","keluar","pakai"].includes(mode) ? mode : "masuk";
  const label = m === "masuk" ? "MASUK" : (m === "pakai" ? "DIPAKAI" : "KELUAR");
  const qtyRaw = prompt(`${label} - ${item.name}\nIsi jumlah ${item.unit || "pcs"}:`, "");
  if(qtyRaw === null) return;
  const qty = Number(String(qtyRaw).replace(",", "."));
  if(!qty || qty <= 0 || Number.isNaN(qty)) return alert("Jumlah harus lebih dari 0.");
  if(m !== "masuk" && qty > Number(row.stock || 0)){
    return alert(`Stok ${item.name} tidak cukup. Sisa ${fmt(row.stock)} ${item.unit || ""}, mau ${label.toLowerCase()} ${fmt(qty)}.`);
  }
  const noteDefault = m === "masuk" ? "barang masuk" : (m === "pakai" ? "barang dipakai hari ini" : "barang keluar umum");
  const noteHint = m === "masuk"
    ? "Keterangan singkat (contoh: pembelian, supplier, koreksi tambah):"
    : (m === "pakai" ? "Keperluan dipakai (contoh: wedges shift pagi, mashed batch 001):" : "Keterangan keluar (contoh: sample, rusak, retur, pindah gudang):");
  const note = prompt(noteHint, noteDefault);
  if(note === null) return;
  const isOut = m !== "masuk";
  const payload = {
    item_id:Number(id),
    date:today(),
    jam_transaksi:nowTime(),
    keluar:isOut ? qty : 0,
    masuk:m === "masuk" ? qty : 0,
    keluar_dus:0,
    keluar_item:isOut ? qty : 0,
    masuk_dus:0,
    masuk_item:m === "masuk" ? qty : 0,
    jenis_transaksi:m === "masuk" ? "barang_masuk" : (m === "pakai" ? "barang_dipakai_hari_ini" : "barang_keluar"),
    note:[noteDefault, `${item.name}: ${fmt(qty)} ${item.unit || ""}`, note || ""].filter(Boolean).join(" | "),
    petugas:userEmail() || state.roleMode || "staff"
  };
  if(!guardDateOpen(payload.date, "Input cepat stok")) return;
  if(isOut && !guardStockAvailable([payload], `Input cepat barang ${label.toLowerCase()}`)) return;
  try{
    await postStockTransactionSafe(payload);
    await loadAll(true);
    await autoSyncGSheet(payload.jenis_transaksi || "input_cepat_stok");
    state.flash = `${item.name} berhasil ${m === "masuk" ? "ditambah" : "dikurangi"} ${fmt(qty)} ${item.unit || ""}.`;
    render();
    setTimeout(()=>{state.flash=""; render();}, 3000);
  }catch(e){
    alert("Gagal simpan: "+e.message);
  }
}
async function quickStockOpname(id){
  const item = itemById(id);
  const row = stockRowByItemId(id);
  if(!item || !row) return alert("Barang tidak ditemukan.");
  const def = row.physical === "" ? row.stock : row.physical;
  const raw = prompt(`OPNAME - ${item.name}\nIsi stok fisik hasil hitung (${item.unit || "pcs"}):`, def === "" ? "" : String(def));
  if(raw === null) return;
  const qty = Number(String(raw).replace(",", "."));
  if(Number.isNaN(qty) || qty < 0) return alert("Stok fisik harus angka 0 atau lebih.");
  try{
    await updateItem(id, {physical_stock:qty});
    const sync = confirm(`Fisik ${fmt(qty)} ${item.unit || ""} tersimpan.\nSamakan STOK SISTEM dengan angka fisik ini juga?`);
    if(sync){
      const before = Number(row.stock || 0);
      const newStartingStock = qty - Number(row.masuk || 0) + Number(row.keluar || 0);
      await api("/items?id=eq."+encodeURIComponent(id), {
        method:"PATCH",
        headers:{"Prefer":"return=representation"},
        body:JSON.stringify({starting_stock:newStartingStock, physical_stock:qty})
      });
      try{
        await postStockTransactionSafe({
          item_id:Number(id),
          date:today(),
          jam_transaksi:nowTime(),
          keluar:0, masuk:0,
          jenis_transaksi:"stock_opname",
          note:`STOCK OPNAME | ${item.name} | sistem ${fmt(before)} -> fisik ${fmt(qty)}`,
          petugas:userEmail() || state.roleMode || "staff"
        });
      }catch(auditErr){ console.warn("Audit opname gagal:", auditErr); }
      await loadAll(true);
      state.flash = `Opname ${item.name} selesai. Stok sistem disamakan ke ${fmt(qty)} ${item.unit || ""}.`;
      render();
      setTimeout(()=>{state.flash=""; render();}, 3200);
    }else{
      await loadAll(true);
      state.flash = `Fisik ${item.name} tersimpan ${fmt(qty)} ${item.unit || ""}. Stok sistem belum diubah.`;
      render();
      setTimeout(()=>{state.flash=""; render();}, 3000);
    }
  }catch(e){
    alert("Gagal opname: "+e.message);
  }
}

async function addTx(data){
  if(!guardDateOpen(data.date, "Input transaksi")) return;
  if(!guardStockAvailable([data], "Input barang keluar")) return;
  data.jam_transaksi = data.jam_transaksi || nowTime();
  data.transaction_code = data.transaction_code || nextStockCode(data);
  const result = await postStockTransactionSafe(data);
  await loadAll();
  await autoSyncGSheet(data.jenis_transaksi || "input_transaksi");
  state.tab="input";
  state.flash = result.fallback
    ? `Input tersimpan mode basic (${data.transaction_code}). Jalankan SQL V52 supaya kode transaksi aktif penuh.`
    : `Input ${String(data.jenis_transaksi || "transaksi").replaceAll("_"," ")} berhasil disimpan (${data.transaction_code}). Stok otomatis update.`;
  render();
  setTimeout(()=>{state.flash=""; render();}, 3600);
}
async function updateItem(id, patch){
  try{ await api("/items?id=eq."+encodeURIComponent(id), {method:"PATCH", headers:{"Prefer":"return=representation"}, body:JSON.stringify(patch)}); await loadAll(true); }
  catch(e){ alert("Gagal update: "+e.message); }
}
async function updateStockNow(id, desiredStock){
  if(!requireAdmin("Edit stok sistem")) return;
  if(isClosedDate(today())) return alert("Hari ini sudah closing. Buka closing dulu sebelum edit stok.");
  const row = rows().find(r => Number(r.id) === Number(id));
  if(!row) return alert("Barang tidak ditemukan.");
  if(desiredStock === "" || desiredStock === null || desiredStock === undefined) return;
  const target = Number(desiredStock);
  if(Number.isNaN(target)) return alert("Isi stok dengan angka.");
  const before = Number(row.stock || 0);
  const newStartingStock = target - Number(row.masuk || 0) + Number(row.keluar || 0);
  try{
    await api("/items?id=eq."+encodeURIComponent(id), {
      method:"PATCH",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify({starting_stock:newStartingStock})
    });

    // Audit log: tercatat di laporan tanpa mengubah stok.
    try{
      await postStockTransactionSafe({
        item_id:Number(id),
        date:today(),
        jam_transaksi:nowTime(),
        keluar:0,
        masuk:0,
        jenis_transaksi:"audit_edit_stok",
        note:`AUDIT EDIT STOK | ${row.name} | stok lama ${fmt(before)} ${row.unit||""} -> stok baru ${fmt(target)} ${row.unit||""}`,
        petugas:userEmail() || "admin"
      });
    }catch(auditErr){ console.warn("Audit log gagal:", auditErr); }

    await loadAll(true);
    await autoSyncGSheet("edit_stok_sistem");
    state.flash = `Stok ${row.name} berhasil diubah jadi ${fmt(target)} ${row.unit || ""}. Audit tersimpan.`;
    render();
    setTimeout(()=>{state.flash=""; render();}, 3200);
  }catch(e){
    alert("Gagal edit stok: "+e.message);
  }
}
async function addItem(data){
  if(!requireAdmin("Tambah barang")) return false;
  try{
    const inserted = await api("/items", {method:"POST", headers:{"Prefer":"return=representation"}, body:JSON.stringify([data])});
    if(data.image_url && inserted && inserted[0] && inserted[0].id) setLocalItemImage(inserted[0].id, data.image_url);
    await loadAll();
    state.flash = "Barang baru berhasil ditambahkan.";
    return true;
  }catch(e){
    const msg = String(e.message || e);
    // Kalau Supabase belum reload schema / kolom opsional belum ada, retry dengan kolom dasar saja.
    if(msg.includes("pcs_per_dus") || msg.includes("archived") || msg.includes("image_url") || msg.includes("schema cache") || msg.includes("Could not find")){
      try{
        const basic = {
          category:data.category,
          name:data.name,
          starting_stock:data.starting_stock,
          unit:data.unit,
          min_stock:data.min_stock,
          physical_stock:data.physical_stock ?? null
        };
        const insertedBasic = await api("/items", {method:"POST", headers:{"Prefer":"return=representation"}, body:JSON.stringify([basic])});
        if(data.image_url && insertedBasic && insertedBasic[0] && insertedBasic[0].id) setLocalItemImage(insertedBasic[0].id, data.image_url);
        await loadAll();
        state.flash = data.image_url ? "Barang baru berhasil ditambahkan. Gambar tersimpan lokal; jalankan SQL V127 supaya permanen." : "Barang baru berhasil ditambahkan. Catatan: kolom opsional belum aktif di Supabase.";
        return true;
      }catch(e2){
        alert("Gagal tambah barang: "+e2.message);
        return false;
      }
    }
    alert("Gagal tambah barang: "+msg);
    return false;
  }
}

function itemUsageCounts(id){
  const numId = Number(id);
  const txCount = (state.tx || []).filter(t => Number(t.item_id) === numId).length;
  const recipeCount = (state.recipes || []).filter(r => Number(r.product_id) === numId || Number(r.ingredient_item_id) === numId).length;
  return { txCount, recipeCount };
}
async function safeDeleteOptional(path){
  try{ await api(path, {method:"DELETE"}); }
  catch(e){
    const msg = String(e.message || e).toLowerCase();
    if(msg.includes("could not find") || msg.includes("schema cache") || msg.includes("not found") || msg.includes("does not exist")){
      console.warn("Lewati delete opsional:", path, e);
      return;
    }
    throw e;
  }
}
async function deleteItemCascadeRest(id){
  await safeDeleteOptional("/product_recipes?product_id=eq."+encodeURIComponent(id));
  await safeDeleteOptional("/product_recipes?ingredient_item_id=eq."+encodeURIComponent(id));
  await api("/stock_transactions?item_id=eq."+encodeURIComponent(id), {method:"DELETE", headers:{"Prefer":"return=minimal"}});
  await api("/items?id=eq."+encodeURIComponent(id), {method:"DELETE", headers:{"Prefer":"return=minimal"}});
}
async function deleteItemCascadeRpc(id, firstError){
  try{
    return await api("/rpc/delete_item_cascade", {
      method:"POST",
      headers:{"Prefer":"return=representation"},
      body:JSON.stringify({p_item_id:Number(id)})
    });
  }catch(rpcErr){
    const rpcMsg = String(rpcErr.message || rpcErr).toLowerCase();
    const rpcMissing = rpcMsg.includes("delete_item_cascade") || rpcMsg.includes("function") || rpcMsg.includes("404") || rpcMsg.includes("schema cache");
    if(rpcMissing && firstError) throw firstError;
    throw rpcErr;
  }
}
async function deleteItemPermanent(id){
  if(!requireAdmin("Hapus barang permanen")) return;
  const item = (state.items || []).find(x => String(x.id) === String(id));
  if(!item) return alert("Barang tidak ditemukan.");
  const usage = itemUsageCounts(id);
  const detail = [];
  if(usage.txCount) detail.push(`${usage.txCount} transaksi/laporan stok`);
  if(usage.recipeCount) detail.push(`${usage.recipeCount} formula produksi`);
  const extra = detail.length ? `\n\nData terkait yang ikut dihapus: ${detail.join(", ")}.` : "";
  if(!confirm(`HAPUS PERMANEN barang ini?\n\n${item.name}${extra}\n\nAksi ini tidak bisa dibatalkan. Kalau cuma mau sembunyikan, pilih Arsipkan saja.`)) return;
  if(!confirm(`Yakin sekali hapus permanen: ${item.name}?`)) return;
  try{
    try{
      await deleteItemCascadeRest(id);
    }catch(restErr){
      console.warn("Delete REST gagal, coba RPC V87:", restErr);
      await deleteItemCascadeRpc(id, restErr);
    }
    await loadAll(true);
    state.flash = `Barang ${item.name} berhasil dihapus permanen.`;
    render();
    setTimeout(()=>{state.flash=""; render();}, 2800);
  }catch(e){
    const msg = String(e.message || e);
    alert("Gagal hapus barang: "+msg+"\n\nSolusi: jalankan SQL supabase-v86-delete-arsip-rpc.sql di Supabase, lalu refresh Ctrl + F5 dan coba hapus lagi.");
  }
}

async function archiveItem(id){
  if(!requireAdmin("Arsip barang")) return;
  if(!confirm("Arsipkan barang ini? Barang tidak masuk kategori/dashboard/input utama, tapi tetap bisa dilihat di menu Arsip.")) return;
  try{ await updateItem(id,{archived:true}); await loadAll(); }
  catch(e){ alert("Gagal arsipkan barang: "+e.message); }
}
async function restoreItem(id){
  if(!requireAdmin("Pulihkan arsip")) return;
  try{ await updateItem(id,{archived:false}); await loadAll(); }
  catch(e){ alert("Gagal pulihkan barang: "+e.message); }
}
async function delTx(id){
  if(!requireAdmin("Hapus transaksi")) return;
  const t=(state.tx||[]).find(x=>String(x.id)===String(id));
  if(t && !guardDateOpen(t.date, "Hapus transaksi")) return;
  if(!confirm("Hapus transaksi ini?"))return;
  try{ await api("/stock_transactions?id=eq."+encodeURIComponent(id), {method:"DELETE"}); await loadAll(); await autoSyncGSheet("hapus_transaksi"); }
  catch(e){ alert("Gagal hapus: "+e.message); }
}
function csvDownload(filename, lines){
  const csv=lines.map(row=>row.map(cell=>`"${String(cell??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function exportStock(){
  csvDownload(`stock-opname-online-${today()}.csv`, [
    ["No","Kode / Barcode","Kategori","Area","Lokasi Gudang / Freezer","QC","Supplier","Batch/Lot","Expired","Nama Barang","Kemasan","Stok Pcs","Stok Dus+Item","Satuan","Jumlah Fisik","Selisih","Batas Minimum","Status","Rekomendasi Beli"],
    ...rows().map((r,i)=>[i+1,barcodeValue(r),r.category,stockAreaKind(r),stockLokasiLabel(r),stockQcValue(r),stockSupplierValue(r),stockBatchValue(r),stockExpValue(r),r.name,packInfo(r),r.stock,formatDusItem(r.stock,r),r.unit,r.physical,r.selisih,r.min_stock,r.status.label,formatDusItem(r.rekomendasi,r)])
  ]);
}

function productionGroupBaseCode(code){
  const c = String(code || "").trim();
  if(!c) return "";
  return c.replace(/-B\d+$/i, "");
}
function productionUsageGroups(){
  const itemMap = Object.fromEntries((state.items || []).map(i => [i.id, i]));
  const tx = (state.tx || []).slice();
  const hasil = tx.filter(t => String(t.jenis_transaksi || "").toLowerCase() === "produksi_hasil");
  const bahan = tx.filter(t => String(t.jenis_transaksi || "").toLowerCase() === "produksi_bahan");
  const search = reportSearchNorm(state.reportSearch || "");
  return hasil.map(h => {
    const code = productionGroupBaseCode(h.transaction_code) || `PROD-${h.id || h.date || ""}`;
    const product = itemMap[h.item_id] || {};
    const ingredients = bahan.filter(b => {
      const bc = productionGroupBaseCode(b.transaction_code);
      if(bc && code && bc === code) return true;
      if(!h.transaction_code && b.date === h.date && String(b.note || "").includes(product.name || "__none__")) return true;
      return false;
    }).sort((a,b)=>String(txTime(a)).localeCompare(String(txTime(b))) || String(a.id||"").localeCompare(String(b.id||"")));
    const text = reportSearchNorm(`${code} ${h.date||""} ${txTime(h)} ${product.name||""} ${product.category||""} ${h.note||""} ${h.petugas||""} ${ingredients.map(b=>{const i=itemMap[b.item_id]||{}; return `${i.name||""} ${i.category||""} ${b.note||""}`;}).join(" ")}`);
    return {code, hasil:h, product, ingredients, searchText:text};
  })
  .filter(g => !state.reportDate || g.hasil.date === state.reportDate)
  .filter(g => !search || g.searchText.includes(search))
  .sort((a,b)=>String(b.hasil.date||"").localeCompare(String(a.hasil.date||"")) || String(txTime(b.hasil)).localeCompare(String(txTime(a.hasil))) || String(b.code).localeCompare(String(a.code)));
}
function productionUsageSummaryHtml(groups){
  const limit = Number(state.productionUsageLimit || 12);
  const visible = groups.slice(0, limit);
  if(!groups.length){
    return `<section class="card production-usage-report-v132"><div class="toolbar"><div><h3>Laporan Pemakaian Bahan per Produk</h3><p class="muted">Belum ada produksi sesuai filter laporan.</p></div></div><div class="warning">Input produksi dulu, lalu bagian ini akan menampilkan bahan apa saja yang kepotong untuk tiap produk.</div></section>`;
  }
  return `<section class="card production-usage-report-v132">
    <div class="toolbar">
      <div>
        <h3>Laporan Pemakaian Bahan per Produk</h3>
        <p class="muted">Rekap ini menyambungkan transaksi <b>produksi_hasil</b> dengan bahan <b>produksi_bahan</b> dalam satu kode produksi.</p>
      </div>
      <div class="toolbar-actions"><button class="btn dark" id="exportProductionUsageBtn" type="button">Export Pemakaian Produk</button></div>
    </div>
    <div class="production-usage-grid-v132">
      ${visible.map(g=>{
        const unit = g.product.unit || "pcs";
        const bahanRows = g.ingredients.slice(0,10).map(b=>{const item = itemById(b.item_id) || {}; return `<li><b>${esc(item.name || "Bahan")}</b><span>${fmt(b.keluar || 0)} ${esc(item.unit || "")} keluar</span></li>`;}).join("");
        const more = g.ingredients.length > 10 ? `<li><b>+${fmt(g.ingredients.length-10)} bahan lagi</b><span>lihat di export CSV</span></li>` : "";
        return `<article class="production-usage-card-v132">
          <div class="production-usage-head-v132"><div><small>${esc(g.hasil.date || "-")} • ${esc(txTime(g.hasil))}</small><h4>${esc(g.product.name || "Produk")}</h4><span class="trx-code">${esc(g.code)}</span></div><b class="usage-result-v132">+${fmt(g.hasil.masuk || 0)} ${esc(unit)}</b></div>
          <ul>${bahanRows || `<li><b>Belum ada bahan terhubung</b><span>cek kode produksi / mode manual</span></li>`}${more}</ul>
          <button class="btn gray reportSearchCodeBtn" data-code="${esc(g.code)}" type="button">Lihat transaksi kode ini</button>
        </article>`;
      }).join("")}
    </div>
    ${groups.length > visible.length ? `<div class="report-load-more-v108"><b>Masih ada ${fmt(groups.length-visible.length)} produksi.</b><button type="button" class="btn gray" id="productionUsageMoreBtn">Tampilkan lagi</button></div>` : ""}
  </section>`;
}
function exportProductionUsage(){
  const groups = productionUsageGroups();
  const rowsCsv = [["Kode Produksi","Tanggal","Jam","Produk","Hasil Masuk","Satuan Produk","Bahan Dipakai","Kategori Bahan","Jumlah Keluar","Satuan Bahan","Petugas","Catatan"]];
  groups.forEach(g => {
    if(!g.ingredients.length){
      rowsCsv.push([g.code,g.hasil.date||"",txTime(g.hasil),g.product.name||"",Number(g.hasil.masuk||0),g.product.unit||"","(belum ada bahan terhubung)","",0,"",g.hasil.petugas||"",g.hasil.note||""]);
      return;
    }
    g.ingredients.forEach(b => {
      const item = itemById(b.item_id) || {};
      rowsCsv.push([g.code,g.hasil.date||"",txTime(g.hasil),g.product.name||"",Number(g.hasil.masuk||0),g.product.unit||"",item.name||"",item.category||"",Number(b.keluar||0),item.unit||"",b.petugas||g.hasil.petugas||"",b.note||""]);
    });
  });
  csvDownload(`pemakaian-bahan-per-produk-${state.reportDate || today()}.csv`, rowsCsv);
}
function exportTx(){
  const itemMap = Object.fromEntries((state.items || []).map(i=>[i.id,i]));
  const rowsTx = filteredReportTx();
  const dateLabel = state.reportDate || "semua-tanggal";
  const jenisLabel = String(state.reportJenis || "Semua").replace(/[^a-z0-9_-]+/gi,"-");
  const groupLabel = String(state.reportGroup || "Semua").replace(/[^a-z0-9_-]+/gi,"-");
  csvDownload(`laporan-filter-${dateLabel}-${groupLabel}-${jenisLabel}.csv`, [
    ["Kode","Tanggal","Jam","Grup Laporan","Jenis","No SJ/DO","Tujuan","Jenis Dus","Jenis Plastik","Nama Barang","Kategori","Kemasan","Keluar Pcs","Keluar Dus","Keluar Item","Masuk Pcs","Satuan","Keterangan","Petugas"],
    ...rowsTx.map(t=>{const i=itemMap[t.item_id]||{}; return [t.transaction_code||"",t.date||"",txTime(t),txReportGroup(t),t.jenis_transaksi||"stok_harian",t.no_surat_jalan||"",t.tujuan||"",t.jenis_dus||"",t.jenis_plastik||"",i.name||"(barang arsip/terhapus)",i.category||"",packInfo(i),Number(t.keluar||0),Number(t.keluar_dus||0),Number(t.keluar_item||0),Number(t.masuk||0),i.unit||"",t.note||"",t.petugas||""];})
  ]);
}

function setGSheetUrl(){
  const current = state.gsheetUrl || "";
  const value = prompt("Tempel URL Google Apps Script Web App (/exec) untuk export harian ke Google Sheet:", current);
  if(value === null) return;
  const clean = String(value || "").trim();
  if(clean && !/^https:\/\/script\.google\.com\/macros\/s\//.test(clean)){
    if(!confirm("URL ini bukan format Google Apps Script biasa. Tetap simpan?")) return;
  }
  state.gsheetUrl = clean;
  if(clean) localStorage.setItem("hf_gsheet_webhook_url_v87", clean);
  else localStorage.removeItem("hf_gsheet_webhook_url_v87");
  alert(clean ? "URL GSheet tersimpan. Klik Test GSheet dulu. Kalau test masuk LOG_SYNC, baru klik Kirim GSheet." : "URL Google Sheet dikosongkan.");
  render();
}

function testGSheetUrl(){
  const url = state.gsheetUrl || localStorage.getItem("hf_gsheet_webhook_url_v87") || "";
  if(!url){
    alert("Belum ada URL Apps Script. Klik Set GSheet dulu, tempel URL /exec.");
    return;
  }
  const sep = url.includes("?") ? "&" : "?";
  const testUrl = url + sep + "test=1&t=" + Date.now();
  alert("Browser akan buka halaman test GSheet. Kalau benar, akan muncul tulisan OK dan tab LOG_SYNC di Google Sheet ikut bertambah.");
  window.open(testUrl, "_blank");
}

function gsheetDirection(t){
  const j = String(t && t.jenis_transaksi || "stok_harian").toLowerCase();
  if(j.includes("opname")) return "OPNAME";
  if(Number(t && t.keluar || 0) > 0 && Number(t && t.masuk || 0) > 0) return "MIX";
  if(Number(t && t.keluar || 0) > 0) return "KELUAR";
  if(Number(t && t.masuk || 0) > 0) return "MASUK";
  return "INFO";
}
function isGSheetUsedMaterialTx(t){
  const j = String(t && t.jenis_transaksi || "").toLowerCase();
  return isDailyUsedTx(t) || j === "produksi_bahan" || j === "keluar_bahan_pendukung" || j === "keluar_plastik_pabrik" || j === "keluar_dus_pabrik";
}
function gsheetMapTx(t, itemMap, stockMap){
  const i = itemMap[t.item_id] || {};
  const stock = stockMap[t.item_id] || {};
  return {
    kode:t.transaction_code || "",
    tanggal:t.date || "",
    jam:txTime(t),
    arah:gsheetDirection(t),
    jenis:t.jenis_transaksi || "stok_harian",
    no_surat_jalan:t.no_surat_jalan || "",
    tujuan:t.tujuan || "",
    nama_barang:i.name || "(barang arsip/terhapus)",
    kategori:i.category || "",
    area:stockAreaKind(i),
    lokasi:stockLokasiLabel(i),
    qc:stockQcValue(i),
    kemasan:packInfo(i),
    keluar_pcs:Number(t.keluar || 0),
    keluar_dus:Number(t.keluar_dus || 0),
    keluar_item:Number(t.keluar_item || 0),
    masuk_pcs:Number(t.masuk || 0),
    masuk_dus:Number(t.masuk_dus || 0),
    masuk_item:Number(t.masuk_item || 0),
    stok_saat_ini:stock && stock.stock !== undefined ? Number(stock.stock || 0) : "",
    satuan:i.unit || "",
    jenis_dus:t.jenis_dus || "",
    jenis_plastik:t.jenis_plastik || "",
    keterangan:t.note || "",
    petugas:t.petugas || ""
  };
}
function productionUsageRowsForGSheet(date){
  const itemMap = Object.fromEntries((state.items || []).map(i => [i.id, i]));
  const tx = (state.tx || []).slice();
  const hasil = tx.filter(t => String(t.jenis_transaksi || "").toLowerCase() === "produksi_hasil" && String(t.date || "") === String(date || ""));
  const bahan = tx.filter(t => String(t.jenis_transaksi || "").toLowerCase() === "produksi_bahan");
  const out = [];
  hasil.forEach(h => {
    const code = productionGroupBaseCode(h.transaction_code) || `PROD-${h.id || h.date || ""}`;
    const product = itemMap[h.item_id] || {};
    const ingredients = bahan.filter(b => {
      const bc = productionGroupBaseCode(b.transaction_code);
      if(bc && code && bc === code) return true;
      if(!h.transaction_code && b.date === h.date && String(b.note || "").includes(product.name || "__none__")) return true;
      return false;
    }).sort((a,b)=>String(txTime(a)).localeCompare(String(txTime(b))) || String(a.id||"").localeCompare(String(b.id||"")));
    if(!ingredients.length){
      out.push({kode_produksi:code,tanggal:h.date||"",jam:txTime(h),produk:product.name||"",hasil_masuk:Number(h.masuk||0),satuan_produk:product.unit||"",bahan_dipakai:"(belum ada bahan terhubung)",kategori_bahan:"",jumlah_keluar:0,satuan_bahan:"",petugas:h.petugas||"",catatan:h.note||""});
    }else{
      ingredients.forEach(b => {
        const item = itemMap[b.item_id] || {};
        out.push({kode_produksi:code,tanggal:h.date||"",jam:txTime(h),produk:product.name||"",hasil_masuk:Number(h.masuk||0),satuan_produk:product.unit||"",bahan_dipakai:item.name||"",kategori_bahan:item.category||"",jumlah_keluar:Number(b.keluar||0),satuan_bahan:item.unit||"",petugas:b.petugas||h.petugas||"",catatan:b.note||""});
      });
    }
  });
  return out;
}
function dailyReportDataForGSheet(reason="manual"){
  const isAutoSync = reason && reason !== "manual";
  const date = isAutoSync ? today() : (state.reportDate || today());
  const jenisFilter = isAutoSync ? "Semua" : (state.reportJenis || "Semua");
  const groupFilter = isAutoSync ? "Semua" : (state.reportGroup || "Semua");
  const itemMap = Object.fromEntries((state.items || []).map(i=>[i.id,i]));
  const stockRows = rows();
  const stockMap = Object.fromEntries(stockRows.map(r => [r.id, r]));
  const allDateTx = (state.tx || [])
    .filter(t => String(t.date || "") === date)
    .sort((a,b)=>String(txTime(a)).localeCompare(String(txTime(b))) || String(a.id||"").localeCompare(String(b.id||"")));
  const transaksi = allDateTx
    .filter(t => jenisFilter === "Semua" || String(t.jenis_transaksi || "stok_harian") === jenisFilter)
    .filter(t => groupFilter === "Semua" || txReportGroup(t) === groupFilter)
    .map(t => gsheetMapTx(t, itemMap, stockMap));
  const keluar_masuk = allDateTx.map(t => gsheetMapTx(t, itemMap, stockMap));
  const barang_dipakai = allDateTx.filter(isGSheetUsedMaterialTx).map(t => gsheetMapTx(t, itemMap, stockMap));
  const pemakaian_produk = productionUsageRowsForGSheet(date);
  const stok = stockRows.map(r => ({
    kode:barcodeValue(r),
    nama_barang:r.name || "",
    kategori:r.category || "",
    area:stockAreaKind(r),
    lokasi:stockLokasiLabel(r),
    qc:stockQcValue(r),
    supplier:stockSupplierValue(r),
    batch_lot:stockBatchValue(r),
    expired:stockExpValue(r),
    kemasan:packInfo(r),
    stok:Number(r.stock || 0),
    stok_dus:formatDusItem(r.stock, r),
    fisik:r.physical === "" ? "" : Number(r.physical || 0),
    selisih:r.selisih === "" ? "" : Number(r.selisih || 0),
    minimum:Number(r.min_stock || 0),
    status:r.status.label,
    rekomendasi:formatDusItem(r.rekomendasi, r),
    satuan:r.unit || ""
  }));
  const kritis = stok.filter(x => x.status !== "AMAN");
  const summary = {
    total_transaksi:transaksi.length,
    total_keluar_pcs:transaksi.reduce((s,x)=>s+Number(x.keluar_pcs||0),0),
    total_masuk_pcs:transaksi.reduce((s,x)=>s+Number(x.masuk_pcs||0),0),
    total_keluar_masuk:keluar_masuk.length,
    total_barang_dipakai:barang_dipakai.length,
    total_pemakaian_produk:pemakaian_produk.length,
    total_item_stok:stok.length,
    stok_aman:stok.filter(x=>x.status==="AMAN").length,
    stok_kurang:stok.filter(x=>x.status==="DI BAWAH MINIMUM").length,
    stok_habis:stok.filter(x=>x.status==="HABIS").length
  };
  return {app:"Harry's Farm Stock", version:"V140 Simple Staff Flow", type:"realtime_keluar_masuk_pemakaian", reason, date, jenis_filter:jenisFilter, exported_at:new Date().toISOString(), exported_by:userEmail() || state.roleMode || "admin", summary, transaksi, keluar_masuk, barang_dipakai, pemakaian_produk, kritis, stok};
}

function toggleGSheetAutoSync(){
  if(!state.gsheetAuto && !(state.gsheetUrl || localStorage.getItem("hf_gsheet_webhook_url_v87"))){
    alert("Set URL GSheet dulu, baru aktifkan Auto GSheet.");
    setGSheetUrl();
    return;
  }
  state.gsheetAuto = !state.gsheetAuto;
  localStorage.setItem("hf_gsheet_auto_sync_v133", state.gsheetAuto ? "1" : "0");
  state.flash = state.gsheetAuto ? "Auto GSheet ON. Setiap transaksi baru akan update Google Sheet." : "Auto GSheet OFF. Pakai tombol Kirim GSheet untuk manual.";
  render();
  setTimeout(()=>{state.flash=""; render();}, 3200);
}
async function autoSyncGSheet(reason){
  const url = state.gsheetUrl || localStorage.getItem("hf_gsheet_webhook_url_v87") || "";
  if(!state.gsheetAuto || !url) return false;
  try{
    await submitGSheetFormPost(url, dailyReportDataForGSheet(reason || "auto"));
    state.lastSync = nowTime();
    return true;
  }catch(e){
    console.warn("Auto GSheet gagal:", e);
    return false;
  }
}

function submitGSheetFormPost(url, payload){
  // V113: Apps Script sering gagal kalau dikirim fetch no-cors dari browser.
  // Form POST lebih stabil karena tidak kena CORS/preflight dan doPost pasti terpanggil.
  return new Promise((resolve)=>{
    const iframeName = "hf_gsheet_hidden_iframe_" + Date.now();
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = iframeName;
    form.style.display = "none";
    form.enctype = "application/x-www-form-urlencoded";
    form.acceptCharset = "UTF-8";

    // V116: payload ditaruh dulu supaya Apps Script lebih mudah baca.
    const payloadInput = document.createElement("textarea");
    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify(payload);
    form.appendChild(payloadInput);

    const actionInput = document.createElement("input");
    actionInput.type = "hidden";
    actionInput.name = "hf_action";
    actionInput.value = "EXPORT";
    form.appendChild(actionInput);

    document.body.appendChild(form);
    form.submit();

    setTimeout(()=>{
      try{ form.remove(); iframe.remove(); }catch(_e){}
      resolve();
    }, 2200);
  });
}

async function sendDailyGSheet(){
  let url = state.gsheetUrl || localStorage.getItem("hf_gsheet_webhook_url_v87") || "";
  if(!url){
    const input = prompt("Belum ada URL Google Sheet. Tempel URL Google Apps Script Web App (/exec):", "");
    if(!input) return;
    url = String(input).trim();
    state.gsheetUrl = url;
    localStorage.setItem("hf_gsheet_webhook_url_v87", url);
  }
  const payload = dailyReportDataForGSheet();
  if(!confirm(`Kirim data realtime ${payload.date} ke Google Sheet?

Keluar/Masuk: ${payload.keluar_masuk.length}
Barang Dipakai: ${payload.barang_dipakai.length}
Pemakaian Produk: ${payload.pemakaian_produk.length}
Stok kritis: ${payload.kritis.length}
Snapshot stok: ${payload.stok.length}`)) return;
  try{
    await submitGSheetFormPost(url, payload);
    alert(`Data sudah dikirim lewat FORM POST.

Sekarang refresh Google Sheet dan cek tab:
1. LOG_SYNC harus ada baris POST / EXPORT
2. Harian_${payload.date}
3. STOK_REALTIME
4. KELUAR_MASUK_REALTIME
5. BARANG_DIPAKAI_REALTIME
6. PEMAKAIAN_PRODUK

Kalau LOG_SYNC hanya TEST, berarti URL /exec yang ditempel masih deployment lama. Deploy Apps Script V133 sebagai New version lalu Set GSheet ulang.`);
  }catch(e){
    alert("Gagal kirim ke Google Sheet: "+(e.message || e)+"\\n\\nCek URL Apps Script dan akses deployment Web App: Anyone.");
  }
}

function groupByCategorySummary(){
  const r = rows();
  const cats = {};
  r.forEach(x => {
    if(!cats[x.category]) cats[x.category] = {category:x.category, total:0, aman:0, kurang:0, habis:0, rekomendasi:0};
    cats[x.category].total += 1;
    if(x.status.label === "AMAN") cats[x.category].aman += 1;
    if(x.status.label === "DI BAWAH MINIMUM") cats[x.category].kurang += 1;
    if(x.status.label === "HABIS") cats[x.category].habis += 1;
    cats[x.category].rekomendasi += Number(x.rekomendasi || 0);
  });
  return Object.values(cats);
}
function dailyUsageSummary(){
  const map = {};
  state.tx.forEach(t => {
    if(!map[t.date]) map[t.date] = {date:t.date, keluar:0, masuk:0};
    map[t.date].keluar += Number(t.keluar || 0);
    map[t.date].masuk += Number(t.masuk || 0);
  });
  return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).slice(-7);
}
function barChartStatus(){
  const r = rows();
  const data = [
    {label:"Aman", value:r.filter(x=>x.status.label==="AMAN").length, cls:"aman"},
    {label:"Kurang", value:r.filter(x=>x.status.label==="DI BAWAH MINIMUM").length, cls:"kurang"},
    {label:"Habis", value:r.filter(x=>x.status.label==="HABIS").length, cls:"habis"}
  ];
  const max = Math.max(1, ...data.map(x=>x.value));
  return `<div class="chart-bars">${data.map(x=>`<div class="chart-row"><div class="chart-label">${esc(x.label)}</div><div class="chart-track"><div class="chart-fill ${x.cls}" style="width:${Math.max(5, (x.value/max)*100)}%"></div></div><div class="chart-value">${x.value}</div></div>`).join("")}</div>`;
}
function barChartDailyUsage(){
  const data = dailyUsageSummary();
  if(!data.length) return `<div class="empty-chart">Belum ada transaksi. Input pemakaian dulu supaya grafik muncul.</div>`;
  const max = Math.max(1, ...data.map(x=>Math.max(x.keluar, x.masuk)));
  return `<div class="daily-chart">${data.map(x=>`<div class="day-col"><div class="day-bars"><div title="Keluar ${fmt(x.keluar)}" class="day-bar keluar" style="height:${Math.max(4, (x.keluar/max)*120)}px"></div><div title="Masuk ${fmt(x.masuk)}" class="day-bar masuk" style="height:${Math.max(4, (x.masuk/max)*120)}px"></div></div><div class="day-name">${esc(x.date.slice(5))}</div></div>`).join("")}</div><div class="chart-legend"><span><b class="dot keluar"></b>Keluar</span><span><b class="dot masuk"></b>Masuk</span></div>`;
}
function tableCategorySummary(){
  const data = groupByCategorySummary();
  return `<div class="table-wrap compact"><table><thead><tr><th>Kategori</th><th class="right">Total</th><th class="right">Aman</th><th class="right">Kurang</th><th class="right">Habis</th></tr></thead><tbody>${data.map(x=>`<tr><td><b>${esc(x.category)}</b></td><td class="right">${x.total}</td><td class="right"><span class="pill-ok">${x.aman}</span></td><td class="right"><span class="pill-warn">${x.kurang}</span></td><td class="right"><span class="pill-bad">${x.habis}</span></td></tr>`).join("")}</tbody></table></div>`;
}


function isDusEligible(item){
  const c = String(item && item.category ? item.category : "").toLowerCase();
  const n = String(item && item.name ? item.name : "").toLowerCase();
  const hasWeight = /(500\s*(gr|g)|0\.5\s*kg|1\s*kg|1kg|2\s*kg|2kg)/.test(n);
  const productCat = c.includes("produk akhir") || c.includes("produk jadi") || c.includes("finished");
  return productCat || hasWeight;
}
function pcsPerDus(item){
  if(!isDusEligible(item)) return 0;
  const direct = Number(item && item.pcs_per_dus);
  if(direct > 0) return direct;
  const text = `${item && item.name ? item.name : ""} ${item && item.unit ? item.unit : ""}`.toLowerCase();
  if(/500\s*(gr|g)/.test(text) || text.includes("0.5")) return 20;
  if(text.includes("2 kg") || text.includes("2kg")) return 5;
  if(text.includes("1 kg") || text.includes("1kg")) return 10;
  return 0;
}
function formatDusItem(qty, item){
  const pcs = pcsPerDus(item);
  const n = Number(qty || 0);
  if(!pcs) return `${fmt(n)} ${esc(item && item.unit ? item.unit : "pcs")}`;
  const dus = Math.floor(n / pcs);
  const sisa = n % pcs;
  return `${fmt(dus)} dus${sisa ? ` + ${fmt(sisa)} pcs` : ""}`;
}
function packInfo(item){
  const pcs = pcsPerDus(item);
  if(!pcs) return "-";
  const kgPerPcs = 10 / pcs;
  const label = kgPerPcs === 0.5 ? "500 gr" : `${fmt(kgPerPcs)} kg`;
  return `${label} • ${pcs} pcs/dus`;
}
function pcsDusCell(x){
  if(!isDusEligible(x)) return `<span class="muted">-</span>`;
  return `<input class="input small-input pcsperdus" data-id="${x.id}" type="number" step="1" min="0" value="${pcsPerDus(x)||""}" placeholder="20/10/5">`;
}

function inputToPcs(dus, itemPcs, item){
  const pcs = pcsPerDus(item);
  return (Number(dus || 0) * Number(pcs || 0)) + Number(itemPcs || 0);
}
function itemById(id){
  return state.items.find(x => Number(x.id) === Number(id)) || {};
}


function produkAkhirItems(){
  const list = activeItems().filter(i => {
    const c = String(i.category || "").toLowerCase();
    return c.includes("produk akhir") || c.includes("produk jadi") || c.includes("finished");
  });
  return (list.length ? list.filter(isDusEligible) : activeItems().filter(isDusEligible)).slice().sort(sortByName);
}
function factoryOutRows(){
  return state.tx.filter(t => String(t.jenis_transaksi || "").toLowerCase() === "keluar_pabrik");
}
function exportFactoryOut(){
  const itemMap = Object.fromEntries(state.items.map(i=>[i.id,i]));
  csvDownload(`barang-keluar-pabrik-${today()}.csv`, [
    ["Kode","Tanggal","No Surat Jalan","Tujuan","Jenis Dus","Jenis Plastik","Nama Barang","Kategori","Kemasan","Keluar Pcs","Keluar Dus","Keluar Item","Petugas","Keterangan"],
    ...factoryOutRows().map(t=>{const i=itemMap[t.item_id]||{}; return [t.transaction_code||"",t.date,t.no_surat_jalan||"",t.tujuan||"",t.jenis_dus||"",t.jenis_plastik||"",i.name||"",i.category||"",packInfo(i),t.keluar,t.keluar_dus||0,t.keluar_item||0,t.petugas||"",t.note||""];})
  ]);
}
async function addFactoryOut(data, dusData=null, plastikData=null, extraDataList=[]){
  const extras = (extraDataList || []).filter(Boolean);
  if(!guardDateOpen(data.date, "Keluar pabrik")) return;
  if(!guardStockAvailable([data, dusData, plastikData, ...extras], "Keluar pabrik / bahan dipakai")) return;

  const mainCode = data.transaction_code || nextStockCode(data);
  data.transaction_code = mainCode;
  if(dusData) dusData.transaction_code = dusData.transaction_code || `${mainCode}-DUS`;
  if(plastikData) plastikData.transaction_code = plastikData.transaction_code || `${mainCode}-PLS`;
  extras.forEach((x, idx) => { x.transaction_code = x.transaction_code || `${mainCode}-PK${idx+1}`; });

  const result = await postStockTransactionSafe(data);
  let fallback = !!result.fallback;

  if(dusData){
    const dusResult = await postStockTransactionSafe(dusData);
    fallback = fallback || !!dusResult.fallback;
  }

  if(plastikData){
    const plastikResult = await postStockTransactionSafe(plastikData);
    fallback = fallback || !!plastikResult.fallback;
  }

  for(const extra of extras){
    const extraResult = await postStockTransactionSafe(extra);
    fallback = fallback || !!extraResult.fallback;
  }

  await loadAll();
  await autoSyncGSheet("keluar_pabrik");
  state.tab="keluarPabrik";
  state.flash = fallback
    ? `Keluar pabrik tersimpan mode basic (${mainCode}). Jalankan SQL V52 agar kode/kolom aktif penuh.`
    : (extras.length
        ? `Keluar pabrik berhasil (${mainCode}). Produk, dus, plastik pengiriman otomatis terpotong.`
        : (dusData || plastikData
            ? `Keluar pabrik berhasil (${mainCode}). Stok produk, dus, dan plastik otomatis terpotong.`
            : `Barang keluar pabrik berhasil disimpan (${mainCode}).`));
  render();
  setTimeout(()=>{state.flash=""; render();}, 4500);
}


function stockRowByItemId(id){
  return rows().find(x => Number(x.id) === Number(id)) || null;
}
function activeCategories(){
  const counts = simpleCategoryCounts(activeItems());
  return simpleStockCategories().filter(c => c === "Semua" || counts[c] > 0);
}
function posItems(){
  return activeItems().filter(i => state.posCategory === "Semua" || simpleStockCategory(i) === state.posCategory);
}
function setSafeSelectedItemForCategory(category){
  state.posCategory = category;
  const list = activeItems().filter(i => category === "Semua" || simpleStockCategory(i) === category);
  if(list.length){
    const current = itemById(document.querySelector('[name="item_id"]')?.value);
    if(!current || isArchivedItem(current) || (category !== "Semua" && simpleStockCategory(current) !== category)){
      return list[0].id;
    }
  }
  return "";
}


function masterItemTemplates(){
  // V89: fix kategori APD/perlengkapan produksi tampil sebagai Bahan Penolong.
  return [
  {
    "category": "Produk Akhir",
    "name": "Wedges Plain 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA01",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Wedges Plain 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA02",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Wedges Plain 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA03",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Waffle Seasoned Fries 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA04",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Waffle Seasoned Fries 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA05",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Waffle Seasoned Fries 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA06",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Rendang Seasoned Wedges 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA07",
    "starting_stock": 11
  },
  {
    "category": "Produk Akhir",
    "name": "Rendang Seasoned Wedges 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA08",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Rendang Seasoned Wedges 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA09",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Mashed Potato 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA10",
    "starting_stock": 37
  },
  {
    "category": "Produk Akhir",
    "name": "Mashed Potato 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA11",
    "starting_stock": -51
  },
  {
    "category": "Produk Akhir",
    "name": "Mashed Potato 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA12",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Cheesy Potato Nuggets 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA13",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Cheesy Potato Nuggets 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA14",
    "starting_stock": 11
  },
  {
    "category": "Produk Akhir",
    "name": "Cheesy Potato Nuggets 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA15",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Mozzarella Potato Sticks 10pcs",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA16",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Mozzarella Potato Balls 10pcs",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA17",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Mixed Vegetables 4 Ways 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA18",
    "starting_stock": 4
  },
  {
    "category": "Produk Akhir",
    "name": "Mixed Vegetables 3 Ways 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA19",
    "starting_stock": 5
  },
  {
    "category": "Produk Akhir",
    "name": "Mixed Capcay 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA20",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Jagung Manis Pipil 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA21",
    "starting_stock": 12
  },
  {
    "category": "Produk Akhir",
    "name": "Jagung",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA22",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Wortel",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA23",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Buncis",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA24",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Kacang Polong",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA25",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Crinkle Cut 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA26",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Crinkle Cut 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA27",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Crinkle Cut 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA28",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Seasoned Wedges 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 20,
    "lokasi": "Freezer Produk Jadi - 500gr",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA29",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Seasoned Wedges 1kg ( Sablon )",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA30",
    "starting_stock": 30
  },
  {
    "category": "Produk Akhir",
    "name": "Seasoned Wedges 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA31",
    "starting_stock": 4
  },
  {
    "category": "Produk Akhir",
    "name": "Sweet Chopped Carrots",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA32",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Shoestring Battercoated 2kg",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 5,
    "lokasi": "Freezer Produk Jadi - 2kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA33",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Baby Potato",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Produk Jadi",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA34",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Edamame 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "PA35",
    "starting_stock": 0
  },
  {
    "category": "Produk Akhir",
    "name": "Seasoned Wedges 1kg ( Polos )",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "",
    "starting_stock": 36
  },
  {
    "category": "Produk Akhir",
    "name": "Mashed Potato 1kg ( Sablon ) GB",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 10,
    "lokasi": "Freezer Produk Jadi - 1kg",
    "supplier": "Produksi Internal",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Produk Akhir",
    "item_code": "",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kentang Atlantik",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB01",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kentang Granola",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB02",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kentang Medians",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB03",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Jagung",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB04",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Wortel",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB05",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Buncis",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB06",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kacang Polong",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB07",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Brokoli",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB08",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kembang Kol",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB09",
    "starting_stock": 0
  },
  {
    "category": "Bahan Baku",
    "name": "Kentang Ventury",
    "unit": "kg",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Freezer Bahan Baku",
    "supplier": "Supplier Bahan Baku",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Baku",
    "item_code": "BB10",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik uk 30x45",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK01",
    "starting_stock": 40939
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik uk 20x35",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK02",
    "starting_stock": 149
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik uk 15x25",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK03",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik uk 90x120 (trashbag)",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK04",
    "starting_stock": 32
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Cheesy Potato Nugget 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK05",
    "starting_stock": 45
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Cheesy Potato Nugget 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK06",
    "starting_stock": 95
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Cheesy Potato Nugget 500gr (sablon)",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK07",
    "starting_stock": 65
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Hashbrown 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK08",
    "starting_stock": 180
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Hashbrown 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK09",
    "starting_stock": 200
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Hashbrown 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK10",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Jagung 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK11",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Jagung 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK12",
    "starting_stock": 480
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Mashed Potato 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK13",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Mashed Potato 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK14",
    "starting_stock": 66
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Mashed Potato 500gr (sablon)",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK15",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Mix Vegetables 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK16",
    "starting_stock": 45
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Mix Vegetables 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK17",
    "starting_stock": 47
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Polos 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK18",
    "starting_stock": 22
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Polos 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK19",
    "starting_stock": 215
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Polos 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK20",
    "starting_stock": 4160
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Rendang Wedges 500gr (sablon)",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK21",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Rendang Wedges 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK22",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Fries 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK23",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Fries 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK24",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Fries 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK25",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Wedges 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK26",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Wedges 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK27",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Seasoned Wedges 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK28",
    "starting_stock": 256
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Shoestring 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK29",
    "starting_stock": 71
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Shoestring 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK30",
    "starting_stock": 61
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Straightcut 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK31",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Straightcut 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK32",
    "starting_stock": 87
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Tulisan Hitam 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK33",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Waffle Fries 500gr (sablon)",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK34",
    "starting_stock": 396
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Waffle Fries 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK35",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Wedges Plain 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK36",
    "starting_stock": 20
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Wedges Plain 250gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK37",
    "starting_stock": 57
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Wedges Plain 500gr",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK38",
    "starting_stock": 234
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Wedges Plain 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK39",
    "starting_stock": 40
  },
  {
    "category": "Bahan Kemas",
    "name": "Stiker Potato Balls",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK40",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Stiker Potato Sticks",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK41",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Kardus Polos",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK42",
    "starting_stock": 95
  },
  {
    "category": "Bahan Kemas",
    "name": "Kardus Sablon",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK43",
    "starting_stock": -35
  },
  {
    "category": "Bahan Kemas",
    "name": "Lakban",
    "unit": "roll",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK44",
    "starting_stock": 3
  },
  {
    "category": "Bahan Kemas",
    "name": "plastik 60 x 100",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK45",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Southmount 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK46",
    "starting_stock": 560
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Southmount 2kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK47",
    "starting_stock": 411
  },
  {
    "category": "Bahan Kemas",
    "name": "plastik 40 x 60",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK48",
    "starting_stock": 0
  },
  {
    "category": "Bahan Kemas",
    "name": "Plastik Crinkle Cut 1kg",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bahan Kemas",
    "supplier": "Supplier Kemasan",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Kemas",
    "item_code": "BK49",
    "starting_stock": 19
  },
  {
    "category": "Bahan Penolong",
    "name": "Masker",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Perlengkapan Produksi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP01",
    "starting_stock": -58
  },
  {
    "category": "Bahan Penolong",
    "name": "Sarung Tangan Plastik",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Perlengkapan Produksi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP02",
    "starting_stock": -275
  },
  {
    "category": "Bahan Penolong",
    "name": "Sarung Tangan Latex",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Perlengkapan Produksi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP03",
    "starting_stock": 0
  },
  {
    "category": "Bahan Penolong",
    "name": "Nurse Cap",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Perlengkapan Produksi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP04",
    "starting_stock": -46
  },
  {
    "category": "Bahan Penolong",
    "name": "Spidol",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Perlengkapan Produksi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP05",
    "starting_stock": 12
  },
  {
    "category": "Bahan Penolong",
    "name": "Sabun Cuci Piring",
    "unit": "ml",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Kebersihan & Sanitasi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP06",
    "starting_stock": 570
  },
  {
    "category": "Bahan Penolong",
    "name": "Sabun Lantai",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Kebersihan & Sanitasi",
    "supplier": "Supplier Bahan Penolong",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Penolong",
    "item_code": "BP07",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Minyak Sawit",
    "unit": "liter",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Chiller / Gudang BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP01",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Minyak Canola",
    "unit": "liter",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Chiller / Gudang BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP02",
    "starting_stock": 5
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Dextrose Monohydrate",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP03",
    "starting_stock": 2150
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Malto Dextrin",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP04",
    "starting_stock": 18700
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Citric Acid",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP05",
    "starting_stock": 24645
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Garam",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP06",
    "starting_stock": 4600
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Knorr",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP07",
    "starting_stock": 7710
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Tepung Beras",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP08",
    "starting_stock": 54800
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Tepung Terigu",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP09",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Tepung Jagung",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP10",
    "starting_stock": 3540
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Tepung Kentang",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP11",
    "starting_stock": 2610
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Bawang Putih Bubuk / Garlic Powder",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP12",
    "starting_stock": 28565
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Roasted Garlic",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP13",
    "starting_stock": 1000
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Lada Putih",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP14",
    "starting_stock": 2765
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Bumbu Rendang Indofood",
    "unit": "pcs",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP15",
    "starting_stock": 27
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Keju Mozzarella",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Chiller / Gudang BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP16",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Keju Cheddar",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Chiller / Gudang BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP17",
    "starting_stock": 6500
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Polenta",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP18",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Baking Powder",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP19",
    "starting_stock": 5530
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Ragi",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP20",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Chili Powder",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP21",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Paprika Bubuk",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP22",
    "starting_stock": 15430
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Pewarna Merah",
    "unit": "ml",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP23",
    "starting_stock": 0
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Maizena",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP24",
    "starting_stock": 52950
  },
  {
    "category": "Bahan Tambahan Pangan",
    "name": "Tapioka",
    "unit": "gr",
    "min_stock": 0,
    "pcs_per_dus": 0,
    "lokasi": "Gudang Bumbu & BTP",
    "supplier": "Supplier Bumbu/BTP",
    "qc_status": "OK",
    "deskripsi": "Import KStok HF Maret Pabrik 2026 - KS Bahan Tambahan Pangan",
    "item_code": "BTP25",
    "starting_stock": 1000
  }
];
}

function kategoriOptions(){
  return [
  "Produk Akhir",
  "Bahan Baku",
  "Bahan Kemas",
  "Bahan Penolong",
  "Bahan Tambahan Pangan",
  "Lainnya"
];
}
function satuanOptions(){
  return ["pcs","kg","gr","liter","ml","roll","pack","dus","botol","bungkus","lembar","box","pail","karung","set","unit"];
}
function buildItemNameFromForm(d){
  const nama = String(d.name || "").trim();
  const varian = String(d.varian || "").trim();
  const ukuran = String(d.ukuran || "").trim();
  return [nama, varian, ukuran].filter(Boolean).join(" ").replace(/\s+/g," ").trim();
}
function resetItemDraft(){
  state.itemDraft = {category:"Produk Akhir",name:"",varian:"",ukuran:"",starting_stock:"",unit:"pcs",min_stock:"",pcs_per_dus:"",lokasi:"",supplier:"",qc_status:"OK",batch_lot:"",expired_date:"",deskripsi:"",image_url:""};
}

function inferPcsPerDusFromText(text){
  const s = String(text || "").toLowerCase();
  if(/500\s*(gr|g)/.test(s) || s.includes("0.5 kg") || s.includes("0,5 kg")) return 20;
  if(s.includes("2 kg") || s.includes("2kg")) return 5;
  if(s.includes("1 kg") || s.includes("1kg")) return 10;
  return 0;
}

function renderSetup(){
  app.innerHTML = `<div class="container"><div class="card">
    <h1>Setup belum lengkap, bos</h1>
    <p class="muted">Buka file <b>config.js</b>, tempel <b>Publishable key</b> dari Supabase.</p>
    <div class="warning">Kalau masih ada tulisan <b>TEMPEL_PUBLISHABLE_KEY_DI_SINI</b>, aplikasi tidak bisa ambil data.</div>
    <h3>Isi config.js:</h3>
    <pre class="code">window.SUPABASE_CONFIG = {
  url: "https://truetszmisbkiqargrom.supabase.co",
  anonKey: "sb_publishable_xxxxxxxxxxxxx"
};</pre>
  </div></div>`;
}
function renderLogin(){
  app.innerHTML = `<div class="container">
    <div class="login-card card">
      <div class="brand-login"><img src="/logo.png" alt="Harry\'s Farm Logo"><p class="kicker-dark">Harry's Farm</p></div>
      <h1>Login Staff Stok Gambar</h1>
      <p class="muted">Masuk dengan email dan password staff. Sistem stok internal hanya bisa dibuka oleh akun staff yang terdaftar.</p>
      ${state.error ? `<div class="error" style="margin:12px 0"><b>Error:</b> ${esc(state.error)}</div>` : ""}
      <form id="loginForm" class="login-form">
        <div class="field"><label>Email Staff</label><input class="input" type="email" name="email" placeholder="staff@harrys-farm.com" required autocomplete="email"></div>
        <div class="field"><label>Password</label><input class="input" type="password" name="password" placeholder="Password staff" required autocomplete="current-password"></div>
        <button class="btn dark full" type="submit">${state.loginLoading ? "Memproses..." : "Login"}</button>
      </form>
      <div class="warning" style="margin-top:14px">Akun staff dibuat di Supabase → Authentication → Users.</div>
    </div>
  </div>`;
  const f=document.getElementById("loginForm");
  if(f) f.onsubmit=(e)=>{e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries()); login(d.email, d.password);};
}
function layout(content){
  const r=rows(), aman=r.filter(x=>x.status.label==="AMAN").length, kurang=r.filter(x=>x.status.label==="DI BAWAH MINIMUM").length, habis=r.filter(x=>x.status.label==="HABIS").length;
  const staffNav = [
    tab("dashboard","Home"),
    tab("input","Masuk","masuk"),
    tab("produksi","Produksi"),
    tab("keluarPabrik","Keluar"),
    tab("stock","Stok"),
    tab("laporan","Laporan")
  ].join("");
  const adminNav = staffNav + [
    tab("absen","Absen"),
    tab("pakaiBahan","Pakai Manual"),
    tab("arsip","Arsip")
  ].join("");
  const navHtml = state.roleMode === "admin" ? adminNav : staffNav;
  return `<div class="container app-shell-v116 gas-app-v117 staff-simple-v135 clean-dashboard-v137">
    <header class="hero modern-shell-v116 gas-shell-v117">
      <div class="brand-head modern-brand-v116"><img src="/logo.png" alt="Harry\'s Farm Logo"><div><p class="kicker">Harry's Farm Stock App</p><h1>Dashboard Stok Harry's Farm</h1><p>Menu dibuat simple: barang masuk, produksi hari ini, barang keluar, stok, dan laporan.</p><div class="hero-chips-v116"><span>Simple Staff</span><span>Live Stock</span><span>${today()}</span><span>${roleLabel()}</span></div></div></div>
      <div class="hero-stats modern-hero-stats-v116">
        <div class="hero-stat"><span>Total Item Aktif</span><strong>${activeItems().length} barang</strong></div>
        <div class="hero-stat"><span>Staff Login</span><strong title="${esc(userEmail())}">${esc(userEmail() || "-")}</strong></div>
        <div class="hero-stat"><span>Sync</span><strong>${state.lastSync || "-"}</strong></div>
        <div class="hero-stat role-stat"><span>Mode UI</span><select class="role-select" id="roleModeSelect"><option value="admin" ${state.roleMode==="admin"?"selected":""}>Admin</option><option value="staff" ${state.roleMode==="staff"?"selected":""}>Staff</option></select></div>
        <button class="btn logout" id="logoutBtn" type="button">Logout</button>
      </div>
    </header>
    ${state.error ? `<div class="error" style="margin-top:14px"><b>Error:</b> ${esc(state.error)}<br><span class="muted">Cek login staff, config.js, atau policy RLS Supabase.</span></div>` : ""}
    ${state.flash ? `<div class="vip-done"><b>DONE</b> ${esc(state.flash)}</div>` : ""}
    <nav class="tabs simple-tabs-v135">${navHtml}</nav>
    ${content}
    <div class="footer-note">${state.loading?"mengambil data...":`online staff • aman ${aman} • kurang ${kurang} • habis ${habis} • GSheet Realtime`}</div>
  </div>`;
}
function tab(id,label,mode){const icons={dashboard:"🏠",input:"➕",absen:"👥",pakaiBahan:"🧾",produksi:"🏭",keluarPabrik:"🚚",stock:"📦",laporan:"📄",arsip:"🗂️"}; const modeAttr = mode ? ` data-input-mode="${esc(mode)}"` : ""; return `<button class="tab ${state.tab===id?"active":""}" data-tab="${id}"${modeAttr}><span class="tab-emoji">${icons[id]||"•"}</span><span>${label}</span></button>`;}
function stat(title,val,note,target,status){
  const attrs = target ? ` data-stat-target="${target}" data-stat-status="${status || "Semua"}" role="button" tabindex="0"` : "";
  const cls = target ? "card stat-clickable modern-stat-v116" : "card modern-stat-v116";
  const icons = {"Total Barang":"📦","Kurang/Habis":"⚠️","Keluar Hari Ini":"↗","Masuk Hari Ini":"↙","Barang Dipakai":"🧾","Produksi":"🏭","Keluar Pabrik":"🚚","Barang Keluar":"🚚","Closing":"🔒"};
  return `<div class="${cls}"${attrs}>
    <div class="stat-top-v116"><span class="stat-icon-v116">${icons[title] || "📊"}</span><div class="stat-title">${esc(title)}</div></div>
    <div class="stat-value">${esc(val)}</div>
    <div class="muted">${esc(note)}</div>
    <div class="stat-hint">${target ? "Klik untuk buka detail" : ""}</div>
  </div>`;
}

function productShowcaseHtml(){
  const cards = [
    {
      title:"Potato Series",
      subtitle:"Wedges • Skin On • Mashed",
      img:"https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=900&q=80",
      tab:"produksi"
    },
    {
      title:"Vegetables",
      subtitle:"Corn • Mix Vegetables • Edamame",
      img:"https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=900&q=80",
      tab:"stock"
    },
    {
      title:"Packaging",
      subtitle:"Plastik • Kardus • Stiker",
      img:"https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80",
      tab:"stock"
    }
  ];
  return `<section class="product-showcase">
    ${cards.map(c=>`<button class="product-card" data-tab="${c.tab}" style="--img:url('${c.img}')">
      <div class="product-card-img"></div>
      <div class="product-card-body">
        <span>Harry's Farm</span>
        <b>${esc(c.title)}</b>
        <small>${esc(c.subtitle)}</small>
      </div>
    </button>`).join("")}
  </section>`;
}

function dashboard(){
  const r=rows();
  const lowRows=r.filter(x=>x.status.label!=="AMAN");
  const kurangRows=lowRows.slice(0,8);
  const amanCount=r.filter(x=>x.status.label==="AMAN").length;
  const kurangCount=r.filter(x=>x.status.label==="DI BAWAH MINIMUM").length;
  const habisCount=r.filter(x=>x.status.label==="HABIS").length;
  const todayOut=state.tx.filter(t=>t.date===today()).reduce((s,t)=>s+Number(t.keluar||0),0);
  const todayIn=state.tx.filter(t=>t.date===today()).reduce((s,t)=>s+Number(t.masuk||0),0);
  const factory=todaysFactoryInfo();
  const used=todaysUsedInfo();
  const checklist=dailyChecklist();
  const recs=recommendationList();
  const closed = isClosedDate(today());

  return layout(`<main class="dashboard-v137 simple-home modern-dashboard-v116 gas-dashboard-v117 clean-home-v137">
    <section class="dashboard-welcome-v137 card">
      <div class="welcome-copy-v137">
        <p class="vip-kicker">ALUR SIMPLE STAFF</p>
        <h2>Kerja Stok Hari Ini</h2>
        <p>Patokan gampang: <b>barang datang</b> masuk ke Masuk, <b>bikin produk</b> masuk ke Produksi, <b>barang dikirim/rusak/retur</b> masuk ke Keluar.</p>
        <div class="welcome-tags-v137">
          <span>Live: ${state.lastSync || "menunggu sync"}</span>
          <span>${lowRows.length} stok perlu cek</span>
          <span>${closed ? "Closing terkunci" : "Siap closing"}</span>
        </div>
      </div>
      <div class="today-box-v137">
        <span>Hari Ini</span>
        <b>${today()}</b>
        <small>Masuk ${fmt(todayIn)} • Keluar ${fmt(todayOut)} • Dipakai ${fmt(used.count)} item</small>
      </div>
      <div class="hero-actions-v137">
        <button class="btn dark" id="refreshBtn" type="button">Sync Data</button>
        <button class="btn gray" id="printDailyFullBtn" type="button">Print Harian</button>
        <button class="btn gray" id="backupJsonBtn" type="button">Backup JSON</button>
        <button class="btn gray" id="backupMonthlyBtn" type="button">Backup Bulanan</button>
        <button class="btn gray" id="changePinBtn" type="button">PIN Admin</button>
        ${closed?`<button class="btn red" id="reopenClosingBtn" type="button">Buka Closing</button>`:`<button class="btn green" id="closeTodayBtn" type="button">Closing Hari Ini</button>`}
      </div>
    </section>

    <section class="flow-step-v137">
      <button class="flow-step-card-v137 masuk" data-tab="input" data-input-mode="masuk">
        <i>1</i><strong>Barang Masuk</strong><span>Dus, plastik, bumbu, kentang datang</span>
      </button>
      <button class="flow-step-card-v137 produksi" data-tab="produksi">
        <i>2</i><strong>Produksi Hari Ini</strong><span>Pilih produk, bahan otomatis kepotong</span>
      </button>
      <button class="flow-step-card-v137 keluar" data-tab="keluarPabrik">
        <i>3</i><strong>Barang Keluar</strong><span>Produk akhir, dus/plastik kirim, rusak, retur</span>
      </button>
      <button class="flow-step-card-v137 stok" data-tab="stock">
        <i>4</i><strong>Cek Stok</strong><span>Opname, edit minimum, gambar barang</span>
      </button>
    </section>

    <section class="summary-grid-v137">
      ${stat("Total Barang",activeItems().length,"item aktif","stock","Semua")}
      ${stat("Kurang/Habis",lowRows.length,"perlu cek cepat","stock","KURANG/HABIS")}
      ${stat("Masuk Hari Ini",fmt(todayIn),"barang datang","laporan","")}
      ${stat("Barang Keluar",fmt(todayOut),"kirim/rusak/retur","laporan","")}
      ${stat("Produksi",`${fmt(used.count)} item`,`bahan kepotong` ,"produksi","")}
      ${stat("Closing",closed?"Terkunci":"Belum",closed?"hari ini aman":"jangan lupa closing","dashboard","")}
    </section>

    <section class="quick-menu modern-quick-menu-v116 quick-menu-v137">
      <button class="quick-card" data-tab="input" data-input-mode="masuk"><i>➕</i><b>Barang Masuk</b><span>Tambah stok barang datang</span></button>
      <button class="quick-card" data-tab="produksi"><i>🏭</i><b>Produksi</b><span>Bikin wedges/produk, potong bahan</span></button>
      <button class="quick-card" data-tab="keluarPabrik"><i>🚚</i><b>Barang Keluar</b><span>Produk akhir, dus, plastik keluar</span></button>
      <button class="quick-card" data-tab="laporan"><i>📄</i><b>Laporan</b><span>Filter masuk/produksi/keluar</span></button>
    </section>

    <section class="card checklist-card-v116 checklist-v137">
      <div class="toolbar"><div><h2>Checklist Harian</h2><p class="muted">Tanda cepat supaya kerja staff tidak ada yang kelewat.</p></div><span class="pill">${today()}</span></div>
      <div class="checklist-grid modern-checklist-v116">
        ${checklist.map(c=>`<button class="check-card ${c.ok?"done":"todo"}" data-tab="${c.tab}">
          <div><b>${esc(c.title)}</b><span>${esc(c.note)}</span></div>
          <strong>${esc(c.value)}</strong>
        </button>`).join("")}
      </div>
    </section>

    <section class="grid two-col dashboard-panels-v137">
      <div class="card recommendation-card">
        <div class="toolbar"><div><h2>Rekomendasi Cek</h2><p class="muted">Yang sebaiknya dicek dulu oleh admin/staff.</p></div><span class="pill">Auto Check</span></div>
        <div class="recommend-list">
          ${recs.map(x=>`<button class="recommend-item ${esc(x.level)}" data-tab="${x.tab}">
            <b>${esc(x.title)}</b>
            <span>${esc(x.text)}</span>
          </button>`).join("")}
        </div>
      </div>

      <div class="card priority-card-v116">
        <div class="toolbar"><div><h2>Prioritas Beli / Cek</h2><p class="muted">Barang kurang/habis paling atas.</p></div><button class="btn gray" data-tab="stock">Buka Stok</button></div>
        <div class="simple-list">
          ${kurangRows.map(x=>`<button class="simple-row" data-tab="stock">
            <div><b>${esc(x.name)}</b><span>${esc(x.category)}</span></div>
            <strong>${fmt(x.stock)} ${esc(x.unit)}</strong>
          </button>`).join("") || `<div class="ok">Semua stok aman.</div>`}
        </div>
      </div>
    </section>

    <section class="grid two-col desktop-only chart-panel-v116 chart-v137">
      <div class="card">
        <div class="toolbar"><div><h2>Grafik Status Stok</h2><p class="muted">Perbandingan barang aman, kurang, dan habis.</p></div><span class="pill">Grafik</span></div>
        ${barChartStatus()}
      </div>
      <div class="card">
        <div class="toolbar"><div><h2>Grafik Transaksi 7 Hari</h2><p class="muted">Total barang keluar dan masuk per tanggal.</p></div><span class="pill">Harian</span></div>
        ${barChartDailyUsage()}
      </div>
    </section>
  </main>`);
}

function inputModeMeta(mode){
  const m = String(mode || "masuk");
  const meta = {
    masuk:{
      icon:"➕", cls:"masuk", kicker:"1. BARANG MASUK", title:"Barang Masuk", short:"Barang datang", desc:"Pakai ini kalau dus, plastik, bumbu, kentang, bahan baku, atau barang lain baru datang. Stok otomatis bertambah.", qtyLabel:"Jumlah Masuk", qtyHelp:"Contoh: 10 dus / 500 pcs / 25 kg / 500 gr", noteLabel:"Supplier / Catatan", notePlaceholder:"Contoh: supplier A / pembelian / retur masuk", submit:"SIMPAN BARANG MASUK", side:"Barang datang dari supplier/pembelian = masuk sini."
    },
    keluar:{
      icon:"↗", cls:"keluar", kicker:"3. BARANG KELUAR", title:"Barang Keluar", short:"Kirim/rusak/retur", desc:"Pakai ini untuk barang yang keluar: dus, plastik, produk akhir, rusak, sample, retur, atau pindah gudang. Stok otomatis berkurang.", qtyLabel:"Jumlah Keluar", qtyHelp:"Jumlah tidak boleh melebihi stok sistem", noteLabel:"Tujuan / Keterangan", notePlaceholder:"Contoh: kirim gudang / sample / rusak / retur / pindah gudang", submit:"SIMPAN BARANG KELUAR", side:"Barang keluar selain produksi = keluar sini. Produk jadi per dus lebih rapi lewat menu Barang Keluar."
    },
    pakai:{
      icon:"🧾", cls:"pakai", kicker:"2. BARANG DIPAKAI", title:"Pakai Manual", short:"Bahan kepakai", desc:"Cadangan kalau produksi belum punya resep. Untuk bumbu, bahan baku, plastik, dus, tepung, atau bahan lain yang dipakai hari ini.", qtyLabel:"Jumlah Dipakai", qtyHelp:"Isi sesuai unit master stok: gr/kg/pcs/liter", noteLabel:"Keperluan", notePlaceholder:"Contoh: Wedges shift pagi / Mashed batch 001 / trial produksi", submit:"SIMPAN BARANG DIPAKAI", side:"Untuk produksi paling mudah gunakan menu Produksi Hari Ini."
    }
  };
  return meta[m] || meta.masuk;
}
function inputModeItems(mode){
  const m = String(mode || "masuk");
  let base = activeItems();
  if(m === "pakai"){
    base = base.filter(i => {
      const simple = simpleStockCategory(i);
      const c = String(i.category || "").toLowerCase();
      return simple !== "Produk Jadi" && !c.includes("produk akhir") && !c.includes("produk jadi");
    });
  }
  return base;
}
function inputTodayRows(){
  const allow = new Set(["barang_masuk","barang_keluar","barang_dipakai_hari_ini","keluar_bahan_pendukung"]);
  return (state.tx || []).filter(t => t.date === today() && allow.has(String(t.jenis_transaksi || "").toLowerCase()))
    .slice()
    .sort((a,b)=>String(txTime(b)).localeCompare(String(txTime(a))))
    .slice(0,18);
}
function inputTxLabel(t){
  const j = String(t && t.jenis_transaksi || "").toLowerCase();
  if(j === "barang_masuk") return {label:"Masuk", cls:"masuk", sign:"+", qty:Number(t.masuk||0)};
  if(j === "barang_keluar") return {label:"Keluar", cls:"keluar", sign:"-", qty:Number(t.keluar||0)};
  return {label:"Dipakai", cls:"pakai", sign:"-", qty:Number(t.keluar||0)};
}
function inputModeGuide(){
  return `<div class="input-simple-flow-v134 flow-v135">
    <b>Patokan staff:</b>
    <span><strong>Barang datang</strong> = pilih Barang Masuk.</span>
    <span><strong>Bikin produk</strong> = buka Produksi Hari Ini, bahan otomatis kepotong.</span>
    <span><strong>Barang dikirim/rusak/retur</strong> = pilih Barang Keluar.</span>
    <small>Contoh: dus/plastik/bumbu datang masuk sini. Contoh wedges: bahan dipakai input lewat <b>Produksi Hari Ini</b> supaya jelas produk apa yang dibuat.</small>
  </div>`;
}
function inputPage(){
  const mode = ["masuk","keluar","pakai"].includes(state.posMode) ? state.posMode : "masuk";
  state.posMode = mode;
  const meta = inputModeMeta(mode);
  const baseItems = inputModeItems(mode);
  const catCounts = simpleCategoryCounts(baseItems);
  const cats = simpleStockCategories().filter(c => c === "Semua" || (catCounts[c] || 0) > 0);
  if(!cats.includes(state.posCategory)) state.posCategory = "Semua";
  const list = baseItems.filter(i => state.posCategory === "Semua" || simpleStockCategory(i) === state.posCategory).slice().sort(sortByName);
  const activeCount = activeItems().length;
  const lowCount = rows().filter(x=>x.status.label!=="AMAN").length;
  const todayRows = inputTodayRows();
  const inToday = todayRows.filter(t=>String(t.jenis_transaksi||"").toLowerCase()==="barang_masuk").reduce((s,t)=>s+Number(t.masuk||0),0);
  const outToday = todayRows.filter(t=>String(t.jenis_transaksi||"").toLowerCase()==="barang_keluar").reduce((s,t)=>s+Number(t.keluar||0),0);
  const usedToday = todayRows.filter(t=>isDailyUsedTx(t)).length;
  const catChips = cats.map(c=>`<button type="button" class="pos-cat-chip-v91 ${state.posCategory===c?"active":""}" data-pos-category="${esc(c)}"><b>${esc(c)}</b><span>${fmt(catCounts[c]||0)} item</span></button>`).join("");
  const modeButton = (id)=>{ const m=inputModeMeta(id); return `<button type="button" class="input-mode-card-v134 ${mode===id?"active":""} ${esc(m.cls)}" data-pos-mode="${esc(id)}"><i>${m.icon}</i><b>${esc(m.title)}</b><span>${esc(m.short)}</span></button>`; };
  return layout(`<main class="pos-page pos-page-v91 input-simple-page-v134">
    <section class="pos-card pos-card-v91 input-simple-card-v134">
      <div class="pos-head input-simple-head-v134">
        <div>
          <p class="vip-kicker">${esc(meta.kicker)}</p>
          <h2>${esc(meta.title)}</h2>
          <p class="muted">${esc(meta.desc)}</p>
        </div>
        <div class="pos-status">Simple Staff</div>
      </div>

      <div class="input-mode-grid-v134">
        ${modeButton("masuk")}
        ${modeButton("keluar")}
        ${modeButton("pakai")}
      </div>

      ${inputModeGuide()}

      <div class="pos-cat-grid-v91 input-cat-grid-v134">${catChips}</div>

      <form id="txForm" class="pos-form pos-form-v91 input-simple-form-v134">
        <input type="hidden" name="mode" value="${esc(mode)}">

        <div class="pos-grid pos-grid-time">
          <div class="field"><label>Tanggal</label><input class="input pos-input" type="date" name="date" value="${today()}" required></div>
          <div class="field"><label>Jam</label><input class="input pos-input pos-time-input" type="time" name="jam_transaksi" value="${nowTime()}" required></div>
          <div class="field"><label>Kategori</label><select class="select pos-input" id="posCategorySelect">${cats.map(c=>`<option value="${esc(c)}" ${c===state.posCategory?"selected":""}>${esc(c)}</option>`).join("")}</select><small class="helper-note">Filter biar pilihan barang tidak panjang.</small></div>
        </div>

        <div class="field input-item-picker-v134">
          <label>Nama Barang</label>
          <select class="select pos-input item-picker" name="item_id" required>
            ${list.map(i=>{
              const sr = stockRowByItemId(i.id);
              const stock = sr ? Number(sr.stock || 0) : Number(i.starting_stock||0);
              const st = stock <= 0 ? "HABIS" : (stock < minStockValue(i) ? "KURANG" : "AMAN");
              return `<option value="${i.id}">${esc(i.name)} • ${esc(simpleStockCategory(i))} • Stok ${fmt(stock)} ${esc(i.unit||"")} • ${st}</option>`;
            }).join("")}
          </select>
          ${!list.length ? `<div class="error" style="margin-top:10px">Tidak ada barang aktif untuk pilihan ini. Coba kategori <b>Semua</b> atau cek master stok.</div>` : ""}
        </div>

        <div class="pos-qty-box mode-${esc(meta.cls)} input-qty-box-v134">
          <div class="pos-qty-title">${esc(meta.qtyLabel)}</div>
          <div class="field"><label>${esc(meta.qtyLabel)} / Pcs / Kg / Gram / Item</label><input class="input pos-input input-big-qty-v134" type="number" step="0.0001" min="0" name="qty" placeholder="${esc(meta.qtyHelp)}" required></div>
        </div>

        <div class="pos-grid">
          <div class="field"><label>Petugas / Staff</label><input class="input pos-input" name="petugas" value="${esc(userEmail() || state.roleMode || "staff")}" placeholder="Nama staff"></div>
          <div class="field"><label>${esc(meta.noteLabel)}</label><input class="input pos-input" name="note" placeholder="${esc(meta.notePlaceholder)}"></div>
        </div>

        <button class="btn pos-submit ${esc(meta.cls)}" type="submit">${esc(meta.submit)} — DONE</button>
      </form>
    </section>

    <aside class="pos-side input-side-v134">
      <div class="pos-side-card input-recap-v134">
        <h3>Rekap Hari Ini</h3>
        <div class="pos-metric"><span>Masuk</span><b>${fmt(inToday)}</b></div>
        <div class="pos-metric"><span>Keluar umum</span><b>${fmt(outToday)}</b></div>
        <div class="pos-metric"><span>Barang dipakai</span><b>${fmt(usedToday)} item</b></div>
        <small class="muted">${esc(meta.side)}</small>
      </div>

      <div class="pos-side-card dark-card">
        <h3>Rekomendasi Bos</h3>
        <p><b>1.</b> Input <b>Masuk</b> saat barang datang.</p>
        <p><b>2.</b> Input <b>Dipakai</b> setiap selesai produksi/shift.</p>
        <p><b>3.</b> Pakai <b>Keluar</b> hanya untuk rusak/sample/retur/pindah, bukan kirim produk jadi per dus.</p>
        <p><b>4.</b> Kirim produk jadi pakai menu <b>Pabrik</b> supaya dus/plastik ikut kepotong.</p>
      </div>

      <div class="pos-side-card input-recent-v134">
        <h3>Transaksi Simple Hari Ini</h3>
        <div class="produksi-list">
          ${todayRows.map(t=>{ const i=itemById(t.item_id)||{}; const lab=inputTxLabel(t); return `<div class="produksi-mini input-tx-mini-v134 ${esc(lab.cls)}"><b>${esc(i.name||"-")}</b><span><em>${esc(lab.label)}</em> ${esc(txTime(t))} • ${esc(lab.sign)}${fmt(lab.qty)} ${esc(i.unit||"")}</span><small>${esc(t.note||"")}</small></div>`; }).join("") || `<div class="warning">Belum ada transaksi simple hari ini.</div>`}
        </div>
      </div>

      <div class="pos-side-card">
        <h3>Status</h3>
        <div class="pos-metric"><span>Barang aktif</span><b>${activeCount}</b></div>
        <div class="pos-metric"><span>Stok kurang/habis</span><b>${lowCount}</b></div>
        <div class="pos-metric"><span>Sync terakhir</span><b>${esc(state.lastSync || "-")}</b></div>
      </div>
    </aside>
  </main>`);
}


function absenPage(){
  const rows = attendanceRows();
  const sum = attendanceSummary();
  const employees = employeeRows();
  const defaultShift = "Shift 1";

  return layout(`<main class="absen-page absen-simple-page">
    <section class="card absen-hero simple-absen-hero">
      <div class="toolbar">
        <div>
          <p class="vip-kicker">ABSEN SIMPLE</p>
          <h2>Absen Karyawan</h2>
          <p class="muted">Cara cepat: pilih tanggal, pilih shift, centang karyawan, lalu simpan sekali.</p>
        </div>
        <button class="btn dark" id="exportAttendance" type="button">Export Absen</button>
      </div>
    </section>

    <section class="shift-grid simple-shift-info">
      <div class="card shift-card"><b>Shift 1</b><span>Masuk 07:00</span><span>Pulang 16:00</span></div>
      <div class="card shift-card"><b>Shift 2</b><span>Masuk 15:00</span><span>Pulang 00:00 / 12 malam</span></div>
      <div class="card shift-card lembur"><b>Lembur</b><span>Centang lembur</span><span>Isi jam lembur</span></div>
    </section>

    <section class="absen-stats">
      <div class="card report-stat"><span>Total</span><b>${sum.total}</b><small>sesuai filter</small></div>
      <div class="card report-stat"><span>Masuk</span><b>${sum.masuk}</b><small>hadir kerja</small></div>
      <div class="card report-stat"><span>Izin/Sakit</span><b>${sum.izin + sum.sakit}</b><small>izin + sakit</small></div>
      <div class="card report-stat"><span>Alpha/Lembur</span><b>${sum.alpha + sum.lembur}</b><small>alpha + lembur</small></div>
    </section>

    <section class="card quick-absen-card">
      <div class="toolbar">
        <div>
          <h3>Absen Cepat Banyak Karyawan</h3>
          <p class="muted">Pilih beberapa karyawan sekaligus. Cocok untuk absen shift harian.</p>
        </div>
        <span class="pill">${employees.length} karyawan aktif</span>
      </div>

      <form id="bulkAttendanceForm" class="quick-absen-form">
        <div class="quick-absen-settings">
          <div class="field"><label>Tanggal</label><input class="input" type="date" name="date" value="${today()}" required></div>
          <div class="field"><label>Shift</label><select class="select" name="shift_name" id="bulkShift">${shiftOptions().filter(s=>s!=="Custom").map(s=>`<option value="${esc(s)}" ${s===defaultShift?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
          <div class="field"><label>Status</label><select class="select" name="status">${attendanceStatusOptions().filter(s=>s!=="Lembur").map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}</select></div>
          <div class="field"><label>Jam Masuk</label><input class="input" type="time" name="check_in" id="bulkIn" value="07:00"></div>
          <div class="field"><label>Jam Pulang</label><input class="input" type="time" name="check_out" id="bulkOut" value="16:00"></div>
          <div class="field"><label>Lembur?</label><select class="select" name="overtime" id="bulkOvertime"><option value="false">Tidak</option><option value="true">Ya</option></select></div>
          <div class="field"><label>Jam Lembur</label><input class="input" type="number" min="0" step="0.5" name="overtime_hours" value="0"></div>
          <div class="field sm-span-2"><label>Keterangan</label><input class="input" name="note" placeholder="Contoh: shift pagi / lembur packing / izin"></div>
          <div class="field"><label>Petugas</label><input class="input" name="petugas" value="${esc(userEmail() || "")}" placeholder="Admin/staff"></div>
        </div>

        <div class="employee-picker">
          <div class="employee-picker-head">
            <b>Pilih Karyawan</b>
            <div>
              <button class="btn gray small-btn" id="selectAllEmployees" type="button">Pilih Semua</button>
              <button class="btn gray small-btn" id="clearAllEmployees" type="button">Kosongkan</button>
            </div>
          </div>
          <div class="employee-check-grid">
            ${employees.map(e=>`<label class="employee-check">
              <input type="checkbox" name="employee_ids" value="${e.id}" checked>
              <span><b>${esc(e.name)}</b>${e.note?`<small>${esc(e.note)}</small>`:""}</span>
            </label>`).join("") || `<div class="warning">Belum ada master karyawan. Jalankan SQL V48/V50 atau tambah karyawan dulu.</div>`}
          </div>
        </div>

        <button class="btn dark absen-submit" type="submit">Simpan Absen Terpilih — DONE</button>
      </form>
    </section>

    <section class="card employee-master-card simple-master">
      <div class="toolbar">
        <div>
          <h3>Master Karyawan</h3>
          <p class="muted">Tambah atau edit nama karyawan. Shift tidak dikunci, karena dipilih saat absen.</p>
        </div>
        <span class="pill">${employees.length} aktif</span>
      </div>

      <form id="employeeForm" class="employee-add-form no-shift-master">
        <input class="input" name="name" placeholder="Nama karyawan baru" required>
        <input class="input" name="note" placeholder="Keterangan / bagian kerja">
        <button class="btn dark" type="submit">Tambah</button>
      </form>

      <details class="master-details">
        <summary>Lihat / Edit Daftar Karyawan</summary>
        <div class="employee-list">
          ${employees.map(e=>`<div class="employee-row employee-row-no-shift" data-id="${e.id}">
            <input class="input emp-name" value="${esc(e.name)}" placeholder="Nama">
            <input class="input emp-note" value="${esc(e.note||"")}" placeholder="Keterangan / bagian kerja">
            <button class="btn green saveEmployee" data-id="${e.id}" type="button">Simpan</button>
            <button class="btn red archiveEmployee" data-id="${e.id}" type="button">Nonaktif</button>
          </div>`).join("") || `<div class="warning">Belum ada master karyawan.</div>`}
        </div>
      </details>
    </section>


    <section class="card monthly-absen-card">
      <div class="toolbar">
        <div>
          <h3>Rekap Absen Bulanan</h3>
          <p class="muted">Untuk bantu rekap gajian: masuk, izin, sakit, alpha, lembur, dan total jam lembur.</p>
        </div>
        <div class="monthly-actions">
          <input class="input" type="month" id="attendanceMonthFilter" value="${esc(attendanceMonthValue())}">
          <button class="btn dark" id="exportAttendanceMonthly" type="button">Export Bulanan</button>
        </div>
      </div>
      <div class="monthly-grid">
        ${monthlyAttendanceSummary().map(x=>`<div class="monthly-card">
          <b>${esc(x.name)}</b>
          <span>Masuk: ${x.masuk} • Izin: ${x.izin} • Sakit: ${x.sakit} • Alpha: ${x.alpha}</span>
          <small>Lembur: ${x.lembur}x • Total Jam: ${fmt(x.lembur_hours)}</small>
        </div>`).join("") || `<div class="warning">Belum ada data absen untuk bulan ${esc(attendanceMonthValue())}.</div>`}
      </div>
    </section>

    <section class="card payroll-card">
      <div class="toolbar">
        <div>
          <h3>Laporan Gaji Sederhana</h3>
          <p class="muted">Estimasi dari rekap absen bulanan. Isi nominal sesuai aturan perusahaan.</p>
        </div>
        <button class="btn dark" id="exportPayrollMonthly" type="button">Export Gaji</button>
      </div>
      <div class="payroll-config">
        <div class="field"><label>Gaji Harian</label><input class="input" id="payrollDailyInput" type="number" min="0" step="1000" value="${esc(state.payrollDaily)}" placeholder="Contoh: 100000"></div>
        <div class="field"><label>Upah Lembur / Jam</label><input class="input" id="payrollOvertimeInput" type="number" min="0" step="1000" value="${esc(state.payrollOvertime)}" placeholder="Contoh: 15000"></div>
        <div class="field"><label>Potongan Alpha / Hari</label><input class="input" id="payrollAlphaInput" type="number" min="0" step="1000" value="${esc(state.payrollAlpha)}" placeholder="Contoh: 100000"></div>
      </div>
      <div class="payroll-list">
        ${payrollSummary().map(x=>`<div class="payroll-row">
          <b>${esc(x.name)}</b>
          <span>Hadir ${x.hadir} hari • Lembur ${fmt(x.lembur_hours)} jam • Alpha ${x.alpha}</span>
          <strong>${fmt(x.total)}</strong>
        </div>`).join("") || `<div class="warning">Belum ada data gaji untuk bulan ${esc(attendanceMonthValue())}.</div>`}
      </div>
    </section>

    <section class="card absen-filter simple-absen-filter">
      <div class="filter-grid">
        <div class="field"><label>Filter Tanggal</label><input class="input" type="date" id="attendanceDateFilter" value="${esc(state.attendanceDate)}"></div>
        <div class="field"><label>Cari Karyawan</label><input class="input" id="attendanceSearch" value="${esc(state.searchAbsen)}" placeholder="Cari nama/status/shift/keterangan"></div>
        <button class="btn gray" id="clearAttendanceFilter" type="button">Reset Filter</button>
      </div>
    </section>

    <section class="absen-list">
      ${rows.map(a=>`<article class="card absen-card">
        <div class="absen-main">
          <div>
            <h3>${esc(a.employee_name)}</h3>
            <p>${esc(a.date)} • <b>${esc(a.status)}</b> • ${esc(a.shift_name || "-")}</p>
          </div>
          <span class="absen-badge ${esc(String(a.status||"").toLowerCase().replaceAll(" ","-"))}">${esc(a.status)}</span>
        </div>
        <div class="absen-detail">
          <div><span>Shift</span><b>${esc(a.shift_name || "-")}</b></div>
          <div><span>Masuk</span><b>${esc(a.check_in || "-")}</b></div>
          <div><span>Pulang</span><b>${esc(a.check_out || "-")}</b></div>
          <div><span>Lembur</span><b>${a.overtime ? `Ya, ${fmt(a.overtime_hours||0)} jam` : "Tidak"}</b></div>
          <div><span>Petugas</span><b>${esc(a.petugas || "-")}</b></div>
          <div><span>Keterangan</span><b>${esc(a.note || "-")}</b></div>
        </div>
        <div class="absen-actions"><button class="btn gray editAttendance" data-id="${a.id}" type="button">Edit</button><button class="btn red delAttendance" data-id="${a.id}" type="button">Hapus</button></div>
      </article>`).join("") || `<div class="card report-empty">Belum ada data absen sesuai filter.</div>`}
    </section>
  </main>`);
}

function pakaiBahanPage(){
  const items = filteredUsedBahanItems();
  const todayRows = dailyUsedRows(today()).filter(t => String(t.jenis_transaksi || "").toLowerCase() !== "produksi_bahan");
  const recentRows = dailyUsedRows("").filter(t => String(t.jenis_transaksi || "").toLowerCase() !== "produksi_bahan").slice(0,30);
  const itemMap = Object.fromEntries(state.items.map(i=>[i.id,i]));
  const totalToday = todayRows.reduce((s,t)=>s+Number(t.keluar||0),0);
  const options = items.map(usedItemOptionHtml).join("");
  const rowHtml = Array.from({length:12}, (_,idx)=>{
    const n = idx + 1;
    return `<div class="used-row-v129">
      <div class="field used-item-field-v129"><label>Barang Dipakai ${n}</label><select class="input" name="item_${n}"><option value="">Pilih barang/bahan...</option>${options}</select></div>
      <div class="field used-qty-field-v129"><label>Jumlah</label><input class="input" type="number" step="0.0001" min="0" name="qty_${n}" placeholder="0"></div>
    </div>`;
  }).join("");
  return layout(`<main class="produksi-page pakai-page-v129">
    <section class="card produksi-card pakai-card-v129">
      <div class="toolbar">
        <div>
          <p class="kicker-dark">Barang Dipakai Hari Ini</p>
          <h2>Potong Stok Bahan / Bumbu / Kemasan</h2>
          <p class="muted">Pilih barang yang benar-benar dipakai hari ini. Setelah simpan, stok sistem di Data Stok langsung berkurang, jadi stock opname lebih akurat.</p>
        </div>
        <div class="toolbar-actions"><button class="btn gray" data-tab="stock" type="button">Cek Stok</button><button class="btn gray" data-tab="produksi" type="button">Produksi</button></div>
      </div>
      <div class="warning pakai-warning-v129"><b>Contoh:</b> hari ini bikin wedges → pilih kentang, bumbu A, bumbu B, tepung, plastik/kemasan yang dipakai. Isi gram/pcs/kg sesuai pemakaian nyata, lalu klik simpan.</div>
      <form id="usedTodayForm" class="produksi-form used-form-v129">
        <div class="grid three-col">
          <div class="field"><label>Tanggal Pakai</label><input class="input" type="date" name="date" value="${today()}" required></div>
          <div class="field"><label>Jam</label><input class="input" type="time" name="jam_transaksi" value="${nowTime()}" required></div>
          <div class="field"><label>Petugas</label><input class="input" name="petugas" value="${esc(userEmail() || state.roleMode || "staff")}" placeholder="Nama staff"></div>
          <div class="field sm-span-2"><label>Filter Kategori</label><select class="input" id="usedBahanCategorySelect">${productionBahanCategories().map(c=>`<option value="${esc(c)}" ${state.usedBahanCategory===c?"selected":""}>${esc(c)}</option>`).join("")}</select><small class="helper-note">Ganti kategori supaya pilihan barang tidak terlalu panjang.</small></div>
          <div class="field"><label>Keperluan</label><input class="input" name="keperluan" placeholder="Contoh: wedges shift pagi"></div>
        </div>
        <div class="used-lines-v129">${rowHtml}</div>
        <div class="field"><label>Catatan Tambahan</label><input class="input" name="note" placeholder="Contoh: batch 001 / produksi trial / koreksi pemakaian"></div>
        <button class="btn dark full produksi-submit" type="submit">Simpan Barang Dipakai + Potong Stok</button>
      </form>
    </section>
    <section class="card produksi-side pakai-side-v129">
      <h3>Rekap Dipakai Hari Ini</h3>
      <div class="stat-value" style="font-size:28px">${fmt(todayRows.length)} item</div>
      <p class="muted">Total angka keluar: ${fmt(totalToday)}. Unit bisa beda-beda, detailnya ada di bawah.</p>
      <div class="produksi-list used-today-list-v129">
        ${todayRows.map(t=>{const i=itemMap[t.item_id]||{}; return `<div class="produksi-mini used-mini-v129">
          <b>${esc(i.name||"-")}</b>
          <span>${esc(txTime(t))} • ${fmt(t.keluar||0)} ${esc(i.unit||"")}</span>
          <small>${esc(t.note||"")}</small>
          <button class="btn red deltx" data-id="${t.id}" type="button">Hapus</button>
        </div>`;}).join("") || `<div class="warning">Belum ada barang dipakai hari ini.</div>`}
      </div>
      <h3>Riwayat Terbaru</h3>
      <div class="produksi-list">
        ${recentRows.map(t=>{const i=itemMap[t.item_id]||{}; return `<div class="produksi-mini">
          <b>${esc(i.name||"-")}</b>
          <span>${esc(t.date)} ${esc(txTime(t))} • keluar ${fmt(t.keluar||0)} ${esc(i.unit||"")}</span>
        </div>`;}).join("") || `<div class="warning">Belum ada riwayat barang dipakai.</div>`}
      </div>
    </section>
  </main>`);
}

function produksiPage(){
  const products = productionProducts();
  const bahan = filteredProductionIngredients(products[0] ? products[0].id : null);
  const allBahan = activeItems().filter(i => {
    const c = String(i.category || "").toLowerCase();
    return !(c.includes("produk akhir") || c.includes("produk jadi"));
  }).slice().sort(sortByName);
  const recents = recentProductionRows();
  const itemMap = Object.fromEntries(state.items.map(i=>[i.id,i]));

  return layout(`<main class="produksi-page produksi-simple-v135">
    <section class="card produksi-card produksi-main-v135">
      <div class="toolbar produksi-title-v135">
        <div>
          <p class="vip-kicker">2. PRODUKSI HARI INI</p>
          <h2>Produksi Hari Ini / Barang Dipakai</h2>
          <p class="muted">Staff cukup pilih produk yang dibuat, isi jumlah hasil produksi, lalu pilih bahan/bumbu/plastik/dus yang dipakai. Setelah simpan, <b>produk jadi bertambah</b> dan <b>bahan langsung berkurang</b>.</p>
        </div>
        <span class="pill">Simple Staff</span>
      </div>

      <div class="simple-flow-cards-v135">
        <div><b>1</b><span>Pilih produk: Wedges / Mashed / produk lain</span></div>
        <div><b>2</b><span>Isi hasil jadi yang masuk stok</span></div>
        <div><b>3</b><span>Bumbu, kentang, plastik, dus otomatis/manual kepotong</span></div>
      </div>

      <form id="productionForm" class="produksi-form produksi-form-v135" novalidate>
        <div class="form-grid quick-production-grid-v135">
          <div class="field"><label>Tanggal Produksi</label><input class="input" type="date" name="date" value="${today()}" required></div>
          <div class="field"><label>Jam</label><input class="input" type="time" name="jam_transaksi" value="${nowTime()}" required></div>
          <div class="field sm-span-2"><label>Produk yang Dibuat</label><select class="select" name="product_id" required>${products.map(p=>`<option value="${p.id}">${esc(p.name)} — stok ${fmt((stockRowByItemId(p.id)||{}).stock || 0)} ${esc(p.unit||"pcs")}</option>`).join("")}</select><small class="helper-note">Ini produk jadi/bahan akhir yang akan bertambah stoknya.</small></div>
          <div class="field"><label>Jumlah Hasil Jadi Masuk</label><input class="input big-production-input-v135" type="number" step="0.01" min="0" name="qty" placeholder="Contoh: 50 kg / 100 pcs" required></div>
          <div class="field"><label>Cara Potong Bahan</label><select class="select" name="recipe_mode"><option value="manual">Manual simple - staff pilih bahan</option><option value="formula">Otomatis dari Resep/BOM</option></select><small class="helper-note">Kalau resep belum disetting, pakai Manual simple dulu.</small></div>
          <div class="field"><label>Petugas</label><input class="input" name="petugas" value="${esc(userEmail() || state.roleMode || "staff")}" placeholder="Nama staff"></div>
          <div class="field sm-span-2"><label>Catatan Produksi</label><input class="input" name="note" placeholder="Contoh: wedges shift pagi / batch 001"></div>
        </div>

        <section class="produksi-bahan-panel v121-pakai-bahan produksi-bahan-simple-v135">
          <div class="v121-panel-head">
            <div>
              <span class="v121-step-badge">BAHAN YANG DIPAKAI</span>
              <h3>Pilih Bahan/Bumbu/Plastik/Dus yang Dipakai</h3>
              <p class="muted">Contoh produksi wedges: pilih kentang, bumbu spicy/plain, garam, minyak, plastik, dus. Isi jumlah sesuai pemakaian nyata.</p>
            </div>
            <div class="v121-mini-example"><b>Contoh Wedges</b><span>Kentang 50 kg • Bumbu 500 gr • Plastik 100 pcs</span></div>
          </div>

          <div class="form-grid bahan-filter-v135">
            <div class="field sm-span-2"><label>Filter Kategori Bahan</label><select class="select bahan-category-filter" id="productionBahanCategorySelect">${productionBahanCategories().map(c=>`<option value="${esc(c)}" ${c===state.productionBahanCategory?"selected":""}>${esc(c)}</option>`).join("")}</select><small class="helper-note">Pilih Semua Bahan kalau item belum muncul.</small></div>
          </div>

          <div class="v121-guide-grid guide-v135">
            <div><b>Bahan baku</b><span>Kentang, sayur, tepung, dll.</span></div>
            <div><b>Bumbu</b><span>Isi gram/kg sesuai unit stok.</span></div>
            <div><b>Kemasan</b><span>Plastik/dus kalau dipakai produksi.</span></div>
          </div>

          ${!bahan.length ? `<div class="warning">Tidak ada item di kategori ${esc(state.productionBahanCategory)}. Pilih Semua Bahan atau tambah barang kategori tersebut.</div>` : ""}
          <div class="bahan-lines-v135">
            ${Array.from({length:8},(_,i)=>i+1).map(n=>`
              <div class="bahan-row v121-bahan-row bahan-row-v135">
                <select class="select" name="bahan_${n}">
                  <option value="">Pilih bahan ${n}</option>
                  ${bahan.map(i=>`<option value="${i.id}">${esc(i.name)} — stok ${fmt((stockRowByItemId(i.id)||{}).stock || 0)} ${esc(i.unit||"")} — ${esc(i.category||"")}</option>`).join("")}
                </select>
                <input class="input" type="number" step="0.0001" min="0" name="bahan_qty_${n}" placeholder="Jumlah dipakai">
              </div>
            `).join("")}
          </div>
          <div class="v121-after-save"><b>Setelah simpan:</b> produk jadi masuk stok, bahan/bumbu/plastik/dus yang dipilih otomatis berkurang. Kalau stok bahan kurang, sistem blok supaya tidak minus.</div>
        </section>

        <details class="formula-panel formula-panel-v135 admin-formula-v135">
          <summary><b>Admin: Setting Resep Otomatis / BOM</b><span>Simpan takaran bahan per 1 produk, supaya staff nanti tidak input bahan satu-satu.</span></summary>
          <div class="formula-list">
            ${products.slice(0,12).map(p=>{
              const list = recipesForProduct(p.id);
              return `<details class="formula-details">
                <summary>${esc(p.name)} <span>${list.length} bahan tersimpan</span></summary>
                <div class="formula-items">
                  ${list.map(r=>`<div class="formula-item"><b>${esc(r.ingredient_name||recipeIngredientRow(r).name)}</b><span>${fmt(r.qty_per_unit||0)} ${esc(r.unit||recipeIngredientRow(r).unit||"")} / 1 ${esc(p.unit||"hasil")}</span><button class="btn red delRecipe" data-id="${r.id}" type="button">Hapus</button></div>`).join("") || `<div class="warning">Belum ada resep/BOM untuk produk ini.</div>`}
                </div>
              </details>`;
            }).join("")}
          </div>
          <div class="bom-guide-v120"><b>Contoh resep:</b> 1 kg Wedges pakai kentang 1 kg + bumbu 0,03 kg + plastik 2 pcs. Saat produksi 50 kg, sistem potong otomatis sesuai rumus.</div>
          <div id="recipeForm" class="recipe-form" data-no-production-validate="1">
            <select class="select" name="recipe_product_id">${products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
            <select class="select" name="recipe_ingredient_item_id">${allBahan.map(i=>`<option value="${i.id}">${esc(i.name)} — stok ${fmt((stockRowByItemId(i.id)||{}).stock || 0)} ${esc(i.unit||"")} — ${esc(i.category||"")}</option>`).join("")}</select>
            <input class="input" type="number" step="0.0001" min="0" name="recipe_qty_per_unit" placeholder="Takaran bahan / 1 hasil produksi">
            <button class="btn dark" id="addRecipeBtn" type="button">Simpan Resep</button>
          </div>
        </details>

        <button class="btn dark full produksi-submit produksi-submit-v135" type="submit">Simpan Produksi Hari Ini — DONE</button>
      </form>
    </section>

    <section class="card produksi-side produksi-side-v135">
      <h3>Rekap Produksi Hari Ini</h3>
      <div class="produksi-list">
        ${todayProductionSummary().hasil.map(t=>{const i=itemMap[t.item_id]||{}; return `<div class="produksi-mini">
          <b>${esc(i.name||"-")}</b>
          <span>${esc(t.transaction_code||"-")} • Masuk ${fmt(t.masuk||0)} ${esc(i.unit||"")}</span>
          <small>${esc(t.note||"-")}</small>
        </div>`;}).join("") || `<div class="warning">Belum ada hasil produksi hari ini.</div>`}
      </div>
      <br>
      <h3>Patokan Alur</h3>
      <div class="ok alur-box-v135">Barang datang → <b>Barang Masuk</b><br>Barang dipakai bikin produk → <b>Produksi Hari Ini</b><br>Produk/dus/plastik keluar gudang → <b>Barang Keluar</b></div>
      <br>
      <h3>Riwayat Terbaru</h3>
      <div class="produksi-list">
        ${recents.map(t=>{const i=itemMap[t.item_id]||{}; return `<div class="produksi-mini">
          <b>${esc(i.name||"-")}</b>
          <span>${esc(t.date)} • ${esc((t.jenis_transaksi||"").replaceAll("_"," "))}</span>
          <small>Masuk: ${fmt(t.masuk||0)} • Keluar: ${fmt(t.keluar||0)} ${esc(i.unit||"")}</small>
        </div>`;}).join("") || `<div class="warning">Belum ada riwayat produksi.</div>`}
      </div>
    </section>
  </main>`);
}

function keluarPabrikPage(){
  const products = produkAkhirItems();
  const map = Object.fromEntries(state.items.map(i=>[i.id,i]));
  const keluarRows = factoryOutRows();
  const dusPolos = packagingStockInfo("Polos");
  const dusSablon = packagingStockInfo("Sablon");
  const firstProduct = products[0] || null;
  const plastikAuto = firstProduct ? plasticStockInfo(firstProduct, "Auto") : {label:"-"};
  return layout(`<main class="grid two-col keluar-v119-page">
    <section class="card">
      <h2>Barang Keluar</h2>
      <p class="muted">Input barang yang keluar dari gudang/pabrik: produk akhir, dus, plastik, sample, retur, atau pengiriman. Untuk produk jadi per dus, sistem otomatis potong stok produk + dus + plastik.</p>
      <form id="factoryOutForm" class="form-grid">
        <div class="field"><label>Tanggal Keluar</label><input class="input" type="date" name="date" value="${today()}" required></div>
        <div class="field"><label>No Surat Jalan / DO <small class="req-note">opsional tapi disarankan</small></label><input class="input" name="no_surat_jalan" placeholder="Contoh: SJ-001"></div>
        <div class="field sm-span-2"><label>Tujuan / Customer <small class="req-note">isi supaya laporan jelas</small></label><input class="input" name="tujuan" placeholder="Contoh: Gudang Bekasi / Customer A"></div>
        <div class="field sm-span-2"><label>Jenis Dus</label><select class="select" name="jenis_dus" required>${jenisDusOptions().map(j=>`<option value="${esc(j)}">${esc(j)}</option>`).join("")}</select></div>
        <div class="field sm-span-2"><label>Jenis Plastik</label><select class="select" name="jenis_plastik" required>${plastikOptions().map(j=>`<option value="${esc(j.value)}">${esc(j.label)}</option>`).join("")}</select><small class="helper-note">Pilih plastik asli dari master stok. Auto tetap bisa dipakai, tapi pilihan manual lebih aman karena jenis plastik banyak.</small></div>
        <div class="field sm-span-2"><label>Nama Barang</label><select class="select" name="item_id" required>${products.map(i=>`<option value="${i.id}">${esc(i.name)} — ${esc(i.category)} — ${packInfo(i)}</option>`).join("")}</select></div>
        <div class="field"><label>Keluar Dus</label><input class="input factory-dus" type="number" step="1" min="0" name="keluar_dus" placeholder="Contoh: 4 dus" required></div>
        <div class="field"><label>Keluar Item/Pcs</label><input class="input factory-pcs" type="number" step="1" min="0" name="keluar_item" placeholder="Sisa pcs, kalau ada"></div>
        <div class="field"><label>Petugas</label><input class="input" name="petugas" placeholder="Nama petugas"></div>
        <div class="field"><label>Keterangan</label><input class="input" name="note" placeholder="Contoh: kirim gudang / customer / sample"></div>

        <div class="warning soft-warning-v119" style="grid-column:1/-1">
          <b>Catatan alur baru:</b> Bumbu, kentang, plastik produksi, tepung, dan bahan lain yang dipakai untuk membuat produk dipotong dari menu <b>Produksi</b>. Menu Barang Keluar ini untuk produk jadi keluar + dus/plastik pengiriman supaya tidak double potong.
        </div>

        <div class="auto-cut-panel" style="grid-column:1/-1">
          <h3>Preview Auto Potong</h3>
          <div id="autoCutPreview" class="auto-cut-preview">Pilih barang dulu.</div>
        </div>

        <button class="btn dark full" style="grid-column:1/-1" type="submit">Simpan Barang Keluar + Auto Potong</button>
      </form>
    </section>
    <aside class="card">
      <h3>Patokan Dus</h3>
      <div class="ok">500gr = 20 pcs/dus<br>1kg = 10 pcs/dus<br>2kg = 5 pcs/dus</div>
      <br>
      <h3>Stok Dus</h3>
      <div class="ok">Kardus Polos: <b>${esc(dusPolos.label)}</b><br>Kardus Sablon: <b>${esc(dusSablon.label)}</b></div>
      <br>
      <h3>Stok Plastik</h3>
      <div class="ok">Auto contoh: <b>${esc(plastikAuto.label)}</b></div>
      ${plasticStockListHtml()}
      <br>
      <div class="warning">Karena jenis plastik banyak, pilih <b>Jenis Plastik</b> manual dari list kalau Auto kurang yakin. Sistem akan potong plastik yang dipilih sesuai total pcs keluar.</div>
      <br>
      <button class="btn dark full" id="exportFactoryOut">Export Barang Keluar</button>
    </aside>

    <section class="card table-wrap" style="padding:0;grid-column:1/-1">
      <table>
        <thead><tr><th>Tanggal</th><th>No SJ/DO</th><th>Tujuan</th><th>Jenis Dus</th><th>Barang</th><th>Kemasan</th><th class="right">Keluar Pcs</th><th>Keluar Dus/Item</th><th>Petugas</th><th>Keterangan</th><th>Aksi</th></tr></thead>
        <tbody>
          ${keluarRows.map(t=>{const i=map[t.item_id]||{};return `<tr><td>${esc(t.date)}</td><td>${esc(t.no_surat_jalan||"-")}</td><td>${esc(t.tujuan||"-")}</td><td><span class="pill">${esc(jenisDusLabel(t.jenis_dus))}</span></td><td><b>${esc(i.name||"-")}</b><br><span class="muted">${esc(i.category||"-")}</span></td><td>${packInfo(i)}</td><td class="right"><b style="color:var(--red)">${fmt(t.keluar)}</b></td><td>${fmt(t.keluar_dus||0)} dus + ${fmt(t.keluar_item||0)} pcs</td><td>${esc(t.petugas||"-")}</td><td>${esc(t.note||"-")}</td><td><button class="btn gray edittx" data-id="${t.id}" type="button">Edit</button><button class="btn red deltx" data-id="${t.id}">Hapus</button></td></tr>`;}).join("") || `<tr><td colspan="11">Belum ada barang keluar.</td></tr>`}
        </tbody>
      </table>
    </section>
  </main>`);
}

function factoryEditModalHtml(){
  if(!state.factoryEditId) return "";
  const item = state.items.find(i=>String(i.id)===String(state.factoryEditId));
  if(!item) return "";
  return `<div class="modal-backdrop" id="factoryModalBackdrop">
    <div class="factory-modal">
      <div class="modal-head">
        <div>
          <h3>Edit Lokasi / QC</h3>
          <p>${esc(item.name || "")}</p>
        </div>
        <button type="button" class="modal-x" id="factoryModalClose">×</button>
      </div>
      <form id="factoryEditForm" class="factory-modal-grid">
        <input type="hidden" name="id" value="${esc(item.id)}">
        <div class="field"><label>Lokasi Gudang / Freezer</label>
          <select class="select" name="lokasi">
            <option value="">Pilih lokasi</option>
            ${lokasiOptions().map(s=>`<option value="${esc(s)}" ${s===stockLokasiValue(item)?"selected":""}>${esc(s)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>QC Status</label>
          <select class="select" name="qc_status">
            ${qcOptions().map(s=>`<option value="${esc(s)}" ${s===stockQcValue(item)?"selected":""}>${esc(s)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Supplier</label>
          <select class="select" name="supplier_select">
            <option value="">Pilih supplier</option>
            ${supplierOptions().map(s=>`<option value="${esc(s)}" ${s===stockSupplierValue(item)?"selected":""}>${esc(s)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Supplier Manual</label>
          <input class="input" name="supplier_manual" value="${supplierOptions().includes(stockSupplierValue(item))?"":esc(stockSupplierValue(item)||"")}" placeholder="Isi kalau supplier belum ada">
        </div>
        <div class="field"><label>Batch / Lot</label>
          <input class="input" name="batch_lot" value="${esc(stockBatchValue(item)||"")}" placeholder="Contoh: BATCH-240526-A">
        </div>
        <div class="field"><label>Expired Date</label>
          <input class="input" name="expired_date" type="date" value="${esc(stockExpValue(item)||"")}">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn gray" id="factoryModalCancel">Batal</button>
          <button type="submit" class="btn dark">Simpan Lokasi / QC</button>
        </div>
      </form>
    </div>
  </div>`;
}

function stockPage(){
  const view = state.stockView || "ringkasan";
  const itemLimit = 5000; // V91: jangan batasi daftar stok, supaya semua item KStok terlihat.
  const allRows = rows();
  const viewMeta = {
    ringkasan:{title:"Stok Per Kategori", desc:"Keluar/masuk barang dan cek stok dibuat per kategori besar supaya tidak pusing."},
    pendataan:{title:"Stock Opname Per Kategori", desc:"Pilih kategori, isi stok fisik, lalu simpan. Detail lain disembunyikan biar tidak penuh."},
    tambah:{title:"Tambah Barang", desc:"Form simple. Detail tambahan ada di bagian opsional."}
  };

  function simpleArea(x){
    return simpleStockCategory(x);
  }

  function rowForView(x){
    if(view === "tambah") return true;
    return true;
  }

  const scopedRows = allRows.filter(rowForView);
  const simpleAreas = ["Semua","Produk Jadi","Bahan Baku","Bahan Penolong","Kemasan","Lainnya"];
  if(!state.simpleAreaFilter) state.simpleAreaFilter = "Semua";
  if(!simpleAreas.includes(state.simpleAreaFilter)) state.simpleAreaFilter = "Semua";
  const cats=["Semua",...Array.from(new Set(scopedRows.map(i=>i.category).filter(Boolean))).sort(sortText)];
  if(state.category !== "Semua" && !cats.includes(state.category)) state.category = "Semua";

  // V99: pencarian dibuat benar-benar per kategori. Search tidak mereset kategori,
  // bisa cari sebagian kata seperti "bawang putih" atau "sarung latex".
  function searchNorm(v){
    return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function stockSearchText(x){
    return searchNorm(`${x.name||""} ${x.category||""} ${simpleArea(x)} ${stockAreaKind(x)} ${stockLokasiLabel(x)} ${stockQcValue(x)} ${stockSupplierValue(x)} ${stockBatchValue(x)} ${stockExpValue(x)} ${x.barcode||""} ${barcodeValue(x)} ${x.varian||""} ${x.ukuran||""} ${x.deskripsi||""}`);
  }
  function itemMatchesSearch(x){
    const q = searchNorm(state.search || "");
    if(!q) return true;
    const hay = stockSearchText(x);
    return q.split(" ").filter(Boolean).every(term => hay.includes(term));
  }
  function itemMatchesDetailCategory(x){
    return state.category === "Semua" || x.category === state.category;
  }
  function itemMatchesArea(x){
    return state.simpleAreaFilter === "Semua" || simpleArea(x) === state.simpleAreaFilter;
  }
  function itemMatchesStatus(x){
    return state.statusFilter === "Semua"
      || x.status.label === state.statusFilter
      || (state.statusFilter === "KURANG/HABIS" && x.status.label !== "AMAN");
  }

  // V104: search tidak dikunci. Mode Semua boleh cari semua kategori.
  const hasActiveSimpleArea = state.simpleAreaFilter && state.simpleAreaFilter !== "Semua";
  const baseBeforeSearch = scopedRows.filter(x=> itemMatchesDetailCategory(x) && itemMatchesArea(x) && itemMatchesStatus(x));
  const baseFiltered = baseBeforeSearch.filter(x=> !state.search ? true : itemMatchesSearch(x));
  const filtered=baseFiltered.slice().sort((a,b)=> sortText(simpleArea(a), simpleArea(b)) || sortText(a.name||"", b.name||""));

  const categoryMap = {};
  filtered.forEach(x=>{ categoryMap[x.category] = (categoryMap[x.category] || 0) + 1; });
  const criticalRows = filtered.filter(x=>x.status.label!=="AMAN");
  const emptyCount = filtered.filter(x=>x.status.label==="HABIS").length;
  const criticalCount = criticalRows.length;
  const totalStock = filtered.reduce((sum,x)=>sum+Number(x.stock||0),0);

  function itemSubtitle(x){
    const loc = stockLokasiLabel(x);
    const cat = x.category || simpleArea(x);
    const bits = [cat, loc].filter(Boolean);
    return bits.join(" • ");
  }

  function menuButton(id,title,desc,count){
    return `<button type="button" class="stock-menu-btn-v82 stock-menu-btn-v83 ${view===id?"active":""}" data-stock-view="${esc(id)}"><b>${esc(title)}</b><span>${esc(desc)}</span><small>${esc(count)}</small></button>`;
  }

  function stockMenuHtml(){
    return `<div class="stock-menu-v82 stock-menu-v83">
      ${menuButton("ringkasan","Masuk / Cek Stok","stok masuk, cek stok, opname", `${allRows.length} item`)}
      ${menuButton("pendataan","Opname","stok fisik per kategori", `${allRows.length} item`)}
      ${menuButton("tambah","Tambah Barang","master item baru", `simple`)}
    </div>`;
  }

  function recommendationHtml(){
    return `<div class="stock-simple-guide-v83">
      <b>Alur paling gampang:</b>
      <span>1) Cari/pilih kategori → 2) klik + Masuk di card / buka menu Keluar-Masuk → 3) pilih Masuk, Keluar, atau Dipakai.</span>
    </div>`;
  }

  function quickAreaHtml(){
    const countBase = scopedRows.filter(x=> itemMatchesDetailCategory(x) && itemMatchesStatus(x));
    const counts = simpleCategoryCounts(countBase);
    const qTxt = state.simpleAreaFilter !== "Semua"
      ? `Search aktif hanya di kategori: ${state.simpleAreaFilter}`
      : "Pilih kategori dulu, baru cari nama barang";
    return `<div class="simple-area-picker-v101"><div class="simple-area-title-v91 simple-area-title-v99 simple-area-title-v101">Pilih kategori besar <small>${esc(qTxt)}</small></div><div class="simple-area-chips-v83 simple-area-chips-v91 simple-area-chips-v99 simple-area-chips-v101">
      ${simpleAreas.map(a=>`<button type="button" class="simple-area-chip-v83 simple-area-chip-v91 simple-area-chip-v101 ${state.simpleAreaFilter===a?"active":""}" data-simple-area="${esc(a)}"><b>${esc(a)}</b><span>${fmt(counts[a]||0)} item</span></button>`).join("")}
    </div></div>`;
  }

  function categorySummaryHtml(){
    const entries = Object.entries(categoryMap).sort((a,b)=> sortText(a[0], b[0]));
    return entries.map(([name,count])=>`<button type="button" class="stock-cat-chip ${state.category===name?"active":""}" data-category="${esc(name)}">${esc(name)} <span>${count}</span></button>`).join("");
  }

  function stockRowsHtml(list){
    if(!list.length) return `<div class="empty-row stock-empty-search-v99"><b>Barang tidak ditemukan.</b><span>Coba hapus kata pencarian, pilih kategori <b>Semua</b>, atau klik <b>Reset Cari</b>.</span><button type="button" class="btn gray" id="clearStockSearch">Reset Cari</button></div>`;
    return list.map(x=>{
      const subtitle = itemSubtitle(x);
      const isOpname = view === "pendataan";
      const imageHtml = itemImageHtml(x, "stock-item-image-v125");
      const detailImageHtml = itemImageHtml(x, "stock-detail-image-v125");
      const statusNote = x.status.label === "HABIS"
        ? `<div class="stock-card-status-note-v98 habis">⛔ HABIS — stok kosong. Segera restock.</div>`
        : (x.status.label === "DI BAWAH MINIMUM"
          ? `<div class="stock-card-status-note-v98 kurang">⚠ DI BAWAH MINIMUM — kurang ${formatDusItem(x.rekomendasi,x)} dari batas minimum.</div>`
          : `<div class="stock-card-status-note-v98 aman">✅ AMAN — stok masih di atas minimum.</div>`);
      return `<article class="stock-row-card-v78 stock-row-card-v83 stock-status-card-v98 stock-status-card-${x.status.cls}">
        <div class="stock-simple-main-v83">
          <div class="stock-item-top-v83">
            <span class="stock-cat-badge">${esc(simpleArea(x))}</span>
            <span class="badge ${x.status.cls}">${x.status.label}</span>
          </div>
          <div class="stock-title-wrap-v125">${imageHtml}<div class="stock-title-copy-v125"><b>${esc(x.name)}</b>
          ${subtitle?`<small>${esc(subtitle)}</small>`:""}</div></div>
          ${statusNote}
        </div>

        <div class="stock-simple-number-v83 stock-stock-min-v97">
          <div class="stock-mini-block-v97">
            <span>Stok</span>
            <b>${fmt(x.stock)}</b>
            <small>${esc(x.unit || "pcs")} • ${formatDusItem(x.stock,x)}</small>
          </div>
          <div class="stock-mini-block-v97 min-v97">
            <span>Min</span>
            <b>${fmt(x.min_stock)}</b>
            <small>${Number(x.raw_min_stock||0)>0 ? "manual" : "default"}</small>
          </div>
        </div>

        <div class="stock-quick-actions-v91">
          <button type="button" class="btn green quickStockMove" data-mode="masuk" data-id="${x.id}">+ Masuk</button>
          <button type="button" class="btn orange quickStockMove" data-mode="keluar" data-id="${x.id}">- Keluar</button>
          <button type="button" class="btn purple quickStockMove" data-mode="pakai" data-id="${x.id}">Pakai</button>
          <button type="button" class="btn gray quickStockOpname" data-id="${x.id}">Opname</button>
        </div>

        <div class="stock-simple-opname-v83">
          <label>Fisik
            <input class="input small-input physical" data-id="${x.id}" type="number" step="0.01" value="${x.physical===""?"":x.physical}" placeholder="cek fisik">
          </label>
          <label>Batas Minimum
            <input class="input small-input minstock" data-id="${x.id}" type="number" step="0.01" value="${x.min_stock}" placeholder="isi minimum">
          </label>
          <div class="selisih-line">Selisih: <b>${x.selisih===""?"-":fmt(x.selisih)}</b></div>
        </div>

        ${isOpname ? `<div class="stock-simple-edit-v83">
          <label>Edit Stok Sistem
            <input class="input stockedit" data-id="${x.id}" type="number" step="0.01" value="${Number(x.stock || 0)}">
          </label>
        </div>` : ""}

        <details class="stock-detail-toggle-v83">
          <summary>Detail</summary>
          <div class="stock-detail-body-v83">
            ${factoryMetaHtml(x)}
            <div><b>Kode:</b> <input class="input barcode-input" data-id="${x.id}" value="${esc(barcodeValue(x))}" title="Kode barcode / QR"></div>
            <div class="stock-image-edit-v125"><b>Gambar Barang:</b><div class="stock-image-edit-box-v125">${detailImageHtml}<input class="input itemImageUrlInput" data-id="${x.id}" value="${esc(itemImageSrc(x))}" placeholder="Tempel URL gambar atau upload file"><input class="input itemImageFile" data-id="${x.id}" type="file" accept="image/*"><button type="button" class="btn gray itemImageRemove" data-id="${x.id}">Hapus Gambar</button><small class="muted">Upload foto item atau tempel link gambar. Klik/ubah lalu otomatis tersimpan.</small></div></div>
            <div><b>Kemasan:</b> ${packInfo(x)}</div>
            <div><b>Pcs/Dus:</b> ${pcsDusCell(x)}</div>
            <div class="detail-actions-v83">
              <button type="button" class="btn gray factoryEditBtn" data-id="${x.id}">Edit Lokasi / QC</button>
              <button class="btn archive-main archiveItem" data-id="${x.id}" title="Pindahkan barang ini ke Arsip">Arsipkan</button>
              <button class="btn red deleteItemPermanent" data-id="${x.id}" title="Hapus permanen barang dan data terkait">Hapus</button>
            </div>
          </div>
        </details>
      </article>`;
    }).join("");
  }


  // V101: daftar stok dipisah per kategori besar dan search dikunci per kategori.
  function groupLabelText(name){
    if(name === "Produk Jadi") return "Barang jadi siap freezer / siap jual";
    if(name === "Bahan Baku") return "Kentang, sayuran, bumbu, dairy, dan bahan produksi";
    if(name === "Bahan Penolong") return "APD, perlengkapan produksi, cleaning, alat bantu";
    if(name === "Kemasan") return "Plastik, dus, stiker, label, lakban";
    if(name === "Lainnya") return "Item lain yang belum masuk kategori utama";
    return "Semua kategori";
  }
  function statBtnActive(area,statusValue){
    const sameArea = state.simpleAreaFilter === area;
    if(!sameArea) return false;
    return (statusValue === "Semua" && state.statusFilter === "Semua") || state.statusFilter === statusValue;
  }
  function groupStatBtn(area,label,value,statusValue,cls){
    const active = statBtnActive(area,statusValue) ? "active" : "";
    const valueHtml = value===null ? "" : `<b>${fmt(value)}</b> `;
    return `<button type="button" class="stock-group-stat-btn-v103 ${cls||""} ${active}" data-group-area="${esc(area)}" data-group-status="${esc(statusValue)}">${valueHtml}${label}</button>`;
  }
  function groupStatsHtml(area,list){
    const habis = list.filter(x=>x.status.label === "HABIS").length;
    const kurang = list.filter(x=>x.status.label === "DI BAWAH MINIMUM").length;
    const aman = list.filter(x=>x.status.label === "AMAN").length;
    return `<div class="stock-group-stats-v100 stock-group-stats-v103">
      ${groupStatBtn(area,"item",list.length,"Semua","all")}
      ${groupStatBtn(area,"aman",aman,"AMAN","aman")}
      ${groupStatBtn(area,"bawah min",kurang,"DI BAWAH MINIMUM","kurang")}
      ${groupStatBtn(area,"habis",habis,"HABIS","habis")}
    </div>`;
  }
  function categorySectionHtml(name, list){
    return `<section class="stock-category-section-v100 stock-category-section-v103">
      <div class="stock-category-head-v100">
        <button type="button" class="stock-category-title-v100" data-simple-area="${esc(name)}">
          <b>${esc(name)}</b>
          <small>${esc(groupLabelText(name))}</small>
        </button>
        ${groupStatsHtml(name, list)}
      </div>
      <div class="stock-card-list-v78 stock-card-list-v83 stock-card-list-v100">${stockRowsHtml(list)}</div>
    </section>`;
  }
  function groupedStockRowsHtml(list){
    if(!list.length) return `<section class="stock-wrap-v78 stock-wrap-v83"><div class="stock-card-list-v78 stock-card-list-v83">${stockRowsHtml(list)}</div></section>`;
    const order = simpleAreas.filter(a=>a !== "Semua");
    if(state.simpleAreaFilter && state.simpleAreaFilter !== "Semua"){
      return categorySectionHtml(state.simpleAreaFilter, list);
    }
    return order.map(area=>{
      const group = list.filter(x=>simpleArea(x) === area);
      return group.length ? categorySectionHtml(area, group) : "";
    }).join("");
  }

  const displayRows = filtered.slice(0, itemLimit);

  function filterHtml(){
    const hasArea = state.simpleAreaFilter && state.simpleAreaFilter !== "Semua";
    const activeArea = hasArea ? state.simpleAreaFilter : "Semua kategori";
    const searchValue = esc(state.search);
    const statusHtml = `<select class="select" id="statusSelect"><option ${state.statusFilter==="Semua"?"selected":""}>Semua</option><option ${state.statusFilter==="AMAN"?"selected":""}>AMAN</option><option ${state.statusFilter==="KURANG/HABIS"?"selected":""}>KURANG/HABIS</option><option ${state.statusFilter==="DI BAWAH MINIMUM"?"selected":""}>DI BAWAH MINIMUM</option><option ${state.statusFilter==="HABIS"?"selected":""}>HABIS</option></select>`;
    const categoryHtml = `<select class="select" id="categorySelect">${cats.map(c=>`<option ${c===state.category?"selected":""}>${esc(c)}</option>`).join("")}</select>`;

    // V104: kolom search selalu aktif. Kalau kategori = Semua, list berisi semua barang.
    const choiceRows = scopedRows
      .filter(x=> itemMatchesDetailCategory(x) && itemMatchesArea(x) && itemMatchesStatus(x))
      .slice()
      .sort((a,b)=> sortText(simpleArea(a), simpleArea(b)) || sortText(a.name||"", b.name||""));
    const optionMap = new Map();
    choiceRows.forEach(x=>{
      const label = String(x.name || "").trim();
      if(label && !optionMap.has(label.toLowerCase())) optionMap.set(label.toLowerCase(), x);
    });
    const options = Array.from(optionMap.values());
    const datalistHtml = `<datalist id="stockSearchChoices">${options.map(x=>`<option value="${esc(String(x.name||""))}"></option>`).join("")}</datalist>`;
    const optionText = x => `${String(x.name||"").trim()} • stok ${fmt(x.stock)} ${x.unit||"pcs"} • ${x.status.label}`;
    const pickListHtml = `<select class="select stock-search-pick-v102 stock-search-pick-v104 stock-search-pick-v106" id="stockSearchPick"><option value="">Pilih dari list ${esc(activeArea)} (${fmt(options.length)} item)</option>${options.map(x=>`<option value="${esc(String(x.name||"").trim())}" ${state.search===String(x.name||"").trim()?"selected":""}>${esc(optionText(x))}</option>`).join("")}</select><small class="helper-note stock-search-helper-v102">List barang sekarang menampilkan <b>stok</b> dan <b>status</b>. Bisa cari manual atau pilih dari list.</small>`;
    const selectedPreview = options.find(x=> String(x.name||"").trim() === String(state.search||"").trim());
    const selectedPreviewHtml = selectedPreview
      ? `<div class="stock-search-preview-v106 ${selectedPreview.status.cls}"><div class="stock-search-preview-main-v106"><b>${esc(selectedPreview.name)}</b><span>${esc(selectedPreview.category || simpleArea(selectedPreview))}</span></div><div class="stock-search-preview-metrics-v106"><span class="qty">Stok <b>${fmt(selectedPreview.stock)}</b> ${esc(selectedPreview.unit||"pcs")}</span><span class="min">Min <b>${fmt(selectedPreview.min_stock)}</b></span><span class="badge ${selectedPreview.status.cls}">${esc(selectedPreview.status.label)}</span></div><div class="stock-search-preview-actions-v106"><button type="button" class="btn green quickStockMove" data-mode="masuk" data-id="${selectedPreview.id}">+ Masuk</button><button type="button" class="btn orange quickStockMove" data-mode="keluar" data-id="${selectedPreview.id}">- Keluar</button><button type="button" class="btn purple quickStockMove" data-mode="pakai" data-id="${selectedPreview.id}">Pakai</button><button type="button" class="btn gray quickStockOpname" data-id="${selectedPreview.id}">Opname</button></div></div>`
      : `<div class="stock-search-legend-v106"><span class="badge aman">AMAN</span><span class="badge kurang">DI BAWAH MINIMUM</span><span class="badge habis">HABIS</span><small>Pilih barang dari list supaya stok dan status langsung kelihatan.</small></div>`;

    return `<div class="stock-filter-simple-v83 stock-filter-search-v99 stock-filter-search-v101 stock-filter-search-v102 stock-filter-search-v104 stock-filter-search-v106">
      <div class="field stock-search-field-v99 stock-search-field-v101 stock-search-field-v102"><label>Cari / pilih barang: <b>${esc(activeArea)}</b></label><input class="input" id="searchInput" list="stockSearchChoices" placeholder="Ketik nama barang: buncis / masker / plastik" value="${searchValue}" autocomplete="off">${datalistHtml}${pickListHtml}</div>
      <div class="field"><label>Status</label>${statusHtml}</div>
      ${view === "pendataan" ? `<div class="field"><label>Kategori detail</label>${categoryHtml}</div>` : ""}
      <button type="button" class="btn gray clear-stock-search-v99" id="clearStockSearch">Reset Cari</button>
    </div>${selectedPreviewHtml}<div class="stock-search-note-v101 active stock-search-note-v104">Search aktif di <b>${esc(activeArea)}</b>. List barang sekarang menampilkan stok dan status supaya lebih gampang pilih.</div>`;
  }

  function addItemFormHtml(){
    return `<section class="card add-item-pro add-item-v83"><div class="toolbar"><div><h3>Tambah Barang Baru</h3><p class="muted">Yang wajib cuma: nama, kategori, stok awal, satuan, minimum, lokasi.</p></div><span class="pill">Simple</span></div>
    <form id="itemForm" class="add-item-grid add-item-grid-v83" autocomplete="off">
      <div class="field sm-span-2"><label>Template Cepat</label><select class="select" id="templateBarangSelect"><option value="">Pilih template kalau ada</option>${masterItemTemplates().map((t,idx)=>`<option value="${idx}">${esc(t.name)} • ${esc(t.category)}</option>`).join("")}</select></div>
      <div class="field"><label>Kategori Simple</label><select class="select draft-field" name="category" required>${kategoriOptions().map(c=>`<option value="${esc(c)}" ${c===state.itemDraft.category?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
      <div class="field"><label>Nama Barang</label><input class="input draft-field" name="name" value="${esc(state.itemDraft.name)}" placeholder="Contoh: Wedges Plain 500gr" required></div>
      <div class="field"><label>Stok Awal</label><input class="input draft-field" name="starting_stock" type="number" step="0.01" value="${esc(state.itemDraft.starting_stock)}" placeholder="0" required></div>
      <div class="field"><label>Satuan</label><select class="select draft-field" name="unit">${satuanOptions().map(s=>`<option value="${esc(s)}" ${s===state.itemDraft.unit?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      <div class="field"><label>Batas Minimum</label><input class="input draft-field" name="min_stock" type="number" step="0.01" value="${esc(state.itemDraft.min_stock)}" placeholder="Contoh: 20" required></div>
      <div class="field"><label>Lokasi</label><select class="select draft-field" name="lokasi"><option value="">Pilih lokasi</option>${lokasiOptions().map(s=>`<option value="${esc(s)}" ${s===state.itemDraft.lokasi?"selected":""}>${esc(s)}</option>`).join("")}</select></div>

      <details class="advanced-item-v83 sm-span-2">
        <summary>Detail tambahan opsional</summary>
        <div class="advanced-grid-v83">
          <div class="field"><label>Varian / Brand</label><input class="input draft-field" name="varian" value="${esc(state.itemDraft.varian)}" placeholder="Southmount / HF / Polos"></div>
          <div class="field"><label>Ukuran</label><input class="input draft-field" name="ukuran" value="${esc(state.itemDraft.ukuran)}" placeholder="500gr / 1kg / 2kg"></div>
          <div class="field"><label>Pcs/Dus</label><input class="input draft-field" name="pcs_per_dus" type="number" step="1" value="${esc(state.itemDraft.pcs_per_dus)}" placeholder="Auto: 500gr=20, 1kg=10, 2kg=5"></div>
          <div class="field"><label>Supplier</label><select class="select draft-field" name="supplier"><option value="">Pilih supplier</option>${supplierOptions().map(s=>`<option value="${esc(s)}" ${s===state.itemDraft.supplier?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
          <div class="field"><label>QC Status</label><select class="select draft-field" name="qc_status">${qcOptions().map(s=>`<option value="${esc(s)}" ${s===state.itemDraft.qc_status?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
          <div class="field"><label>Batch / Lot</label><input class="input draft-field" name="batch_lot" value="${esc(state.itemDraft.batch_lot)}" placeholder="BATCH-240526-A"></div>
          <div class="field"><label>Expired Date</label><input class="input draft-field" name="expired_date" type="date" value="${esc(state.itemDraft.expired_date)}"></div>
          <div class="field"><label>Catatan</label><input class="input draft-field" name="deskripsi" value="${esc(state.itemDraft.deskripsi)}" placeholder="Catatan barang"></div>
          <div class="field sm-span-2"><label>Gambar Barang</label><div class="item-upload-box-v125">${itemImageHtml(state.itemDraft, "add-item-image-preview-v125")}<input class="input draft-field" id="itemImageUrlDraft" name="image_url" value="${esc(itemImageSrc(state.itemDraft))}" placeholder="Tempel URL gambar atau upload file"><input class="input" id="itemImageFileNew" type="file" accept="image/*"><small class="muted">Bisa pakai link gambar atau upload foto item. Saat tambah barang, gambar ikut disimpan.</small></div></div>
        </div>
      </details>
      <div class="field action-span sm-span-2"><button class="btn dark" type="submit">Simpan Barang</button></div>
    </form></section>`;
  }

  const meta = viewMeta[view] || viewMeta.ringkasan;
  const activeFilterText = state.statusFilter!=="Semua"||state.category!=="Semua"||state.search||state.simpleAreaFilter!=="Semua" ? `<p class="active-filter">Filter aktif: ${esc([state.search?`Cari: ${state.search}`:"", state.simpleAreaFilter!=="Semua"?state.simpleAreaFilter:"", state.category!=="Semua"?state.category:"", state.statusFilter!=="Semua"?state.statusFilter:""].filter(Boolean).join(" • "))}</p>` : "";
  const showFilters = view !== "tambah";
  const showList = view !== "tambah";
  const showAdd = view === "tambah";

  return layout(`<main class="grid stock-page-v83"><section class="card"><div class="toolbar"><div><h2>${esc(meta.title)}</h2><p class="muted">${esc(meta.desc)}</p>${activeFilterText}</div><div class="stock-toolbar-actions stock-gsheet-actions-v112"><button class="btn green" id="sendGSheetStockBtn" type="button">Kirim GSheet</button><button class="btn ${state.gsheetAuto?"green":"gray"}" id="toggleAutoGSheetStockBtn" type="button">${state.gsheetAuto?"Auto GSheet ON":"Auto GSheet OFF"}</button><button class="btn gray" id="setupGSheetStockBtn" type="button">Set GSheet</button><button class="btn gray" id="testGSheetStockBtn" type="button">Test GSheet</button><button class="btn dark" id="exportStock">Export CSV</button></div></div>
    ${stockMenuHtml()}
    <div class="stock-gsheet-note-v112"><b>Google Sheet V133:</b> aktifkan <b>Auto GSheet ON</b> agar barang masuk, keluar pabrik, produksi, dan barang dipakai langsung update tab STOK_REALTIME, KELUAR_MASUK_REALTIME, BARANG_DIPAKAI_REALTIME, dan PEMAKAIAN_PRODUK.</div>
    ${view === "ringkasan" ? recommendationHtml() : ""}
    <div class="stock-summary-grid stock-summary-v83">
      <button type="button" class="stock-summary-card" data-stock-summary="all"><span>Total Item</span><b>${filtered.length}</b><small>yang tampil</small></button>
      <button type="button" class="stock-summary-card qc" data-stock-summary="category"><span>Total Stok</span><b>${fmt(totalStock)}</b><small>pcs/kg sesuai item</small></button>
      <button type="button" class="stock-summary-card warning" data-stock-summary="critical"><span>Perlu Cek</span><b>${criticalCount}</b><small>di bawah minimum / habis</small></button>
      <button type="button" class="stock-summary-card danger" data-stock-summary="empty"><span>Habis</span><b>${emptyCount}</b><small>stok kosong</small></button>
    </div>
    ${showFilters ? quickAreaHtml() : ""}
    ${showFilters ? filterHtml() : ""}
    ${view === "pendataan" ? `<details class="category-detail-v83"><summary>Lihat kategori detail</summary><div class="stock-chip-row"><button type="button" class="stock-cat-chip ${state.category==="Semua"?"active":""}" data-category="Semua">Semua <span>${filtered.length}</span></button>${categorySummaryHtml()}</div></details>` : ""}
  </section>
  ${view === "ringkasan" ? `<section class="card stock-priority-v82 stock-priority-v83"><div class="toolbar"><div><h3>Daftar Barang Per Kategori</h3><p class="muted">Tampil ${displayRows.length} dari ${filtered.length} item. Daftar sekarang dipisah per kategori agar tidak ada barang yang kelewat.</p></div><div class="stack-actions"><button type="button" class="btn gray" data-stock-summary="all">Tampilkan Semua</button><button type="button" class="btn gray" data-stock-view="pendataan">Buka Opname</button></div></div></section>` : ""}
  ${showList ? groupedStockRowsHtml(displayRows) : ""}
  ${showAdd ? addItemFormHtml() : ""}
  ${factoryEditModalHtml()}</main>`);
}


function archivePage(){
  const archived = archivedItems();
  const cards = archived.map(x=>{
    const usage = itemUsageCounts(x.id);
    const usageLine = [usage.txCount ? `${usage.txCount} transaksi` : "", usage.recipeCount ? `${usage.recipeCount} formula` : ""].filter(Boolean).join(" + ");
    return `<article class="archive-card-v86">
      <div class="archive-head-v86">
        <div>
          <b>${esc(x.name)}</b>
          <small>${esc(x.category || "Tanpa kategori")}</small>
        </div>
        <span class="badge kurang">ARSIP</span>
      </div>
      <div class="archive-meta-v86">
        <div><span>Kemasan</span><b>${packInfo(x)}</b></div>
        <div><span>Pcs/Dus</span><b>${fmt(pcsPerDus(x)||0)}</b></div>
        <div><span>Satuan</span><b>${esc(x.unit||"-")}</b></div>
        <div><span>Stok Awal</span><b>${fmt(x.starting_stock||0)}</b></div>
        <div><span>Minimum</span><b>${fmt(x.min_stock||0)}</b></div>
        <div><span>Lokasi</span><b>${esc(x.lokasi||"-")}</b></div>
      </div>
      ${usageLine ? `<div class="archive-warning-v86">Barang ini punya ${esc(usageLine)}. Tombol <b>Hapus Permanen</b> akan ikut membersihkan data terkait.</div>` : `<div class="archive-ok-v86">Tidak ada transaksi/formula terkait yang terbaca.</div>`}
      <div class="archive-actions-v86">
        <button class="btn green restoreItem" data-id="${x.id}" type="button">Pulihkan</button>
        <button class="btn red deleteItemPermanent" data-id="${x.id}" type="button">Hapus Permanen</button>
      </div>
    </article>`;
  }).join("");
  return layout(`<main class="archive-page-v86 grid">
    <section class="card archive-hero-v86">
      <div class="toolbar">
        <div>
          <h2>Arsip Barang</h2>
          <p class="muted">Barang arsip bisa dipulihkan atau dihapus permanen. Tombol hapus sekarang dibuat besar dan tidak kepotong di kanan layar.</p>
        </div>
        <span class="pill">${archived.length} barang arsip</span>
      </div>
      <div class="archive-note-v86"><b>Tips:</b> Pakai <b>Pulihkan</b> kalau barang masih diperlukan. Pakai <b>Hapus Permanen</b> kalau barang benar-benar mau dibuang dari database.</div>
    </section>
    ${archived.length ? `<section class="archive-grid-v86">${cards}</section>` : `<section class="card"><div class="ok">Belum ada barang yang diarsipkan.</div></section>`}
  </main>`);
}

function reportSummaryByJenis(rowsTx){
  const map = {};
  rowsTx.forEach(t=>{
    const key = t.jenis_transaksi || "stok_harian";
    if(!map[key]) map[key] = {jenis:key, count:0, keluar:0, masuk:0};
    map[key].count += 1;
    map[key].keluar += Number(t.keluar || 0);
    map[key].masuk += Number(t.masuk || 0);
  });
  return Object.values(map).sort((a,b)=>b.count-a.count || sortText(a.jenis,b.jenis));
}
function reportQuickDateButton(label,dateValue,cls){
  const active = String(state.reportDate||"") === String(dateValue||"");
  return `<button type="button" class="btn ${cls||"gray"} reportQuickDate ${active?"active":""}" data-report-date="${esc(dateValue||"")}">${esc(label)}</button>`;
}
function reportCsvCountText(rowsTx){
  return rowsTx.length ? `${fmt(rowsTx.length)} transaksi siap export/print` : "Tidak ada data sesuai filter";
}
function printFilteredReport(){
  const itemMap = Object.fromEntries((state.items || []).map(i=>[i.id,i]));
  const rowsTx = filteredReportTx();
  const titleDate = state.reportDate || "Semua Tanggal";
  const titleJenis = state.reportJenis || "Semua";
  const titleGroup = state.reportGroup || "Semua";
  const totalKeluar = rowsTx.reduce((s,t)=>s+Number(t.keluar||0),0);
  const totalMasuk = rowsTx.reduce((s,t)=>s+Number(t.masuk||0),0);
  const html = `<!doctype html><html><head><title>Laporan Harry's Farm ${esc(titleDate)}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}
      h1{margin:0 0 4px;font-size:23px} .muted{color:#64748b;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px}
      th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;vertical-align:top}
      th{background:#f1f5f9}.right{text-align:right}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.box{border:1px solid #cbd5e1;border-radius:10px;padding:9px}.box b{font-size:18px}
      @media print{button{display:none}}
    </style></head><body>
    <h1>Harry's Farm - Laporan Transaksi</h1>
    <div class="muted">Tanggal: ${esc(titleDate)} • Grup: ${esc(titleGroup)} • Detail: ${esc(titleJenis==="Semua"?"Semua":reportHumanLabel(titleJenis))} • Cari: ${esc(state.reportSearch||"-")} • Dicetak: ${new Date().toLocaleString("id-ID")}</div>
    <div class="summary"><div class="box"><span>Total Transaksi</span><br><b>${fmt(rowsTx.length)}</b></div><div class="box"><span>Total Keluar</span><br><b>${fmt(totalKeluar)}</b></div><div class="box"><span>Total Masuk</span><br><b>${fmt(totalMasuk)}</b></div><div class="box"><span>Filter</span><br><b>${esc(titleGroup)}</b></div></div>
    <table><thead><tr><th>Kode</th><th>Tanggal</th><th>Jam</th><th>Grup</th><th>Jenis</th><th>Barang</th><th>SJ/DO</th><th>Tujuan</th><th>Plastik</th><th class="right">Keluar</th><th class="right">Masuk</th><th>Petugas</th><th>Keterangan</th></tr></thead><tbody>
    ${rowsTx.map(t=>{const i=itemMap[t.item_id]||{}; return `<tr><td>${esc(t.transaction_code||"")}</td><td>${esc(t.date||"")}</td><td>${esc(txTime(t))}</td><td>${esc(txReportGroup(t))}</td><td>${esc(reportHumanLabel(t.jenis_transaksi||"stok_harian"))}</td><td>${esc(i.name||"(barang arsip/terhapus)")}</td><td>${esc(t.no_surat_jalan||"")}</td><td>${esc(t.tujuan||"")}</td><td>${esc(t.jenis_plastik||"")}</td><td class="right">${fmt(t.keluar||0)}</td><td class="right">${fmt(t.masuk||0)}</td><td>${esc(t.petugas||"")}</td><td>${esc(t.note||"")}</td></tr>`;}).join("") || `<tr><td colspan="13">Tidak ada data.</td></tr>`}
    </tbody></table>
    <script>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if(!w) return alert("Popup diblokir. Izinkan popup untuk print laporan.");
  w.document.write(html);
  w.document.close();
}

function reportPage(){
  const map=Object.fromEntries((state.items || []).map(i=>[i.id,i]));
  const laporan = filteredReportTx();
  const todayRows = (state.tx || []).filter(t=>t.date===today());
  const totalKeluar = laporan.reduce((s,t)=>s+Number(t.keluar||0),0);
  const totalMasuk = laporan.reduce((s,t)=>s+Number(t.masuk||0),0);
  const allRowsForGroup = (state.tx || []).filter(t => !state.reportDate || t.date === state.reportDate);
  const groupCounts = reportGroupCounts(allRowsForGroup);
  const summaryJenis = reportSummaryByJenis(laporan);
  const displayLimit = Number(state.reportLimit || 150);
  const visibleRows = laporan.slice(0, displayLimit);
  const productionGroups = productionUsageGroups();
  const dateInfo = state.reportDate ? state.reportDate : "Semua tanggal";
  const searchInfo = state.reportSearch ? `Cari: ${state.reportSearch}` : "Tanpa pencarian";
  return layout(`<main class="report-pro report-pro-v108">
    <section class="report-hero card report-hero-v108">
      <div>
        <p class="vip-kicker">REPORT CENTER</p>
        <h2>Laporan Simple</h2>
        <p class="muted">Dibikin lebih gampang dibaca staff: pisah Barang Masuk, Produksi/Dipakai, Barang Keluar, dan Opname/Koreksi.</p>
        <div class="report-active-filter-v108"><b>${esc(dateInfo)}</b><span>${esc(state.reportGroup||"Semua")}</span><span>${esc((state.reportJenis||"Semua").replaceAll("_"," "))}</span><span>${esc(searchInfo)}</span></div>
      </div>
      <div class="report-actions-top report-actions-top-v108">
        <button class="btn dark report-export" id="exportTx">Export CSV Filter</button>
        <button class="btn green report-export" id="sendGSheetDailyBtn" type="button">Kirim GSheet</button>
        <button class="btn ${state.gsheetAuto?"green":"gray"} report-export" id="toggleAutoGSheetBtn" type="button">${state.gsheetAuto?"Auto GSheet ON":"Auto GSheet OFF"}</button>
        <button class="btn gray report-export" id="setupGSheetBtn" type="button">Set GSheet</button>
        <button class="btn gray report-export" id="testGSheetBtn" type="button">Test GSheet</button>
        <button class="btn gray report-export" id="printReportBtn" type="button">Print Halaman</button>
        <button class="btn green report-export" id="printFilteredReportBtn" type="button">Print Filter</button>
      </div>
    </section>

    <section class="card report-simple-guide-v136">
      <div class="toolbar"><div><h3>Filter Cepat Laporan</h3><p class="muted">Pilih sesuai bahasa harian staff. Setelah dipilih, export CSV, print, dan Kirim GSheet ikut filter ini.</p></div><span class="pill">${esc(reportGroupGuideText(state.reportGroup))}</span></div>
      <div class="report-flow-grid-v136">${groupCounts.map(reportGroupButton).join("")}</div>
    </section>

    <section class="card report-filter-pro report-filter-v108">
      <div class="report-quick-date-v108">
        ${reportQuickDateButton("Hari ini", today(), "green")}
        ${reportQuickDateButton("Kemarin", new Date(Date.now()-86400000).toISOString().slice(0,10), "gray")}
        ${reportQuickDateButton("Semua tanggal", "", "gray")}
      </div>
      <div class="filter-grid report-filter-grid-v108">
        <div class="field"><label>Tanggal Laporan</label><input class="input" type="date" id="reportDateInput" value="${esc(state.reportDate)}"></div>
        <div class="field"><label>Detail Transaksi <small class="req-note">opsional</small></label><select class="select" id="reportJenisSelect">${transactionJenisOptions().map(j=>`<option value="${esc(j)}" ${j===state.reportJenis?"selected":""}>${esc(j==="Semua" ? "Semua detail" : reportHumanLabel(j))}</option>`).join("")}</select></div>
        <div class="field report-search-field-v108"><label>Cari barang / SJ / tujuan / plastik / petugas</label><input class="input" id="reportSearchInput" value="${esc(state.reportSearch||"")}" placeholder="Contoh: dus / plastik / bumbu / wedges / DO-001"></div>
        <button class="btn gray" id="clearReportFilter" type="button">Reset Filter</button>
      </div>
      <div class="report-filter-note-v108">${esc(reportCsvCountText(laporan))}</div>
    </section>

    <section class="report-stats report-stats-v108">
      <button type="button" class="report-stat card reportStatBtn" data-report-jenis="Semua" data-report-group="Semua"><span>Total Transaksi</span><b>${laporan.length}</b><small>sesuai filter aktif</small></button>
      <button type="button" class="report-stat card reportQuickDate" data-report-date="${today()}"><span>Transaksi Hari Ini</span><b>${todayRows.length}</b><small>${today()}</small></button>
      <div class="report-stat card"><span>Total Keluar</span><b>${fmt(totalKeluar)}</b><small>akumulasi sesuai filter</small></div>
      <div class="report-stat card"><span>Total Masuk</span><b>${fmt(totalMasuk)}</b><small>akumulasi sesuai filter</small></div>
    </section>

    ${summaryJenis.length ? `<section class="card report-kind-summary-v108"><div class="toolbar"><div><h3>Ringkasan Jenis Transaksi</h3><p class="muted">Klik jenis untuk filter cepat.</p></div></div><div class="report-kind-grid-v108">${summaryJenis.map(x=>`<button type="button" class="report-kind-card-v108 ${state.reportJenis===x.jenis?"active":""}" data-report-jenis="${esc(x.jenis)}"><b>${esc(reportHumanLabel(x.jenis))}</b><span>${fmt(x.count)} trx</span><small>Keluar ${fmt(x.keluar)} • Masuk ${fmt(x.masuk)}</small></button>`).join("")}</div></section>` : ""}

    ${productionUsageSummaryHtml(productionGroups)}

    <section class="report-list report-list-v108">
      ${visibleRows.map(t=>{
        const i=map[t.item_id]||{};
        const jenis = t.jenis_transaksi || "stok_harian";
        const keluarText = t.keluar_dus||t.keluar_item ? `${fmt(t.keluar_dus||0)} dus + ${fmt(t.keluar_item||0)} pcs` : formatDusItem(Number(t.keluar||0),i);
        const jenisCls = jenis.includes("keluar") ? "keluar" : (jenis.includes("masuk") || jenis.includes("produksi") ? "masuk" : "netral");
        return `<article class="report-card card report-card-v108 ${jenisCls}">
          <div class="report-main">
            <div class="report-date">
              <span>${esc(t.date||"-")}</span>
              <small class="report-time">Jam ${esc(txTime(t))}</small>
              <b>${esc(reportHumanLabel(jenis))}</b>
            </div>
            <div class="report-item">
              <h3>${esc(i.name||"(barang arsip/terhapus)")}</h3>${t.transaction_code?`<p class="trx-code">Kode: <b>${esc(t.transaction_code)}</b></p>`:""}
              <p>${esc(i.category||"-")} ${packInfo(i)!=="-"?`• ${packInfo(i)}`:""}</p>
              ${(t.no_surat_jalan||t.tujuan||t.jenis_dus||t.jenis_plastik)?`<p class="report-sj">SJ/DO: <b>${esc(t.no_surat_jalan||"-")}</b> • Tujuan: <b>${esc(t.tujuan||"-")}</b> ${t.jenis_dus?`• Dus: <b>${esc(t.jenis_dus)}</b>`:""} ${t.jenis_plastik?`• Plastik: <b>${esc(t.jenis_plastik)}</b>`:""}</p>`:""}
              ${t.note?`<p class="report-note-v108">${esc(t.note)}</p>`:""}
            </div>
          </div>

          <div class="report-values">
            <div class="rv keluar"><span>Keluar</span><b>${fmt(t.keluar||0)}</b><small>${keluarText}</small></div>
            <div class="rv masuk"><span>Masuk</span><b>${fmt(t.masuk||0)}</b><small>${esc(i.unit||"-")}</small></div>
            <div class="rv"><span>Petugas</span><b>${esc(t.petugas||"-")}</b><small>${esc(t.note||"-")}</small></div>
          </div>

          <div class="report-actions">
            <button class="btn gray edittx" data-id="${t.id}" type="button">Edit</button><button class="btn red deltx" data-id="${t.id}">Hapus</button>
          </div>
        </article>`;
      }).join("") || `<div class="card report-empty report-empty-v108">Belum ada transaksi sesuai filter. Coba reset filter atau pilih Semua tanggal.</div>`}
      ${laporan.length > visibleRows.length ? `<div class="card report-load-more-v108"><b>Data masih ada ${fmt(laporan.length-visibleRows.length)} transaksi.</b><button type="button" class="btn gray" id="reportShowMoreBtn">Tampilkan lebih banyak</button></div>` : ""}
    </section>
  </main>`);
}



function render(){
  try{
    if(!configured()) return renderSetup();
    if(!accessToken()) return renderLogin();
    if(state.loading && !state.items.length){app.innerHTML=`<div class="container"><div class="card">Mengambil data online...</div></div>`; return;}
    if(state.tab==="dashboard") app.innerHTML=dashboard();
    if(state.tab==="absen") app.innerHTML=absenPage();
    if(state.tab==="pakaiBahan") app.innerHTML=pakaiBahanPage();
    if(state.tab==="produksi") app.innerHTML=produksiPage();
    if(state.tab==="keluarPabrik") app.innerHTML=keluarPabrikPage();
    if(state.tab==="input") app.innerHTML=inputPage();
    if(state.tab==="stock") app.innerHTML=stockPage();
    if(state.tab==="laporan") app.innerHTML=reportPage();
    if(state.tab==="arsip") app.innerHTML=archivePage();
    bind();
  }catch(e){
    app.innerHTML=`<div class="container"><div class="error"><h2>Aplikasi error</h2><p>${esc(e.message||e)}</p></div></div>`;
  }
}
function bind(){
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{ if(b.dataset.inputMode) state.posMode=b.dataset.inputMode; state.tab=b.dataset.tab; render(); scrollTo(0,0);});
  document.querySelectorAll("[data-stock-view]").forEach(b=>b.onclick=()=>{state.stockView=b.dataset.stockView||"ringkasan"; state.search=""; state.category="Semua"; state.locationFilter="Semua"; state.statusFilter="Semua"; state.simpleAreaFilter="Semua"; state.tab="stock"; render(); scrollTo(0,0);});
  const logoutBtn=document.getElementById("logoutBtn"); if(logoutBtn) logoutBtn.onclick=logout;
  const roleSel=document.getElementById("roleModeSelect"); if(roleSel) roleSel.onchange=()=>setRoleMode(roleSel.value);
  const ref=document.getElementById("refreshBtn"); if(ref) ref.onclick=()=>loadAll();
  const closeBtn=document.getElementById("closeTodayBtn"); if(closeBtn) closeBtn.onclick=closeToday;
  const reopenBtn=document.getElementById("reopenClosingBtn"); if(reopenBtn) reopenBtn.onclick=reopenTodayClosing;
  const pdf=document.getElementById("printDailyFullBtn"); if(pdf) pdf.onclick=printDailyFullReport;
  const bj=document.getElementById("backupJsonBtn"); if(bj) bj.onclick=exportFullBackupJson;
  const bm=document.getElementById("backupMonthlyBtn"); if(bm) bm.onclick=exportMonthlyBackupJson;
  const cp=document.getElementById("changePinBtn"); if(cp) cp.onclick=changeAdminPin;
  const pdf2=document.getElementById("printDailyFullBtn2"); if(pdf2) pdf2.onclick=printDailyFullReport;
  const exs=document.getElementById("exportStock"); if(exs) exs.onclick=exportStock;
  const pbb=document.getElementById("printBarcodeBtn"); if(pbb) pbb.onclick=printBarcodeLabels;
  document.querySelectorAll(".barcode-input").forEach(inp=>inp.onchange=()=>{if(!requireAdmin("Edit barcode")) return render(); updateItem(inp.dataset.id,{barcode:inp.value||null});});
  document.querySelectorAll(".itemImageUrlInput").forEach(inp=>inp.onchange=()=>saveItemImage(inp.dataset.id, inp.value || ""));
  document.querySelectorAll(".itemImageFile").forEach(inp=>inp.onchange=async()=>{
    if(!requireAdmin("Upload gambar barang")) return render();
    const file=inp.files && inp.files[0];
    if(!file) return;
    try{
      state.flash="Memproses gambar..."; render();
      const dataUrl = await resizeImageFileToDataUrl(file);
      await saveItemImage(inp.dataset.id, dataUrl);
    }catch(err){ alert("Gagal upload gambar: "+err.message); }
  });
  document.querySelectorAll(".itemImageRemove").forEach(btn=>btn.onclick=()=>saveItemImage(btn.dataset.id, ""));

  const ext=document.getElementById("exportTx"); if(ext) ext.onclick=exportTx;
  const gset=document.getElementById("setupGSheetBtn"); if(gset) gset.onclick=setGSheetUrl;
  const gsend=document.getElementById("sendGSheetDailyBtn"); if(gsend) gsend.onclick=sendDailyGSheet;
  const gtest=document.getElementById("testGSheetBtn"); if(gtest) gtest.onclick=testGSheetUrl;
  const gauto=document.getElementById("toggleAutoGSheetBtn"); if(gauto) gauto.onclick=toggleGSheetAutoSync;
  const gsetStock=document.getElementById("setupGSheetStockBtn"); if(gsetStock) gsetStock.onclick=setGSheetUrl;
  const gsendStock=document.getElementById("sendGSheetStockBtn"); if(gsendStock) gsendStock.onclick=sendDailyGSheet;
  const gtestStock=document.getElementById("testGSheetStockBtn"); if(gtestStock) gtestStock.onclick=testGSheetUrl;
  const gautoStock=document.getElementById("toggleAutoGSheetStockBtn"); if(gautoStock) gautoStock.onclick=toggleGSheetAutoSync;
  const prb=document.getElementById("printReportBtn"); if(prb) prb.onclick=printReport;
  const pfr=document.getElementById("printFilteredReportBtn"); if(pfr) pfr.onclick=printFilteredReport;
  const efo=document.getElementById("exportFactoryOut"); if(efo) efo.onclick=exportFactoryOut;
  const rdi=document.getElementById("reportDateInput"); if(rdi) rdi.onchange=()=>{state.reportDate=rdi.value; render();};
  const rjs=document.getElementById("reportJenisSelect"); if(rjs) rjs.onchange=()=>{state.reportJenis=rjs.value; state.reportLimit=150; render();};
  const rsi=document.getElementById("reportSearchInput"); if(rsi){
    rsi.oninput=()=>{state.reportSearch=rsi.value; state.reportLimit=150; clearTimeout(stockSearchTimer); stockSearchTimer=setTimeout(()=>{render(); const n=document.getElementById("reportSearchInput"); if(n){n.focus(); const l=n.value.length; try{n.setSelectionRange(l,l);}catch(_e){}}},180);};
  }
  document.querySelectorAll(".reportQuickDate").forEach(b=>b.onclick=()=>{state.reportDate=b.dataset.reportDate||""; state.reportLimit=150; render();});
  document.querySelectorAll("[data-report-group]").forEach(b=>b.onclick=()=>{state.reportGroup=b.dataset.reportGroup||"Semua"; state.reportLimit=150; render();});
  document.querySelectorAll("[data-report-jenis]").forEach(b=>b.onclick=()=>{state.reportJenis=b.dataset.reportJenis||"Semua"; if(b.dataset.reportGroup){state.reportGroup=b.dataset.reportGroup||"Semua";} state.reportLimit=150; render();});
  const rmore=document.getElementById("reportShowMoreBtn"); if(rmore) rmore.onclick=()=>{state.reportLimit=Number(state.reportLimit||150)+150; render();};
  const epu=document.getElementById("exportProductionUsageBtn"); if(epu) epu.onclick=exportProductionUsage;
  const pum=document.getElementById("productionUsageMoreBtn"); if(pum) pum.onclick=()=>{state.productionUsageLimit=Number(state.productionUsageLimit||12)+12; render();};
  document.querySelectorAll(".reportSearchCodeBtn").forEach(b=>b.onclick=()=>{state.reportSearch=b.dataset.code||""; state.reportJenis="Semua"; state.reportLimit=150; render();});
  const crf=document.getElementById("clearReportFilter"); if(crf) crf.onclick=()=>{state.reportDate=""; state.reportJenis="Semua"; state.reportGroup="Semua"; state.reportSearch=""; state.reportLimit=150; render();};
  const fofPreview=document.getElementById("factoryOutForm");
  if(fofPreview){
    fofPreview.querySelectorAll("input,select").forEach(el=>{
      el.addEventListener("input", renderAutoCutPreview);
      el.addEventListener("change", renderAutoCutPreview);
    });
    setTimeout(renderAutoCutPreview, 0);
  }
  document.querySelectorAll("[data-pos-mode]").forEach(b=>b.onclick=()=>{state.posMode=b.dataset.posMode; state.flash=""; render();});
  document.querySelectorAll("[data-pos-category]").forEach(b=>b.onclick=()=>{state.posCategory=b.dataset.posCategory||"Semua"; render();});
  const pcs=document.getElementById("posCategorySelect"); if(pcs) pcs.onchange=e=>{state.posCategory=e.target.value; render();};
  const si=document.getElementById("searchInput"); if(si){
    si.oninput=e=>{
      state.search=e.target.value;
      clearTimeout(stockSearchTimer);
      stockSearchTimer=setTimeout(()=>{
        render();
        const next=document.getElementById("searchInput");
        if(next){
          next.focus();
          const len=next.value.length;
          try{ next.setSelectionRange(len,len); }catch(_e){}
        }
      }, 180);
    };
    si.onkeydown=e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        clearTimeout(stockSearchTimer);
        state.search=si.value;
        render();
      }
    };
  }
  const stockSearchPick=document.getElementById("stockSearchPick"); if(stockSearchPick) stockSearchPick.onchange=e=>{state.search=e.target.value || ""; render();};
  const clearStockSearch=document.getElementById("clearStockSearch"); if(clearStockSearch) clearStockSearch.onclick=e=>{e.preventDefault(); state.search=""; state.category="Semua"; state.statusFilter="Semua"; state.locationFilter="Semua"; render();};
  const cs=document.getElementById("categorySelect"); if(cs) cs.onchange=e=>{state.category=e.target.value; render();};
  const ls=document.getElementById("locationSelect"); if(ls) ls.onchange=e=>{state.locationFilter=e.target.value; render();};
  const ss=document.getElementById("statusSelect"); if(ss) ss.onchange=e=>{state.statusFilter=e.target.value; render();};
  
  document.querySelectorAll("[data-stock-summary]").forEach(card=>{
    card.onclick=(e)=>{
      e.preventDefault();
      const mode = card.dataset.stockSummary;
      state.search = "";
      if(mode === "all"){
        state.category = "Semua";
        state.locationFilter = "Semua";
        state.statusFilter = "Semua";
        state.simpleAreaFilter = "Semua";
      }else if(mode === "category"){
        state.category = "Semua";
        state.locationFilter = "Semua";
        state.statusFilter = "Semua";
        state.simpleAreaFilter = "Semua";
      }else if(mode === "location"){
        state.locationFilter = "Semua";
      }else if(mode === "critical"){
        state.category = "Semua";
        state.locationFilter = "Semua";
        state.simpleAreaFilter = "Semua";
        state.statusFilter = "KURANG/HABIS";
      }else if(mode === "empty"){
        state.category = "Semua";
        state.locationFilter = "Semua";
        state.simpleAreaFilter = "Semua";
        state.statusFilter = "HABIS";
      }
      render();
    };
  });

  
  document.querySelectorAll(".factoryEditBtn").forEach(btn=>{
    btn.onclick=(e)=>{
      e.preventDefault();
      if(!requireAdmin("Edit lokasi/QC")) return;
      state.factoryEditId = btn.dataset.id;
      render();
    };
  });
  const factoryClose = ()=>{
    state.factoryEditId = null;
    render();
  };
  const factoryCloseBtn = document.getElementById("factoryModalClose");
  if(factoryCloseBtn) factoryCloseBtn.onclick = factoryClose;
  const factoryCancelBtn = document.getElementById("factoryModalCancel");
  if(factoryCancelBtn) factoryCancelBtn.onclick = factoryClose;
  const factoryBackdrop = document.getElementById("factoryModalBackdrop");
  if(factoryBackdrop) factoryBackdrop.onclick = (e)=>{ if(e.target === factoryBackdrop) factoryClose(); };
  const factoryForm = document.getElementById("factoryEditForm");
  if(factoryForm) factoryForm.onsubmit = async(e)=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(factoryForm).entries());
    const supplier = d.supplier_manual || d.supplier_select || null;
    await updateItem(d.id,{
      lokasi:d.lokasi||null,
      qc_status:(d.qc_status||"OK").toUpperCase(),
      supplier,
      batch_lot:d.batch_lot||null,
      expired_date:d.expired_date||null
    });
    state.factoryEditId = null;
    render();
  };


  document.querySelectorAll("[data-simple-area]").forEach(btn=>{
    btn.onclick=(e)=>{
      e.preventDefault();
      const nextArea = btn.dataset.simpleArea || "Semua";
      if(state.simpleAreaFilter !== nextArea) state.search = "";
      state.simpleAreaFilter = nextArea;
      state.category = "Semua";
      render();
    };
  });

  document.querySelectorAll("[data-group-area][data-group-status]").forEach(btn=>{
    btn.onclick=(e)=>{
      e.preventDefault();
      const nextArea = btn.dataset.groupArea || "Semua";
      const nextStatus = btn.dataset.groupStatus || "Semua";
      if(state.simpleAreaFilter !== nextArea) state.search = "";
      state.simpleAreaFilter = nextArea;
      state.statusFilter = nextStatus;
      state.category = "Semua";
      render();
    };
  });

  document.querySelectorAll(".stock-cat-chip,.stock-group-filter").forEach(btn=>{
    btn.onclick=(e)=>{
      e.preventDefault();
      state.category = btn.dataset.category || "Semua";
      render();
    };
  });
  document.querySelectorAll(".stock-location-card-v79,.stock-location-filter-v79").forEach(btn=>{
    btn.onclick=(e)=>{
      e.preventDefault();
      state.locationFilter = btn.dataset.location || "Semua";
      render();
    };
  });
  document.querySelectorAll("[data-stat-target]").forEach(card=>{card.onclick=()=>{state.tab=card.dataset.statTarget; if(card.dataset.statTarget==="stock"){state.statusFilter=card.dataset.statStatus||"Semua"; state.search=""; state.category="Semua"; state.locationFilter="Semua";} render(); scrollTo(0,0);}; card.onkeydown=(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(); card.click();}};});
  const ef=document.getElementById("employeeForm"); if(ef) ef.onsubmit=async e=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(ef).entries());
    if(!String(d.name||"").trim()) return alert("Nama karyawan wajib diisi.");
    await addEmployee({
      name:String(d.name||"").trim(),
      default_shift:"Shift 1",
      note:d.note || null,
      active:true
    });
  };

  document.querySelectorAll(".saveEmployee").forEach(b=>b.onclick=async ()=>{
    const row = b.closest(".employee-row");
    await updateEmployee(b.dataset.id, {
      name: row.querySelector(".emp-name").value.trim(),
      note: row.querySelector(".emp-note").value || null
    });
  });
  document.querySelectorAll(".archiveEmployee").forEach(b=>b.onclick=()=>archiveEmployee(b.dataset.id));

  function applyBulkShift(shift){
    const def = shiftDefaults(shift);
    const cin = document.getElementById("bulkIn");
    const cout = document.getElementById("bulkOut");
    if(cin) cin.value = def.check_in;
    if(cout) cout.value = def.check_out;
  }

  const bulkShift=document.getElementById("bulkShift");
  if(bulkShift){
    bulkShift.onchange=()=>applyBulkShift(bulkShift.value);
    setTimeout(()=>applyBulkShift(bulkShift.value || "Shift 1"),0);
  }

  const selectAll=document.getElementById("selectAllEmployees");
  if(selectAll) selectAll.onclick=()=>{
    document.querySelectorAll('input[name="employee_ids"]').forEach(x=>x.checked=true);
  };
  const clearAll=document.getElementById("clearAllEmployees");
  if(clearAll) clearAll.onclick=()=>{
    document.querySelectorAll('input[name="employee_ids"]').forEach(x=>x.checked=false);
  };

  const bulk=document.getElementById("bulkAttendanceForm"); if(bulk) bulk.onsubmit=async e=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(bulk).entries());
    const ids = [...bulk.querySelectorAll('input[name="employee_ids"]:checked')].map(x=>Number(x.value));
    if(!ids.length) return alert("Pilih minimal 1 karyawan.");
    const overtime = d.overtime === "true";
    const shift = d.shift_name || "Shift 1";
    const schedule = shiftDefaults(shift);
    const payloads = ids.map(id=>{
      const emp = employeeById(id);
      return {
        date:d.date,
        employee_id:Number(id),
        employee_name:emp ? emp.name : `Karyawan ${id}`,
        shift_name:shift,
        status:overtime ? "Lembur" : (d.status || "Masuk"),
        check_in:d.check_in || null,
        check_out:d.check_out || null,
        scheduled_in:schedule.check_in,
        scheduled_out:schedule.check_out,
        overtime:overtime,
        overtime_hours:Number(d.overtime_hours || 0),
        note:d.note || null,
        petugas:d.petugas || userEmail() || null
      };
    });
    await addBulkAttendance(payloads);
  };

  const eab=document.getElementById("exportAttendance"); if(eab) eab.onclick=exportAttendance;
  const eabm=document.getElementById("exportAttendanceMonthly"); if(eabm) eabm.onclick=exportAttendanceMonthly;
  const epm=document.getElementById("exportPayrollMonthly"); if(epm) epm.onclick=exportPayrollMonthly;
  const pdi=document.getElementById("payrollDailyInput"); if(pdi) pdi.onchange=()=>{setPayrollConfig(pdi.value, state.payrollOvertime, state.payrollAlpha); render();};
  const poi=document.getElementById("payrollOvertimeInput"); if(poi) poi.onchange=()=>{setPayrollConfig(state.payrollDaily, poi.value, state.payrollAlpha); render();};
  const pai=document.getElementById("payrollAlphaInput"); if(pai) pai.onchange=()=>{setPayrollConfig(state.payrollDaily, state.payrollOvertime, pai.value); render();};
  const amf=document.getElementById("attendanceMonthFilter"); if(amf) amf.onchange=()=>{state.attendanceMonth=amf.value; render();};
  const adf=document.getElementById("attendanceDateFilter"); if(adf) adf.onchange=()=>{state.attendanceDate=adf.value; render();};
  const asr=document.getElementById("attendanceSearch"); if(asr) asr.oninput=()=>{state.searchAbsen=asr.value; render();};
  const caf=document.getElementById("clearAttendanceFilter"); if(caf) caf.onclick=()=>{state.attendanceDate=""; state.searchAbsen=""; render();};
  document.querySelectorAll(".editAttendance").forEach(b=>b.onclick=()=>editAttendancePrompt(b.dataset.id));
  document.querySelectorAll(".delAttendance").forEach(b=>b.onclick=()=>deleteAttendance(b.dataset.id));
  const ubc=document.getElementById("usedBahanCategorySelect"); if(ubc) ubc.onchange=()=>{state.usedBahanCategory=ubc.value; localStorage.setItem("hf_used_bahan_category_v129", ubc.value); render();};
  const utf=document.getElementById("usedTodayForm"); if(utf) utf.onsubmit=async e=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(utf).entries());
    const payloads = [];
    const names = [];
    for(let n=1; n<=12; n++){
      const id = d[`item_${n}`];
      const qty = Number(String(d[`qty_${n}`] || "0").replace(",", "."));
      if(id && qty > 0){
        const item = itemById(id);
        if(!item || !item.id) continue;
        payloads.push({
          item_id:Number(id),
          date:d.date || today(),
          jam_transaksi:d.jam_transaksi || nowTime(),
          keluar:qty,
          masuk:0,
          keluar_dus:0,
          keluar_item:qty,
          masuk_dus:0,
          masuk_item:0,
          jenis_transaksi:"barang_dipakai_hari_ini",
          note:["Barang dipakai hari ini", d.keperluan ? `Keperluan: ${d.keperluan}` : "", `${item.name}: ${fmt(qty)} ${item.unit || ""}`, d.note || ""].filter(Boolean).join(" | "),
          petugas:d.petugas || userEmail() || state.roleMode || "staff"
        });
        names.push(`${item.name}: ${fmt(qty)} ${item.unit || ""}`);
      }else if(id && qty <= 0){
        return alert(`Jumlah barang dipakai baris ${n} harus lebih dari 0.`);
      }
    }
    if(!payloads.length) return alert("Pilih minimal 1 barang dan isi jumlah dipakai.");
    try{
      await addUsedTodayTx(payloads);
    }catch(err){
      alert("Gagal simpan barang dipakai: " + err.message);
      if(String(err.message).includes("login")) renderLogin();
    }
  };
  const pbc=document.getElementById("productionBahanCategorySelect"); if(pbc) pbc.onchange=()=>{state.productionBahanCategory=pbc.value; localStorage.setItem("hf_production_bahan_category_v121", pbc.value); render();};
  const fbc=document.getElementById("factoryBahanCategorySelect"); if(fbc) fbc.onchange=()=>{state.factoryBahanCategory=fbc.value; localStorage.setItem("hf_factory_bahan_category_v119", fbc.value); render();};
  const rf=document.getElementById("recipeForm");
  const addRecipeBtn=document.getElementById("addRecipeBtn");
  if(rf && addRecipeBtn) addRecipeBtn.onclick=async (ev)=>{
    if(ev) ev.preventDefault();
    const d = {};
    rf.querySelectorAll("[name]").forEach(el => { d[el.name] = el.value; });
    const productId = d.recipe_product_id || d.product_id;
    const ingredientId = d.recipe_ingredient_item_id || d.ingredient_item_id;
    const qtyPerUnit = Number(String(d.recipe_qty_per_unit || d.qty_per_unit || "0").replace(",", "."));
    const ingredient = itemById(ingredientId);
    if(!productId || !ingredientId) return alert("Pilih produk dan bahan resep dulu.");
    if(!qtyPerUnit || qtyPerUnit <= 0 || Number.isNaN(qtyPerUnit)) return alert("Isi takaran bahan per 1 hasil produksi.");
    await addRecipe({
      product_id:Number(productId),
      ingredient_item_id:Number(ingredientId),
      ingredient_name:ingredient ? ingredient.name : "",
      qty_per_unit:qtyPerUnit,
      unit:ingredient ? ingredient.unit : "",
      note:"Resep/BOM produksi V141"
    });
  };
  document.querySelectorAll(".delRecipe").forEach(b=>b.onclick=()=>deleteRecipe(b.dataset.id));

  const pf=document.getElementById("productionForm"); if(pf) pf.onsubmit=async e=>{
    e.preventDefault();
    const submitBtn = pf.querySelector('.produksi-submit');
    if(submitBtn){ submitBtn.disabled = true; submitBtn.dataset.oldText = submitBtn.textContent || ''; submitBtn.textContent = 'Menyimpan produksi...'; }
    const resetSubmitBtn = ()=>{ if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.oldText || 'Simpan Produksi Hari Ini'; } };
    const d = Object.fromEntries(new FormData(pf).entries());
    const product = itemById(d.product_id);
    const qty = Number(String(d.qty || "0").replace(",", "."));
    if(!d.date){ resetSubmitBtn(); return alert("Tanggal produksi wajib diisi."); }
    if(!product){ resetSubmitBtn(); return alert("Pilih produk jadi dulu."); }
    if(!qty || qty <= 0 || Number.isNaN(qty)){ resetSubmitBtn(); return alert("Isi hasil produksi/masuk stok lebih dari 0."); }

    let bahanList = [];
    let bahanNames = [];

    if(d.recipe_mode === "formula"){
      const recipeRows = recipesForProduct(product.id);
      if(!recipeRows.length){ resetSubmitBtn(); return alert("Resep/BOM produk ini belum ada. Tambahkan dulu di Resep Produksi / BOM atau pakai mode manual."); }
      bahanList = recipeBahanPayloads(product, qty, d.date, d.note, d.petugas);
      bahanNames = bahanList.map(b => {
        const bahan = itemById(b.item_id) || {};
        return `${bahan.name || "Bahan"}: ${fmt(b.keluar)} ${bahan.unit || ""}`;
      });
    }else{
      for(let n=1; n<=12; n++){
        const bid = d[`bahan_${n}`];
        const bqty = Number(String(d[`bahan_qty_${n}`] || "0").replace(",", "."));
        if(bid && bqty > 0){
          const bahan = itemById(bid);
          if(!bahan) continue;

          const row = stockRowByItemId(bid);
          const current = row ? Number(row.stock || 0) : Number(bahan.starting_stock || 0);
          if(bqty > current){
            resetSubmitBtn();
            alert(`Stok ${bahan.name} tidak cukup. Sisa ${fmt(current)} ${bahan.unit || ""}, mau dipakai ${fmt(bqty)}. Produksi diblok supaya stok tidak minus.`); return;
          }

          bahanNames.push(`${bahan.name}: ${fmt(bqty)} ${bahan.unit || ""}`);
          bahanList.push({
            item_id:Number(bid),
            date:d.date,
            jam_transaksi:d.jam_transaksi || nowTime(),
            keluar:bqty,
            masuk:0,
            jenis_transaksi:"produksi_bahan",
            note:`Bahan produksi untuk ${product.name} | ${bahan.name}: ${fmt(bqty)} ${bahan.unit || ""} | ${d.note || ""}`.trim(),
            petugas:d.petugas||null
          });
        }
      }
    }

    const noteDetail = bahanNames.length ? `Bahan dipakai: ${bahanNames.join(" | ")}` : "Tanpa rincian bahan";
    try{
      const saved = await addProductionTx({
        item_id:Number(d.product_id),
        date:d.date,
        jam_transaksi:d.jam_transaksi || nowTime(),
        keluar:0,
        masuk:qty,
        jenis_transaksi:"produksi_hasil",
        note:[d.note || "Hasil produksi", noteDetail].filter(Boolean).join(" | "),
        petugas:d.petugas||null
      }, bahanList);
      if(saved === false) resetSubmitBtn();
    }catch(err){
      resetSubmitBtn();
      alert("Gagal simpan produksi: "+err.message);
      if(String(err.message).includes("login")) renderLogin();
    }
  };

  const fof=document.getElementById("factoryOutForm"); if(fof) fof.onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(fof).entries());
    const item=itemById(d.item_id);
    const pcs=pcsPerDus(item);
    if(!pcs)return alert("Barang ini belum punya Pcs/Dus. Isi dulu di Stock Opname: 500gr=20, 1kg=10, 2kg=5.");

    if(!String(d.tujuan||"").trim()){ if(!confirm("Tujuan/customer belum diisi. Tetap simpan?")) return; }
    const keluarDus = Number(d.keluar_dus||0);
    const keluarItem = Number(d.keluar_item||0);
    const keluar=inputToPcs(keluarDus, keluarItem, item);
    if(keluar<=0)return alert("Isi jumlah Keluar Dus atau Keluar Item/Pcs.");

    const detail = autoCutDetail(item, keluarDus, keluarItem, d.jenis_dus || "Polos", d.jenis_plastik || "Auto");
    const previewPlasticItem = detail.plastikItem || findPlasticPackagingItem(item, d.jenis_plastik || "Auto");
    const selectedPlasticReport = previewPlasticItem ? previewPlasticItem.name : plasticSelectedLabel(d.jenis_plastik || "Auto");

    let dusPayload = null;
    let plastikPayload = null;

    if(keluarDus > 0){
      const dusItem = findDusPackagingItem(d.jenis_dus || "Polos");
      if(!dusItem){
        return alert(`Item Kardus ${d.jenis_dus || "Polos"} belum ada di master stok. Jalankan SQL V41/V42 atau tambah barang bernama Kardus ${d.jenis_dus || "Polos"} dulu.`);
      }

      const dusRow = stockRowByItemId(dusItem.id);
      const sisaDus = dusRow ? Number(dusRow.stock || 0) : Number(dusItem.starting_stock || 0);
      if(keluarDus > sisaDus){
        alert(`Stok ${dusItem.name} tidak cukup. Sisa ${fmt(sisaDus)} ${dusItem.unit || "pcs"}, mau keluar ${fmt(keluarDus)}. Keluar pabrik diblok.`); return;
      }

      dusPayload = {
        item_id:Number(dusItem.id),
        date:d.date,
        keluar:keluarDus,
        masuk:0,
        keluar_dus:0,
        keluar_item:keluarDus,
        masuk_dus:0,
        masuk_item:0,
        jenis_transaksi:"keluar_dus_pabrik",
        no_surat_jalan:d.no_surat_jalan||null,
        tujuan:d.tujuan||null,
        jenis_dus:d.jenis_dus||"Polos",
        jenis_plastik:selectedPlasticReport,
        note:`${autoCutNote(detail)} | Auto potong ${dusItem.name} untuk keluar pabrik ${item.name}`,
        petugas:d.petugas||null
      };
    }

    if(keluar > 0){
      const plastikItem = findPlasticPackagingItem(item, d.jenis_plastik || "Auto");
      if(!plastikItem){
        return alert(`Item plastik untuk ${item.name} belum ketemu. Pilih Jenis Plastik manual dari list plastik, atau tambah master item plastik dulu sesuai nama plastik yang dipakai.`);
      }

      const plastikRow = stockRowByItemId(plastikItem.id);
      const sisaPlastik = plastikRow ? Number(plastikRow.stock || 0) : Number(plastikItem.starting_stock || 0);
      if(keluar > sisaPlastik){
        alert(`Stok ${plastikItem.name} tidak cukup. Sisa ${fmt(sisaPlastik)} ${plastikItem.unit || "pcs"}, butuh ${fmt(keluar)}. Keluar pabrik diblok.`); return;
      }

      const plastikNameForReport = plastikItem.name || plasticSelectedLabel(d.jenis_plastik || "Auto");
      plastikPayload = {
        item_id:Number(plastikItem.id),
        date:d.date,
        keluar:keluar,
        masuk:0,
        keluar_dus:0,
        keluar_item:keluar,
        masuk_dus:0,
        masuk_item:0,
        jenis_transaksi:"keluar_plastik_pabrik",
        no_surat_jalan:d.no_surat_jalan||null,
        tujuan:d.tujuan||null,
        jenis_dus:d.jenis_dus||"Polos",
        jenis_plastik:plastikNameForReport,
        note:`${autoCutNote(detail)} | Auto potong plastik ${plastikItem.name} untuk keluar pabrik ${item.name}`,
        petugas:d.petugas||null
      };
    }

    // V122: bahan produksi tidak lagi dipotong dari menu Pabrik agar tidak double potong.
    // Potong bumbu/plastik/kentang/tepung yang dipakai produksi dari menu Produksi.
    const extraNames = [];
    const extraPayloads = [];

    try{
      await addFactoryOut({
        item_id:Number(d.item_id),
        date:d.date,
        keluar,
        masuk:0,
        keluar_dus:keluarDus,
        keluar_item:keluarItem,
        masuk_dus:0,
        masuk_item:0,
        jenis_transaksi:"keluar_pabrik",
        no_surat_jalan:d.no_surat_jalan||null,
        tujuan:d.tujuan||null,
        jenis_dus:d.jenis_dus||"Polos",
        jenis_plastik:selectedPlasticReport,
        note:[d.note||"Keluar pabrik", autoCutNote(detail)].filter(Boolean).join(" | "),
        petugas:d.petugas||null
      }, dusPayload, plastikPayload, extraPayloads);
    }catch(err){
      alert("Gagal simpan keluar pabrik: "+err.message);
      if(String(err.message).includes("login")) renderLogin();
    }
  };
  const txf=document.getElementById("txForm"); if(txf) txf.onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(txf).entries());
    const item=itemById(d.item_id);
    const mode=["masuk","keluar","pakai"].includes(d.mode) ? d.mode : (state.posMode || "masuk");
    const qty=Number(String(d.qty || d.masuk_item || "0").replace(",","."));
    if(!item || !d.item_id) return alert("Pilih barang dulu.");
    if(!qty || qty<=0 || Number.isNaN(qty)) return alert("Isi jumlah lebih dari 0.");
    const isOut = mode === "keluar" || mode === "pakai";
    const jenis = mode === "masuk" ? "barang_masuk" : (mode === "pakai" ? "barang_dipakai_hari_ini" : "barang_keluar");
    const label = mode === "masuk" ? "Barang masuk" : (mode === "pakai" ? "Barang dipakai hari ini" : "Barang keluar umum");
    const detail = `${item.name}: ${fmt(qty)} ${item.unit || ""}`;
    const note = [label, detail, d.note ? `Ket: ${d.note}` : ""].filter(Boolean).join(" | ");
    try{
      await addTx({
        item_id:Number(d.item_id),
        date:d.date || today(),
        jam_transaksi:d.jam_transaksi || nowTime(),
        keluar:isOut ? qty : 0,
        masuk:mode === "masuk" ? qty : 0,
        keluar_dus:0,
        keluar_item:isOut ? qty : 0,
        masuk_dus:0,
        masuk_item:mode === "masuk" ? qty : 0,
        jenis_transaksi:jenis,
        note:note,
        petugas:d.petugas || userEmail() || state.roleMode || "staff"
      });
    }catch(err){
      alert("Gagal simpan: "+err.message);
      if(String(err.message).includes("login")) renderLogin();
    }
  };
  const itf=document.getElementById("itemForm"); if(itf){

    const tpl=document.getElementById("templateBarangSelect");
    if(tpl){
      tpl.onchange=()=>{
        const selected = masterItemTemplates()[Number(tpl.value)];
        if(!selected) return;
        state.itemDraft = Object.assign({}, state.itemDraft, {
          category:selected.category || state.itemDraft.category,
          name:selected.name || "",
          varian:"",
          ukuran:"",
          starting_stock:state.itemDraft.starting_stock || "0",
          unit:selected.unit || "pcs",
          min_stock:String(selected.min_stock ?? 0),
          pcs_per_dus:String(selected.pcs_per_dus ?? 0),
          lokasi:selected.lokasi || "",
          supplier:selected.supplier || "",
          qc_status:selected.qc_status || "OK",
          batch_lot:state.itemDraft.batch_lot || "",
          expired_date:state.itemDraft.expired_date || "",
          deskripsi:selected.deskripsi || "",
          image_url:selected.image_url || state.itemDraft.image_url || ""
        });
        render();
      };
    }
    itf.querySelectorAll(".draft-field").forEach(el=>{
      const saveDraft=()=>{ state.itemDraft = Object.assign({}, state.itemDraft, {[el.name]:el.value}); };
      el.oninput=saveDraft;
      el.onchange=saveDraft;
    });
    const newImgFile=document.getElementById("itemImageFileNew");
    if(newImgFile){
      newImgFile.onchange=async()=>{
        const file=newImgFile.files && newImgFile.files[0];
        if(!file) return;
        try{
          const dataUrl = await resizeImageFileToDataUrl(file);
          state.itemDraft = Object.assign({}, state.itemDraft, {image_url:dataUrl});
          render();
        }catch(err){
          alert("Gagal membaca gambar: "+err.message);
        }
      };
    }
    itf.onsubmit=async e=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(itf).entries());
      state.itemDraft = Object.assign({}, state.itemDraft, d);
      const finalName=buildItemNameFromForm(d);
      if(!finalName)return alert("Nama Barang wajib diisi.");
      if(!d.category)return alert("Pilih Jenis / Kategori dulu.");
      if(!d.unit)return alert("Pilih satuan dulu.");
      const pcsAuto=Number(d.pcs_per_dus||0) || inferPcsPerDusFromText(finalName);
      const ok = await addItem({
        name:finalName,
        category:d.category,
        starting_stock:Number(d.starting_stock||0),
        unit:d.unit,
        pcs_per_dus:pcsAuto,
        min_stock:Number(d.min_stock||0),
        physical_stock:null,
        archived:false,
        lokasi:d.lokasi || null,
        supplier:d.supplier || null,
        qc_status:(d.qc_status || "OK").toUpperCase(),
        batch_lot:d.batch_lot || null,
        expired_date:d.expired_date || null,
        varian:d.varian || null,
        ukuran:d.ukuran || null,
        deskripsi:d.deskripsi || null,
        image_url:d.image_url || null
      });
      if(ok){
        resetItemDraft();
        render();
        setTimeout(()=>{state.flash=""; render();}, 2600);
      }
    };
  }
  document.querySelectorAll(".edittx").forEach(b=>b.onclick=()=>editTransactionPrompt(b.dataset.id));
  document.querySelectorAll(".deltx").forEach(b=>b.onclick=()=>delTx(b.dataset.id));
  document.querySelectorAll(".quickStockMove").forEach(b=>b.onclick=()=>quickStockMove(b.dataset.id, b.dataset.mode));
  document.querySelectorAll(".quickStockOpname").forEach(b=>b.onclick=()=>quickStockOpname(b.dataset.id));
  document.querySelectorAll(".stockedit").forEach(inp=>inp.onchange=()=>updateStockNow(inp.dataset.id, inp.value));
  document.querySelectorAll(".physical").forEach(inp=>inp.onchange=()=>updateItem(inp.dataset.id,{physical_stock:inp.value===""?null:Number(inp.value)}));
  document.querySelectorAll(".minstock").forEach(inp=>inp.onchange=()=>{if(!requireAdmin("Edit batas minimum")) return render(); const v=Number(String(inp.value||0).replace(",",".")); if(Number.isNaN(v)||v<0) return alert("Batas minimum harus angka 0 atau lebih."); updateItem(inp.dataset.id,{min_stock:v});});
  document.querySelectorAll(".pcsperdus").forEach(inp=>inp.onchange=()=>{if(!requireAdmin("Edit Pcs/Dus")) return render(); updateItem(inp.dataset.id,{pcs_per_dus:Number(inp.value||0)});});
  document.querySelectorAll(".archiveItem").forEach(b=>b.onclick=()=>archiveItem(b.dataset.id));
  document.querySelectorAll(".deleteItemPermanent").forEach(b=>b.onclick=()=>deleteItemPermanent(b.dataset.id));
  document.querySelectorAll(".restoreItem").forEach(b=>b.onclick=()=>restoreItem(b.dataset.id));
}
try{
  render();
  if(configured() && accessToken()){
    loadAll();
  }
}catch(e){
  showBootError(e);
}
})();
