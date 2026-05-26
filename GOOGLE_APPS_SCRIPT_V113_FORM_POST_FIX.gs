
/**
 * Harry's Farm - GSheet POST Parse Fix V115
 *
 * Cara pasang:
 * 1. Isi SPREADSHEET_ID di bawah dengan ID Google Sheet tujuan.
 * 2. Save.
 * 3. Terapkan > Kelola deployment > Edit > Version: New version > Deploy.
 * 4. Copy URL /exec baru, tempel ulang di aplikasi Harry's Farm > Set GSheet.
 */

var SPREADSHEET_ID = '';

function doGet(e) {
  var ss = getTargetSpreadsheet_();
  var log = getOrCreateSheet_(ss, 'LOG_SYNC');
  ensureLogHeader_(log);
  log.appendRow([new Date(), 'TEST', 'OK', 'Test koneksi dari URL /exec berhasil', '', '', '']);
  return ContentService
    .createTextOutput('OK - Harry\'s Farm GSheet tersambung. Sekarang klik Kirim GSheet dari aplikasi, bukan Test.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var ss, log;
  try {
    ss = getTargetSpreadsheet_();
    log = getOrCreateSheet_(ss, 'LOG_SYNC');
    ensureLogHeader_(log);
    log.appendRow([new Date(), 'POST_START', 'OK', 'doPost terpanggil dari aplikasi', '', '', '']);

    var raw = readPayload_(e);
    if(!raw || String(raw).trim().charAt(0) !== '{') {
      log.appendRow([new Date(), 'POST_RAW', 'INFO', String(raw || '').slice(0, 180), '', '', '']);
    }
    var data = JSON.parse(raw || '{}');
    var date = data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    writeDailyReport_(ss, data, date);
    writeRealtimeStock_(ss, data);
    writeTransaksi_(ss, data, date);

    log.appendRow([new Date(), 'EXPORT', 'OK', 'Laporan dan stok masuk ke Google Sheet', date, (data.transaksi || []).length, (data.stok || []).length]);
    return json_({ ok:true, date:date, sheet:'Harian_' + date });
  } catch (err) {
    try {
      ss = ss || getTargetSpreadsheet_();
      log = getOrCreateSheet_(ss, 'LOG_SYNC');
      ensureLogHeader_(log);
      log.appendRow([new Date(), 'POST_ERROR', 'ERROR', String(err), '', '', '']);
    } catch (_ignored) {}
    return json_({ ok:false, error:String(err) });
  }
}

function readPayload_(e) {
  // V115: baca payload dari semua kemungkinan bentuk POST.
  // 1) Normal form field dari aplikasi: e.parameter.payload
  if (e && e.parameter && e.parameter.payload) return e.parameter.payload;
  if (e && e.parameters && e.parameters.payload && e.parameters.payload.length) return e.parameters.payload[0];

  var raw = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : '';
  if (!raw) return '{}';

  // 2) Kalau body sudah JSON langsung.
  var trimmed = raw.trim();
  if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') return trimmed;

  // 3) x-www-form-urlencoded: payload=...&hf_action=EXPORT atau hf_action=EXPORT&payload=...
  var parsed = parseUrlEncoded_(raw);
  if (parsed && parsed.payload) return parsed.payload;

  // 4) Fallback regex: cari payload= di mana saja.
  var m = raw.match(/(?:^|&)payload=([\s\S]*?)(?:&hf_action=|&[^=]+=|$)/);
  if (m && m[1]) return safeDecode_(m[1]);

  // 5) multipart/form-data fallback: name="payload" lalu isi di bawahnya.
  var mp = raw.match(/name="payload"\s*\r?\n\r?\n([\s\S]*?)\r?\n--/);
  if (mp && mp[1]) return mp[1].trim();

  // 6) Kalau yang terkirim masih berbentuk hf_action=..., kasih error jelas.
  if (raw.indexOf('hf_action=') >= 0) {
    throw new Error('Payload JSON tidak terbaca. Apps Script menerima form tanpa field payload. Pakai file GOOGLE_APPS_SCRIPT_V115_GSHEET_POST_PARSE_FIX.gs dan deploy New version.');
  }

  return raw;
}

function parseUrlEncoded_(raw) {
  var obj = {};
  String(raw || '').split('&').forEach(function(part){
    if (!part) return;
    var eq = part.indexOf('=');
    var key = eq >= 0 ? part.slice(0, eq) : part;
    var val = eq >= 0 ? part.slice(eq + 1) : '';
    key = safeDecode_(key);
    val = safeDecode_(val);
    obj[key] = val;
  });
  return obj;
}

function safeDecode_(v) {
  try {
    return decodeURIComponent(String(v || '').replace(/\+/g, ' '));
  } catch (err) {
    return String(v || '');
  }
}

function getTargetSpreadsheet_() {
  if (SPREADSHEET_ID && String(SPREADSHEET_ID).trim()) {
    return SpreadsheetApp.openById(String(SPREADSHEET_ID).trim());
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak ketemu. Isi SPREADSHEET_ID di bagian atas script.');
  }
  return ss;
}

function writeDailyReport_(ss, data, date) {
  var sheetName = 'Harian_' + date;
  var sh = getOrCreateSheet_(ss, sheetName);
  sh.clear();

  var rows = [];
  pushTitle_(rows, "Harry's Farm - Laporan Harian");
  rows.push(['Tanggal', date, 'Jenis Filter', data.jenis_filter || 'Semua']);
  rows.push(['Export Dari App', data.exported_at || '', 'Petugas', data.exported_by || '']);
  rows.push([]);

  pushTitle_(rows, 'RINGKASAN');
  rows.push(['Total Transaksi', n_(data.summary && data.summary.total_transaksi), 'Total Keluar Pcs', n_(data.summary && data.summary.total_keluar_pcs), 'Total Masuk Pcs', n_(data.summary && data.summary.total_masuk_pcs)]);
  rows.push(['Total Item Stok', n_(data.summary && data.summary.total_item_stok), 'Stok Aman', n_(data.summary && data.summary.stok_aman), 'Stok Kurang', n_(data.summary && data.summary.stok_kurang), 'Stok Habis', n_(data.summary && data.summary.stok_habis)]);
  rows.push([]);

  pushTitle_(rows, 'TRANSAKSI HARIAN');
  rows.push(['Kode','Tanggal','Jam','Jenis','No SJ/DO','Tujuan','Nama Barang','Kategori','Kemasan','Keluar Pcs','Keluar Dus','Keluar Item','Masuk Pcs','Satuan','Keterangan','Petugas']);
  (data.transaksi || []).forEach(function(x){
    rows.push([v_(x.kode),v_(x.tanggal),v_(x.jam),v_(x.jenis),v_(x.no_surat_jalan),v_(x.tujuan),v_(x.nama_barang),v_(x.kategori),v_(x.kemasan),n_(x.keluar_pcs),n_(x.keluar_dus),n_(x.keluar_item),n_(x.masuk_pcs),v_(x.satuan),v_(x.keterangan),v_(x.petugas)]);
  });
  if(!(data.transaksi || []).length) rows.push(['Belum ada transaksi harian']);
  rows.push([]);

  pushTitle_(rows, 'STOK KRITIS / KURANG / HABIS');
  rows.push(['Kode','Nama Barang','Kategori','Area','Lokasi','QC','Stok','Stok Dus','Fisik','Selisih','Minimum','Status','Rekomendasi','Satuan']);
  (data.kritis || []).forEach(function(x){
    rows.push([v_(x.kode),v_(x.nama_barang),v_(x.kategori),v_(x.area),v_(x.lokasi),v_(x.qc),n_(x.stok),v_(x.stok_dus),v_(x.fisik),v_(x.selisih),n_(x.minimum),v_(x.status),v_(x.rekomendasi),v_(x.satuan)]);
  });
  if(!(data.kritis || []).length) rows.push(['Semua stok aman']);
  rows.push([]);

  pushTitle_(rows, 'SNAPSHOT SEMUA STOK');
  rows.push(['Kode','Nama Barang','Kategori','Area','Lokasi','QC','Supplier','Batch/Lot','Expired','Kemasan','Stok','Stok Dus','Fisik','Selisih','Minimum','Status','Rekomendasi','Satuan']);
  (data.stok || []).forEach(function(x){
    rows.push([v_(x.kode),v_(x.nama_barang),v_(x.kategori),v_(x.area),v_(x.lokasi),v_(x.qc),v_(x.supplier),v_(x.batch_lot),v_(x.expired),v_(x.kemasan),n_(x.stok),v_(x.stok_dus),v_(x.fisik),v_(x.selisih),n_(x.minimum),v_(x.status),v_(x.rekomendasi),v_(x.satuan)]);
  });

  writeRows_(sh, rows);
  styleSheet_(sh, rows.length, maxCols_(rows));
}

function writeRealtimeStock_(ss, data) {
  var sh = getOrCreateSheet_(ss, 'STOK_REALTIME');
  var rows = [['Update', new Date()], []];
  rows.push(['Kode','Nama Barang','Kategori','Area','Lokasi','QC','Stok','Stok Dus','Minimum','Status','Rekomendasi','Satuan']);
  (data.stok || []).forEach(function(x){
    rows.push([v_(x.kode),v_(x.nama_barang),v_(x.kategori),v_(x.area),v_(x.lokasi),v_(x.qc),n_(x.stok),v_(x.stok_dus),n_(x.minimum),v_(x.status),v_(x.rekomendasi),v_(x.satuan)]);
  });
  sh.clear();
  writeRows_(sh, rows);
  sh.setFrozenRows(3);
  colorStatus_(sh, 4, rows.length, 10);
}

function writeTransaksi_(ss, data, date) {
  var sh = getOrCreateSheet_(ss, 'TRANSAKSI_HARIAN');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Waktu Export','Tanggal','Jam','Jenis','No SJ/DO','Tujuan','Nama Barang','Kategori','Keluar Pcs','Masuk Pcs','Satuan','Keterangan','Petugas']);
    sh.setFrozenRows(1);
  }
  (data.transaksi || []).forEach(function(x){
    sh.appendRow([new Date(),v_(x.tanggal || date),v_(x.jam),v_(x.jenis),v_(x.no_surat_jalan),v_(x.tujuan),v_(x.nama_barang),v_(x.kategori),n_(x.keluar_pcs),n_(x.masuk_pcs),v_(x.satuan),v_(x.keterangan),v_(x.petugas)]);
  });
}

