// =========================================================
// VARIABEL GLOBAL & LOADING
// =========================================================
let LOKAL_DATA_SANTRI = []; 
let HISTORI_GLOBAL = []; 
let TARIF_SPP_BULAN = 0;
let JUMLAH_BULAN_SPP = 0;
let TOTAL_TAGIHAN_SETAHUN = 0;
let SALDO_SAAT_INI = 0;

function showLoading(show, pesan = "Memproses...") {
    document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none';
}

// =========================================================
// JAM REAL-TIME DAN KALENDER
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
// INISIALISASI AWAL (LOAD DATA & SALDO)
// =========================================================
function initSpp() {
    updateWaktuLokal();
    setInterval(updateWaktuLokal, 1000);
    ambilMasterSantri();
    ambilSettingSpp(); 
    loadBukuKas();
}

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
            
            // Panggil fungsi untuk membuat daftar kelas otomatis dari database
            buatDropdownKelasOtomatis();

            if (document.getElementById('filterKelasSpp').value) {
                loadDataSpp();
            }
        }
    }).catch(e => console.log("Gagal muat master santri"));
}


// =========================================================
// LOGIKA CUSTOM SELECT (PENGGANTI <select> BAWAAN)
// =========================================================
function buatDropdownKelasOtomatis() {
    const listEl = document.getElementById('customSelectList');
    const hiddenInput = document.getElementById('filterKelasSpp');
    const displayEl = document.getElementById('customSelectText');
    if (!listEl) return;

    const pilihanSaatIni = hiddenInput.value;

    const kelasUnik = [...new Set(LOKAL_DATA_SANTRI.map(s => s.kelas).filter(k => k && k.trim() !== ''))].sort();

    let bobotJenjang = { "TK / RA": 1, "IBTIDAIYAH": 2, "SANAWIYAH": 3, "ALIYAH": 4 };
    let kelompokKelas = {};
    
    kelasUnik.forEach(k => {
        let kUpper = k.toUpperCase();
        let kategori = "LAINNYA";

        if (kUpper.includes('TK') || kUpper.includes('RA')) kategori = "TK / RA";
        else if (kUpper.includes('IBT') || kUpper.includes('IBTIDAIYAH')) kategori = "IBTIDAIYAH";
        else if (kUpper.includes('SANA') || kUpper.includes('SANAWIYAH') || kUpper.includes('MTS')) kategori = "SANAWIYAH";
        else if (kUpper.includes('ALIYAH') || kUpper.includes('MA')) kategori = "ALIYAH";
        else kategori = k.split(/[\s-]+/)[0].toUpperCase();

        if (!kelompokKelas[kategori]) kelompokKelas[kategori] = [];
        kelompokKelas[kategori].push(k);
    });

    let kategoriUrut = Object.keys(kelompokKelas).sort((a, b) => (bobotJenjang[a] || 99) - (bobotJenjang[b] || 99));

    // Susun Elemen HTML ke dalam <li>
    let htmlList = `<li class="custom-option-item text-gray-400 text-center !pl-3" onclick="pilihKelasCustom('', '-- Pilih Kelas --')">-- Reset Pilihan --</li>`;
    
    kategoriUrut.forEach(kategori => {
        // Judul Jenjang (Seperti Optgroup)
        htmlList += `<li class="custom-option-group"><i class="fas fa-layer-group mr-2 opacity-50"></i>${kategori}</li>`;
        
        // Daftar Kelas
        kelompokKelas[kategori].forEach(kelas => {
            let safeKelas = kelas.replace(/'/g, "\\'"); // Mencegah error jika ada tanda petik
            htmlList += `<li class="custom-option-item" onclick="pilihKelasCustom('${safeKelas}', '${safeKelas}')">${kelas}</li>`;
        });
    });

    listEl.innerHTML = htmlList;

    if (pilihanSaatIni) displayEl.innerText = pilihanSaatIni;
}

// Logika Klik (Buka, Tutup, dan Pilih)
document.addEventListener("DOMContentLoaded", () => {
    const displayBox = document.getElementById('customSelectDisplay');
    if (displayBox) {
        displayBox.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleCustomSelect();
        });
    }

    // Menutup daftar jika mengeklik area mana saja di luar kotak
    document.addEventListener('click', (e) => {
        const list = document.getElementById('customSelectList');
        const wrapper = document.getElementById('customSelectWrapper');
        if (list && wrapper && !wrapper.contains(e.target)) {
            list.classList.add('hidden');
            document.getElementById('customSelectIcon')?.classList.remove('rotate-180');
        }
    });
});

