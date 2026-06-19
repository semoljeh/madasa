// === UI Toggles ===
function togglePassword() {
    const pwd = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        pwd.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function showLoading(show) {
    document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none';
}

function showView(viewName) {
    // 1. Sembunyikan semua konten view
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
    });
    
    // 2. Tampilkan view yang dipilih
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // 3. Update style tombol navigasi aktif di Sidebar Desktop
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('bg-emerald-700', 'text-white', 'font-medium');
        link.classList.add('text-emerald-100', 'hover:bg-emerald-700/50');
        
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${viewName}'`)) {
            link.classList.add('bg-emerald-700', 'text-white', 'font-medium');
            link.classList.remove('text-emerald-100', 'hover:bg-emerald-700/50');
        }
    });
}




// === Logika Filter & Pencarian Data Santri ===
        function filterSantri() {
            const searchText = document.getElementById('searchSantri').value.toLowerCase();
            const selectedKelas = document.getElementById('filterKelasSantri').value;
            const rows = document.querySelectorAll('.santri-row');
            
            let visibleCount = 0; // Untuk menghitung data yang tampil

            rows.forEach(row => {
                // Ambil text dari kolom Nama (index 1) dan NIS (index 0)
                const nama = row.cells[1].innerText.toLowerCase();
                const nis = row.cells[0].innerText.toLowerCase();
                // Ambil asal kelas dari attribute HTML 'data-kelas'
                const kelas = row.getAttribute('data-kelas');

                // Cek apakah data cocok dengan pencarian dan filter
                const matchSearch = nama.includes(searchText) || nis.includes(searchText);
                const matchKelas = selectedKelas === 'Semua' || kelas === selectedKelas;

                if (matchSearch && matchKelas) {
                    row.style.display = ''; // Tampilkan baris
                    visibleCount++;
                } else {
                    row.style.display = 'none'; // Sembunyikan baris
                }
            });

            // Tampilkan pesan kosong jika tidak ada data yang cocok
            const tabelContainer = document.getElementById('tabelSantri').parentElement;
            const noDataPesan = document.getElementById('noDataPesan');
            
            if (visibleCount === 0) {
                tabelContainer.classList.add('hidden');
                noDataPesan.classList.remove('hidden');
            } else {
                tabelContainer.classList.remove('hidden');
                noDataPesan.classList.add('hidden');
            }
        }

function logout() {
    Swal.fire({
        title: 'Keluar?',
        text: "Anda akan kembali ke halaman login",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('dashboardPage').classList.add('hidden');
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            
            showView('home'); // Reset ke halaman utama
        }
    });
}

// === Login Logic (Sistem Hak Akses / RBAC) ===
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Ambil data yang diketik pengguna
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    let role = '';
    let name = '';

    // LOGIKA PENGECEKAN HAK AKSES
    if (user === 'admin' && pass === 'admin') {
        role = 'Administrator';
        name = 'Ustadz Admin Utama';
    } else if (user === 'guru' && pass === 'guru') {
        role = 'Guru Kelas';
        name = 'Ustadz Ahmad Fauzi';
    } else {
        // Jika username/password salah
        Swal.fire({
            icon: 'error',
            title: 'Gagal Masuk',
            text: 'Username atau Password salah! (Gunakan admin/admin atau guru/guru)',
            confirmButtonColor: '#059669'
        });
        return; // Hentikan fungsi sampai di sini
    }

    showLoading(true);

    // Simulasi loading database
    setTimeout(() => {
        showLoading(false);
        
        // Update Nama dan Role di Header
        document.getElementById('userNameDisplay').innerText = name;
        document.getElementById('userRoleDisplay').innerText = role;

        // Atur Elemen yang Boleh Dilihat Admin Saja
        const adminElements = document.querySelectorAll('.admin-only');
        if (role === 'Guru Kelas') {
            // Sembunyikan elemen admin-only jika yang login adalah guru
            adminElements.forEach(el => el.style.display = 'none');
        } else {
            // Tampilkan kembali elemen admin-only jika yang login adalah admin
            adminElements.forEach(el => el.style.display = ''); 
        }

        // Pindah layar
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        showView('home');
        
        // Notifikasi Berhasil
        Swal.fire({
            icon: 'success',
            title: 'Alhamdulillah',
            text: `Selamat datang, ${name}!`,
            timer: 1500,
            showConfirmButton: false
        });
    }, 1000);
});