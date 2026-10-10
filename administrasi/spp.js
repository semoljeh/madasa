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
async function initSpp() {
    updateWaktuLokal();
    if (!window.intervalWaktu) window.intervalWaktu = setInterval(updateWaktuLokal, 1000);

    showLoading(true, "Menyiapkan Data Aplikasi...");

    try {
        await Promise.all([
            ambilMasterSantri(),
            ambilSettingSpp(),
            loadBukuKas()
        ]);
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        console.error("Kesalahan inisialisasi:", error);
        
        Swal.fire({
            title: 'Gagal Memuat Data',
            text: error.message || 'Terjadi kesalahan saat menghubungi server.',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-sync"></i> Muat Ulang',
            cancelButtonText: 'Tutup',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload(); 
            }
        });
    }
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
    
    return gasFetch( { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        if(res.status === 'success') {
            LOKAL_DATA_SANTRI = res.data;
            buatDropdownKelasOtomatis();
            if (document.getElementById('filterKelasSpp').value) loadDataSpp();
        } else {
            throw new Error(res.message || "Data santri gagal dimuat. Cek format data di server.");
        }
    }).catch(e => {
        console.error("Gagal muat master santri:", e);
        throw e; 
    });
}


// =========================================================
// LOGIKA CUSTOM SELECT
// =========================================================
function buatDropdownKelasOtomatis() {
    const listEl = document.getElementById('customSelectList');
    const hiddenInput = document.getElementById('filterKelasSpp');
    const displayEl = document.getElementById('customSelectText');
    if (!listEl) return;

    const pilihanSaatIni = hiddenInput.value;

    const kelasUnik = [...new Set(LOKAL_DATA_SANTRI.map(s => s.kelas))]
        .filter(k => k && k.trim() !== '' && !k.toLowerCase().includes('lulus') && !k.toLowerCase().includes('alumni') && !k.toLowerCase().includes('diberhentikan'))
        .sort();

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

    let htmlList = `<li class="custom-option-item text-gray-400 text-center !pl-3" onclick="pilihKelasCustom('', '-- Pilih Kelas --')">-- Reset Pilihan --</li>`;
    
    kategoriUrut.forEach(kategori => {
        htmlList += `<li class="custom-option-group"><i class="fas fa-layer-group mr-2 opacity-50"></i>${kategori}</li>`;
        kelompokKelas[kategori].forEach(kelas => {
            let safeKelas = kelas.replace(/'/g, "\\'"); 
            htmlList += `<li class="custom-option-item" onclick="pilihKelasCustom('${safeKelas}', '${safeKelas}')">${kelas}</li>`;
        });
    });

    listEl.innerHTML = htmlList;

    if (pilihanSaatIni) displayEl.innerText = pilihanSaatIni;
}

document.addEventListener("DOMContentLoaded", () => {
    const displayBox = document.getElementById('customSelectDisplay');
    if (displayBox) {
        displayBox.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleCustomSelect();
        });
    }

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
    icon.classList.toggle('rotate-180'); 
}

function pilihKelasCustom(nilai, teks) {
    document.getElementById('filterKelasSpp').value = nilai; 
    document.getElementById('customSelectText').innerText = teks; 
    toggleCustomSelect(); 
    loadDataSpp(); 
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
    return parseFloat(stringInput.toString().replace(/[^0-9]/g, '')) || 0; 
}