function toggleCustomSelect() {
    const list = document.getElementById('customSelectList');
    const icon = document.getElementById('customSelectIcon');
    list.classList.toggle('hidden');
    icon.classList.toggle('rotate-180'); // Putar ikon panah 180 derajat
}

function pilihKelasCustom(nilai, teks) {
    document.getElementById('filterKelasSpp').value = nilai; // Simpan ke input tersembunyi
    document.getElementById('customSelectText').innerText = teks; // Ubah teks di kotak
    
    toggleCustomSelect(); // Tutup dropdown
    loadDataSpp(); // Panggil data ke tabel secara otomatis
}

function formatRp(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

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

document.addEventListener("DOMContentLoaded", () => {
    // Gunakan pengecekan (opsional) agar tidak error jika ID dihapus dari HTML
    const elBulan = document.getElementById('info_spp_bulan');
    const elJmlBulan = document.getElementById('info_spp_jml_bulan');
    const elTotal = document.getElementById('info_spp_total');

    if (elBulan) elBulan.innerText = formatRp(TARIF_SPP_BULAN) + ' / bln';
    if (elJmlBulan) elJmlBulan.innerText = JUMLAH_BULAN_SPP + ' Bulan';
    if (elTotal) elTotal.innerText = formatRp(TOTAL_TAGIHAN_SETAHUN);
});

function ambilSettingSpp() {
    const fd = new URLSearchParams();
    fd.append('action', 'getSettingSpp');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    
    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        if(res.status === 'success') {
            TARIF_SPP_BULAN = parseFloat(res.nominal) || 0;
            JUMLAH_BULAN_SPP = parseFloat(res.bulan) || 0;
            TOTAL_TAGIHAN_SETAHUN = TARIF_SPP_BULAN * JUMLAH_BULAN_SPP;
            
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

    showLoading(true, "Menyimpan pengaturan...");
    const fd = new URLSearchParams();
    fd.append('action', 'saveSettingSpp');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('nominal', nominal);
    fd.append('bulan', bulan);
    
    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        if(res.status === 'success') {
            Swal.fire({
                toast: true, 
                position: 'top-end', 
                icon: 'success', 
                title: 'Pengaturan berhasil disimpan!', 
                showConfirmButton: false, 
                timer: 2000
            });
            TARIF_SPP_BULAN = nominal;
            JUMLAH_BULAN_SPP = bulan;
            TOTAL_TAGIHAN_SETAHUN = nominal * bulan;
            kalkulasiTotalSppUi();
            if(document.getElementById('filterKelasSpp').value) loadDataSpp();
        }
    }).catch(e => { 
        showLoading(false); 
        Swal.fire('Error', 'Gagal menyimpan ke server.', 'error');
    });
}


