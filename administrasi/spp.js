// Menarik data santri mentah untuk keperluan dropdown pilihan nama
let LOKAL_DATA_SANTRI = []; 

function showLoading(show, pesan = "Memproses...") {
    document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none';
}

// =========================================================
// JAM REAL-TIME DAN KALENDER (Sama seperti index)
// =========================================================
function updateWaktuLokal() {
    const sekarang = new Date();
    const jam = sekarang.getHours().toString().padStart(2, '0');
    const menit = sekarang.getMinutes().toString().padStart(2, '0');
    const detik = sekarang.getSeconds().toString().padStart(2, '0');
    
    const elemenJam = document.getElementById('waktu-jam');
    if (elemenJam) elemenJam.innerText = `${jam}:${menit}:${detik}`;

    const offsetWIB = 7 * 60 * 60 * 1000; 
    const totalHari = Math.floor((sekarang.getTime() + offsetWIB) / 86400000);
    const arrPasaran = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const pasaranJawa = arrPasaran[(totalHari + 3) % 5]; 

    const opsiMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let teksMasehi = sekarang.toLocaleDateString('id-ID', opsiMasehi);
    let bagianTeks = teksMasehi.split(','); 
    teksMasehi = `${bagianTeks[0]} ${pasaranJawa}, ${bagianTeks[1]} M`;

    const elemenMasehi = document.getElementById('waktu-masehi');
    if (elemenMasehi) elemenMasehi.innerText = teksMasehi.toUpperCase();

    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const parts = formatter.formatToParts(sekarang);
        let hDay = "", hMonth = "", hYear = "";
        parts.forEach(p => {
            if (p.type === 'day') hDay = p.value;
            if (p.type === 'month') hMonth = p.value;
            if (p.type === 'year') hYear = p.value;
        });
        const namaBulanHijriyah = ["", "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"];
        const elemenHijriyah = document.getElementById('waktu-hijriyah');
        if (elemenHijriyah) elemenHijriyah.innerText = `${hDay} ${namaBulanHijriyah[parseInt(hMonth)]} ${hYear} H`.toUpperCase();
    } catch (e) { }
}

// =========================================================
// INISIALISASI AWAL (ANTI GAGAL LOAD & AUTO REFRESH)
// =========================================================
function initSpp() {
    updateWaktuLokal();
    setInterval(updateWaktuLokal, 1000);
    ambilMasterSantri();
    ambilSettingSpp(); // <--- KODE BARU
}

// Menjamin fungsi tetap berjalan meski halaman lambat dimuat
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initSpp);
} else {
    initSpp(); 
}

function ambilMasterSantri() {
    const fd = new URLSearchParams(); 
    fd.append('action', 'getSantri');
    fd.append('token', sessionStorage.getItem('tokenMadasa')); 
    
    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        if(res.status === 'success') {
            LOKAL_DATA_SANTRI = res.data;
            
            // FITUR BARU: Auto-Refresh Pilihan Dropdown
            // Jika Anda sudah terlanjur memilih kelas sebelum data selesai diunduh,
            // sistem akan otomatis memunculkan namanya sekarang!
            if (document.getElementById('filterKelasSpp').value) {
                loadDataSpp();
            }
        }
    }).catch(e => console.log("Gagal muat master santri"));
}

// =========================================================
// PENGATURAN KETETAPAN SPP MADRASAH (DINAMIS DARI DATABASE)
// =========================================================
let TARIF_SPP_BULAN = 0;
let JUMLAH_BULAN_SPP = 0;
let TOTAL_TAGIHAN_SETAHUN = 0;

let HISTORI_GLOBAL = []; // Menyimpan riwayat sementara untuk modal

// Format Rupiah
function formatRp(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// --- KODE BARU: Auto-Format saat diketik & Pengubah ke Angka Murni ---
function formatInputRupiah(input) {
    let angkaMurni = input.value.replace(/[^0-9]/g, '');
    if (angkaMurni) {
        input.value = new Intl.NumberFormat('id-ID').format(angkaMurni);
    } else {
        input.value = '';
    }
}

function getAngkaMurni(stringInput) {
    if (!stringInput) return 0;
    return parseFloat(stringInput.toString().replace(/\./g, '')) || 0;
}

// Inisialisasi Tampilan Ketetapan
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('info_spp_bulan').innerText = formatRp(TARIF_SPP_BULAN) + ' / bln';
    document.getElementById('info_spp_jml_bulan').innerText = JUMLAH_BULAN_SPP + ' Bulan';
    document.getElementById('info_spp_total').innerText = formatRp(TOTAL_TAGIHAN_SETAHUN);
});

