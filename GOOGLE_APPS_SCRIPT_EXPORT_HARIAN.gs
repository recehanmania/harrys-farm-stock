/**
 * Harry's Farm - GSheet Real Fix V109
 *
 * WAJIB:
 * 1. Buat / buka Google Sheet tujuan.
 * 2. Klik Ekstensi > Apps Script dari Google Sheet itu.
 * 3. Hapus semua kode lama, paste kode ini, Save.
 * 4. Deploy > Manage deployments > Edit > Version: New version > Deploy.
 *    Kalau belum pernah: Deploy > New deployment > Web app.
 * 5. Execute as: Me.
 * 6. Who has access: Anyone.
 * 7. Copy Web app URL yang ujungnya /exec.
 * 8. Di aplikasi Harry's Farm: Laporan > Set GSheet > tempel URL /exec.
 * 9. Klik Test GSheet dulu. Kalau benar, tab LOG_SYNC akan muncul/bertambah.
 */

// Kalau Apps Script dibuat bukan dari Google Sheet, isi ID spreadsheet di sini.
// ID diambil dari URL Google Sheet:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
var SPREADSHEET_ID = '';

function doGet(e) {
  var ss = getTargetSpreadsheet_();
  var log = getOrCreateSheet_(ss, 'LOG_SYNC');
  ensureLogHeader_(log);
  log.appendRow([new Date(), 'TEST', 'OK', 'Test koneksi dari URL /exec berhasil', '', '', '']);
  return ContentService
    .createTextOutput('OK - Harry\'s Farm GSheet tersambung. Cek tab LOG_SYNC di Google Sheet.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var ss, log;
  try {
    ss = getTargetSpreadsheet_();
    log = getOrCreateSheet_(ss, 'LOG_SYNC');
    ensureLogHeader_(log);

    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw || '{}');
    var date = data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    writeDailyReport_(ss, data, date);
    writeRealtimeStock_(ss, data);
    writeTransaksi_(ss, data, date);

    log.appendRow([new Date(), 'POST', 'OK', 'Laporan masuk', date, (data.transaksi || []).length, (data.stok || []).length]);
    return json_({ ok:true, date:date, sheet:'Harian_' + date });
  } catch (err) {
    try {
      ss = ss || getTargetSpreadsheet_();
      log = getOrCreateSheet_(ss, 'LOG_SYNC');
      ensureLogHeader_(log);
      log.appendRow([new Date(), 'POST', 'ERROR', String(err), '', '', '']);
    } catch (_ignored) {}
    return json_({ ok:false, error:String(err) });
  }
}

function getTargetSpreadsheet_() {
  if (SPREADSHEET_ID && String(SPREADSHEET_ID).trim()) {
    return SpreadsheetApp.openById(String(SPREADSHEET_ID).trim());
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak ketemu. Buka Google Sheet > Ekstensi > Apps Script, paste kode dari sana. Atau isi SPREADSHEET_ID di bagian atas script.');
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