function clearSettingSpp() {
    document.getElementById('input_tarif_spp').value = "";
    document.getElementById('input_bulan_spp').value = "";
    document.getElementById('info_spp_total').innerText = "Rp 0";
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
            return kelasDB === kelasBersih || kelasDB === kelasAlternatif;
        });

        santriDitemukan.forEach(s => { 
            selectNama.innerHTML += `<option value="${s.nis}">${s.nis} - ${s.nama}</option>`; 
        });
        
        if (santriDitemukan.length > 0) {
            let nomor = 1;
            santriDitemukan.forEach((santri) => {
                let historiSpp = HISTORI_GLOBAL.filter(d => d.nis == santri.nis);
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
        inputNominal.value = new Intl.NumberFormat('id-ID').format(TOTAL_TAGIHAN_SETAHUN); 
        inputNominal.readOnly = true;
        document.getElementById('spp_status').value = "LUNAS";
        
        inputTgl.removeAttribute('required');
        inputThn.removeAttribute('required');
    } else {
        areaTgl.style.display = 'block'; 
        kalkulasiOtomatisBulan(); 
        inputNominal.readOnly = false;
        
        inputTgl.setAttribute('required', 'required');
        inputThn.setAttribute('required', 'required');
    }
}

// =========================================================
// MODAL INPUT SPP
// =========================================================
function openModalSpp(targetNis = null) {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Pilih kelas terlebih dahulu.', 'warning');

    document.getElementById('formInputSpp').reset();
    document.getElementById('spp_nominal').value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN);
    document.querySelectorAll('.cek-bulan').forEach(cb => cb.checked = false);
    
    // Ambil penanggalan Hijriyah Hari Ini secara otomatis (Tanggal & Tahun)
    let hDay = "01", hYear = "1448"; 
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: '2-digit', year: 'numeric' });
        const parts = formatter.formatToParts(new Date());
        parts.forEach(p => { 
            if (p.type === 'day') hDay = p.value.padStart(2, '0');
            if (p.type === 'year') hYear = p.value; 
        });
    } catch(e) {}
    
    // Setel otomatis ke dalam Form SPP
    const selTgl = document.getElementById('spp_tanggal');
    if (selTgl) selTgl.value = hDay;

    document.getElementById('spp_tahun').value = hYear;

    toggleBintangPelajar(); 
    
    if (targetNis && targetNis !== 'tambah') {
        document.getElementById('spp_nis_nama').value = targetNis;
    } else {
        document.getElementById('spp_nis_nama').value = ""; 
        document.getElementById('spp_nis_nama').selectedIndex = 0; 
    }
    
    window.history.pushState({ modal: 'formSpp' }, "", "#formSpp");
    document.getElementById('modalFormSpp').classList.remove('hidden');
}

function closeModalSpp() { 
    document.getElementById('modalFormSpp').classList.add('hidden'); 
    if (window.location.hash === "#formSpp") window.history.back();
}

document.getElementById('formInputSpp').addEventListener('submit', function(e) {
    e.preventDefault();
    const btnSubmit = this.querySelector('button[type="submit"]');
    const teksAsli = btnSubmit.innerHTML;
    
    btnSubmit.disabled = true; 
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...';

    const nis = document.getElementById('spp_nis_nama').value;
    const kelas = document.getElementById('filterKelasSpp').value;
    const namaSantri = LOKAL_DATA_SANTRI.find(s => s.nis.toString() === nis)?.nama || '';
    
    const nominal = getAngkaMurni(document.getElementById('spp_nominal').value);
    const status = document.getElementById('spp_status').value;
    
    let stringKeterangan = "";
    if (document.getElementById('cek_bintang_pelajar').checked) {
        stringKeterangan = "Bintang Pelajar - Beasiswa Lunas 1 Tahun";
    } else {
        const tgl = document.getElementById('spp_tanggal').value;
        const thn = document.getElementById('spp_tahun').value;
        const arrayBulanDiceklis = Array.from(document.querySelectorAll('.cek-bulan:checked')).map(cb => cb.value);
        
        if (arrayBulanDiceklis.length === 0) {
            btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
            return Swal.fire('Perhatian', 'Mohon centang minimal 1 bulan yang akan dibayar!', 'warning');
        }
        
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
            loadBukuKas();
        } else Swal.fire('Gagal', res.message, 'error');
    }).catch(e => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
        Swal.fire('Error', 'Koneksi gagal.', 'error');
    });
});

// =========================================================
// MODAL RIWAYAT TRANSAKSI SPP (PER SANTRI)
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
    
    window.history.pushState({ modal: 'riwayatSpp' }, "", "#riwayatSpp");
    document.getElementById('modalRiwayatSpp').classList.remove('hidden');
}

function closeRiwayatSpp() { 
    document.getElementById('modalRiwayatSpp').classList.add('hidden'); 
    if (window.location.hash === "#riwayatSpp") window.history.back();
}

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
                    loadBukuKas();
                } else Swal.fire('Gagal', res.message, 'error');
            }).catch(e => { showLoading(false); Swal.fire('Error', 'Koneksi gagal.', 'error'); });
        }
    });
}