document.addEventListener("DOMContentLoaded", () => {
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
    
    return gasFetch( { method: 'POST', body: fd })
    .then(r=>r.json())
    .then(res => {
        if(res.status === 'success') {
            TARIF_SPP_BULAN = parseFloat(res.nominal) || 0;
            JUMLAH_BULAN_SPP = parseFloat(res.bulan) || 0;
            TOTAL_TAGIHAN_SETAHUN = TARIF_SPP_BULAN * JUMLAH_BULAN_SPP;
            
            document.getElementById('input_tarif_spp').value = TARIF_SPP_BULAN > 0 ? new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN) : "";
            document.getElementById('input_bulan_spp').value = JUMLAH_BULAN_SPP > 0 ? JUMLAH_BULAN_SPP : "";
            document.getElementById('info_spp_total').innerText = formatRp(TOTAL_TAGIHAN_SETAHUN);
        } else {
            throw new Error("Gagal load pengaturan");
        }
    }).catch(e => {
        console.log("Gagal muat setting", e);
        throw e; 
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
    
    gasFetch( { method: 'POST', body: fd })
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

    gasFetch( { method: 'POST', body: fd })
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
            let htmlTabel = ''; 

            santriDitemukan.forEach((santri) => {
                let historiSpp = HISTORI_GLOBAL.filter(d => d.nis == santri.nis);
                let totalTerbayar = 0;
                historiSpp.forEach(item => { totalTerbayar += parseFloat(item.nominal) || 0; });
                let sisaTunggakan = Math.max(0, TOTAL_TAGIHAN_SETAHUN - totalTerbayar);
                
                let warnaSisa = sisaTunggakan === 0 ? 'text-emerald-600' : 'text-red-500';
                let teksSisa = sisaTunggakan === 0 ? '<i class="fas fa-check-circle"></i> LUNAS' : formatRp(sisaTunggakan);
                let warnaTombolWa = santri.hp ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed';

                htmlTabel += `
                    <tr class="hover:bg-gray-50 transition-all border-b border-gray-50">
                        <td class="p-4 text-center text-gray-500 font-medium">${nomor++}</td>
                        <td class="p-4 font-mono text-gray-500">${santri.nis}</td>
                        <td class="p-4 font-bold text-gray-800">${santri.nama}</td>
                        <td class="p-4 text-center text-gray-600 font-semibold">${formatRp(TOTAL_TAGIHAN_SETAHUN)}</td>
                        <td class="p-4 text-center font-bold text-blue-600">${formatRp(totalTerbayar)}</td>
                        <td class="p-4 text-center font-bold ${warnaSisa}">${teksSisa}</td>
                        <td class="p-4 text-center">
                            <div class="flex items-center justify-center gap-2 relative z-20">
                                <button type="button" onclick="kirimWaTagihan('${santri.nis}')" title="WA" class="w-9 h-9 flex items-center justify-center rounded-xl ${warnaTombolWa} shadow-sm transition-all"><i class="fab fa-whatsapp"></i></button>
                                <button type="button" onclick="bukaRiwayatSpp('${santri.nis}')" title="Riwayat" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm transition-all"><i class="fas fa-list"></i></button>
                                <button type="button" onclick="openModalSpp('${santri.nis}')" title="Bayar SPP" class="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm transition-all"><i class="fas fa-plus"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = htmlTabel; 
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

    const jumlahBulanDipilih = document.querySelectorAll('.cek-bulan:checked:not(:disabled)').length;
    const inputNominal = document.getElementById('spp_nominal');

    if (jumlahBulanDipilih > 0) {
        inputNominal.value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN * jumlahBulanDipilih);
    } else {
        inputNominal.value = "0"; 
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
// SISTEM MODAL CERDAS (ANTI-MACET / FORCE REPAINT)
// =========================================================
window.tutupSemuaModal = function() {
    const modals = ['modalFormSpp', 'modalRiwayatSpp', 'modalPengeluaran', 'modalLaporanKas'];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.style.display = ''; // Bersihkan style agar Tailwind bekerja normal
        }
    });
};

function paksaTampilModal(idModal, hashUrl) {
    // Memaksa browser menyelesaikan render UI terlebih dahulu sebelum membuka modal
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const modal = document.getElementById(idModal);
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex'; // Paksa tampil
            }
            if (window.location.hash !== hashUrl) {
                window.history.pushState({ modal: idModal }, "", hashUrl);
            }
        });
    });
}

function openModalSpp(targetNis = null) {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Pilih kelas terlebih dahulu.', 'warning');

    tutupSemuaModal();

    document.getElementById('formInputSpp').reset();
    document.getElementById('spp_nominal').value = new Intl.NumberFormat('id-ID').format(TARIF_SPP_BULAN);
    document.querySelectorAll('.cek-bulan').forEach(cb => cb.checked = false);
    
    let hDay = "01", hYear = "1448"; 
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: '2-digit', year: 'numeric' });
        const parts = formatter.formatToParts(new Date());
        parts.forEach(p => { 
            if (p.type === 'day') hDay = p.value.padStart(2, '0');
            if (p.type === 'year') hYear = p.value; 
        });
    } catch(e) {}
    
    const selTgl = document.getElementById('spp_tanggal');
    if (selTgl) selTgl.value = hDay;
    document.getElementById('spp_tahun').value = hYear;

    toggleBintangPelajar(); 
    
    if (targetNis && targetNis !== 'tambah') {
        document.getElementById('spp_nis_nama').value = targetNis;
        cekBulanTerbayar(); 
    } else {
        document.getElementById('spp_nis_nama').value = ""; 
        document.getElementById('spp_nis_nama').selectedIndex = 0; 
        cekBulanTerbayar(); 
    }
    
    paksaTampilModal('modalFormSpp', '#formSpp');
}

window.bukaRiwayatSpp = function(nis) {
    try {
        tutupSemuaModal(); 

        let santri = LOKAL_DATA_SANTRI.find(s => s.nis == nis);
        let namaAman = santri ? santri.nama : 'Santri';

        document.getElementById('riwayat_nama_santri').innerText = `${nis} - ${namaAman}`;
        const tbody = document.getElementById('bodyRiwayatSpp');
        
        let historiAnak = (Array.isArray(HISTORI_GLOBAL) ? HISTORI_GLOBAL : []).filter(d => d.nis == nis);
        
        if(historiAnak.length > 0) {
            let htmlRiwayat = '';
            historiAnak.forEach((item, idx) => {
                let warnaBadge = item.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
                let ketAman = item.keterangan ? item.keterangan.toString().replace(/'/g, "\\'").replace(/"/g, "&quot;") : '-';
                
                htmlRiwayat += `
                    <tr>
                        <td class="p-3 text-center text-gray-500">${idx+1}</td>
                        <td class="p-3 font-semibold text-gray-700">${item.keterangan}</td>
                        <td class="p-3 text-right font-bold text-blue-600">${formatRp(item.nominal)}</td>
                        <td class="p-3 text-center"><span class="px-2 py-1 rounded text-xs font-bold ${warnaBadge}">${item.status}</span></td>
                        <td class="p-3 text-center">
                            <button type="button" onclick="hapusSpp('${item.nis}', '${ketAman}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = htmlRiwayat; 
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="p-5 text-center text-gray-400 italic">Belum ada riwayat transaksi.</td></tr>';
        }
        
        paksaTampilModal('modalRiwayatSpp', '#riwayatSpp');
        
    } catch (error) {
        console.error("Sistem gagal memuat riwayat:", error);
        Swal.fire('Error Tampilan', 'Gagal memproses data riwayat.', 'error');
    }
};

function closeRiwayatSpp() { 
    const el = document.getElementById('modalRiwayatSpp');
    if(el) {
        el.classList.add('hidden'); 
        el.style.display = 'none'; 
    }
    if (window.location.hash === "#riwayatSpp") {
        window.history.replaceState(null, null, ' '); 
    }
}

function closeModalSpp() { 
    const el = document.getElementById('modalFormSpp');
    if(el) {
        el.classList.add('hidden'); 
        el.style.display = 'none'; 
    }
    if (window.location.hash === "#formSpp") {
        window.history.replaceState(null, null, ' '); 
    }
}

// =========================================================
// PROSES SIMPAN SPP 
// =========================================================
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
      const arrayBulanDiceklis = Array.from(document.querySelectorAll('.cek-bulan:checked:not(:disabled)')).map(cb => cb.value);
        
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

    gasFetch( { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
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
// PROSES HAPUS SPP 
// =========================================================
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

            gasFetch( { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
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
// SISTEM BUKU KAS & PENGELUARAN 
// =========================================================
function loadBukuKas() {
    const fd = new URLSearchParams();
    fd.append('action', 'getBukuKas');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));

    return gasFetch( { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        if(res.status === 'success') {
            SALDO_SAAT_INI = res.saldo; 
            document.getElementById('kas_pemasukan').innerText = formatRp(res.masuk);
            document.getElementById('kas_pengeluaran').innerText = formatRp(res.keluar);
            document.getElementById('kas_saldo').innerText = formatRp(res.saldo);
        } else {
            throw new Error("Gagal load buku kas");
        }
    }).catch(e => {
        console.log("Gagal memuat buku kas", e);
        throw e; 
    });
}

// =========================================================
// MODAL PENGELUARAN
// =========================================================
function openModalPengeluaran() {
    document.getElementById('formPengeluaran').reset();
    
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
    
    const selTgl = document.getElementById('out_tgl');
    if (selTgl) selTgl.value = hDay;
    
    const selBln = document.getElementById('out_bln');
    if (selBln) selBln.value = namaBulanHijriyah[hMonthIdx];

    const inThn = document.getElementById('out_thn');
    if (inThn) inThn.value = hYear;
    
    paksaTampilModal('modalPengeluaran', '#pengeluaran');
}

function closeModalPengeluaran() {
    const el = document.getElementById('modalPengeluaran');
    if(el) {
        el.classList.add('hidden'); 
        el.style.display = 'none'; 
    }
    if (window.location.hash === "#pengeluaran") {
        window.history.replaceState(null, null, ' '); 
    }
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

    const tgl = document.getElementById('out_tgl').value;
    const bln = document.getElementById('out_bln').value;
    const thn = document.getElementById('out_thn').value;
    const tanggalGabungan = `${tgl} ${bln} ${thn}`; 

    const keterangan = document.getElementById('out_keterangan').value;
    
    showLoading(true, "Mencatat Pengeluaran...");

    const fd = new URLSearchParams();
    fd.append('action', 'addPengeluaran');
    fd.append('token', sessionStorage.getItem('tokenMadasa'));
    fd.append('tanggal', tanggalGabungan); 
    fd.append('keterangan', keterangan);
    fd.append('nominal', nominalKeluar);
    fd.append('user', sessionStorage.getItem('namaMadasa') || 'Admin');

    gasFetch( { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
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
// MODAL LAPORAN BUKU KAS
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

    gasFetch( { method: 'POST', body: fd })
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
                
                let rincianAman = item.rincian ? item.rincian.toString().replace(/'/g, "\\'").replace(/"/g, "&quot;") : '-';
                
                let tombolAksi = `
                    <div class="flex items-center justify-center">
                        <button onclick="hapusKas('${rincianAman}', '${item.jenis}')" title="Hapus" class="w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                tbody.innerHTML += `
                    <tr class="hover:bg-gray-50 transition-all border-b border-gray-50">
                        <td class="p-3 text-center text-gray-500">${nomor++}</td>
                        <td class="p-3 font-semibold text-gray-700 text-xs sm:text-sm whitespace-normal min-w-[200px]">${item.rincian}</td>
                        <td class="p-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold ${warnaJenis}">${item.jenis}</span></td>
                        <td class="p-3 text-right font-bold text-emerald-600">${strMasuk}</td>
                        <td class="p-3 text-right font-bold text-red-500">${strKeluar}</td>
                        <td class="p-3 text-center">${tombolAksi}</td>
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
    paksaTampilModal('modalLaporanKas', '#laporanKas');
    if (document.getElementById('bodyLaporanKas').innerText.includes('Silakan klik tombol cari')) {
        tarikLaporanKas();
    }
}

function closeModalLaporanKas() {
    const el = document.getElementById('modalLaporanKas');
    if(el) {
        el.classList.add('hidden'); 
        el.style.display = 'none'; 
    }
    if (window.location.hash === "#laporanKas") {
        window.history.replaceState(null, null, ' '); 
    }
}

// =========================================================
// SINKRONISASI TOMBOL KEMBALI (BACK) PADA HP (POPSTATE)
// =========================================================
window.addEventListener('popstate', function(event) {
    if (typeof Swal !== 'undefined' && Swal.isVisible()) {
        Swal.close();
        return; 
    }

    const modals = ['modalFormSpp', 'modalRiwayatSpp', 'modalPengeluaran', 'modalLaporanKas'];
    let isModalClosed = false;

    modals.forEach(modalId => {
        const modalEl = document.getElementById(modalId);
        if (modalEl && !modalEl.classList.contains('hidden')) {
            modalEl.classList.add('hidden');
            modalEl.style.display = 'none';
            isModalClosed = true;
        }
    });

    if (isModalClosed) return;
});

// =========================================================
// LOGIKA HAPUS DARI BUKU KAS & WA
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

            gasFetch( { method: 'POST', body: fd })
            .then(r => r.json())
            .then(res => {
                showLoading(false);
                if(res.status === 'success') {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Data berhasil dihapus!', showConfirmButton: false, timer: 1500});
                    tarikLaporanKas(); 
                    loadBukuKas(); 
                    if(jenis === 'Masuk') loadDataSpp(); 
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

// =========================================================
// LOGIKA KIRIM NOTIFIKASI WA (DIPERBARUI DENGAN RINCIAN ALOKASI & TITIPAN)
// =========================================================
function kirimWaTagihan(nis) {
    let santri = LOKAL_DATA_SANTRI.find(s => s.nis == nis);
    if (!santri) {
        return Swal.fire('Error', 'Data santri tidak ditemukan.', 'error');
    }

    let noHpAsli = santri.hp ? santri.hp.toString().replace(/[^0-9]/g, '') : '';
    if (!noHpAsli) {
        return Swal.fire('Ups', 'Nomor HP Wali Santri tidak tersedia di database.', 'info');
    }
    if (noHpAsli.startsWith('0')) {
        noHpAsli = '62' + noHpAsli.substring(1);
    }
    
    let historiAnak = HISTORI_GLOBAL.filter(d => d.nis == nis);
    let totalTerbayar = 0;
    let totalDialokasikan = 0;
    
    const urutanBulanSyahriah = [
        "Syawal", "Dzulqa'dah", "Dzulhijjah", "Muharram", "Safar", 
        "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", 
        "Rajab", "Sya'ban", "Ramadhan"
    ];

    let semuaBulanDibayar = [];
    let namaBulanTerbayar = [];

    // --- PROSES PEMUCAHAN NOMINAL TRANSAKSI PER BULAN ---
    historiAnak.forEach(item => {
        let nominal = parseFloat(item.nominal) || 0;
        totalTerbayar += nominal;
        
        let ket = item.keterangan.toString().trim();
        let parts = ket.split(' ');
        let tgl = parts[0]; 
        let thn = parts[parts.length - 1];
        
        if (ket.toLowerCase().includes('bintang pelajar')) {
            semuaBulanDibayar.push({ teksCetak: `${ket} (LUNAS 1 TAHUN) ✅`, indexBulan: -1 });
            namaBulanTerbayar = [...urutanBulanSyahriah]; 
            totalDialokasikan += nominal;
        } 
        else if (!isNaN(tgl) && !isNaN(thn) && parts.length >= 3) {
            let bulanString = ket.substring(tgl.length, ket.length - thn.length).trim();
            let listBulan = bulanString.split(',').map(b => b.trim());
            
            let sisaNominalTransaksi = nominal;

            listBulan.forEach(bulan => {
                let idxBln = urutanBulanSyahriah.indexOf(bulan);
                let nominalAlokasi = 0;
                
                // Alokasikan uang pas sebesar TARIF SPP, sisanya lanjut ke bulan berikutnya
                if (sisaNominalTransaksi >= TARIF_SPP_BULAN) {
                    nominalAlokasi = TARIF_SPP_BULAN;
                    sisaNominalTransaksi -= TARIF_SPP_BULAN;
                } else if (sisaNominalTransaksi > 0) {
                    nominalAlokasi = sisaNominalTransaksi;
                    sisaNominalTransaksi = 0;
                }
                
                totalDialokasikan += nominalAlokasi;
                let teksLunas = nominalAlokasi >= TARIF_SPP_BULAN ? '( ✅ Lunas )' : '( ⏳ Angsur )';
                
                if (idxBln !== -1) {
                    semuaBulanDibayar.push({ 
                        teksCetak: `Bulan ${bulan} : ${formatRp(nominalAlokasi)} ${teksLunas}`, 
                        indexBulan: idxBln 
                    });
                    namaBulanTerbayar.push(bulan);
                } else {
                    semuaBulanDibayar.push({ 
                        teksCetak: `${bulan} : ${formatRp(nominalAlokasi)}`, 
                        indexBulan: 99 
                    });
                }
            });
        } 
        else {
            let idxBlnTunggal = urutanBulanSyahriah.indexOf(ket);
            if (idxBlnTunggal !== -1) {
                namaBulanTerbayar.push(ket);
                let nominalAlokasi = nominal >= TARIF_SPP_BULAN ? TARIF_SPP_BULAN : nominal;
                let teksLunas = nominalAlokasi >= TARIF_SPP_BULAN ? '( ✅ Lunas )' : '( ⏳ Angsur )';
                totalDialokasikan += nominalAlokasi;
                semuaBulanDibayar.push({ teksCetak: `Bulan ${ket} : ${formatRp(nominalAlokasi)} ${teksLunas}`, indexBulan: idxBlnTunggal });
            } else {
                totalDialokasikan += nominal;
                semuaBulanDibayar.push({ teksCetak: `${ket} : ${formatRp(nominal)}`, indexBulan: 99 });
            }
        }
    });

    semuaBulanDibayar.sort((a, b) => a.indexBulan - b.indexBulan);
    
    let teksRincian = "";
    if (semuaBulanDibayar.length > 0) {
        teksRincian = "\n\n*Rincian Alokasi Bulan:*";
        semuaBulanDibayar.forEach((item, index) => {
            teksRincian += `\n${index + 1}. ${item.teksCetak}`;
        });
    } else {
        teksRincian = "\n\n*Rincian Alokasi Bulan:*\n_Belum ada data pembayaran yang tercatat._";
    }

    const sisaTotalSatuTahun = Math.max(0, TOTAL_TAGIHAN_SETAHUN - totalTerbayar);
    const batasSetahun = JUMLAH_BULAN_SPP > 12 ? 12 : JUMLAH_BULAN_SPP;

    // --- DETEKSI SALDO TITIPAN (SISA PECAHAN) ---
    let saldoTitipan = Math.max(0, totalTerbayar - totalDialokasikan);
    let teksTitipan = "";
    if (saldoTitipan > 0) {
        teksTitipan = `\n🔸 Saldo Titipan (Akumulasi bln berikutnya): *${formatRp(saldoTitipan)}*`;
    }
    
    // Rangkum daftar nama bulan unik yang sudah disentuh
    let uniqueBulanTerbayar = [...new Set(namaBulanTerbayar)];
    let stringDaftarBulan = uniqueBulanTerbayar.length > 0 ? uniqueBulanTerbayar.join(", ") : "Belum ada";

    let currentHijriMonth = 1; 
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { month: 'numeric' });
        const parts = formatter.formatToParts(new Date());
        parts.forEach(p => { 
            if (p.type === 'month') currentHijriMonth = parseInt(p.value, 10);
        });
    } catch(e) {}
    
    const BULAN_AWAL_AJARAN = 10; 
    let bulanBerjalan = ((currentHijriMonth - BULAN_AWAL_AJARAN + 12) % 12) + 1;
    if (bulanBerjalan > batasSetahun) bulanBerjalan = batasSetahun;

    let tagihanIdealSampaiBulanIni = bulanBerjalan * TARIF_SPP_BULAN;
    let tunggakanSaatIni = Math.max(0, tagihanIdealSampaiBulanIni - totalTerbayar);

    let arrayBulanNunggak = [];
    if (tunggakanSaatIni > 0) {
        for (let i = 0; i < bulanBerjalan; i++) {
            let namaBln = urutanBulanSyahriah[i];
            if (!namaBulanTerbayar.includes(namaBln)) {
                arrayBulanNunggak.push(namaBln);
            }
        }
    }
    
    let teksBulanNunggak = "";
    if (tunggakanSaatIni <= 0) {
        teksBulanNunggak = "Tidak ada (Lancar s.d bulan ini)";
    } else if (arrayBulanNunggak.length === 1) {
        teksBulanNunggak = arrayBulanNunggak[0]; 
    } else if (arrayBulanNunggak.length > 1) {
        teksBulanNunggak = arrayBulanNunggak.join(", "); 
    } else {
        teksBulanNunggak = "Terdapat kurang bayar / angsuran tertunda";
    }

    const namaSantri = santri.nama.trim();
    let teksPesan = "";

    if (sisaTotalSatuTahun <= 0) {
        let teksKelebihanLunas = saldoTitipan > 0 ? `\n\n_(Catatan: Terdapat kelebihan pembayaran / saldo mengendap sebesar *${formatRp(saldoTitipan)}*)_` : '';
        
        teksPesan = `Assalamu'alaikum Wr. Wb.

Bapak/Ibu Wali Santri *Madrasah Darussalam*,

Alhamdulillah, administrasi Syahriah (Bulanan) ananda *${namaSantri}* untuk tahun ajaran ini telah *LUNAS SEPENUHNYA*.${teksKelebihanLunas}
${teksRincian}

_Jazakumullah khairan_ atas kelancaran Bapak/Ibu. Semoga berkah.
Wassalamu'alaikum Wr. Wb.
_~ Sistem Administrasi Madasa ~_`;

    } else if (tunggakanSaatIni <= 0) {
        teksPesan = `Assalamu'alaikum Wr. Wb.

Bapak/Ibu Wali Santri *Madrasah Darussalam*,

Terima kasih, administrasi Syahriah (Bulanan) ananda *${namaSantri}* s.d bulan berjalan ini telah tertunaikan dengan lancar.

*Ringkasan Administrasi:*
🔸 Ketetapan 1 Tahun: *${formatRp(TOTAL_TAGIHAN_SETAHUN)}*
🔸 Telah Ditunaikan: *${formatRp(totalTerbayar)}*
🔸 Sisa Menuju Lunas: *${formatRp(sisaTotalSatuTahun)}*${teksTitipan}
🔸 Daftar Bulan Disetor: _${stringDaftarBulan}_
${teksRincian}

_Jazakumullah khairan_ atas kedisiplinan Bapak/Ibu. Semoga berkah.
Wassalamu'alaikum Wr. Wb.
_~ Sistem Administrasi Madasa ~_`;

    } else {
        teksPesan = `Assalamu'alaikum Wr. Wb.

Bapak/Ibu Wali Santri *Madrasah Darussalam*,

Mohon izin menginformasikan tagihan administrasi Syahriah (Bulanan) ananda *${namaSantri}* s.d bulan berjalan:

*Fokus Tagihan S.d Bulan Ini:*
🔸 Total Menunggak: *${formatRp(tunggakanSaatIni)}*
🔸 Bulan Menunggak: _${teksBulanNunggak}_

*(Informasi Total 1 Tahun)*
🔸 Ketetapan 1 Tahun: *${formatRp(TOTAL_TAGIHAN_SETAHUN)}*
🔸 Telah Ditunaikan: *${formatRp(totalTerbayar)}*
🔸 Sisa Menuju Lunas: *${formatRp(sisaTotalSatuTahun)}*${teksTitipan}
🔸 Daftar Bulan Disetor: _${stringDaftarBulan}_
${teksRincian}

Abaikan jika baru saja menyelesaikan administrasi. Terima kasih.
Wassalamu'alaikum Wr. Wb.
_~ Sistem Administrasi Madasa ~_`;
    }
    
    let linkWa = `https://wa.me/${noHpAsli}?text=${encodeURIComponent(teksPesan)}`;
    window.open(linkWa, '_blank');
}

// =========================================================
// FUNGSI CETAK KARTU SPP 
// =========================================================
function cetakKartuSppKelas() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Silakan pilih kelas terlebih dahulu pada filter di atas tabel untuk mencetak kartu.', 'warning');

    let kelasBersih = kelas.toString().trim().toLowerCase();
    let kelasAlternatif = kelasBersih.includes('-') ? kelasBersih.split('-')[1].trim() : kelasBersih;

    let santriDitemukan = LOKAL_DATA_SANTRI.filter(s => {
        let kelasDB = s.kelas ? s.kelas.toString().trim().toLowerCase() : '';
        return kelasDB === kelasBersih || kelasDB === kelasAlternatif;
    });

    if (santriDitemukan.length === 0) {
        return Swal.fire('Kosong', 'Tidak ada data santri di kelas ini.', 'error');
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/administrasi\/spp\.html$/i, '');
    const logoUrl = baseUrl + 'asset/logo.png';
    const fontArabUrl = baseUrl + 'asset/ReemKufi-VariableFont_wght.ttf'; 
    
    const namaBulan = [
        "Syawal", "Dzulqa'dah", "Dzulhijjah", "Muharram", "Safar", 
        "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", 
        "Rajab", "Sya'ban"
    ];

    let htmlKartu = '';
    
    for (let i = 0; i < santriDitemukan.length; i += 4) {
        let chunk = santriDitemukan.slice(i, i + 4);
        htmlKartu += `<div class="page">`;
        
        chunk.forEach(santri => {
            let barisTabel = '';
            namaBulan.forEach((bln, idx) => {
                barisTabel += `
                    <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td>${bln}</td>
                        <td></td>
                        <td></td>
                    </tr>
                `;
            });

            htmlKartu += `
                <div class="kartu">
                    <!-- KOP KARTU -->
                    <div class="header-kartu">
                        <img src="${logoUrl}" onerror="this.style.display='none'">
                        <div class="header-teks">
                            <h2 class="judul-arab" dir="rtl">مدرسة دينية دار السلام</h2>
                            <h3>KARTU SYAHRIYAH SANTRI</h3>
                            <p>Website : www.madasa.ponpes.id | E-mail : madasaponpes@gmail.com</p>
                        </div>
                    </div>
                    <!-- INFO SANTRI -->
                    <table class="info-santri">
                        <tr><td width="50px">Nama</td><td width="10px">:</td><td><strong>${santri.nama}</strong></td></tr>
                        <tr><td>NIS</td><td>:</td><td>${santri.nis}</td></tr>
                        <tr><td>Kelas</td><td>:</td><td>${santri.kelas}</td></tr>
                    </table>
                    <table class="tabel-spp">
                        <thead>
                            <tr>
                                <th width="10%">No</th>
                                <th width="35%">Bulan</th>
                                <th width="25%">Tanggal</th>
                                <th width="30%">Paraf/Stempel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${barisTabel}
                        </tbody>
                    </table>
                    <p class="footer-kartu">*Harap dibawa setiap kali melakukan pembayaran Syahriyah</p>
                </div>
            `;
        });
        
        htmlKartu += `</div>`;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire('Pop-up Diblokir', 'Izinkan pop-up browser untuk mencetak kartu.', 'error');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <title>Cetak Kartu Syahriyah - Kelas ${kelas}</title>
            <style>
                @font-face {
                    font-family: 'ReemKufi';
                    src: url('${fontArabUrl}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }

                @page { 
                    size: 215mm 330mm portrait; 
                    margin: 10mm; 
                } 
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background: #fff; 
                    color: #000;
                }
                
                .page {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-content: flex-start;
                    height: 310mm; 
                    page-break-after: always;
                    box-sizing: border-box;
                }
                
                .kartu {
                    width: 49%; 
                    height: 152mm; 
                    border: 2px dashed #000; 
                    box-sizing: border-box;
                    padding: 10px 12px;
                    margin-bottom: 5mm;
                    display: flex;
                    flex-direction: column;
                    page-break-inside: avoid;
                }

                .header-kartu { 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border-bottom: 2px solid #000; 
                    padding-bottom: 6px; 
                    margin-bottom: 8px; 
                }
                .header-kartu img { 
                    width: 45px; 
                    height: 45px; 
                    margin-right: 12px; 
                }
                .header-teks { 
                    flex: 1; 
                    text-align: center; 
                }
                .judul-arab { 
                    font-family: 'ReemKufi', sans-serif; 
                    font-size: 20px; 
                    margin: 0 0 2px 0; 
                    font-weight: normal; 
                }
                .header-teks h3 { 
                    margin: 0 0 3px 0; 
                    font-size: 13px; 
                    text-transform: uppercase; 
                    font-weight: bold; 
                }
                .header-teks p { 
                    margin: 0; 
                    font-size: 8px; 
                    font-weight: bold;
                }
                
                .info-santri { width: 100%; font-size: 12px; margin-bottom: 8px; }
                .info-santri td { padding: 2px 0; vertical-align: top; }
                
                .tabel-spp { 
                    width: 100%; 
                    border-collapse: collapse; 
                    font-size: 11px; 
                    flex-grow: 1; 
                }
                .tabel-spp th, .tabel-spp td { 
                    border: 1px solid #000; 
                    padding: 4px; 
                    vertical-align: middle;
                }
                .tabel-spp th { 
                    background-color: #f3f4f6 !important; 
                    font-weight: bold; 
                    text-align: center;
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                .tabel-spp td:nth-child(2) { font-weight: bold; }
                
                .footer-kartu {
                    font-size: 10px; 
                    text-align: center; 
                    margin-top: auto; 
                    padding-top: 8px;
                    font-style: italic; 
                    color: #555;
                }
            </style>
        </head>
        <body>
            ${htmlKartu}
            <script> 
                window.onload = function() { setTimeout(function() { window.print(); }, 1500); }; 
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function cekBulanTerbayar() {
    const nis = document.getElementById('spp_nis_nama').value;
    if (!nis) return;

    const checkboxes = document.querySelectorAll('.cek-bulan');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false; 
        cb.closest('label').classList.remove('bg-gray-100', 'opacity-50', 'cursor-not-allowed');
        cb.closest('label').classList.add('bg-white', 'cursor-pointer');
    });

    let historiAnak = HISTORI_GLOBAL.filter(d => d.nis == nis);
    let namaBulanTerbayar = [];
    const urutanBulanSyahriah = ["Syawal", "Dzulqa'dah", "Dzulhijjah", "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan"];

    historiAnak.forEach(item => {
        let ket = item.keterangan.toString().trim();
        if (ket.toLowerCase().includes('bintang pelajar')) {
            namaBulanTerbayar = [...urutanBulanSyahriah]; 
        } else {
            let parts = ket.split(' ');
            if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[parts.length - 1])) {
                let thn = parts[parts.length - 1];
                let tgl = parts[0];
                let bulanString = ket.substring(tgl.length, ket.length - thn.length).trim();
                let listBulan = bulanString.split(',').map(b => b.trim());
                listBulan.forEach(bulan => {
                    if (urutanBulanSyahriah.includes(bulan)) namaBulanTerbayar.push(bulan);
                });
            } else {
                if (urutanBulanSyahriah.includes(ket)) namaBulanTerbayar.push(ket);
            }
        }
    });

    checkboxes.forEach(cb => {
        if (namaBulanTerbayar.includes(cb.value)) {
            cb.checked = true;
            cb.disabled = true; 
            cb.closest('label').classList.remove('bg-white', 'cursor-pointer');
            cb.closest('label').classList.add('bg-gray-100', 'opacity-50', 'cursor-not-allowed');
        }
    });

    kalkulasiOtomatisBulan();
}

// =========================================================
// FUNGSI CETAK LAPORAN REKAP PER KELAS (F4 / 210x330mm PORTRAIT)
// =========================================================
function cetakLaporanKelas() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Silakan pilih kelas terlebih dahulu pada filter di atas tabel untuk mencetak laporan.', 'warning');

    let kelasBersih = kelas.toString().trim().toLowerCase();
    let kelasAlternatif = kelasBersih.includes('-') ? kelasBersih.split('-')[1].trim() : kelasBersih;

    let santriDitemukan = LOKAL_DATA_SANTRI.filter(s => {
        let kelasDB = s.kelas ? s.kelas.toString().trim().toLowerCase() : '';
        return kelasDB === kelasBersih || kelasDB === kelasAlternatif;
    });

    if (santriDitemukan.length === 0) {
        return Swal.fire('Kosong', 'Tidak ada data santri di kelas ini.', 'error');
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/administrasi\/spp\.html$/i, '');
    const logoUrl = baseUrl + 'asset/logo.png';
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let htmlTabel = '';
    let nomor = 1;
    
    // Variabel untuk menampung total keseluruhan di bagian bawah tabel
    let grandTotalTagihan = 0;
    let grandTotalDibayar = 0;
    let grandTotalTunggakan = 0;

    // Hitung data per santri
    santriDitemukan.forEach(santri => {
        let historiSpp = HISTORI_GLOBAL.filter(d => d.nis == santri.nis);
        let totalTerbayar = 0;
        
        historiSpp.forEach(item => { totalTerbayar += parseFloat(item.nominal) || 0; });
        let sisaTunggakan = Math.max(0, TOTAL_TAGIHAN_SETAHUN - totalTerbayar);
        
        // Penentuan Status
        let statusHtml = sisaTunggakan === 0 ? '<span style="color: #059669;">LUNAS</span>' : '<span style="color: #dc2626;">BELUM LUNAS</span>';

        grandTotalTagihan += TOTAL_TAGIHAN_SETAHUN;
        grandTotalDibayar += totalTerbayar;
        grandTotalTunggakan += sisaTunggakan;

        htmlTabel += `
            <tr>
                <td style="text-align: center;">${nomor++}</td>
                <td style="text-align: center; font-family: monospace;">${santri.nis}</td>
                <td><strong>${santri.nama}</strong></td>
                <td style="text-align: right;">${formatRp(TOTAL_TAGIHAN_SETAHUN)}</td>
                <td style="text-align: right; color: #059669; font-weight: bold;">${formatRp(totalTerbayar)}</td>
                <td style="text-align: right; color: ${sisaTunggakan > 0 ? '#dc2626' : '#333'};">${formatRp(sisaTunggakan)}</td>
                <td style="text-align: center; font-weight: bold; font-size: 10px;">${statusHtml}</td>
            </tr>
        `;
    });

    // --- KALKULASI PERSENTASE KEPATUHAN ---
    let persentaseBayar = 0;
    if (grandTotalTagihan > 0) {
        persentaseBayar = (grandTotalDibayar / grandTotalTagihan) * 100;
    }
    
    // Hilangkan angka nol desimal di belakang koma yang tidak perlu
    let teksPersen = parseFloat(persentaseBayar.toFixed(2)) + "%";
    
    // Penentuan warna otomatis berdasarkan progres
    let warnaPersen = persentaseBayar >= 100 ? '#059669' : (persentaseBayar >= 50 ? '#d97706' : '#dc2626');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire('Pop-up Diblokir', 'Izinkan pop-up browser untuk mencetak laporan.', 'error');

    // Injeksi HTML dan CSS untuk Cetak (Ukuran presisi 210 x 330 mm)
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <title>Laporan_SPP_Kelas_${kelas}</title>
            <style>
                /* MENGUBAH UKURAN KERTAS MENJADI 210x330 mm (F4) */
                @page { size: 210mm 330mm portrait; margin: 15mm; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
                
                /* KOP SURAT */
                .kop-surat { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .kop-surat img { width: 65px; height: 65px; margin-right: 15px; }
                .kop-surat .teks { flex: 1; text-align: center; padding-right: 80px; }
                .kop-surat h2 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: bold; color: #000; letter-spacing: 1px; }
                .kop-surat p { margin: 5px 0 0 0; font-size: 12px; }
                
                /* JUDUL LAPORAN */
                .judul-laporan { text-align: center; margin-bottom: 20px; }
                .judul-laporan h3 { margin: 0; font-size: 15px; text-transform: uppercase; text-decoration: underline; }
                .judul-laporan p { margin: 5px 0 0 0; font-size: 11px; font-weight: bold; }

                /* TABEL UTAMA */
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                th, td { border: 1px solid #444; padding: 6px 8px; vertical-align: middle; }
                th { background-color: #f3f4f6 !important; font-weight: bold; text-align: center; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                /* STRIPING WARNA BARIS */
                tbody tr:nth-child(even) { background-color: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                /* FOOTER TABEL (REKAP) */
                tfoot th { background-color: #e5e7eb !important; font-weight: bold; text-align: right; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                /* AREA TANDA TANGAN */
                .signature-area { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 200px; }
                .signature-box p { margin: 0 0 5px 0; font-size: 12px; }
                .signature-box .name { margin-top: 70px; font-weight: bold; text-decoration: underline; font-size: 12px; }
                
                /* CATATAN KAKI */
                .footer { text-align: center; font-size: 9px; font-style: italic; color: #777; margin-top: 30px; border-top: 1px dashed #aaa; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="kop-surat">
                <img src="${logoUrl}" onerror="this.style.display='none'">
                <div class="teks">
                    <h2>Madrasah Darussalam</h2>
                    <p>Sistem Informasi Administrasi & Keuangan Santri</p>
                </div>
            </div>
            
            <div class="judul-laporan">
                <h3>Rekapitulasi Pembayaran SPP / Syahriyah</h3>
                <p>Kelas: ${kelas.toUpperCase()} | Periode Filter: Keseluruhan</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">NIS</th>
                        <th width="30%">Nama Santri</th>
                        <th width="15%">Tagihan 1 Thn</th>
                        <th width="15%">Telah Dibayar</th>
                        <th width="13%">Tunggakan</th>
                        <th width="10%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${htmlTabel}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="3">TOTAL AKUMULASI KELAS INI :</th>
                        <th style="text-align: right;">${formatRp(grandTotalTagihan)}</th>
                        <th style="text-align: right; color: #059669;">${formatRp(grandTotalDibayar)}</th>
                        <th style="text-align: right; color: #dc2626;">${formatRp(grandTotalTunggakan)}</th>
                        <th style="text-align: center; color: ${warnaPersen}; font-size: 14px;">${teksPersen}</th>
                    </tr>
                </tfoot>
            </table>
            
            <div class="signature-area">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p><strong>Kepala Madrasah</strong></p>
                    <div class="name">( ...................................... )</div>
                </div>
                <div class="signature-box">
                    <p>Bangkalan, ${tanggalCetak.split(',')[1]}</p>
                    <p><strong>Bendahara Madrasah</strong></p>
                    <div class="name">( ...................................... )</div>
                </div>
            </div>

            <div class="footer">Dicetak otomatis dari Sistem Administrasi Madasa | Dokumen Sah | Tanggal Cetak: ${tanggalCetak}</div>
            
            <script> 
                window.onload = function() { 
                    setTimeout(function() { window.print(); }, 1500); 
                }; 
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}



// =========================================================
// FUNGSI CETAK KENDALI BULANAN (MANUAL GURU + SAMPUL, 11 BULAN, F4 LANDSCAPE)
// =========================================================
function cetakLaporanBulananKelas() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Silakan pilih kelas terlebih dahulu pada filter di atas tabel.', 'warning');

    let kelasBersih = kelas.toString().trim().toLowerCase();
    let kelasAlternatif = kelasBersih.includes('-') ? kelasBersih.split('-')[1].trim() : kelasBersih;

    let santriDitemukan = LOKAL_DATA_SANTRI.filter(s => {
        let kelasDB = s.kelas ? s.kelas.toString().trim().toLowerCase() : '';
        return kelasDB === kelasBersih || kelasDB === kelasAlternatif;
    });

    if (santriDitemukan.length === 0) {
        return Swal.fire('Kosong', 'Tidak ada data santri di kelas ini.', 'error');
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/administrasi\/spp\.html$/i, '');
    const logoUrl = baseUrl + 'asset/logo.png';
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Daftar 11 Bulan Syahriah lengkap (Ramadhan Dihapus)
    const urutanBulan = ["Syawal", "Dzulqa'dah", "Dzulhijjah", "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban"];

    let htmlTabel = '';
    let nomor = 1;

    // Membuat baris tabel santri
    santriDitemukan.forEach(santri => {
        let cellBulanHTML = '';
        urutanBulan.forEach(() => {
            cellBulanHTML += `<td></td>`;
        });

        htmlTabel += `
            <tr>
                <td style="text-align: center;">${nomor++}</td>
                <td style="text-align: center; font-family: monospace;">${santri.nis}</td>
                <td style="font-weight: bold; text-transform: uppercase;">${santri.nama}</td>
                ${cellBulanHTML}
                <td></td> <!-- Kolom kosong untuk Paraf Wali -->
            </tr>
        `;
    });

    // Menghapus pengaturan width persentase agar kolom otomatis mengikuti teks
    let headerBulanHTML = urutanBulan.map(b => `<th style="font-size: 10px;">${b}</th>`).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire('Pop-up Diblokir', 'Izinkan pop-up browser untuk mencetak laporan.', 'error');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <title>Buku_Kendali_Kelas_${kelas}</title>
            <style>
                /* PENGATURAN KERTAS F4 LANDSCAPE */
                @page { size: 330mm 210mm landscape; margin: 10mm 15mm; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; background: #fff; }
                
                /* ==================== DESAIN SAMPUL ==================== */
                .cover-page {
                    width: 100%;
                    height: 175mm; 
                    padding: 5mm; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    page-break-after: always; 
                    box-sizing: border-box;
                }
                .cover-border {
                    width: 100%;
                    height: 100%;
                    border: 5px double #222; 
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    border-radius: 8px;
                    box-sizing: border-box; 
                }
                .cover-logo { width: 130px; height: 130px; margin-top: 10px; }
                .cover-title { font-size: 32px; font-weight: bold; margin: 15px 0 5px 0; letter-spacing: 2px; text-transform: uppercase; }
                .cover-subtitle { font-size: 22px; margin: 0; font-weight: normal; letter-spacing: 1px; color: #444; }
                
                .cover-details { 
                    width: 65%; 
                    margin: 20px auto; 
                    border: 2px solid #444; 
                    padding: 15px 30px; 
                    border-radius: 12px;
                    background-color: #fafafa !important;
                    -webkit-print-color-adjust: exact;
                }
                .detail-box { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 18px; font-weight: bold; }
                .detail-box:last-child { margin-bottom: 0; }
                .detail-label { text-align: left; width: 40%; }
                .detail-colon { width: 5%; text-align: center; }
                .detail-value { text-align: left; width: 55%; border-bottom: 1px dashed #777; }
                .detail-value.filled { border-bottom: none; font-size: 20px; color: #000; text-transform: uppercase; }

                .cover-footer { margin-bottom: 5px; font-size: 12px; font-weight: bold; color: #333; }
                .cover-footer p { margin: 3px 0; }

                /* ==================== DESAIN HALAMAN ISI (TABEL) ==================== */
                .kop-surat { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .kop-surat img { width: 60px; height: 60px; margin-right: 15px; }
                .kop-surat .teks { flex: 1; text-align: center; padding-right: 75px; }
                .kop-surat h2 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: bold; color: #000; }
                .kop-surat p { margin: 5px 0 0 0; font-size: 12px; }
                
                .judul-laporan { text-align: center; margin-bottom: 15px; }
                .judul-laporan h3 { margin: 0; font-size: 15px; text-transform: uppercase; text-decoration: underline; }
                .judul-laporan p { margin: 5px 0 0 0; font-size: 12px; font-weight: bold; }

                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                th, td { border: 1px solid #444; padding: 6px 8px; vertical-align: middle; }
                
                /* MENGUNCI HEADER AGAR TEKS TIDAK TURUN KE BAWAH (NO WRAP) */
                th { 
                    background-color: #f3f4f6 !important; 
                    font-weight: bold; 
                    text-align: center; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                    line-height: 1.2;
                    white-space: nowrap; /* Ini yang membuat teks menjadi 1 baris */
                }
                
                /* Pengecualian khusus untuk kolom Nama Santri agar tetap bisa fleksibel jika terlalu panjang */
                th.col-nama { white-space: normal; width: auto; }
                th.col-kecil { width: 1%; } /* Membuat kolom No & NIS setipis mungkin */
                
                tbody tr { height: 35px; }
                tbody tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                .signature-area { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 50px; page-break-inside: avoid; }
                .signature-box { text-align: center; width: 220px; }
                .signature-box p { margin: 0 0 5px 0; font-size: 12px; }
                .signature-box .name { margin-top: 60px; font-weight: bold; text-decoration: underline; font-size: 12px; }
                
                .footer { text-align: center; font-size: 9px; font-style: italic; color: #777; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
            </style>
        </head>
        <body>
            <!-- HALAMAN 1: SAMPUL DEPAN -->
            <div class="cover-page">
                <div class="cover-border">
                    <img src="${logoUrl}" class="cover-logo" onerror="this.style.display='none'">
                    <div>
                        <h1 class="cover-title">BUKU KENDALI ADMINISTRASI<br>SYAHRIYAH SANTRI</h1>
                        <h2 class="cover-subtitle">MADRASAH DARUSSALAM</h2>
                    </div>
                    
                    <div class="cover-details">
                        <div class="detail-box">
                            <div class="detail-label">KELAS</div>
                            <div class="detail-colon">:</div>
                            <div class="detail-value filled">${kelas}</div>
                        </div>
                        <div class="detail-box">
                            <div class="detail-label">WALI KELAS</div>
                            <div class="detail-colon">:</div>
                            <div class="detail-value"></div> 
                        </div>
                        <div class="detail-box">
                            <div class="detail-label">TAHUN AJARAN</div>
                            <div class="detail-colon">:</div>
                            <div class="detail-value"></div> 
                        </div>
                    </div>

                    <div class="cover-footer">
                        <p>Sistem Informasi Administrasi & Keuangan Madrasah</p>
                        <p>Website: www.madasa.ponpes.id | Email: madasaponpes@gmail.com</p>
                    </div>
                </div>
            </div>

            <!-- HALAMAN 2 DST: ISI TABEL DATA -->
            <div class="kop-surat">
                <img src="${logoUrl}" onerror="this.style.display='none'">
                <div class="teks">
                    <h2>Madrasah Darussalam</h2>
                    <p>Sistem Informasi Administrasi & Keuangan Santri</p>
                </div>
            </div>
            
            <div class="judul-laporan">
                <h3>Lembar Kendali Syahriyah Bulanan (Manual)</h3>
                <p>Kelas: ${kelas.toUpperCase()} | Lembar Pengisian Wali Kelas</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th class="col-kecil">NO</th>
                        <th class="col-kecil">NIS</th>
                        <th class="col-nama">NAMA SANTRI</th>
                        ${headerBulanHTML}
                        <th>PARAF WALI</th>
                    </tr>
                </thead>
                <tbody>
                    ${htmlTabel}
                </tbody>
            </table>
            
            <div class="signature-area">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p><strong>Kepala Madrasah</strong></p>
                    <div class="name">( ...................................... )</div>
                </div>
                <div class="signature-box">
                    <p>Memeriksa,</p>
                    <p><strong>Wali Kelas</strong></p>
                    <div class="name">( ...................................... )</div>
                </div>
                <div class="signature-box">
                    <p>Bangkalan, ${tanggalCetak.split(',')[1]}</p>
                    <p><strong>Bendahara Madrasah</strong></p>
                    <div class="name">( ...................................... )</div>
                </div>
            </div>

            <div class="footer">Dicetak dari Sistem Administrasi Madasa | Tanggal Cetak: ${tanggalCetak} | Format Dokumen Kosong</div>
            
            <script> 
                window.onload = function() { 
                    setTimeout(function() { window.print(); }, 1500); 
                }; 
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}