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
            
            // Kembalikan ke menu utama saat logout agar tidak tersangkut di menu lain
            showView('home'); 
        }
    });
}

// === Login Logic (Prototype Mode) ===
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading(true);

    // Simulasi loading 1 detik
    setTimeout(() => {
        showLoading(false);
        
        // Sembunyikan Login, Tampilkan Dashboard
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        
        // Pastikan view home yang pertama kali muncul
        showView('home');
        
        Swal.fire({
            icon: 'success',
            title: 'Alhamdulillah',
            text: 'Berhasil masuk ke Dashboard!',
            timer: 1500,
            showConfirmButton: false
        });
    }, 1000);
});