// =========================================================
// SISTEM BUKU KAS & PENGELUARAN (SALDO OTOMATIS)
// =========================================================
function loadBukuKas() {
    const fd = new URLSearchParams();
    fd.append('action', 'getBukuKas');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        if(res.status === 'success') {
            SALDO_SAAT_INI = res.saldo; 
            
            document.getElementById('kas_pemasukan').innerText = formatRp(res.masuk);
            document.getElementById('kas_pengeluaran').innerText = formatRp(res.keluar);
            document.getElementById('kas_saldo').innerText = formatRp(res.saldo);
        }
    }).catch(e => console.log("Gagal memuat buku kas", e));
}

// =========================================================
// MODAL PENGELUARAN
// =========================================================
function openModalPengeluaran() {
    document.getElementById('formPengeluaran').reset();
    
    // Ambil penanggalan Hijriyah Hari Ini secara otomatis
    let hDay = "01", hMonthIdx = 1, hYear = "1448"; 
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: '2-digit', month: 'numeric', year: 'numeric' });
        const parts = formatter.formatToParts(new Date());
        parts.forEach(p => { 
            if (p.type === 'day') hDay = p.value.padStart(2, '0');
            if (p.type === 'month') hMonthIdx = parseInt(p.value);
            if (p.type === 'year') hYear = p.value; 
        });
    } catch(e) {}

    const namaBulanHijriyah = ["", "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"];
    
    // Setel otomatis ke dalam Form
    const selTgl = document.getElementById('out_tgl');
    if (selTgl) selTgl.value = hDay;
    
    const selBln = document.getElementById('out_bln');
    if (selBln) selBln.value = namaBulanHijriyah[hMonthIdx];

    const inThn = document.getElementById('out_thn');
    if (inThn) inThn.value = hYear;
    
    window.history.pushState({ modal: 'pengeluaran' }, "", "#pengeluaran");
    document.getElementById('modalPengeluaran').classList.remove('hidden');
}

function closeModalPengeluaran() {
    document.getElementById('modalPengeluaran').classList.add('hidden');
    if (window.location.hash === "#pengeluaran") window.history.back();
}

document.getElementById('formPengeluaran').addEventListener('submit', function(e) {
    e.preventDefault();
    const nominalKeluar = getAngkaMurni(document.getElementById('out_nominal').value);
    
    if (nominalKeluar > SALDO_SAAT_INI) {
        return Swal.fire({
            icon: 'error',
            title: 'Saldo Tidak Cukup!',
            html: `Anda mencoba mengeluarkan <b>${formatRp(nominalKeluar)}</b>, <br>sedangkan saldo saat ini hanya <b>${formatRp(SALDO_SAAT_INI)}</b>.`
        });
    }

    if (nominalKeluar <= 0) return Swal.fire('Perhatian', 'Nominal tidak valid', 'warning');

    const btnSubmit = this.querySelector('button[type="submit"]');
    const teksAsli = btnSubmit.innerHTML;
    btnSubmit.disabled = true; 
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';

    // Gabungkan Tanggal, Bulan, dan Tahun dari inputan baru
    const tgl = document.getElementById('out_tgl').value;
    const bln = document.getElementById('out_bln').value;
    const thn = document.getElementById('out_thn').value;
    const tanggalGabungan = `${tgl} ${bln} ${thn}`; // Hasil: e.g., "20 Muharram 1448"

    const keterangan = document.getElementById('out_keterangan').value;
    
    showLoading(true, "Mencatat Pengeluaran...");

    const fd = new URLSearchParams();
    fd.append('action', 'addPengeluaran');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('tanggal', tanggalGabungan); // Mengirim format gabungan ke Google Apps Script
    fd.append('keterangan', keterangan);
    fd.append('nominal', nominalKeluar);
    fd.append('user', sessionStorage.getItem('namaMadasa') || 'Admin');

    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
        
        if (res.status === 'success') {
            closeModalPengeluaran();
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'Pengeluaran dicatat!', showConfirmButton:false, timer:2000});
            loadBukuKas(); 
        } else {
            Swal.fire('Gagal', res.message, 'error');
        }
    }).catch(e => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = teksAsli;
        Swal.fire('Error', 'Koneksi gagal.', 'error');
    });
});


