// Pastikan URL ini persis sama dengan GAS_URL yang ada di file script.js Anda!

let JADWAL_MAPEL = {};

function showLoading(show) {
    document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none';
}

function tarikDataDariDatabase() {
    const inputNis = document.getElementById('ortuNis').value.trim();
    const inputTgl = document.getElementById('ortuTglLahir').value;
    const containerHasil = document.getElementById('hasilDataOrtu');

    if (!inputNis || !inputTgl) {
        return Swal.fire('Perhatian', 'Mohon isi Nomor NIS dan pilih Tanggal Lahir terlebih dahulu.', 'warning');
    }

    showLoading(true);

    // Konversi tanggal
    const objekTanggal = new Date(inputTgl);
    const opsiFormat = { day: 'numeric', month: 'long', year: 'numeric' };
    const ejaanTglLahir = objekTanggal.toLocaleDateString('id-ID', opsiFormat).toLowerCase();

    // Siapkan 2 penarik data secara bersamaan (Data Santri & Data Master Mapel)
    const fdSantri = new URLSearchParams(); fdSantri.append('action', 'getSantri');
    const fdMapel = new URLSearchParams(); fdMapel.append('action', 'getAllMapel');

    Promise.all([
        fetch(GAS_URL, { method: 'POST', body: fdSantri }).then(r => r.json()),
        fetch(GAS_URL, { method: 'POST', body: fdMapel }).then(r => r.json())
    ])
    .then(([responseSantri, responseMapel]) => {
        // Simpan data master mapel ke memori
        if (responseMapel.status === 'success') JADWAL_MAPEL = responseMapel.data;
        if (responseSantri.status !== 'success') throw new Error("Gagal mengambil master data.");

        // Cari santri yang cocok
        const santriTerpilih = responseSantri.data.find(s => s.nis.toString() === inputNis && s.ttl.toLowerCase().includes(ejaanTglLahir));

        if (!santriTerpilih) {
            showLoading(false);
            containerHasil.classList.add('hidden');
            return Swal.fire('Data Tidak Cocok', 'Nomor NIS atau Tanggal Lahir santri yang Anda masukkan salah.', 'error');
        }

        // Pasang Identitas
        document.getElementById('ortuNamaSantri').innerText = santriTerpilih.nama;
        document.getElementById('ortuNisSantri').innerText = santriTerpilih.nis;
        document.getElementById('ortuKelasSantri').innerText = santriTerpilih.kelas;
		// Panggil fungsi riwayat SPP
        muatRiwayatSpp(santriTerpilih.nis);

        // Tarik Data Nilai & Pengaturan khusus untuk kelas santri terpilih
     const fdNilai = new URLSearchParams();
     fdNilai.append('action', 'getDataNilai');
     fdNilai.append('kelas', santriTerpilih.kelas);

     const fdPengaturan = new URLSearchParams();
     fdPengaturan.append('action', 'getPengaturan');
     fdPengaturan.append('kelas', santriTerpilih.kelas);

     return Promise.all([
         fetch(GAS_URL, { method: 'POST', body: fdNilai }).then(r => r.json()),
         fetch(GAS_URL, { method: 'POST', body: fdPengaturan }).then(r => r.json())
     ])
     .then(([responseNilai, responsePengaturan]) => {
         showLoading(false);
         if (responseNilai.status !== 'success') {
             return Swal.fire('Informasi', 'Data identitas benar, namun nilai kelas belum di-input guru.', 'info');
         }

         // Cek Status Rilis
         let statusRilis = 'Sembunyi'; // Default disembunyikan
         if (responsePengaturan.status === 'success' && responsePengaturan.umum && responsePengaturan.umum.status_rilis) {
             statusRilis = responsePengaturan.umum.status_rilis;
         }

         // Lanjut ke proses render
         prosesDanTampilkanData(inputNis, santriTerpilih.kelas, responseNilai.headers, responseNilai.data, statusRilis);
     });
		
    })
    .catch(err => {
        showLoading(false);
        Swal.fire('Koneksi Gagal', 'Gagal memuat informasi database dari server cloud.', 'error');
        console.error(err);
    });
}