// KUMPULAN FUNGSI KETETAPAN SPP
function ambilSettingSpp() {
    const fd = new URLSearchParams();
    fd.append('action', 'getSettingSpp');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    
    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        if(res.status === 'success') {
            TARIF_SPP_BULAN = parseFloat(res.nominal) || 0;
            JUMLAH_BULAN_SPP = parseFloat(res.bulan) || 0;
            TOTAL_TAGIHAN_SETAHUN = TARIF_SPP_BULAN * JUMLAH_BULAN_SPP;
            
            // KUNCI PERBAIKAN: Jika angka lebih dari 0 maka tampilkan, jika 0 maka kosongkan ("")
            document.getElementById('input_tarif_spp').value = TARIF_SPP_BULAN > 0 ? new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN) : "";
            document.getElementById('input_bulan_spp').value = JUMLAH_BULAN_SPP > 0 ? JUMLAH_BULAN_SPP : "";
            
            document.getElementById('info_spp_total').innerText = formatRp(TOTAL_TAGIHAN_SETAHUN);
        }
    });
}

function kalkulasiTotalSppUi() {
    let nominal = getAngkaMurni(document.getElementById('input_tarif_spp').value);
    let bulan = parseFloat(document.getElementById('input_bulan_spp').value) || 0;
    document.getElementById('info_spp_total').innerText = formatRp(nominal * bulan);
}

function simpanSettingSpp() {
    let nominal = getAngkaMurni(document.getElementById('input_tarif_spp').value);
    let bulan = parseFloat(document.getElementById('input_bulan_spp').value) || 0;
    
    if (nominal <= 0 || bulan <= 0) return Swal.fire('Perhatian', 'Isi nominal dan bulan dengan benar.', 'warning');

    showLoading(true);
    const fd = new URLSearchParams();
    fd.append('action', 'saveSettingSpp');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('nominal', nominal);
    fd.append('bulan', bulan);
    
    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        showLoading(false);
        if(res.status === 'success') {
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'Pengaturan disimpan!', showConfirmButton:false, timer:2000});
            
            // Terapkan ke memori web secara instan
            TARIF_SPP_BULAN = nominal;
            JUMLAH_BULAN_SPP = bulan;
            TOTAL_TAGIHAN_SETAHUN = nominal * bulan;
            
            // Jika ada kelas yang sedang aktif dibuka, refresh tabelnya otomatis
            if(document.getElementById('filterKelasSpp').value) loadDataSpp();
        }
    }).catch(e => { showLoading(false); Swal.fire('Error', 'Gagal menyimpan.', 'error');});
}