// =========================================================
// MODAL LAPORAN BUKU KAS (MASUK & KELUAR)
// =========================================================
function tarikLaporanKas() {
    const keyword = document.getElementById('lap_keyword').value;
    const jenis = document.getElementById('lap_jenis').value;

    showLoading(true, "Memuat Riwayat...");
    
    const fd = new URLSearchParams();
    fd.append('action', 'getLaporanKas');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('keyword', keyword);
    fd.append('jenis', jenis);

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        const tbody = document.getElementById('bodyLaporanKas');
        tbody.innerHTML = '';
        
        if(res.status === 'success' && res.data.length > 0) {
            let nomor = 1;
            res.data.forEach(item => {
                let warnaJenis = item.jenis === 'Masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
                let strMasuk = item.masuk > 0 ? formatRp(item.masuk) : '-';
                let strKeluar = item.keluar > 0 ? formatRp(item.keluar) : '-';
                
           
            // --- KODE TOMBOL (HANYA SISA HAPUS) ---
                let tombolAksi = `
                    <div class="flex items-center justify-center">
                        <button onclick="hapusKas('${item.rincian}', '${item.jenis}')" title="Hapus" class="w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                tbody.innerHTML += `
                    <tr class="hover:bg-gray-50 transition-all border-b border-gray-50">
                        <td class="p-3 text-center text-gray-500">${nomor++}</td>
                        <td class="p-3 font-semibold text-gray-700 text-xs sm:text-sm whitespace-normal min-w-[200px]">${item.rincian}</td>
                        <td class="p-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold ${warnaJenis}">${item.jenis}</span></td>
                        <td class="p-3 text-right font-bold text-emerald-600">${strMasuk}</td>
                        <td class="p-3 text-right font-bold text-red-500">${strKeluar}</td>
                        <td class="p-3 text-center">${tombolAksi}</td> <!-- KOLOM AKSI DIMASUKKAN -->
                    </tr>
                `;
            });
            document.getElementById('lap_tot_masuk').innerText = formatRp(res.masuk);
            document.getElementById('lap_tot_keluar').innerText = formatRp(res.keluar);
            document.getElementById('lap_tot_saldo').innerText = formatRp(res.masuk - res.keluar);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-red-400 font-medium">Tidak ada transaksi yang cocok.</td></tr>';
            document.getElementById('lap_tot_masuk').innerText = "Rp 0";
            document.getElementById('lap_tot_keluar').innerText = "Rp 0";
            document.getElementById('lap_tot_saldo').innerText = "Rp 0";
        }
    }).catch(e => {
        showLoading(false);
        Swal.fire('Error', 'Gagal memuat buku kas.', 'error');
    });
}

function cetakLaporanKas() {
    const tbody = document.getElementById('bodyLaporanKas');
    if (tbody.innerText.includes('Ketik bulan/tahun') || tbody.innerText.includes('Tidak ada transaksi')) {
        return Swal.fire('Tabel Kosong', 'Tidak ada data laporan yang bisa dicetak.', 'error');
    }

    const keyword = document.getElementById('lap_keyword').value || "Semua Waktu";
    const areaTabel = document.getElementById('areaTabelKas');
    const tabelClone = areaTabel.cloneNode(true);
    
    tabelClone.removeAttribute('class');
    tabelClone.querySelectorAll('table, thead, tbody, tfoot, tr, th, td, span').forEach(el => el.removeAttribute('class'));

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = window.location.origin + window.location.pathname.replace(/administrasi\/spp\.html$/i, '') + 'asset/logo.png';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire('Pop-up Diblokir', 'Izinkan pop-up browser untuk mencetak.', 'error');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <title>Buku_Kas_Madrasah</title>
            <style>
                @page { size: portrait; margin: 15mm; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
                .kop-surat { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .kop-surat img { width: 60px; height: 60px; margin-right: 15px; }
                .kop-surat .teks { flex: 1; text-align: center; padding-right: 75px; }
                .kop-surat h2 { margin: 0; font-size: 20px; text-transform: uppercase; font-weight: bold; }
                .kop-surat p { margin: 5px 0 0 0; font-size: 12px; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #000; padding: 6px; font-size: 11px; vertical-align: middle; }
                th { background-color: #f3f4f6 !important; font-weight: bold; text-align: center; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                td:nth-child(2) { text-align: left; }
                td:nth-child(1), td:nth-child(3) { text-align: center; }
                td:nth-child(4), td:nth-child(5) { text-align: right; }
                
                tfoot td { font-weight: bold; background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                .info-filter { margin-bottom: 15px; font-size: 11px; font-weight: bold; }
                .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="kop-surat">
                <img src="${logoUrl}" onerror="this.style.display='none'">
                <div class="teks">
                    <h2>Madrasah Darussalam</h2>
                    <p>Laporan Buku Kas Umum (Arus Kas)</p>
                </div>
            </div>
            
            <div class="info-filter">Pencarian/Filter Terapan: <span style="border-bottom: 1px dashed #000;">${keyword}</span></div>
            
            ${tabelClone.innerHTML}
            
            <div style="margin-top: 40px; display: flex; justify-content: flex-end; padding-right: 20px; page-break-inside: avoid;">
                <div style="text-align: center; width: 250px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px;">Bangkalan, ${tanggalCetak.split(',')[1]}</p>
                    <p style="margin: 0; font-size: 12px; font-weight: bold;">Bendahara Madrasah</p>
                    <div style="height: 70px;"></div>
                    <p style="margin: 0; font-size: 12px; font-weight: bold; text-decoration: underline;">( ...................................... )</p>
                </div>
            </div>
            <div class="footer">Dicetak otomatis dari Sistem Administrasi Madrasah | Tgl: ${tanggalCetak}</div>
            
            <script> window.onload = function() { setTimeout(function() { window.print(); }, 1000); }; </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function openModalLaporanKas() {
    window.history.pushState({ modal: 'laporanKas' }, "", "#laporanKas");
    document.getElementById('modalLaporanKas').classList.remove('hidden');
    if (document.getElementById('bodyLaporanKas').innerText.includes('Silakan klik tombol cari')) {
        tarikLaporanKas();
    }
}

function closeModalLaporanKas() {
    document.getElementById('modalLaporanKas').classList.add('hidden');
    if (window.location.hash === "#laporanKas") window.history.back();
}

// =========================================================
// SINKRONISASI TOMBOL KEMBALI (BACK) PADA HP (POPSTATE)
// =========================================================
window.addEventListener('popstate', function(event) {
    if (typeof Swal !== 'undefined' && Swal.isVisible()) {
        Swal.close();
        return; 
    }

    const modals = [
        'modalFormSpp',
        'modalRiwayatSpp',
        'modalPengeluaran',
        'modalLaporanKas'
    ];

    let isModalClosed = false;

    modals.forEach(modalId => {
        const modalEl = document.getElementById(modalId);
        if (modalEl && !modalEl.classList.contains('hidden')) {
            modalEl.classList.add('hidden');
            isModalClosed = true;
        }
    });

    if (isModalClosed) return;
});


// =========================================================
// LOGIKA HAPUS & EDIT TRANSAKSI DARI BUKU KAS
// =========================================================

function hapusKas(rincian, jenis) {
    Swal.fire({
        title: 'Hapus Transaksi?',
        text: `Anda yakin ingin menghapus catatan ${jenis} ini? Saldo akan disesuaikan otomatis.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoading(true, "Menghapus...");
            const fd = new URLSearchParams();
            fd.append('action', 'deleteKas'); 
            fd.append('token', sessionStorage.getItem('tokenMadasa'));
            fd.append('rincian', rincian);
            fd.append('jenis', jenis);

            fetch(GAS_URL, { method: 'POST', body: fd })
            .then(r => r.json())
            .then(res => {
                showLoading(false);
                if(res.status === 'success') {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Data berhasil dihapus!', showConfirmButton: false, timer: 1500});
                    tarikLaporanKas(); // Refresh tabel Buku Kas
                    loadBukuKas(); // Refresh jumlah Saldo di atas
                    if(jenis === 'Masuk') loadDataSpp(); // Refresh tabel SPP jika itu pemasukan
                } else {
                    Swal.fire('Gagal', res.message, 'error');
                }
            }).catch(e => {
                showLoading(false);
                Swal.fire('Error', 'Koneksi gagal ke server.', 'error');
            });
        }
    });
}

