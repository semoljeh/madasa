const GAS_URL = 'https://script.google.com/macros/s/AKfycbyoOXucwPi1Rx4LW6Uiz6N2nTAd_tt2r3QWPp8q6dGFOrmrOPZvNcneKy9_4uZ7MzQN/exec';

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

document.addEventListener("DOMContentLoaded", () => {
    updateWaktuLokal();
    setInterval(updateWaktuLokal, 1000);
    // Muat data master santri di awal untuk dropdown SPP
    ambilMasterSantri();
});

function ambilMasterSantri() {
    const fd = new URLSearchParams(); fd.append('action', 'getSantri');
    fetch(GAS_URL, { method: 'POST', body: fd }).then(r=>r.json()).then(res => {
        if(res.status === 'success') LOKAL_DATA_SANTRI = res.data;
    }).catch(e=>console.log("Gagal muat master santri"));
}

// =========================================================
// LOGIKA CRUD SPP (Read, Tambah, Edit, Hapus)
// =========================================================
function loadDataSpp() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return;

    showLoading(true);
    const fd = new URLSearchParams();
    fd.append('action', 'getSppData'); // Pastikan Endpoint ini disiapkan di GAS
    fd.append('kelas', kelas);

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        const tbody = document.getElementById('bodyTabelSpp');
        tbody.innerHTML = '';

        // Update Dropdown di Modal berdasarkan kelas yang dipilih
        const selectNama = document.getElementById('spp_nis_nama');
        selectNama.innerHTML = '<option value="" disabled selected>-- Pilih Santri --</option>';
        LOKAL_DATA_SANTRI.filter(s => s.kelas === kelas).forEach(s => {
            selectNama.innerHTML += `<option value="${s.nis}">${s.nis} - ${s.nama}</option>`;
        });

        if (res.status === 'success' && res.data.length > 0) {
            res.data.forEach((item, index) => {
                let badgeColor = item.status.includes('LUNAS') && !item.status.includes('BELUM') ? 'bg-emerald-100 text-emerald-700' : 
                                 item.status.includes('BELUM') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';

                tbody.innerHTML += `
                    <tr class="hover:bg-gray-50 transition-all">
                        <td class="p-4 text-center text-gray-500 font-medium">${index + 1}</td>
                        <td class="p-4 font-mono text-gray-500">${item.nis}</td>
                        <td class="p-4 font-bold text-gray-800">${item.nama}</td>
                        <td class="p-4 text-center text-gray-600">${item.keterangan}</td>
                        <td class="p-4 text-center"><span class="px-3 py-1 rounded-md text-xs font-bold ${badgeColor}">${item.status}</span></td>
                        <td class="p-4 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="hapusSpp('${item.nis}', '${item.keterangan}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-gray-400">Belum ada data pembayaran di kelas ini.</td></tr>';
        }
    }).catch(e => {
        showLoading(false);
        Swal.fire('Error', 'Gagal memuat data SPP. Pastikan backend siap.', 'error');
    });
}

function openModalSpp() {
    const kelas = document.getElementById('filterKelasSpp').value;
    if (!kelas) return Swal.fire('Perhatian', 'Pilih kelas terlebih dahulu di bagian atas.', 'warning');
    
    document.getElementById('formInputSpp').reset();
    document.getElementById('modalFormSpp').classList.remove('hidden');
}

function closeModalSpp() {
    document.getElementById('modalFormSpp').classList.add('hidden');
}

document.getElementById('formInputSpp').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 1. Ambil tombol simpan dan simpan teks aslinya
    const btnSubmit = this.querySelector('button[type="submit"]');
    const teksAsli = btnSubmit.innerHTML;

    // 2. Kunci tombol agar tidak bisa diklik dobel (Mencegah Double Submit)
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...';
    btnSubmit.classList.add('opacity-70', 'cursor-not-allowed');

    // 3. Ambil nilai input
    const nis = document.getElementById('spp_nis_nama').value;
    const kelas = document.getElementById('filterKelasSpp').value;
    const namaSantri = LOKAL_DATA_SANTRI.find(s => s.nis.toString() === nis)?.nama || '';
    
    const tgl = document.getElementById('spp_tanggal').value;
    const bln = document.getElementById('spp_bulan').value;
    const thn = document.getElementById('spp_tahun').value;
    const desk = document.getElementById('spp_deskripsi').value.trim();
    const status = document.getElementById('spp_status').value;
    
    // Gabungkan Tanggal, Bulan, Tahun, dan Deskripsi
    let stringKeterangan = `${tgl} ${bln} ${thn}`;
    if (desk !== "") {
        stringKeterangan += ` | ${desk}`; 
    }

    // 4. Tampilkan layar loading penuh
    showLoading(true);

    const fd = new URLSearchParams();
    fd.append('action', 'saveSppData'); 
    fd.append('nis', nis);
    fd.append('nama', namaSantri);
    fd.append('kelas', kelas);
    fd.append('keterangan', stringKeterangan);
    fd.append('status', status);

    fetch(GAS_URL, { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        
        // 5. Kembalikan tombol seperti semula setelah selesai
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = teksAsli;
        btnSubmit.classList.remove('opacity-70', 'cursor-not-allowed');

        if (res.status === 'success') {
            closeModalSpp();
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'Data SPP disimpan!', showConfirmButton:false, timer:2000});
            loadDataSpp(); // Refresh tabel
        } else {
            Swal.fire('Gagal', res.message, 'error');
        }
    }).catch(e => {
        showLoading(false);
        
        // Kembalikan tombol seperti semula jika terjadi error koneksi
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = teksAsli;
        btnSubmit.classList.remove('opacity-70', 'cursor-not-allowed');
        
        Swal.fire('Error', 'Koneksi gagal saat menyimpan SPP.', 'error');
    });
});

function hapusSpp(nis, keterangan) {
    Swal.fire({
        title: 'Hapus Data?', text: "Data pembayaran ini akan dihapus permanen.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280', confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoading(true);
            const fd = new URLSearchParams();
            fd.append('action', 'deleteSppData'); // Endpoint GAS
            fd.append('nis', nis);
            fd.append('keterangan', keterangan);

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