// =========================================================
// LOGIKA TAMPILKAN TABEL DATA SPP
// =========================================================
function loadDataSpp() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return;

    showLoading(true);
    const fd = new URLSearchParams();
    fd.append('action', 'getSppData'); 
    fd.append('kelas', kelas);
    fd.append('token', sessionStorage.getItem('tokenMadasa'));

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        const tbody = document.getElementById('bodyTabelSpp');
        tbody.innerHTML = '';
        
        HISTORI_GLOBAL = res.status === 'success' ? res.data : [];

        const selectNama = document.getElementById('spp_nis_nama');
        selectNama.innerHTML = '<option value="" disabled selected>-- Pilih Santri --</option>';
        
        let kelasBersih = kelas.toString().trim().toLowerCase();
        let kelasAlternatif = kelasBersih.includes('-') ? kelasBersih.split('-')[1].trim() : kelasBersih;

        let santriDitemukan = LOKAL_DATA_SANTRI.filter(s => {
            let kelasDB = s.kelas ? s.kelas.toString().trim().toLowerCase() : '';
            // Memastikan kelas IV tidak menarik data kelas I (Pencocokan Mutlak)
            return kelasDB === kelasBersih || kelasDB === kelasAlternatif;
        });

        // Masukkan nama ke dropdown form
        santriDitemukan.forEach(s => { 
            selectNama.innerHTML += `<option value="${s.nis}">${s.nis} - ${s.nama}</option>`; 
        });
        
        // Render Tabel Akuntansi
        if (santriDitemukan.length > 0) {
            let nomor = 1;
            santriDitemukan.forEach((santri) => {
                let historiSpp = HISTORI_GLOBAL.filter(d => d.nis == santri.nis);
                
                // Kalkulasi Terbayar & Sisa Tunggakan
                let totalTerbayar = 0;
                historiSpp.forEach(item => { totalTerbayar += parseFloat(item.nominal) || 0; });
                let sisaTunggakan = Math.max(0, TOTAL_TAGIHAN_SETAHUN - totalTerbayar);
                
                let warnaSisa = sisaTunggakan === 0 ? 'text-emerald-600' : 'text-red-500';
                let teksSisa = sisaTunggakan === 0 ? '<i class="fas fa-check-circle"></i> LUNAS' : formatRp(sisaTunggakan);

                tbody.innerHTML += `
                    <tr class="hover:bg-gray-50 transition-all border-b border-gray-50">
                        <td class="p-4 text-center text-gray-500 font-medium">${nomor++}</td>
                        <td class="p-4 font-mono text-gray-500">${santri.nis}</td>
                        <td class="p-4 font-bold text-gray-800">${santri.nama}</td>
                        <td class="p-4 text-center text-gray-600 font-semibold">${formatRp(TOTAL_TAGIHAN_SETAHUN)}</td>
                        <td class="p-4 text-center font-bold text-blue-600">${formatRp(totalTerbayar)}</td>
                        <td class="p-4 text-center font-bold ${warnaSisa}">${teksSisa}</td>
                        <td class="p-4 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="bukaRiwayatSpp('${santri.nis}', '${santri.nama}')" title="Lihat Riwayat" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><i class="fas fa-list"></i></button>
                                <button onclick="openModalSpp('${santri.nis}')" title="Bayar SPP" class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><i class="fas fa-plus"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-gray-400">Belum ada data santri di kelas ini. Periksa data Master Santri Anda.</td></tr>';
        }
    }).catch(e => { 
        showLoading(false); 
        console.error(e);
        Swal.fire('Error', 'Gagal memuat data SPP.', 'error'); 
    });
}

function kalkulasiOtomatisBulan() {
    if (document.getElementById('cek_bintang_pelajar').checked) return; 

    const jumlahBulanDipilih = document.querySelectorAll('.cek-bulan:checked').length;
    const inputNominal = document.getElementById('spp_nominal');

    if (jumlahBulanDipilih > 0) {
        inputNominal.value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN * jumlahBulanDipilih);
    } else {
        inputNominal.value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN);
    }
}

function toggleBintangPelajar() {
    const isChecked = document.getElementById('cek_bintang_pelajar').checked;
    const areaTgl = document.getElementById('area_tanggal_bulan');
    const inputNominal = document.getElementById('spp_nominal');
    const inputTgl = document.getElementById('spp_tanggal');
    const inputThn = document.getElementById('spp_tahun');
    
    if(isChecked) {
        areaTgl.style.display = 'none'; 
        inputNominal.value = new Intl.NumberFormat('id-ID').format(TOTAL_TAGIHAN_SETAHUN); // Tambahkan format ini
        inputNominal.readOnly = true;
        document.getElementById('spp_status').value = "LUNAS";
        
        inputTgl.removeAttribute('required');
        inputThn.removeAttribute('required');
    } else {
        areaTgl.style.display = 'block'; // Tampilkan kembali
        kalkulasiOtomatisBulan(); // Hitung ulang nominal sesuai ceklis
        inputNominal.readOnly = false;
        
        inputTgl.setAttribute('required', 'required');
        inputThn.setAttribute('required', 'required');
    }
}

function openModalSpp(targetNis = null) {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Pilih kelas terlebih dahulu.', 'warning');

    document.getElementById('formInputSpp').reset();
    document.getElementById('spp_nominal').value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN);
    
    // --- KODE BARU: Bersihkan semua centang bulan ---
    document.querySelectorAll('.cek-bulan').forEach(cb => cb.checked = false);
    
    let tahunHijriyah = 1448; 
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { year: 'numeric' });
        const parts = formatter.formatToParts(new Date());
        parts.forEach(p => { if (p.type === 'year') tahunHijriyah = p.value; });
    } catch(e) {}
    document.getElementById('spp_tahun').value = tahunHijriyah;

    toggleBintangPelajar(); 
    
    if (targetNis && targetNis !== 'tambah') {
        document.getElementById('spp_nis_nama').value = targetNis;
    } else {
        document.getElementById('spp_nis_nama').value = ""; 
        document.getElementById('spp_nis_nama').selectedIndex = 0; 
    }
    
    document.getElementById('modalFormSpp').classList.remove('hidden');
}

function closeModalSpp() { document.getElementById('modalFormSpp').classList.add('hidden'); }

// --- KODE YANG BENAR & BERSIH DARI DUPLIKASI ---
document.getElementById('formInputSpp').addEventListener('submit', function(e) {
    e.preventDefault();
    const btnSubmit = this.querySelector('button[type="submit"]');
    const teksAsli = btnSubmit.innerHTML;
    
    btnSubmit.disabled = true; 
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...';

    const nis = document.getElementById('spp_nis_nama').value;
    const kelas = document.getElementById('filterKelasSpp').value;
    const namaSantri = LOKAL_DATA_SANTRI.find(s => s.nis.toString() === nis)?.nama || '';
    
    // KUNCI PERBAIKAN: nominal ditarik dan dibersihkan dari titik di sini
    const nominal = getAngkaMurni(document.getElementById('spp_nominal').value);
    const status = document.getElementById('spp_status').value;
    
    let stringKeterangan = "";
    if (document.getElementById('cek_bintang_pelajar').checked) {
        stringKeterangan = "Bintang Pelajar - Beasiswa Lunas 1 Tahun";
    } else {
        const tgl = document.getElementById('spp_tanggal').value;
        const thn = document.getElementById('spp_tahun').value;
        
        // Tarik semua nama bulan yang dicentang
        const arrayBulanDiceklis = Array.from(document.querySelectorAll('.cek-bulan:checked')).map(cb => cb.value);
        
        // Peringatan jika admin lupa mencentang bulan satupun
        if (arrayBulanDiceklis.length === 0) {
            btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
            return Swal.fire('Perhatian', 'Mohon centang minimal 1 bulan yang akan dibayar!', 'warning');
        }
        
        // Gabungkan menjadi teks (Contoh: "05 Muharram, Safar 1448")
        const gabunganBulan = arrayBulanDiceklis.join(", ");
        stringKeterangan = `${tgl} ${gabunganBulan} ${thn}`;
    }

    showLoading(true);
    const fd = new URLSearchParams();
    fd.append('action', 'saveSppData');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('nis', nis);
    fd.append('nama', namaSantri);
    fd.append('kelas', kelas);
    fd.append('keterangan', stringKeterangan);
    fd.append('nominal', nominal);
    fd.append('status', status);

    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
        if (res.status === 'success') {
            closeModalSpp();
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'Transaksi dicatat!', showConfirmButton:false, timer:2000});
            loadDataSpp();
        } else Swal.fire('Gagal', res.message, 'error');
    }).catch(e => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
        Swal.fire('Error', 'Koneksi gagal.', 'error');
    });
});

// =========================================================
// FUNGSI MODAL RIWAYAT TRANSAKSI
// =========================================================
function bukaRiwayatSpp(nis, nama) {
    document.getElementById('riwayat_nama_santri').innerText = `${nis} - ${nama}`;
    const tbody = document.getElementById('bodyRiwayatSpp');
    tbody.innerHTML = '';
    
    let historiAnak = HISTORI_GLOBAL.filter(d => d.nis == nis);
    
    if(historiAnak.length > 0) {
        historiAnak.forEach((item, idx) => {
            let warnaBadge = item.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
            tbody.innerHTML += `
                <tr>
                    <td class="p-3 text-center text-gray-500">${idx+1}</td>
                    <td class="p-3 font-semibold text-gray-700">${item.keterangan}</td>
                    <td class="p-3 text-right font-bold text-blue-600">${formatRp(item.nominal)}</td>
                    <td class="p-3 text-center"><span class="px-2 py-1 rounded text-xs font-bold ${warnaBadge}">${item.status}</span></td>
                    <td class="p-3 text-center">
                        <button onclick="hapusSpp('${item.nis}', '${item.keterangan}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="p-5 text-center text-gray-400 italic">Belum ada riwayat transaksi.</td></tr>';
    }
    
    document.getElementById('modalRiwayatSpp').classList.remove('hidden');
}

function closeRiwayatSpp() { document.getElementById('modalRiwayatSpp').classList.add('hidden'); }

function hapusSpp(nis, keterangan) {
    Swal.fire({
        title: 'Batalkan Transaksi?', text: "Uang yang sudah masuk akan dihapus dari catatan.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280', confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            closeRiwayatSpp(); showLoading(true);
            const fd = new URLSearchParams();
            fd.append('action', 'deleteSppData');
            fd.append('token', sessionStorage.getItem('tokenMadasa'));
            fd.append('nis', nis); fd.append('keterangan', keterangan);

            fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
                showLoading(false);
                if(res.status === 'success') {
                    Swal.fire({toast:true, position:'top-end', icon:'success', title:'Dihapus!', showConfirmButton:false, timer:1500});
                    loadDataSpp();
                } else Swal.fire('Gagal', res.message, 'error');
            }).catch(e => { showLoading(false); Swal.fire('Error', 'Koneksi gagal.', 'error'); });
        }
    });
}