function prosesDanTampilkanData(nis, kelas, headers, rows, statusRilis) {
    const containerHasil = document.getElementById('hasilDataOrtu');
    const tbodyNilai = document.getElementById('bodyTabelNilaiOrtu');
    tbodyNilai.innerHTML = '';

    // PERBAIKAN: Mencegah error jika Guru belum membuat database nilai sama sekali
    let barisSantri = undefined;
    if (headers && headers.length > 0) {
        const idxNis = headers.findIndex(h => h && h.toString().toUpperCase().includes('NIS'));
        if (idxNis > -1) {
            barisSantri = rows.find(row => row[idxNis] && row[idxNis].toString().replace(/'/g, "").trim() === nis.toString().trim());
        }
    }

    if (!barisSantri) {
        tbodyNilai.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Nilai akademik semester ini belum dirilis guru kelas.</td></tr>';
        document.getElementById('ortuSakit').innerText = '0';
        document.getElementById('ortuIzin').innerText = '0';
        document.getElementById('ortuAlpa').innerText = '0';
        containerHasil.classList.remove('hidden');
        return;
    }

    let dataMap = {};
    headers.forEach((h, i) => { dataMap[h.toLowerCase()] = barisSantri[i]; });

    // SET ABSENSI
    document.getElementById('ortuSakit').innerText = dataMap['sakit'] || '0';
    document.getElementById('ortuIzin').innerText = dataMap['izin'] || '0';
    document.getElementById('ortuAlpa').innerText = dataMap['alpa'] || '0';

    // CEK STATUS RILIS NILAI
    if (statusRilis === 'Sembunyi') {
        tbodyNilai.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500"><i class="fas fa-lock text-4xl mb-3 block text-gray-300"></i>Nilai akademik semester ini belum dirilis oleh madrasah.<br><span class="text-xs">Silakan cek kembali secara berkala.</span></td></tr>';
        containerHasil.classList.remove('hidden');
        return; // Hentikan proses merender angka nilai
    }

  // ==========================================
    // LOGIKA RENDER NILAI DENGAN KATEGORI A B C
    // ==========================================
    let adaNilai = false;
    const dataMapel = JADWAL_MAPEL[kelas] || { tulis: [], praktek: [], baca: [] };

    // Fungsi kecil pembantu untuk merender 1 baris mapel (ditambah parameter nomor)
    function getBarisHTML(mapel, isGrouped, nomor = '') {
        const skor = dataMap[mapel.toLowerCase()] || '-';
        let kategori = '-';

        if (skor !== '-') {
            const numSkor = parseFloat(skor);
            if (numSkor >= 85) kategori = '<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-bold">A</span>';
            else if (numSkor >= 75) kategori = '<span class="bg-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-bold">B</span>';
            else if (numSkor >= 65) kategori = '<span class="bg-orange-100 text-orange-700 px-2.5 py-1 rounded text-xs font-bold">C</span>';
            else kategori = '<span class="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-bold">D</span>';
        }

        let prefix = isGrouped ? `<span class="text-gray-500 mr-2 font-bold inline-block w-4 text-right">${nomor}.</span>` : '';
        let padding = isGrouped ? 'pl-4' : '';

        // Penambahan class 'whitespace-nowrap' pada elemen <td> pertama
        return `
            <tr class="hover:bg-gray-50/80 transition-all">
                <td class="p-3 font-semibold text-gray-700 uppercase text-xs ${padding} whitespace-nowrap">${prefix}${mapel}</td>
                <td class="p-3 text-center font-black text-base ${parseFloat(skor) < 75 ? 'text-red-500' : 'text-emerald-600'}">${skor}</td>
                <td class="p-3 text-center">${kategori}</td>
            </tr>
        `;
    }

    // Cek apakah ini kelas Ibtidaiyah/Sanawiyah yang mapelnya sudah dikategorikan di Pengaturan
    if (!kelas.includes('TK') && (dataMapel.tulis.length > 0 || dataMapel.praktek.length > 0 || dataMapel.baca.length > 0)) {
        
        // KATEGORI A: TERTULIS (Ditambah whitespace-nowrap)
        if (dataMapel.tulis && dataMapel.tulis.length > 0) {
            tbodyNilai.innerHTML += `<tr class="bg-emerald-50/50"><td colspan="3" class="p-2.5 font-bold text-emerald-800 text-xs border-y border-emerald-100 whitespace-nowrap"><i class="fas fa-pen-alt mr-2 text-emerald-600"></i>A. UJIAN TERTULIS</td></tr>`;
            dataMapel.tulis.forEach((m, index) => { tbodyNilai.innerHTML += getBarisHTML(m, true, index + 1); adaNilai = true; });
        }
        
        // KATEGORI B: PRAKTEK (Ditambah whitespace-nowrap)
        if (dataMapel.praktek && dataMapel.praktek.length > 0) {
            tbodyNilai.innerHTML += `<tr class="bg-blue-50/50"><td colspan="3" class="p-2.5 font-bold text-blue-800 text-xs border-y border-blue-100 whitespace-nowrap"><i class="fas fa-praying-hands mr-2 text-blue-600"></i>B. UJIAN PRAKTEK</td></tr>`;
            dataMapel.praktek.forEach((m, index) => { tbodyNilai.innerHTML += getBarisHTML(m, true, index + 1); adaNilai = true; });
        }
        
        // KATEGORI C: MEMBACA (Ditambah whitespace-nowrap)
        if (dataMapel.baca && dataMapel.baca.length > 0) {
            tbodyNilai.innerHTML += `<tr class="bg-purple-50/50"><td colspan="3" class="p-2.5 font-bold text-purple-800 text-xs border-y border-purple-100 whitespace-nowrap"><i class="fas fa-book-open mr-2 text-purple-600"></i>C. UJIAN MEMBACA</td></tr>`;
            dataMapel.baca.forEach((m, index) => { tbodyNilai.innerHTML += getBarisHTML(m, true, index + 1); adaNilai = true; });
        }

    } else {
        // Mode Polos (Untuk TK)
        const filterKolomBukanMapel = ['nis', 'nama lengkap', 'nama', 'kelas', 'hari', 'sakit', 'izin', 'alpa', 'status_spp', 'spp', 'total', 'total nilai', 'rata-rata', 'rata', 'ranking', 'rank'];
        let noUrutTK = 1;
        headers.forEach((header) => {
            if (!filterKolomBukanMapel.includes(header.toLowerCase())) {
                tbodyNilai.innerHTML += getBarisHTML(header, true, noUrutTK++);
                adaNilai = true;
            }
        });
    }

    if (!adaNilai) {
        tbodyNilai.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Belum ada komponen mapel terinput.</td></tr>';
    }

    containerHasil.classList.remove('hidden');
}
// ==========================================
// FUNGSI TARIK DATA RIWAYAT SPP KHUSUS ORTU
// ==========================================
function muatRiwayatSpp(nisSantri) {
    const wadah = document.getElementById('wadahSppOrtu');
    wadah.innerHTML = '<div class="text-center text-xs text-gray-400 py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Memuat data...</div>';
    
    const fd = new URLSearchParams();
    fd.append('action', 'getSppSantri'); // Endpoint yang dibuat di APPSSCRIPT.txt
    fd.append('nis', nisSantri);

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        wadah.innerHTML = ''; 
        
        if (res.status === 'success' && res.data.length > 0) {
            res.data.forEach(item => {
                let warnaTeks = item.status.includes('LUNAS') ? 'text-emerald-600' : 
                                item.status.includes('BELUM') ? 'text-red-500' : 'text-amber-500';
                let warnaBg = item.status.includes('LUNAS') ? 'bg-emerald-50' : 
                              item.status.includes('BELUM') ? 'bg-red-50' : 'bg-amber-50';

                wadah.innerHTML += `
                    <div class="flex justify-between items-center p-2 rounded-lg border border-gray-50 text-xs ${warnaBg} mb-2">
                        <span class="font-medium text-gray-700">${item.keterangan}</span>
                        <span class="font-bold ${warnaTeks}">${item.status}</span>
                    </div>
                `;
            });
        } else {
            wadah.innerHTML = `<div class="text-center text-xs text-gray-400 py-4">Belum ada riwayat pembayaran yang tercatat.</div>`;
        }
    }).catch(e => {
        wadah.innerHTML = `<div class="text-center text-xs text-red-400 py-4">Gagal terhubung ke database.</div>`;
    });
}