function getOrCreateSheet_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function ensureLogHeader_(log) {
  if (log.getLastRow() === 0) {
    log.appendRow(['Waktu','Aksi','Status','Pesan','Tanggal','Total Transaksi','Total Item']);
    log.setFrozenRows(1);
  }
}
function writeRows_(sh, rows) {
  var cols = maxCols_(rows);
  rows = rows.map(function(r){ r = r || []; while(r.length < cols) r.push(''); return r; });
  if(rows.length) sh.getRange(1, 1, rows.length, cols).setValues(rows);
  sh.autoResizeColumns(1, Math.min(cols, 18));
}
function maxCols_(rows){ return rows.reduce(function(m,r){ return Math.max(m, (r || []).length); }, 1); }
function pushTitle_(rows, text) { rows.push([text]); }
function n_(v) { var x = Number(v || 0); return isNaN(x) ? 0 : x; }
function v_(v) { return v == null ? '' : v; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function styleSheet_(sh, rowCount, colCount) {
  if(rowCount < 1 || colCount < 1) return;
  sh.getRange(1,1,1,colCount).setFontWeight('bold').setFontSize(14);
  for (var r = 1; r <= rowCount; r++) {
    var v = sh.getRange(r,1).getValue();
    if (String(v).match(/^(RINGKASAN|TRANSAKSI HARIAN|STOK KRITIS|SNAPSHOT SEMUA STOK)$/)) {
      sh.getRange(r,1,1,colCount).setFontWeight('bold').setBackground('#e2e8f0');
    }
  }
}
function colorStatus_(sh, startRow, endRow, statusCol) {
  if (endRow < startRow) return;
  var values = sh.getRange(startRow, statusCol, endRow - startRow + 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var status = String(values[i][0] || '').toUpperCase();
    var range = sh.getRange(startRow + i, 1, 1, sh.getLastColumn());
    if (status === 'HABIS') range.setBackground('#fee2e2');
    else if (status === 'DI BAWAH MINIMUM') range.setBackground('#fef3c7');
    else if (status === 'AMAN') range.setBackground('#dcfce7');
  }
}