// =========================================================
// PWA (PROGRESSIVE WEB APP) KHUSUS PORTAL WALI SANTRI
// =========================================================
let deferredPromptOrtu;
const installPromptOrtu = document.getElementById('pwaInstallPromptOrtu');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Menggunakan ../sw.js karena file sw.js ada di luar folder 'informasi'
        navigator.serviceWorker.register('../sw.js')
        .then(reg => console.log('PWA Portal Ortu aktif!'))
        .catch(err => console.log('PWA Portal Ortu gagal: ', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPromptOrtu = e;
    if (installPromptOrtu) { 
        // Munculkan notifikasi install setelah 1.5 detik
        setTimeout(() => { 
            installPromptOrtu.classList.remove('translate-x-[150%]', 'opacity-0'); 
            installPromptOrtu.classList.add('translate-x-0', 'opacity-100'); 
        }, 1500); 
    }
});

function tutupNotifPWAOrtu() { 
    if(installPromptOrtu) { 
        installPromptOrtu.classList.remove('translate-x-0', 'opacity-100'); 
        installPromptOrtu.classList.add('translate-x-[150%]', 'opacity-0'); 
    } 
}

function installPWAOrtu() {
    if (deferredPromptOrtu) {
        deferredPromptOrtu.prompt();
        deferredPromptOrtu.userChoice.then((choiceResult) => { 
            if (choiceResult.outcome === 'accepted') { tutupNotifPWAOrtu(); } 
            deferredPromptOrtu = null; 
        });
    }
}

window.addEventListener('appinstalled', (evt) => { 
    tutupNotifPWAOrtu(); 
});