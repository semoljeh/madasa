// KEAMANAN

document.addEventListener("DOMContentLoaded", () => {
    // Cek apakah ada token yang tersimpan di memori browser
    const tokenTersimpan = sessionStorage.getItem('tokenMadasa');
    
    if (!tokenTersimpan) {
        // Tendang kembali ke halaman login
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
    }
});


// ---------------------------------------------------------
// 1. PENGATURAN GLOBAL, KEAMANAN & ONBOARDING
// ---------------------------------------------------------

let GLOBAL_DATA_SANTRI = [];
let GLOBAL_HEADERS_NILAI = [];
let GLOBAL_DATA_NILAI = [];
let JADWAL_MAPEL = {}; 

document.addEventListener("DOMContentLoaded", () => {
    const sudahOnboarding = localStorage.getItem('madasaOnboardingDone');
    const tokenTersimpan = sessionStorage.getItem('tokenMadasa');
    
    // ✨ PANGGIL VARIABEL DARI SESSION STORAGE
    const namaTersimpan = sessionStorage.getItem('namaMadasa');
    const roleTersimpan = sessionStorage.getItem('roleMadasa');

    const pageOnboarding = document.getElementById('onboardingPage');
    const pageLogin = document.getElementById('loginPage');
    const pageDashboard = document.getElementById('dashboardPage');

    if (!sudahOnboarding) {
        // Tampilkan Welcome Screen, biarkan loginPage tetap hidden
        if (pageOnboarding) pageOnboarding.classList.remove('hidden');
        pageLogin.classList.add('hidden');
        pageDashboard.classList.add('hidden');
    } else {
        // Jika sudah onboarding, baru boleh tampilkan login/dashboard
        if (pageOnboarding) pageOnboarding.classList.add('hidden');
        
        // Hapus style hidden agar loginPage muncul
        pageLogin.style.visibility = 'visible'; 
        
        if (!tokenTersimpan) {
            pageLogin.classList.remove('hidden');
            pageDashboard.classList.add('hidden');
        } else {
            pageLogin.classList.add('hidden');
            pageDashboard.classList.remove('hidden');
			
         // ✨ TAMBAHKAN LOGIKA INI UNTUK MENCEGAH BUG REFRESH
if (namaTersimpan && roleTersimpan) {
    document.getElementById('userNameDisplay').innerText = namaTersimpan;
    document.getElementById('userRoleDisplay').innerText = roleTersimpan;

    const adminElements = document.querySelectorAll('.admin-only');
    if (roleTersimpan === 'Guru Kelas' || roleTersimpan === 'Guru') {
        adminElements.forEach(el => el.style.display = 'none');
    } else {
        adminElements.forEach(el => el.style.display = '');
    }
    
    // SUNTIKAN KODE BARU DI SINI:
    showView('home', false); 
    
    // 👇 TAMBAHKAN BARIS INI 👇
    muatSemuaMapel(); 
}
        }
    }
});

function selesaikanOnboarding() {
    const pageOnboarding = document.getElementById('onboardingPage');
    const pageLogin = document.getElementById('loginPage');

    localStorage.setItem('madasaOnboardingDone', 'true');

    // Memicu Notifikasi
    if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(function(OneSignal) {
            OneSignal.Slidedown.promptPush();
        });
    }

    // Transisi
    pageOnboarding.classList.add('opacity-0');
    
    // Tampilkan Login secara bersih
    pageLogin.style.visibility = 'visible'; 
    pageLogin.classList.remove('hidden');
    pageLogin.classList.add('animasi-masuk');

    setTimeout(() => {
        pageOnboarding.classList.add('hidden');
    }, 500);
}


function formatTanggalIndo(tanggalYYYYMMDD) {
    if (!tanggalYYYYMMDD) return "";
    const dateObj = new Date(tanggalYYYYMMDD);
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Fungsi baru untuk menarik mapel dari database saat aplikasi dibuka
function muatSemuaMapel() {
    const fdMapel = new URLSearchParams();
    fdMapel.append('action', 'getAllMapel');
    // --- KODE KEAMANAN 3: LAMPIRKAN TOKEN ---
    fdMapel.append('token', sessionStorage.getItem('tokenMadasa'));
    // ----------------------------------------
    fetch(GAS_URL, { method: 'POST', body: fdMapel })
        .then(r => r.json())
        .then(res => { if (res.status === 'success') JADWAL_MAPEL = res.data; })
        .catch(e => console.log("Gagal memuat Master Mapel"));
}

// ---------------------------------------------------------
// 2. FUNGSI UI (TAMPILAN) UTAMA
// ---------------------------------------------------------
function togglePassword() { const pwd = document.getElementById('password'); const icon = document.getElementById('eyeIcon'); if (pwd.type === 'password') { pwd.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); } else { pwd.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); } }
function showLoading(show) { document.getElementById('loadingScreen').style.display = show ? 'flex' : 'none'; }

function showView(viewName, pushToHistory = true) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.remove('hidden');
    
    // Logika Muat Data sesuai Menu
    if (viewName === 'dataSantri' || viewName === 'inputNilai' || viewName === 'pengaturan' || viewName === 'mutasi') { loadDataSantri(); }
    if (viewName === 'ranking') { loadBintangPelajar(); }
    
    // Panggil motivasi acak setiap kali pindah menu
    gantiMotivasiAcak(); 
	
	// --- TAMBAHKAN BARIS INI UNTUK QUOTES ATAS ---
    if (viewName === 'home') { jalankanBannerOtomatis(); }
    // ---------------------------------------------
    
    // Efek Aktif Sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('bg-emerald-700', 'text-white', 'font-medium'); link.classList.add('text-emerald-100', 'hover:bg-emerald-700/50');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${viewName}'`)) {
            link.classList.add('bg-emerald-700', 'text-white', 'font-medium'); link.classList.remove('text-emerald-100', 'hover:bg-emerald-700/50');
        }
    });
   // (Kode Anda yang sudah ada sebelumnya)
    if (pushToHistory) window.history.pushState({ view: viewName }, "", "#" + viewName);
    
    // ---> TAMBAHKAN KODE INI UNTUK AUTO-CLOSE DI HP <---
    if (window.innerWidth < 768) {
        const sidebar = document.querySelector('aside');
        const overlay = document.getElementById('overlay-sidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0', 'w-64', 'z-[60]', 'shadow-2xl');
            if (overlay) overlay.remove();
        }
    }
} // <- Ini kurung penutup fungsi showView()

// --- PERBAIKAN LOGIKA TOMBOL BACK HP ---
window.addEventListener('popstate', function(event) {
    // 1. TUTUP PROFIL DEVELOPER (SWEETALERT)
    if (typeof Swal !== 'undefined' && Swal.isVisible()) {
        Swal.close();
        return; 
    }

    // 2. TUTUP MENU NAVIGASI HP (SIDEBAR)
    const sidebar = document.querySelector('aside');
    if (sidebar && !sidebar.classList.contains('hidden') && window.innerWidth < 768) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0', 'w-64', 'z-[60]', 'shadow-2xl');
        const overlay = document.getElementById('overlay-sidebar');
        if (overlay) overlay.remove();
        return;
    }

    // 3. TUTUP SEMUA MODAL & FORM DINAMIS
    const modalTambah = document.getElementById('modalTambahSantri');
    const modalEdit = document.getElementById('modalEditSantri');
    const modalImport = document.getElementById('modalImportSantri');
    const modalEditNilai = document.getElementById('modalEditNilai');
    
    let isModalClosed = false;

    if (modalTambah && !modalTambah.classList.contains('hidden')) { modalTambah.classList.add('hidden'); isModalClosed = true; }
    if (modalEdit && !modalEdit.classList.contains('hidden')) { modalEdit.classList.add('hidden'); isModalClosed = true; }
    if (modalImport && !modalImport.classList.contains('hidden')) { modalImport.classList.add('hidden'); isModalClosed = true; }
    if (modalEditNilai && !modalEditNilai.classList.contains('hidden')) { modalEditNilai.classList.add('hidden'); isModalClosed = true; }
    
    if (isModalClosed) return;

    // 4. NAVIGASI MUNDUR KE HALAMAN UTAMA (HOME)
    const isDashboard = !document.getElementById('dashboardPage').classList.contains('hidden');
    if (isDashboard) {
        if (event.state && event.state.view) {
            showView(event.state.view, false);
        } else {
            showView('home', false);
        }
    }
});
// ---------------------------------------

// ---------------------------------------------------------
// 3. FUNGSI AUTENTIKASI (LOGIN & LOGOUT)
// ---------------------------------------------------------

// --- KODE KEAMANAN 1: AUTO-KICK ---
document.addEventListener("DOMContentLoaded", () => {
    const tokenTersimpan = sessionStorage.getItem('tokenMadasa');
    if (!tokenTersimpan) {
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) { 
    e.preventDefault(); showLoading(true); 
    const formData = new URLSearchParams(); 
    formData.append('action', 'login'); 
    formData.append('username', document.getElementById('username').value); 
    formData.append('password', document.getElementById('password').value); 
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(r => r.json()).then(d => { 
        showLoading(false); 
        if (d.status === 'success') { 
            
            // --- KODE KEAMANAN 2: SIMPAN TOKEN ---
            sessionStorage.setItem('tokenMadasa', d.token);
            // -------------------------------------
			
			// ✨ TAMBAHKAN 2 BARIS INI:
    sessionStorage.setItem('namaMadasa', d.name);
    sessionStorage.setItem('roleMadasa', d.role);
    // ========================

            document.getElementById('userNameDisplay').innerText = d.name; 
            document.getElementById('userRoleDisplay').innerText = d.role; 
            const adminElements = document.querySelectorAll('.admin-only'); 
            
            if (d.role === 'Guru Kelas' || d.role === 'Guru') { 
                adminElements.forEach(el => el.style.display = 'none'); 
            } else { 
                adminElements.forEach(el => el.style.display = ''); 
            } 
            
            document.getElementById('loginPage').classList.add('hidden'); 
            document.getElementById('dashboardPage').classList.remove('hidden'); 
			
			// TAMBAHKAN PEMICU DI SINI:
    if (typeof tampilkanWidgetWA === 'function') {
        tampilkanWidgetWA();
    }
			
            window.history.replaceState({ view: 'home' }, "", "#home");
            showView('home', false); 
            muatSemuaMapel();
			
			// --- TAMBAHKAN KODE INI UNTUK MEMUNCULKAN INSTALL PWA ---
    if (typeof tampilkanPromptPWA === 'function') {
        tampilkanPromptPWA();
    }

            // === FITUR LACAK GPS ===
            let mentahanPerangkat = navigator.userAgent;
            let namaPerangkatRapi = mentahanPerangkat;
            if (/Android/i.test(mentahanPerangkat)) {
                let match = mentahanPerangkat.match(/Android\s[0-9\.]+(?:;\s([^;]+))?/);
                let modelPabrik = match && match[1] ? match[1].split(')')[0] : "Tidak Diketahui";
                namaPerangkatRapi = "📱 HP Android (Model: " + modelPabrik + ")";
            } else if (/iPhone/i.test(mentahanPerangkat)) { namaPerangkatRapi = "📱 Apple iPhone";
            } else if (/iPad/i.test(mentahanPerangkat)) { namaPerangkatRapi = "📱 Apple iPad";
            } else if (/Windows NT/i.test(mentahanPerangkat)) { namaPerangkatRapi = "💻 Laptop/PC (Windows)";
            } else if (/Mac/i.test(mentahanPerangkat)) { namaPerangkatRapi = "💻 MacBook/iMac (Mac OS)";
            }

           const kirimDataKeServer = (dataLokasi) => {
                const notifData = new URLSearchParams();
                notifData.append('action', 'notifLogin');
                notifData.append('nama', d.name);  
                notifData.append('role', d.role);  
                notifData.append('perangkat', namaPerangkatRapi); 
                notifData.append('lokasi', dataLokasi);
                notifData.append('token', d.token); // <--- WAJIB TAMBAHKAN BARIS INI
                
                fetch(GAS_URL, { method: 'POST', body: notifData }).catch(err => console.log(err));
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
                        kirimDataKeServer(`http://googleusercontent.com/maps.google.com/${lat},${lon}`);
                    },
                    (err) => { kirimDataKeServer("Akses GPS Ditolak (" + err.message + ")"); },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                kirimDataKeServer("Perangkat tidak mendukung GPS");
            }
            // =======================

        } else { 
            Swal.fire('Gagal Masuk', d.message, 'error'); 
        } 

}).catch(er => { 
        showLoading(false); 
        
        // Menampilkan error asli di Console Browser
        console.error("Detail Error Sistem:", er); 
        
        // Memunculkan pesan yang lebih akurat
        Swal.fire('Terjadi Kesalahan Script', 'Silakan tekan F12 dan buka tab Console untuk melihat detailnya.', 'error'); 
    }); 
}); // Penutup event listener login form

function logout() {

    Swal.fire({ 
        title: 'Keluar?', text: "Anda akan kembali ke halaman login", icon: 'question', 
        showCancelButton: true, confirmButtonColor: '#059669', cancelButtonColor: '#d33', confirmButtonText: 'Ya, Keluar' 
    }).then((result) => { 
        if (result.isConfirmed) { 
            // --- KODE KEAMANAN 4: HAPUS TOKEN ---
            sessionStorage.removeItem('tokenMadasa');
            // ------------------------------------
			
			// ✨ TAMBAHKAN PENGHAPUSAN NAMA DAN ROLE
            sessionStorage.removeItem('namaMadasa');
            sessionStorage.removeItem('roleMadasa');
            // =====================================
            
            document.getElementById('dashboardPage').classList.add('hidden'); 
            document.getElementById('loginPage').classList.remove('hidden'); 
            document.getElementById('loginForm').reset(); 
            window.history.replaceState(null, "", window.location.pathname); 
        } 
    }); 
}

// ---------------------------------------------------------
// 4. KATA MOTIVASI ACAK (33 QUOTES)
// ---------------------------------------------------------
const dataMotivasi = [
    { judul: "Amal Jariyah Tanpa Batas", teks: "\"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya. Lelahmu dalam mendidik hari ini adalah benih amal jariyah yang pahalanya mengalir abadi.\"" },
    { judul: "Pelita Kegelapan", teks: "\"Guru sejati adalah pelita di tengah kegelapan. Satu huruf yang kau ajarkan dengan ikhlas, bisa menjadi cahaya bagi masa depan seorang santri.\"" },
    { judul: "Kesabaran Berbuah Surga", teks: "\"Mendidik butuh kesabaran ekstra. Ingatlah, setiap keringat dan kesabaranmu menghadapi santri akan dicatat sebagai ibadah di sisi Allah SWT.\"" },
    { judul: "Pencetak Generasi Rabbani", teks: "\"Engkau bukan sekadar mentransfer ilmu, tapi sedang memahat jiwa dan akhlaq. Di tanganmulah generasi Rabbani masa depan dibentuk.\"" },
    { judul: "Niatkan Karena Allah (Lillah)", teks: "\"Jadikan lelahmu menjadi Lillah. Tidak ada profesi yang lebih mulia dibandingkan mewariskan ilmu-ilmu kebaikan dan risalah kenabian.\"" },
    { judul: "Doa Para Malaikat", teks: "\"Sesungguhnya Allah, para malaikat, hingga semut di lubangnya bershalawat dan mendoakan kebaikan bagi orang yang mengajarkan kebaikan kepada manusia.\"" },
    { judul: "Pahlawan Tanpa Tanda Jasa", teks: "\"Namamu mungkin tak setenar tokoh dunia, tapi di langit, namamu harum karena lisan santri-santrimu yang melangitkan doa untukmu.\"" },
    { judul: "Pewaris Para Nabi", teks: "\"Ulama dan guru adalah pewaris para nabi. Berbanggalah, karena jalan yang kau tempuh saat ini adalah jalan setapak menuju surga.\"" },
    { judul: "Sentuhan Hati Terdalam", teks: "\"Nasihat yang keluar dari lisan mungkin hanya sampai di telinga, tapi didikan yang keluar dari hati akan menetap abadi di dalam sanubari santri.\"" },
    { judul: "Mata Air Hikmah", teks: "\"Jadilah seperti mata air hikmah yang menyejukkan. Meskipun terkadang santri menguji kesabaran, tetaplah sirami mereka dengan kasih sayang.\"" },
    { judul: "Mengangkat Derajat", teks: "\"Allah meninggikan derajat orang-orang yang berilmu. Engkau adalah jalan perantara bagi mereka untuk menggapai derajat yang mulia tersebut.\"" },
    { judul: "Tinta Emas Sejarah", teks: "\"Tinta seorang guru lebih berat timbangannya dari darah syuhada. Teruslah menuliskan kebaikan di lembaran kertas kehidupan para santri.\"" },
    { judul: "Arsitek Peradaban", teks: "\"Gedung tinggi bisa hancur, namun pondasi iman dan adab yang kau bangun di dada santrimu akan bertahan melintasi zaman.\"" },
    { judul: "Adab Mendahului Ilmu", teks: "\"Tugas terberatmu bukanlah membuat mereka pintar matematika atau nahwu, melainkan membuat mereka memiliki adab yang luhur dan tawadhu.\"" },
    { judul: "Kunci Pembuka Surga", teks: "\"Barangsiapa memudahkan jalan pencari ilmu, Allah mudahkan jalannya ke surga. Teruslah menjadi pembuka jalan kebaikan itu.\"" },
    { judul: "Menyemai Cahaya Hidayah", teks: "\"Mungkin kau tak pernah tahu kalimat mana yang akhirnya mengubah hidup seorang murid. Tugasmu hanya terus menyemai benih kebaikan.\"" },
    { judul: "Madrasah Pertama Kehidupan", teks: "\"Di madrasah inilah karakter dibentuk. Sambutlah para santri dengan senyum setiap pagi, karena senyummu mungkin adalah penyemangat utama mereka.\"" },
    { judul: "Mahkota Cahaya Kemuliaan", teks: "\"Anak yang sholeh akan memberikan mahkota cahaya bagi orang tuanya. Dan engkaulah perantara terhebat yang mewujudkan hal itu.\"" },
    { judul: "Sinergi Doa & Usaha", teks: "\"Mendidik bukan hanya soal teknik mengajar, tapi seberapa sering engkau menyebut nama murid-muridmu dalam sujud di sepertiga malam.\"" },
    { judul: "Penghapus Kebodohan", teks: "\"Tidak ada sedekah yang lebih agung daripada menyedekahkan ilmu untuk menghapus tabir kebodohan dari umat manusia.\"" },
    { judul: "Langkah Penuh Berkah", teks: "\"Setiap langkah kakimu dari rumah menuju Madrasah Darussalam adalah saksi bisu perjuanganmu menegakkan kalimat Allah.\"" },
    { judul: "Keikhlasan Adalah Kunci", teks: "\"Hanya ilmu yang diajarkan dengan keikhlasan yang akan membuahkan kepahaman. Jaga selalu niat muliamu, wahai Ustadz/Ustadzah.\"" },
    { judul: "Melukis Masa Depan", teks: "\"Papan tulis di kelasmu adalah kanvas, dan engkau adalah pelukisnya. Lukislah masa depan yang cerah untuk generasi Islam.\"" },
    { judul: "Kekuatan Sebuah Keteladanan", teks: "\"Satu contoh keteladanan yang kau tunjukkan jauh lebih kuat pengaruhnya daripada seribu nasihat yang hanya diucapkan lisan.\"" },
    { judul: "Senyum Pembawa Berkah", teks: "\"Wajah yang berseri dan senyum yang tulus saat masuk ke kelas adalah sedekah pertama yang kau berikan kepada santri-santrimu hari ini.\"" },
    { judul: "Merawat Berlian Umat", teks: "\"Setiap santri adalah bongkahan berlian kasar. Tugas gurulah yang menggosoknya dengan ilmu dan adab hingga mereka berkilau terang.\"" },
    { judul: "Tunas yang Akan Tumbuh", teks: "\"Jangan pernah berkecil hati jika hasil didikanmu belum terlihat. Engkau sedang menanam pohon jati yang butuh waktu untuk menjulang tinggi.\"" },
    { judul: "Lentera Kesabaran", teks: "\"Terkadang kenakalan santri hanyalah cara mereka mencari perhatian. Jawablah dengan sabar, karena di sanalah letak ujian keikhlasanmu.\"" },
    { judul: "Mewariskan Harta Terbaik", teks: "\"Harta yang kau wariskan akan habis dimakan zaman, tapi ilmu yang kau ajarkan akan abadi menjaga pemiliknya dari kehancuran.\"" },
    { judul: "Menyelamatkan Masa Depan", teks: "\"Menyelamatkan satu jiwa dengan ilmu agama, sama nilainya dengan menyelamatkan masa depan seluruh umat manusia.\"" },
    { judul: "Menepis Lelah dengan Ibadah", teks: "\"Ketika tumpukan nilai dan koreksian membuatmu lelah, tataplah wajah santrimu. Ingatlah bahwa mereka adalah kunci surgamu kelak.\"" },
    { judul: "Menumbuhkan Sayap Kebaikan", teks: "\"Guru tidak memberikan sayap, tapi guru mengajari santri bagaimana cara mengepakkan sayap agar mereka bisa terbang meraih ridha-Nya.\"" },
    { judul: "Satu Frekuensi Kebaikan", teks: "\"Tetaplah semangat bersinergi. Kesuksesan Madrasah Darussalam adalah hasil dari doa, dedikasi, dan kerja keras seluruh dewan guru.\"" }
];

function gantiMotivasiAcak() {
    const wadahJudul = document.getElementById('judulMotivasi');
    const wadahTeks = document.getElementById('teksMotivasi');
    if (wadahJudul && wadahTeks) {
        const acakIndex = Math.floor(Math.random() * dataMotivasi.length);
        const dataTerpilih = dataMotivasi[acakIndex];
        
        wadahJudul.style.transition = "opacity 0.5s ease"; 
        wadahTeks.style.transition = "opacity 0.5s ease";
        wadahJudul.style.opacity = 0; 
        wadahTeks.style.opacity = 0;
        
        setTimeout(() => {
            wadahJudul.innerText = dataTerpilih.judul;
            wadahTeks.innerText = dataTerpilih.teks; 
            wadahJudul.style.opacity = 1; 
            wadahTeks.style.opacity = 1;
        }, 200);
    }
}
document.addEventListener("DOMContentLoaded", gantiMotivasiAcak);

// ---------------------------------------------------------
// 5. PWA (PROGRESSIVE WEB APP) & NOTIFIKASI
// ---------------------------------------------------------
let deferredPrompt;
const installPrompt = document.getElementById('pwaInstallPrompt');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('PWA aktif!'))
        .catch(err => console.log('PWA gagal: ', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e;
    // Kode setTimeout dihapus dari sini agar tidak langsung muncul di halaman login
});

// Buat fungsi baru untuk memunculkan notifikasi nanti
function tampilkanPromptPWA() {
    const installPrompt = document.getElementById('pwaInstallPrompt');
    if (deferredPrompt && installPrompt) { 
        setTimeout(() => { 
            installPrompt.classList.remove('translate-x-[150%]', 'opacity-0'); 
            installPrompt.classList.add('translate-x-0', 'opacity-100'); 
        }, 2000); // Tunda 2 detik setelah masuk dashboard agar terasa lebih elegan
    }
}

function tutupNotifPWA() { 
    if(installPrompt) { 
        installPrompt.classList.remove('translate-x-0', 'opacity-100'); 
        installPrompt.classList.add('translate-x-[150%]', 'opacity-0'); 
    } 
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => { 
            if (choiceResult.outcome === 'accepted') { tutupNotifPWA(); } 
            deferredPrompt = null; 
        });
    }
}

window.addEventListener('appinstalled', (evt) => { tutupNotifPWA(); });

// ---------------------------------------------------------
// 6. FUNGSI DATABASE (SANTRI, NILAI, RANKING, PENGATURAN)
// ---------------------------------------------------------
function openModalSantri() { 
    // --- SISTEM NIS OTOMATIS ---
    let nextNis = "001"; // Default awal jika database kosong
    if (GLOBAL_DATA_SANTRI && GLOBAL_DATA_SANTRI.length > 0) {
        let maxNis = 0;
        let panjangKarakter = 3; // Standar panjang karakter (contoh: 001)
        
        GLOBAL_DATA_SANTRI.forEach(s => {
            let nisStr = s.nis.toString().trim();
            if(nisStr.length > panjangKarakter) panjangKarakter = nisStr.length;
            
            let nisAngka = parseInt(nisStr.replace(/\D/g, '')); // Ambil angkanya saja
            if (!isNaN(nisAngka) && nisAngka > maxNis) {
                maxNis = nisAngka;
            }
        });
        
        // Tambah 1 dan pertahankan angka nol di depannya
        nextNis = (maxNis + 1).toString().padStart(panjangKarakter, '0');
    }

    const inputNis = document.getElementById('add_nis');
    const labelNis = document.getElementById('labelNisRole');
    inputNis.value = nextNis;

    // --- KUNCI INPUT KHUSUS UNTUK GURU ---
    const userRole = document.getElementById('userRoleDisplay').innerText;
    if (userRole.includes('Guru')) {
        inputNis.readOnly = true;
        inputNis.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        labelNis.innerText = "(Otomatis)";
    } else {
        inputNis.readOnly = false;
        inputNis.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        labelNis.innerText = "(Bisa diedit Admin)";
    }

    // Tampilkan Modal
    window.history.pushState({ modal: 'tambah' }, "", "#modalTambah"); 
    document.getElementById('modalTambahSantri').classList.remove('hidden'); 
}

function closeModalSantri() { 
    document.getElementById('modalTambahSantri').classList.add('hidden'); 
    document.getElementById('formTambahSantri').reset(); 
    if (window.location.hash === "#modalTambah") window.history.back(); 
}

// --- FUNGSI IMPORT SANTRI VIA CSV ---
function openModalImportSantri() {
    window.history.pushState({ modal: 'import' }, "", "#modalImport"); 
    document.getElementById('modalImportSantri').classList.remove('hidden');
    document.getElementById('fileImportCSV').value = '';
    document.getElementById('namaFileCsv').innerText = '';
}

function closeModalImportSantri() {
    document.getElementById('modalImportSantri').classList.add('hidden');
    if (window.location.hash === "#modalImport") window.history.back(); 
}

const formImport = document.getElementById('formImportSantri');
if (formImport) {
    formImport.addEventListener('submit', function(e) {
        e.preventDefault();
const fileInput = document.getElementById('fileImportCSV');
if (!fileInput.files.length) return Swal.fire('Perhatian', 'Pilih file CSV terlebih dahulu!', 'warning');

const btnSubmit = this.querySelector('button[type="submit"]');
const originalText = btnSubmit.innerHTML;
btnSubmit.disabled = true;
btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membaca File...';

// Parse CSV menggunakan library PapaParse
Papa.parse(fileInput.files[0], {
header: false, 
skipEmptyLines: true,
complete: function(results) {
    if(results.errors.length) {
        btnSubmit.disabled = false; btnSubmit.innerHTML = originalText;
        return Swal.fire('Error CSV', 'Format file CSV rusak.', 'error');
    }

    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim Data...';
    showLoading(true);

    const formData = new URLSearchParams();
    formData.append('action', 'importSantriBulk');
    formData.append('data_import', JSON.stringify(results.data));
	formData.append('token', sessionStorage.getItem('tokenMadasa'));

    fetch(GAS_URL, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = originalText;
        if(data.status === 'success') {
            closeModalImportSantri();
            Swal.fire('Berhasil!', data.message, 'success');
            loadDataSantri(); // Refresh tabel setelah sukses
        } else {
            Swal.fire('Gagal', data.message, 'error');
        }
		
}).catch(err => {
        showLoading(false);
        btnSubmit.disabled = false; btnSubmit.innerHTML = originalText;
        Swal.fire('Error', 'Gagal terhubung ke database.', 'error');
    });
}
});
    }); // <--- TAMBAHKAN BARIS INI
} // <--- TAMBAHKAN BARIS INI

// Fungsi Bantuan: Mengubah teks "Bangkalan, 5 April 2026" menjadi "2026-04-05"
function reverseTanggalIndo(teksTanggal) {
    if (!teksTanggal || !teksTanggal.includes(',')) return "";
    let parts = teksTanggal.split(',');
    if (parts.length < 2) return "";
    
    let tglArr = parts[1].trim().split(' '); 
    if (tglArr.length !== 3) return "";

    let bulanMap = {
        "Januari": "01", "Februari": "02", "Maret": "03", "April": "04",
        "Mei": "05", "Juni": "06", "Juli": "07", "Agustus": "08",
        "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
    };
    
    let hari = tglArr[0].padStart(2, '0');
    let bulan = bulanMap[tglArr[1]];
    let tahun = tglArr[2];

    if (hari && bulan && tahun) return `${tahun}-${bulan}-${hari}`;
    return "";
}

// Fungsi Utama Edit Santri yang Sudah Diperbaiki
function openModalEditSantri(nis, nama, jk, kelas, alamat, ayah, ibu, hp, ttl) { 
    // Simpan NIS Asli (Lama) di input hidden
    document.getElementById('edit_nis_lama').value = nis; 
    document.getElementById('edit_nis').value = nis; 
    
    document.getElementById('edit_nama').value = nama; 
    document.getElementById('edit_jk').value = jk; 
    document.getElementById('edit_kelas').value = kelas; 
    document.getElementById('edit_alamat').value = alamat; 
    document.getElementById('edit_ayah').value = ayah; 
    document.getElementById('edit_ibu').value = ibu; 
    document.getElementById('edit_hp').value = hp; 
    
    if (ttl && ttl.includes(',')) {
        let parts = ttl.split(',');
        document.getElementById('edit_tempat_lahir').value = parts[0].trim();
        document.getElementById('edit_tanggal_lahir').value = reverseTanggalIndo(ttl);
    } else {
        document.getElementById('edit_tempat_lahir').value = ttl || "";
        document.getElementById('edit_tanggal_lahir').value = "";
    }

    // --- KUNCI INPUT KHUSUS UNTUK GURU, BUKA UNTUK ADMIN ---
    const userRole = document.getElementById('userRoleDisplay').innerText;
    const inputNisEdit = document.getElementById('edit_nis');
    const labelNisEdit = document.getElementById('labelEditNisRole');

    if (userRole.includes('Guru')) {
        inputNisEdit.readOnly = true;
        inputNisEdit.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        labelNisEdit.innerText = "(Terkunci)";
        labelNisEdit.classList.replace('text-blue-500', 'text-red-500');
    } else {
        inputNisEdit.readOnly = false;
        inputNisEdit.classList.remove('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        labelNisEdit.innerText = "(Bisa diedit Admin)";
        labelNisEdit.classList.replace('text-red-500', 'text-blue-500');
    }

    window.history.pushState({ modal: 'edit' }, "", "#modalEdit"); 
    document.getElementById('modalEditSantri').classList.remove('hidden'); 
}

function closeModalEditSantri() { 
    document.getElementById('modalEditSantri').classList.add('hidden'); 
    document.getElementById('formEditSantri').reset(); 
    if (window.location.hash === "#modalEdit") window.history.back(); 
}

function filterSantri() { 
    const searchText = document.getElementById('searchSantri').value.toLowerCase(); 
    const selectedKelas = document.getElementById('filterKelasSantri').value; 
    const rows = document.querySelectorAll('.santri-row'); 
    let visibleCount = 0; 
    
    rows.forEach(row => { 
        // Index bergeser karena ada kolom NO di awal (index 0)
        const nis = row.cells[1].innerText.toLowerCase(); 
        const nama = row.cells[2].innerText.toLowerCase(); 
        const kelas = row.getAttribute('data-kelas'); 
        const matchSearch = nama.includes(searchText) || nis.includes(searchText); 
        const matchKelas = selectedKelas === 'Semua' || kelas === selectedKelas; 
        
        if (matchSearch && matchKelas) { 
            row.style.display = ''; 
            visibleCount++; 
            // Sisipkan angka nomor urut secara dinamis ke sel pertama
            row.cells[0].innerText = visibleCount;
        } 
        else { 
            row.style.display = 'none'; 
        } 
    }); 
    
    const tabelContainer = document.getElementById('tabelSantri').parentElement; 
    const noDataPesan = document.getElementById('noDataPesan'); 
    
    if (visibleCount === 0) { 
        tabelContainer.classList.add('hidden'); noDataPesan.classList.remove('hidden'); 
    } else { 
        tabelContainer.classList.remove('hidden'); noDataPesan.classList.add('hidden'); 
    } 
}

function loadDataSantri() { 
    showLoading(true); 
    const formData = new URLSearchParams(); 
    formData.append('action', 'getSantri'); 
    // --- KODE KEAMANAN 3: LAMPIRKAN TOKEN ---
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(res => { 
        showLoading(false); 
        if(res.status === 'success') { 
            GLOBAL_DATA_SANTRI = res.data; 
            const tbody = document.getElementById('bodyTabelSantri'); 
            if(tbody) { 
                tbody.innerHTML = ''; 
				
if(res.data.length === 0) { 
    // Ubah colspan="5" menjadi colspan="6"
    tbody.innerHTML = '<tr><td colspan=\"6\" class=\"p-4 sm:p-6 text-center text-gray-500\">Belum ada data santri di database.</td></tr>'; return; 
} 
                
res.data.forEach(s => { 
    const tr = document.createElement('tr'); 
    tr.className = 'hover:bg-teal-50 transition-all santri-row'; tr.setAttribute('data-kelas', s.kelas); 

    // Mengamankan tanda petik agar tidak merusak tombol
    let amanNama = s.nama ? s.nama.toString().replace(/'/g, "\\'") : '';
    let amanAlamat = s.alamat ? s.alamat.toString().replace(/`/g, "\\`") : '';
    let amanAyah = s.ayah ? s.ayah.toString().replace(/`/g, "\\`") : '';
    let amanIbu = s.ibu ? s.ibu.toString().replace(/`/g, "\\`") : '';
    let amanTtl = s.ttl ? s.ttl.toString().replace(/`/g, "\\`") : '';

    // TAMBAHKAN KOLOM NOMOR DI AWAL: <td class="p-3 sm:p-4 text-center font-bold text-gray-500 urut-nomor"></td>
    tr.innerHTML = `<td class="p-3 sm:p-4 text-center font-bold text-gray-500 urut-nomor"></td><td class="p-3 sm:p-4 font-medium">${s.nis}</td><td class="p-3 sm:p-4 font-bold text-gray-800 whitespace-nowrap">${s.nama}</td><td class="p-3 sm:p-4 text-center whitespace-nowrap">${s.jk}</td><td class="p-3 sm:p-4 whitespace-nowrap"><span class="bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">${s.kelas}</span></td><td class="p-3 sm:p-4 text-center"><button onclick="openModalEditSantri('${s.nis}', '${amanNama}', '${s.jk}', '${s.kelas}', \`${amanAlamat}\`, \`${amanAyah}\`, \`${amanIbu}\`, '${s.hp}', \`${amanTtl}\`)" class="text-blue-500 hover:bg-blue-100 p-2 sm:p-2.5 rounded-lg transition-all" title="Edit"><i class="fas fa-edit"></i></button></td>`;
            
    tbody.appendChild(tr); 
});
				
                filterSantri(); 
            } 
        } 
    }).catch(err => { showLoading(false); Swal.fire('Error', 'Gagal menarik data dari server.', 'error'); }); 
}

document.getElementById('formTambahSantri').addEventListener('submit', function(e) { 
    e.preventDefault(); 
    const btnSubmit = this.querySelector('button[type="submit"]'); 
    const originalText = btnSubmit.innerHTML; 
    btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; 
    showLoading(true); 
    
  const formData = new URLSearchParams();
formData.append('action', 'addSantri');
formData.append('token', sessionStorage.getItem('tokenMadasa')); // <--- SUNTIKKAN INI
formData.append('nis', document.getElementById('add_nis').value);
    formData.append('nama', document.getElementById('add_nama').value); formData.append('jk', document.getElementById('add_jk').value); 
    formData.append('kelas', document.getElementById('add_kelas').value); formData.append('alamat', document.getElementById('add_alamat').value); 
    formData.append('ayah', document.getElementById('add_ayah').value); formData.append('ibu', document.getElementById('add_ibu').value); 
    formData.append('hp', document.getElementById('add_hp').value); 
	const tempatTambah = document.getElementById('add_tempat_lahir').value;
const tglTambah = formatTanggalIndo(document.getElementById('add_tanggal_lahir').value);
formData.append('ttl', `${tempatTambah}, ${tglTambah}`);
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(data => { 
        showLoading(false); btnSubmit.disabled = false; btnSubmit.innerHTML = originalText; 
        if(data.status === 'success') { closeModalSantri(); Swal.fire('Berhasil!', data.message, 'success'); loadDataSantri(); } 
        else { Swal.fire('Gagal', data.message, 'error'); } 
    }).catch(err => { 
        showLoading(false); btnSubmit.disabled = false; btnSubmit.innerHTML = originalText; Swal.fire('Error', 'Gagal mengirim data.', 'error'); 
    }); 
});

document.getElementById('formEditSantri').addEventListener('submit', function(e) { 
    e.preventDefault(); 
    
    // 1. Tangkap semua tombol yang ada di Modal Edit
    const btnSubmit = this.querySelector('button[type="submit"]'); 
    const btnBatal = this.querySelector('button[type="button"]'); 
    const btnClose = document.querySelector('#modalEditSantri button[onclick="closeModalEditSantri()"]');
    
    const originalText = btnSubmit.innerHTML; 
    
    // 2. KUNCI TOTAL SEMUA TOMBOL (Tambahkan pointer-events-none)
    btnSubmit.disabled = true; 
    btnSubmit.classList.add('pointer-events-none', 'cursor-not-allowed');
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memperbarui...'; 
    
    if(btnBatal) { 
        btnBatal.disabled = true; 
        btnBatal.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); 
    }
    if(btnClose) { 
        btnClose.disabled = true; 
        btnClose.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); 
    }
    
    showLoading(true); 
    
    const formData = new URLSearchParams();
    formData.append('action', 'updateSantri');
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    formData.append('nis_lama', document.getElementById('edit_nis_lama').value);
    formData.append('nis', document.getElementById('edit_nis').value);
    formData.append('nama', document.getElementById('edit_nama').value); 
    formData.append('jk', document.getElementById('edit_jk').value); 
    formData.append('kelas', document.getElementById('edit_kelas').value); 
    formData.append('alamat', document.getElementById('edit_alamat').value); 
    formData.append('ayah', document.getElementById('edit_ayah').value); 
    formData.append('ibu', document.getElementById('edit_ibu').value); 
    formData.append('hp', document.getElementById('edit_hp').value); 
    
    const tempatEdit = document.getElementById('edit_tempat_lahir').value;
    const tglEdit = formatTanggalIndo(document.getElementById('edit_tanggal_lahir').value);
    formData.append('ttl', `${tempatEdit}, ${tglEdit}`);
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(data => { 
        showLoading(false); 
        
        // 3. LEPASKAN KUNCI TOMBOL
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 
        
        if(btnBatal) { btnBatal.disabled = false; btnBatal.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        if(btnClose) { btnClose.disabled = false; btnClose.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        
        if(data.status === 'success') { 
            closeModalEditSantri(); 
            Swal.fire('Berhasil!', data.message, 'success'); 
            loadDataSantri(); 
        } 
        else { 
            Swal.fire('Gagal', data.message, 'error'); 
        } 
    }).catch(err => { 
        showLoading(false); 
        
        // LEPASKAN KUNCI TOMBOL JIKA ERROR
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 
        
        if(btnBatal) { btnBatal.disabled = false; btnBatal.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        if(btnClose) { btnClose.disabled = false; btnClose.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        
        Swal.fire('Error', 'Gagal update data. Periksa jaringan Anda.', 'error'); 
    }); 
});

function validasiInputNilai(el) { 
    let val = parseFloat(el.value); 
    if (el.value !== "" && (val < 0 || val > 100)) { 
        el.classList.add('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-500'); 
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Nilai 0 - 100', showConfirmButton: false, timer: 2000 }); 
    } else { 
        el.classList.remove('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-500'); 
    } 
}

function aktifkanFilterKedua() { 
    const kelas = document.getElementById('pilihKelasNilai').value; 
    const wadahFilter2 = document.getElementById('wadahFilterKedua'); 
    const selectFilter2 = document.getElementById('pilihFilterKedua'); 
    const labelFilter2 = document.getElementById('labelFilterKedua'); 
    
    document.getElementById('formInputNilaiBulk').classList.add('hidden'); 
    
    if (kelas) { 
        wadahFilter2.classList.remove('hidden'); 
        selectFilter2.innerHTML = '<option value="" disabled selected>-- Pilih --</option>'; 
        
        if (kelas.includes('TK')) { 
            labelFilter2.innerHTML = '<i class="fas fa-calendar-alt text-emerald-600 mr-2"></i> Penilaian Hari Apa?'; 
            const hari = ['Sabtu', 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis']; 
            hari.forEach(h => selectFilter2.innerHTML += `<option value="${h}">${h}</option>`); 
        } else {
            labelFilter2.innerHTML = '<i class="fas fa-book text-blue-600 mr-2"></i> Untuk Pelajaran Apa?';
            
            // --- KODE PINTAR BARU ---
            const dataMapel = JADWAL_MAPEL[kelas] || { tulis: [], praktek: [], baca: [] };
            
            let htmlTulis = ''; let htmlPraktek = ''; let htmlMembaca = '';
            
            if(dataMapel.tulis) dataMapel.tulis.forEach(m => htmlTulis += `<option value="${m}">${m}</option>`);
            if(dataMapel.praktek) dataMapel.praktek.forEach(m => htmlPraktek += `<option value="${m}">${m}</option>`);
            if(dataMapel.baca) dataMapel.baca.forEach(m => htmlMembaca += `<option value="${m}">${m}</option>`);
            
            if(htmlTulis) selectFilter2.innerHTML += `<optgroup label="A. UJIAN TERTULIS">${htmlTulis}</optgroup>`;
            if(htmlPraktek) selectFilter2.innerHTML += `<optgroup label="B. UJIAN PRAKTEK">${htmlPraktek}</optgroup>`;
            if(htmlMembaca) selectFilter2.innerHTML += `<optgroup label="C. UJIAN MEMBACA">${htmlMembaca}</optgroup>`;
        }
    } 
}

function generateTabelAbsen() { 
    const kelas = document.getElementById('pilihKelasNilai').value; 
    const subFilterValue = document.getElementById('pilihFilterKedua').value; 
    const santriKelasIni = GLOBAL_DATA_SANTRI.filter(s => s.kelas === kelas); 
    const tbody = document.getElementById('bodyTabelAbsen'); 
    const wadahGlobalMapelTK = document.getElementById('wadahGlobalMapelTK'); 
    tbody.innerHTML = ''; 
    
    if (santriKelasIni.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-red-500 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i> Kelas ini masih kosong, belum ada santri.</td></tr>'; 
    } else { 
        santriKelasIni.forEach((s, idx) => { 
            let html = `<tr class="hover:bg-emerald-50 transition-all santri-absen-row"> <td class="p-3 text-center text-gray-500 font-medium border-r border-gray-200">${idx + 1}</td>`; 
            
            if (kelas.includes('TK')) { 
                html += `<td class="p-3 text-sm border-r border-gray-200 text-gray-500 whitespace-nowrap">${s.nis}</td> <td class="p-3 border-r border-gray-200 md:sticky md:left-0 bg-white z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px] max-w-[200px]"> <p class="font-bold text-gray-800 whitespace-normal text-xs sm:text-sm leading-snug">${s.nama}</p> </td> <td class="p-2 border-r border-gray-200 bg-gray-50"><input type="number" class="input-tk-n1 w-16 sm:w-20 mx-auto block p-2 border border-gray-300 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" data-nis="${s.nis}" placeholder="N1" oninput="validasiInputNilai(this)"></td> <td class="p-2 border-r border-gray-200 bg-gray-50"><input type="number" class="input-tk-n2 w-16 sm:w-20 mx-auto block p-2 border border-gray-300 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" placeholder="N2" oninput="validasiInputNilai(this)"></td> <td class="p-2 bg-gray-50"><input type="number" class="input-tk-n3 w-16 sm:w-20 mx-auto block p-2 border border-gray-300 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500" placeholder="N3" oninput="validasiInputNilai(this)"></td>`; 
            } else { 
                document.getElementById('judulKolomNilai').innerText = `NILAI ${subFilterValue}`; 
                html += `<td class="p-3 text-sm border-r border-gray-200 text-gray-500 whitespace-nowrap">${s.nis}</td> <td class="p-3 border-r border-gray-200 md:sticky md:left-0 bg-white z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px] max-w-[200px]"> <p class="font-bold text-gray-800 whitespace-normal text-xs sm:text-sm leading-snug">${s.nama}</p> </td> <td class="p-3 text-center bg-gray-50"><input type="number" class="input-ibt w-full min-w-[90px] max-w-[120px] mx-auto block p-2 border-2 border-gray-300 rounded-lg font-bold text-center text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none" data-nis="${s.nis}" data-nama="${s.nama}" placeholder="0-100" oninput="validasiInputNilai(this)"></td>`;
            } 
            html += `</tr>`; tbody.innerHTML += html; 
        }); 
    } 
    
   
   if (kelas.includes('TK')) { 
        document.getElementById('headerTK').style.display = 'table-header-group'; 
        document.getElementById('headerIBT').style.display = 'none'; 
        wadahGlobalMapelTK.classList.remove('hidden'); 
        
        // Tampilkan Petunjuk Nilai khusus TK
        document.getElementById('petunjukPredikatTK').classList.remove('hidden');
        // Sembunyikan Peringatan Ibtidaiyah/Sanawiyah
        document.getElementById('peringatanNilaiIbt').classList.add('hidden');
    } else { 
        document.getElementById('headerTK').style.display = 'none'; 
        document.getElementById('headerIBT').style.display = 'table-header-group'; 
        wadahGlobalMapelTK.classList.add('hidden'); 
        
        // Sembunyikan Petunjuk Nilai jika bukan kelas TK
        document.getElementById('petunjukPredikatTK').classList.add('hidden');
        // Tampilkan Peringatan Ibtidaiyah/Sanawiyah
        document.getElementById('peringatanNilaiIbt').classList.remove('hidden');
    } 
    document.getElementById('formInputNilaiBulk').classList.remove('hidden'); 
}
   

document.getElementById('formInputNilaiBulk').addEventListener('submit', function(e) { 
    e.preventDefault(); 
    if (this.querySelectorAll('.border-red-500').length > 0) { 
        Swal.fire({ icon: 'error', title: 'Data Invalid', text: 'Pastikan angka nilai 0 - 100.' }); 
        return; 
    } 
    
    const kelasPilih = document.getElementById('pilihKelasNilai').value; 
    const filterKedua = document.getElementById('pilihFilterKedua').value; 
    let paketBulk = []; 
    
    if (kelasPilih.includes('TK')) { 
        const globalM1 = document.getElementById('global_tk_m1').value; 
        const globalM2 = document.getElementById('global_tk_m2').value; 
        const globalM3 = document.getElementById('global_tk_m3').value; 
        let adaIsianNilai = false; 
        
        document.querySelectorAll('#bodyTabelAbsen tr.santri-absen-row').forEach(tr => { 
            const n1Input = tr.querySelector('.input-tk-n1'); 
            if (n1Input) { 
                const nis = n1Input.getAttribute('data-nis'); 
                const nama = tr.querySelector('.font-bold.text-gray-800').innerText; 
                const n1 = n1Input.value; const n2 = tr.querySelector('.input-tk-n2').value; const n3 = tr.querySelector('.input-tk-n3').value; 
                if(n1 !== "" || n2 !== "" || n3 !== "") { 
                    adaIsianNilai = true; let total = (parseFloat(n1)||0) + (parseFloat(n2)||0) + (parseFloat(n3)||0); 
                    let count = 0; if(n1!=="")count++; if(n2!=="")count++; if(n3!=="")count++; let rata = count > 0 ? (total/count).toFixed(1) : 0; 
                    paketBulk.push({ nis: nis, nama: nama, m1: globalM1, n1: n1, m2: globalM2, n2: n2, m3: globalM3, n3: n3, total: total, rata: rata }); 
                } 
            } 
        }); 
        
        if (adaIsianNilai && globalM1 === "") { Swal.fire({ icon: 'warning', title: 'Mapel 1 Kosong', text: 'Tolong isi Nama Mapel 1.'}); return; } 
    } else { 
        document.querySelectorAll('.input-ibt').forEach(input => { 
            if (input.value !== "") { paketBulk.push({ nis: input.getAttribute('data-nis'), nama: input.getAttribute('data-nama'), nilai: input.value }); } 
        }); 
    } 
    
    if (paketBulk.length === 0) { Swal.fire({ icon: 'warning', title: 'Tabel Kosong', text: 'Belum memasukkan nilai satupun.'}); return; } 
    
    // === SISTEM KUNCI TOMBOL TOTAL ===
    const btnSubmit = this.querySelector('button[type="submit"]'); 
    const originalText = btnSubmit.innerHTML; 
    
    // Matikan sensor tombol dan jadikan memudar
    btnSubmit.disabled = true; 
    btnSubmit.classList.add('pointer-events-none', 'opacity-70');
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; 
    showLoading(true); 
    
    const formData = new URLSearchParams();
    formData.append('action', 'simpanNilai');
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    formData.append('kelas', kelasPilih);
    formData.append('list_nilai', JSON.stringify(paketBulk)); 
    
    if (kelasPilih.includes('TK')) { 
        formData.append('hari', filterKedua); 
    } else { 
        formData.append('mapel', filterKedua); 
        formData.append('semua_mapel', JSON.stringify(JADWAL_MAPEL[kelasPilih].semua)); 
    }
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(data => { 
        showLoading(false); 
        
        // Hidupkan kembali tombol
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'opacity-70');
        btnSubmit.innerHTML = originalText; 
        
        if(data.status === 'success') { 
            Swal.fire({ icon: 'success', title: 'Sukses!', text: data.message, confirmButtonColor: '#059669' }); 
            document.getElementById('formInputNilaiBulk').classList.add('hidden'); 
            document.getElementById('pilihKelasNilai').value = ""; 
            document.getElementById('wadahFilterKedua').classList.add('hidden'); 
            if(kelasPilih.includes('TK')) { 
                document.getElementById('global_tk_m1').value = ""; 
                document.getElementById('global_tk_m2').value = ""; 
                document.getElementById('global_tk_m3').value = ""; 
            } 
        } else { 
            Swal.fire('Ditolak!', data.message, 'error'); 
        } 
    }).catch(e => { 
        showLoading(false); 
        
        // Hidupkan kembali jika internet error
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'opacity-70');
        btnSubmit.innerHTML = originalText; 
        
        Swal.fire('Error', 'Gagal kirim. Periksa jaringan Anda.', 'error'); 
    }); 
});

function loadDataNilaiKelas() { 
    const kelasPilih = document.getElementById('filterKelasDataNilai').value; 
    if (!kelasPilih) { Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan pilih kelas terlebih dahulu.' }); return; } 
    showLoading(true); 
    
    const formData = new URLSearchParams();
    formData.append('action', 'getDataNilai');
    formData.append('token', sessionStorage.getItem('tokenMadasa')); 
    formData.append('kelas', kelasPilih); // PERBAIKAN: Sebelumnya tertulis 'kelas'
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(res => { 
        showLoading(false); 
        if (res.status === 'success') { renderTabelDataNilai(res.headers, res.data); } 
        else { Swal.fire('Gagal', res.message || 'Gagal memuat data nilai.', 'error'); } 
    }).catch(err => { showLoading(false); Swal.fire('Error', 'Koneksi ke server gagal.', 'error'); }); 
}

function renderTabelDataNilai(headers, data) { 
    GLOBAL_HEADERS_NILAI = headers; GLOBAL_DATA_NILAI = data; 
    const thead = document.getElementById('headerDataNilai'); const tbody = document.getElementById('bodyDataNilai'); 
    thead.innerHTML = ''; tbody.innerHTML = ''; 
    
    if (!headers || headers.length === 0 || data.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="15" class="p-10 text-center text-red-500 font-medium"><i class="fas fa-folder-open text-4xl mb-3 block text-red-300"></i> Belum ada data nilai yang diinput oleh Guru untuk kelas ini.</td></tr>`; return; 
    } 
    
    let idxTotal = headers.findIndex(h => h.toLowerCase().includes('total'));
    let kls = document.getElementById('filterKelasDataNilai').value;

    let trHead = '<tr>'; trHead += `<th class="p-3 text-center border-r border-gray-200 w-10 bg-gray-100">No</th>`; 
    headers.forEach((h) => { 
        let namaKolom = h.toLowerCase(); 
        if (namaKolom.includes('nama')) { trHead += `<th class="p-3 border-r border-gray-200 sticky left-0 bg-gray-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap">${h}</th>`; } 
        else if (namaKolom.includes('nis')) { trHead += `<th class="p-3 border-r border-gray-200 whitespace-nowrap w-1 bg-gray-100">${h}</th>`; } 
        else { trHead += `<th class="p-3 border-r border-gray-200 text-center whitespace-nowrap bg-gray-100">${h}</th>`; } 
    }); 
    trHead += `<th class="p-3 text-center bg-gray-100 w-24">AKSI</th></tr>`; thead.innerHTML = trHead; 
    
    data.forEach((row, rowIndex) => { 
        let trBody = `<tr class="hover:bg-blue-50 transition-all">`; 
        trBody += `<td class="p-3 text-center text-gray-500 border-r border-gray-200">${rowIndex + 1}</td>`; 
        
        // KALKULATOR RATA-RATA OTOMATIS ANTI BUG TANGGAL
        let totalNilai = idxTotal > -1 ? parseFloat(row[idxTotal] || 0) : 0;
        let rataBenar = "0.0";
        if (kls && !kls.includes('TK')) {
            let jmlMapel = (JADWAL_MAPEL[kls] && JADWAL_MAPEL[kls].semua) ? JADWAL_MAPEL[kls].semua.length : 0;
            rataBenar = jmlMapel > 0 ? (totalNilai / jmlMapel).toFixed(1) : "0.0";
        }

        row.forEach((cell, cellIndex) => { 
            const headerName = headers[cellIndex].toLowerCase(); 
            if (headerName.includes('nama')) { 
                trBody += `<td class="p-3 border-r border-gray-200 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] font-bold text-gray-800 whitespace-nowrap">${cell}</td>`; 
            } 
            else if (headerName.includes('nis')) { 
                let textNIS = cell.toString().replace("'", ""); trBody += `<td class="p-3 border-r border-gray-200 text-gray-600 whitespace-nowrap">${textNIS}</td>`; 
            } 
            else if (headerName.includes('rata')) {
                // Terapkan rata-rata hasil hitung ulang agar tidak muncul Teks Tanggal
                let finalRata = kls.includes('TK') ? (!isNaN(parseFloat(cell)) ? parseFloat(cell).toFixed(1) : "0.0") : rataBenar;
                trBody += `<td class="p-3 border-r border-gray-200 text-center font-bold text-blue-600 whitespace-nowrap">${finalRata}</td>`;
                GLOBAL_DATA_NILAI[rowIndex][cellIndex] = finalRata; // Sinkronkan untuk menu Edit
            }
            else { 
                const isNumber = !isNaN(cell) && cell !== ""; trBody += `<td class="p-3 border-r border-gray-200 text-center ${isNumber ? 'font-bold text-emerald-700' : 'text-gray-400'} whitespace-nowrap">${cell}</td>`; 
            } 
        }); 
        trBody += `<td class="p-3 text-center whitespace-nowrap"><button onclick="openModalEditNilai(${rowIndex})" class="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-all shadow-sm border border-blue-200" title="Edit Data"><i class="fas fa-edit"></i> Edit</button></td></tr>`; 
        tbody.innerHTML += trBody; 
    }); 
}

function openModalEditNilai(index) { 
    const headers = GLOBAL_HEADERS_NILAI; const row = GLOBAL_DATA_NILAI[index]; const container = document.getElementById('wadahInputEditNilai'); container.innerHTML = ''; 
    document.getElementById('edit_nilai_kelas').value = document.getElementById('filterKelasDataNilai').value; 
    for(let i = 0; i < headers.length; i++) { 
        let h = headers[i]; let val = row[i] === "" ? "" : row[i]; 
        let isReadOnly = ['NIS', 'Nama Lengkap', 'Kelas', 'Hari', 'Total Nilai', 'Rata-rata'].includes(h); 
        if(h === 'NIS') document.getElementById('edit_nilai_nis').value = val.toString().replace("'", ""); 
        let inputType = (h.includes('Mapel') || isReadOnly) ? 'text' : 'number'; 
        let html = `<div><label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 truncate">${h} ${isReadOnly ? '<span class="text-xs text-red-500">(Terkunci)</span>' : ''}</label><input type="${inputType}" name="${h}" value="${val}" class="input-edit-nilai-dinamis w-full p-2.5 sm:p-3 border border-gray-300 rounded-xl focus:ring-blue-500 outline-none text-sm ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'font-bold text-blue-700'}" ${isReadOnly ? 'readonly' : ''} ${inputType === 'number' && !isReadOnly ? 'oninput="validasiInputNilai(this)"' : ''}></div>`; 
        container.innerHTML += html; 
    } 

    window.history.pushState({ modal: 'editNilai' }, "", "#modalEditNilai"); 
    document.getElementById('modalEditNilai').classList.remove('hidden'); 
}

function closeModalEditNilai() { 
    document.getElementById('modalEditNilai').classList.add('hidden'); 
    if (window.location.hash === "#modalEditNilai") window.history.back(); 
}

document.getElementById('formEditNilai').addEventListener('submit', function(e) { 
    e.preventDefault(); 
    if (this.querySelectorAll('.border-red-500').length > 0) { 
        Swal.fire({ icon: 'error', title: 'Data Invalid', text: 'Pastikan angka nilai 0 - 100.' }); 
        return; 
    } 
    
    // 1. Tangkap semua tombol yang ada di Modal Edit Nilai
    const btnSubmit = this.querySelector('button[type="submit"]'); 
    const btnBatal = this.querySelector('button[type="button"]'); 
    const btnClose = document.querySelector('#modalEditNilai button[onclick="closeModalEditNilai()"]');
    
    const originalText = btnSubmit.innerHTML; 
    
    // 2. KUNCI TOTAL SEMUA TOMBOL (Disable, Memudar, & Matikan Click)
    btnSubmit.disabled = true; 
    btnSubmit.classList.add('pointer-events-none', 'cursor-not-allowed');
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; 
    
    if(btnBatal) { 
        btnBatal.disabled = true; 
        btnBatal.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); 
    }
    if(btnClose) { 
        btnClose.disabled = true; 
        btnClose.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); 
    }
    
    showLoading(true); 
    
    let payload = {}; 
    this.querySelectorAll('.input-edit-nilai-dinamis').forEach(inp => { 
        if(!inp.readOnly) { payload[inp.name] = inp.value; } 
    }); 
    
    const formData = new URLSearchParams(); 
    formData.append('action', 'updateDataNilai'); 
    formData.append('kelas', document.getElementById('edit_nilai_kelas').value); 
    formData.append('nis', document.getElementById('edit_nilai_nis').value); 
    formData.append('data_nilai', JSON.stringify(payload)); 
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    
    fetch(GAS_URL, { method: 'POST', body: formData }).then(res => res.json()).then(data => { 
        showLoading(false); 
        
        // 3. LEPASKAN KUNCI TOMBOL KETIKA SELESAI
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 
        
        if(btnBatal) { btnBatal.disabled = false; btnBatal.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        if(btnClose) { btnClose.disabled = false; btnClose.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        
        if(data.status === 'success') { 
            closeModalEditNilai(); 
            Swal.fire('Berhasil!', data.message, 'success'); 
            loadDataNilaiKelas(); 
        } 
        else { 
            Swal.fire('Gagal', data.message, 'error'); 
        } 
    }).catch(err => { 
        showLoading(false); 
        
        // LEPASKAN KUNCI TOMBOL JIKA TERJADI ERROR JARINGAN
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 
        
        if(btnBatal) { btnBatal.disabled = false; btnBatal.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        if(btnClose) { btnClose.disabled = false; btnClose.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none'); }
        
        Swal.fire('Error', 'Gagal update data. Periksa jaringan Anda.', 'error'); 
    }); 
});

function loadBintangPelajar() { 
    const wadah = document.getElementById('wadahBintangPelajar'); 
    wadah.innerHTML = '<div class="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 text-center text-white col-span-full"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Memuat kandidat juara...</div>'; 
    
    const formData = new URLSearchParams(); 
    formData.append('action', 'getBintangPelajar'); 
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    
    fetch(GAS_URL, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(async res => {
        if (res.status === 'success' && res.data.length > 0) { 
            wadah.innerHTML = '<div class="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 text-center text-white col-span-full"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Sinkronisasi Wali Kelas...</div>';
            
            let kelasUnik = [...new Set(res.data.map(s => s.kelas))];
            let mapWali = {};
            
            let ambilWali = kelasUnik.map(kls => {
                let fd = new URLSearchParams(); 
                fd.append('action', 'getPengaturan'); 
                fd.append('kelas', kls);
                fd.append('token', sessionStorage.getItem('tokenMadasa'));

                return fetch(GAS_URL, {method:'POST', body:fd})
                    .then(r => r.json())
                    .then(d => {
                        mapWali[kls] = (d.status === 'success' && d.umum && d.umum.wali) ? d.umum.wali : 'Belum Diatur';
                    })
                    .catch(() => { mapWali[kls] = 'Gagal Memuat'; });
            });
            
            await Promise.all(ambilWali);
            
            // ==========================================
            // LOGIKA PEMISAHAN TINGKATAN
            // ==========================================
            let dataTK = res.data.filter(s => s.kelas.includes('TK'));
            let dataIBT = res.data.filter(s => s.kelas.includes('IBT'));
            let dataSANA = res.data.filter(s => s.kelas.includes('SANA'));
            
            const urutkan = (arr) => arr.sort((a,b) => parseFloat(b.total || 0) - parseFloat(a.total || 0));
            
            urutkan(dataTK);
            urutkan(dataIBT);
            urutkan(dataSANA);

            wadah.innerHTML = ''; 
            
            // Fungsi render kartu berdasarkan kategori
            const renderKategori = (judul, icon, dataKategori, warnaBadge) => {
                if(dataKategori.length === 0) return;
                
                // Tambahkan Header Tingkatan (Lebar Penuh)
                wadah.innerHTML += `<div class="col-span-full text-white font-bold text-lg mt-4 mb-2 border-b border-white/30 pb-2 shadow-sm"><i class="${icon} mr-2"></i>${judul}</div>`;
                
                dataKategori.forEach((santri, idx) => {
                    let isTop1 = idx === 0;
                    let namaWali = mapWali[santri.kelas];

                    let rataBenar = parseFloat(santri.rata || 0).toFixed(1);
                    if (!santri.kelas.includes('TK')) {
                        let jmlMapel = (JADWAL_MAPEL[santri.kelas] && JADWAL_MAPEL[santri.kelas].semua) ? JADWAL_MAPEL[santri.kelas].semua.length : 0;
                        if (jmlMapel > 0) rataBenar = (parseFloat(santri.total || 0) / jmlMapel).toFixed(1);
                        else rataBenar = "0.0"; 
                    }

                    // Memberikan warna dinamis (Hijau untuk TK, Biru untuk IBT, Ungu untuk SANA)
                    let badgeJuara = isTop1 ? `<div class="absolute top-0 right-0 ${warnaBadge} text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm"><i class="fas fa-crown mr-1"></i>JUARA UMUM</div>` : '';
                    let colorAvatar = isTop1 ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400';
                    let colorNumber = isTop1 ? warnaBadge.split(' ')[0] : 'bg-gray-500'; 

                    let html = ` <div class="bg-white rounded-xl p-5 shadow-lg transform transition hover:-translate-y-1 relative overflow-hidden group"> ${badgeJuara} <div class="flex items-center gap-4 mb-3"> <div class="w-14 h-14 rounded-full ${colorAvatar} flex items-center justify-center text-2xl font-bold shadow-inner shrink-0 relative"> <i class="fas fa-user-graduate"></i> <div class="absolute -bottom-1 -right-1 w-6 h-6 ${colorNumber} text-white text-xs flex items-center justify-center rounded-full border-2 border-white font-bold">${idx + 1}</div> </div> <div class="flex-1 min-w-0"> <p class="text-[10px] font-bold text-amber-600 tracking-wider uppercase mb-0.5">${santri.kelas}</p> <h4 class="font-bold text-gray-800 text-sm sm:text-base truncate leading-tight">${santri.nama}</h4> 
					
					<p class="text-xs text-gray-500 mt-1">Total: <span class="font-bold text-gray-800">${santri.total}</span> | Rata-rata: <span class="font-bold text-gray-800">${rataBenar}</span></p>
					
					</div> </div> <div class="border-t border-gray-100 pt-3 text-xs text-gray-500 space-y-1"> <p class="truncate" title="${santri.jk}"><i class="fas fa-venus-mars w-4 text-purple-500 text-center"></i> Jns Kelamin: <b>${santri.jk}</b></p> <p class="truncate" title="${santri.ttl}"><i class="fas fa-map-marker-alt w-4 text-emerald-500 text-center"></i> ${santri.ttl}</p> <p class="truncate" title="${santri.ayah} & ${santri.ibu}"><i class="fas fa-user-friends w-4 text-blue-500 text-center"></i> ${santri.ayah} & ${santri.ibu}</p> <p class="truncate" title="${santri.alamat}"><i class="fas fa-home w-4 text-orange-500 text-center"></i> ${santri.alamat}</p> <p class="truncate mt-1 pt-1" title="Wali Kelas"><i class="fas fa-user-tie w-4 text-gray-400 text-center"></i> Wali Kelas: <b class="text-gray-700">${namaWali}</b></p> </div> </div>`; 
                    
                    wadah.innerHTML += html; 
                });
            };

// Panggil fungsi render untuk masing-masing tingkatan
renderKategori('Tingkat TK / RA', 'fas fa-star text-amber-400', dataTK, 'bg-emerald-600');
renderKategori('Tingkat Madrasah Ibtidaiyah', 'fas fa-star text-amber-400', dataIBT, 'bg-blue-600');
renderKategori('Tingkat Madrasah Sanawiyah', 'fas fa-star text-amber-400', dataSANA, 'bg-purple-600');
            
        } else { 
            wadah.innerHTML = '<div class="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 text-center text-white col-span-full"><i class="fas fa-info-circle text-2xl mb-2 block"></i>Belum ada data nilai yang diinput di kelas mana pun.</div>'; 
        } 
    }).catch(e => { wadah.innerHTML = '<div class="text-white text-center col-span-full mt-4">Gagal memuat data. Periksa jaringan Anda.</div>'; }); 
}

function loadRankingKelas() { 
    const kelasPilih = document.getElementById('filterKelasRanking').value; 
    if (!kelasPilih) { Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan pilih kelas terlebih dahulu.' }); return; } 
    
    showLoading(true); 
    
    // PERBAIKAN: Pisahkan nama variabel agar tidak bertabrakan
    const formDataRanking = new URLSearchParams();
    formDataRanking.append('action', 'getRankingKelas');
    formDataRanking.append('token', sessionStorage.getItem('tokenMadasa'));
    formDataRanking.append('kelas', kelasPilih); 

    const formDataPengaturan = new URLSearchParams();
    formDataPengaturan.append('action', 'getPengaturan');
    formDataPengaturan.append('token', sessionStorage.getItem('tokenMadasa'));
    formDataPengaturan.append('kelas', kelasPilih); 

    Promise.all([
        fetch(GAS_URL, { method: 'POST', body: formDataRanking }).then(r => r.json()),
        fetch(GAS_URL, { method: 'POST', body: formDataPengaturan }).then(r => r.json())
    ]).then(([resRanking, resPengaturan]) => { 
        showLoading(false); 
        const tbody = document.getElementById('bodyTabelRanking'); 
        tbody.innerHTML = ''; 

        let namaWali = 'Belum Diatur';
        if (resPengaturan.status === 'success' && resPengaturan.umum && resPengaturan.umum.wali) {
            namaWali = resPengaturan.umum.wali;
        }

       if (resRanking.status === 'success' && resRanking.data.length > 0) { 
            
           resRanking.data.forEach(s => {
                if (!kelasPilih.includes('TK')) {
                    let jmlMapel = (JADWAL_MAPEL[kelasPilih] && JADWAL_MAPEL[kelasPilih].semua) ? JADWAL_MAPEL[kelasPilih].semua.length : 0;
                    if (jmlMapel > 0) {
                        s.rata = (parseFloat(s.total || 0) / jmlMapel).toFixed(1);
                    } else {
                        // Tarik nilai asli dari database jika Mapel di Pengaturan masih kosong
                        s.rata = parseFloat(s.rata || 0).toFixed(1); 
                    }
                } else {
                    s.rata = parseFloat(s.rata || 0).toFixed(1);
                }
            });

            resRanking.data.sort((a, b) => { 
                if (a.rank && b.rank) return a.rank - b.rank; 
                return parseFloat(b.rata || 0) - parseFloat(a.rata || 0) || parseFloat(b.total || 0) - parseFloat(a.total || 0); 
            }); 
            
            resRanking.data.forEach((s, index) => {
                let rankNomor = s.rank ? parseInt(s.rank) : (index + 1); 
                let rankStyle = "text-gray-500 font-bold text-lg"; let bgStyle = "hover:bg-gray-50"; let icon = rankNomor; 
                
                if(rankNomor === 1) { rankStyle = "text-amber-500 text-2xl font-black"; bgStyle = "bg-amber-50 border-l-4 border-amber-400"; } 
                else if(rankNomor === 2) { rankStyle = "text-gray-400 text-xl font-black"; bgStyle = "bg-gray-50"; } 
                else if(rankNomor === 3) { rankStyle = "text-orange-400 text-xl font-black"; bgStyle = "bg-orange-50/50"; } 
                
                tbody.innerHTML += ` 
                <tr class="transition-all ${bgStyle} border-b border-gray-50 last:border-0"> 
                    <td class="p-3 text-center border-r border-gray-100 ${rankStyle} whitespace-nowrap">${icon}</td> 
                    <td class="p-3 text-gray-500 border-r border-gray-100 text-xs whitespace-nowrap">${s.nis}</td> 
                    <td class="p-3 border-r border-gray-100 min-w-[280px]"> 
                        <p class="font-bold text-gray-800 ${rankNomor <= 3 ? 'text-base' : 'text-sm'} whitespace-nowrap">${s.nama}</p> 
                        <div class="text-[11px] text-gray-500 mt-1.5 space-y-0.5 whitespace-nowrap"> 
                            <p><span class="font-semibold text-gray-600">L/P:</span> ${s.jk}</p> 
                            <p><span class="font-semibold text-gray-600">TTL:</span> ${s.ttl}</p> 
                            <p><span class="font-semibold text-gray-600">Ortu:</span> ${s.ayah} & ${s.ibu}</p> 
                            <p><span class="font-semibold text-gray-600">Alamat:</span> ${s.alamat}</p> 
                            <p class="mt-1 pt-1 border-t border-gray-200/60"><span class="font-semibold text-gray-600">Wali Kelas:</span> <span class="font-bold text-gray-800">${namaWali}</span></p> 
                        </div> 
                    </td> 
                    <td class="p-3 text-center border-r border-gray-100 font-bold text-emerald-700 align-middle whitespace-nowrap">${s.total}</td> 
                    <td class="p-3 text-center font-bold text-blue-600 align-middle whitespace-nowrap">${s.rata}</td> 
                </tr>`; 
            }); 
        } else { 
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-left sm:text-center border-none"><div class="sticky left-6 inline-block text-center text-red-400 font-medium"><i class="fas fa-folder-open text-4xl mb-3 block text-red-300"></i> Belum ada data nilai di kelas ini.</div></td></tr>`; 
        }
    }).catch(e => { showLoading(false); Swal.fire('Error', 'Gagal memuat ranking.', 'error'); }); 
}

function loadSettingRapor() {
    const kelas = document.getElementById('settingKelas').value; 
    if(!kelas) return; 
    
    // --- LOGIKA SEMBUNYIKAN MAPEL & UBAH LABEL UNTUK TK ---
    const wadahMapel = document.getElementById('wadahKategoriMapel');
    const labelKepala = document.getElementById('labelKepalaSetting');
    
    if (kelas.includes('TK')) {
        if (wadahMapel) wadahMapel.classList.add('hidden'); // Sembunyikan mapel untuk TK
        if (labelKepala) labelKepala.innerText = 'Nama Kepala TK / RA'; // Ubah label untuk TK
    } else {
        if (wadahMapel) wadahMapel.classList.remove('hidden'); // Munculkan mapel untuk Ibt/Sana
        if (labelKepala) labelKepala.innerText = 'Nama Kepala Madrasah'; // Kembalikan label
    }
    // ------------------------------------------------------

    showLoading(true); 
    const formData = new URLSearchParams(); 
    formData.append('action', 'getPengaturan'); 
    formData.append('kelas', kelas); 

    fetch(GAS_URL, {method:'POST', body:formData}).then(r=>r.json()).then(res => { 
        showLoading(false); 
        document.getElementById('formSettingRapor').classList.remove('hidden'); 

        let u = res.umum || {}; 
        document.getElementById('set_semester').value = u.semester || ''; 
        document.getElementById('set_tahun').value = u.tahun || ''; 
        document.getElementById('set_tanggal').value = u.tanggal || ''; 
        document.getElementById('set_kepala').value = u.kepala || ''; 
        document.getElementById('set_wali').value = u.wali || ''; 
		
		document.getElementById('set_status_rilis').value = u.status_rilis || 'Sembunyi';

        document.getElementById('set_mapel_tulis').value = res.mapel_tulis || ''; 
        document.getElementById('set_mapel_praktek').value = res.mapel_praktek || ''; 
        document.getElementById('set_mapel_baca').value = res.mapel_baca || ''; 
        document.getElementById('set_kamus').value = res.kamus || '';

        const mapImg = [{url: u.url_wali, imgId: 'preview_wali', teksId: 'teks_wali'}, {url: u.url_kepala, imgId: 'preview_kepala', teksId: 'teks_kepala'}, {url: u.url_stempel, imgId: 'preview_stempel', teksId: 'teks_stempel'}]; 
        mapImg.forEach(m => { 
            const imgEl = document.getElementById(m.imgId); 
            const txtEl = document.getElementById(m.teksId); 
            if(m.url) { imgEl.src = m.url; imgEl.classList.remove('hidden'); txtEl.classList.add('hidden'); } 
            else { imgEl.src = ''; imgEl.classList.add('hidden'); txtEl.classList.remove('hidden'); } 
        });
        
        const santriKelas = GLOBAL_DATA_SANTRI.filter(s => s.kelas === kelas); 
        const tbody = document.getElementById('bodySettingSantri'); 
        tbody.innerHTML = ''; 
        let det = res.detail || {}; 
        
        // --- TAMBAHAN KODE PENGECEKAN KELAS KOSONG ---
        if (santriKelas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="p-8 text-center text-red-500 font-bold"><i class="fas fa-exclamation-triangle mr-2 block text-3xl mb-2 text-red-300"></i> Belum ada santri di kelas ini.<br><span class="text-sm font-normal text-gray-500">Silakan tambahkan santri terlebih dahulu di menu Data Santri.</span></td></tr>';
        } else {
           santriKelas.forEach(s => { 
    let d = det[s.nis] || {akhlaq:'', kerajinan:'', disiplin:'', rapi:'', sakit:'', izin:'', alpa:'', catatan:'', keputusan:''}; 
    
    tbody.innerHTML += ` 
    <tr class="set-santri-row hover:bg-gray-50 transition-all border-b border-gray-100" data-nis="${s.nis}">
        <td class="p-3 border-r font-bold sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-gray-800 min-w-[130px] max-w-[150px] md:max-w-none md:min-w-[250px] whitespace-normal leading-snug">${s.nama}</td>
        
        <td class="p-1 border-r bg-blue-50/30"><input type="text" class="inp-akhlaq w-10 sm:w-12 mx-auto block text-center border-2 border-blue-200 rounded p-1 uppercase font-bold text-blue-700 outline-none focus:border-blue-500" value="${d.akhlaq}" maxlength="1"></td> 
        <td class="p-1 border-r bg-blue-50/30"><input type="text" class="inp-rajin w-10 sm:w-12 mx-auto block text-center border-2 border-blue-200 rounded p-1 uppercase font-bold text-blue-700 outline-none focus:border-blue-500" value="${d.kerajinan}" maxlength="1"></td> 
        <td class="p-1 border-r bg-blue-50/30"><input type="text" class="inp-disiplin w-10 sm:w-12 mx-auto block text-center border-2 border-blue-200 rounded p-1 uppercase font-bold text-blue-700 outline-none focus:border-blue-500" value="${d.disiplin}" maxlength="1"></td> 
        <td class="p-1 border-r bg-blue-50/30"><input type="text" class="inp-rapi w-10 sm:w-12 mx-auto block text-center border-2 border-blue-200 rounded p-1 uppercase font-bold text-blue-700 outline-none focus:border-blue-500" value="${d.rapi}" maxlength="1"></td> 
        
        <td class="p-1 border-r bg-orange-50/30"><input type="number" class="inp-sakit w-10 sm:w-12 mx-auto block text-center border-2 border-orange-200 rounded p-1 font-bold text-orange-700 outline-none focus:border-orange-500" value="${d.sakit}"></td> 
        <td class="p-1 border-r bg-orange-50/30"><input type="number" class="inp-izin w-10 sm:w-12 mx-auto block text-center border-2 border-orange-200 rounded p-1 font-bold text-orange-700 outline-none focus:border-orange-500" value="${d.izin}"></td> 
        <td class="p-1 border-r bg-orange-50/30"><input type="number" class="inp-alpa w-10 sm:w-12 mx-auto block text-center border-2 border-orange-200 rounded p-1 font-bold text-orange-700 outline-none focus:border-orange-500" value="${d.alpa}"></td> 
        
        <td class="p-1 border-r bg-emerald-50/30"><input type="text" class="inp-keputusan w-48 border-2 border-emerald-200 rounded p-1.5 text-xs font-semibold text-emerald-800 outline-none focus:border-emerald-500" value="${d.keputusan}" placeholder="Naik Ke Kelas..."></td> 
        <td class="p-1 bg-purple-50/30"><input type="text" class="inp-catatan w-72 border-2 border-purple-200 rounded p-1.5 text-xs font-medium text-purple-800 outline-none focus:border-purple-500" value="${d.catatan}" placeholder="Catatan Guru..."></td> 
    </tr>`; 
});
        }
    }).catch(e => {
        showLoading(false);
        Swal.fire('Error', 'Gagal memuat pengaturan. Periksa koneksi internet.', 'error');
    });
}

document.getElementById('formSettingRapor').addEventListener('submit', function(e){ 
    e.preventDefault(); 
    
    // === SISTEM KUNCI TOMBOL TOTAL ===
    const btnSubmit = this.querySelector('button[type="submit"]'); 
    const originalText = btnSubmit.innerHTML; 
    
    // Matikan sensor tombol dan jadikan memudar
    btnSubmit.disabled = true; 
    btnSubmit.classList.add('pointer-events-none', 'opacity-70', 'cursor-not-allowed');
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...'; 
    showLoading(true); 

    const kelas = document.getElementById('settingKelas').value; 
    let setUmum = { semester: document.getElementById('set_semester').value, tahun: document.getElementById('set_tahun').value, tanggal: document.getElementById('set_tanggal').value, kepala: document.getElementById('set_kepala').value, wali: document.getElementById('set_wali').value, status_rilis: document.getElementById('set_status_rilis').value };
    let detSantri = []; 
    document.querySelectorAll('.set-santri-row').forEach(tr => { detSantri.push({ nis: tr.getAttribute('data-nis'), akhlaq: tr.querySelector('.inp-akhlaq').value, kerajinan: tr.querySelector('.inp-rajin').value, disiplin: tr.querySelector('.inp-disiplin').value, rapi: tr.querySelector('.inp-rapi').value, sakit: tr.querySelector('.inp-sakit').value, izin: tr.querySelector('.inp-izin').value, alpa: tr.querySelector('.inp-alpa').value, keputusan: tr.querySelector('.inp-keputusan').value, catatan: tr.querySelector('.inp-catatan').value }); }); 
    
    const formData = new URLSearchParams();
    formData.append('action', 'simpanPengaturan');
    formData.append('token', sessionStorage.getItem('tokenMadasa'));
    formData.append('kelas', kelas); 
    formData.append('set_umum', JSON.stringify(setUmum)); 
    formData.append('det_santri', JSON.stringify(detSantri)); 
    
    formData.append('mapel_tulis', document.getElementById('set_mapel_tulis').value.toUpperCase());
    formData.append('mapel_praktek', document.getElementById('set_mapel_praktek').value.toUpperCase());
    formData.append('mapel_baca', document.getElementById('set_mapel_baca').value.toUpperCase());
    formData.append('kamus', document.getElementById('set_kamus').value);
    
    fetch(GAS_URL, {method:'POST', body:formData}).then(r=>r.json()).then(res => {
        showLoading(false); 
        
        // LEPASKAN KUNCI TOMBOL KETIKA SELESAI
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'opacity-70', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 

        if(res.status === 'success') {
            Swal.fire('Berhasil', res.message, 'success'); 
            muatSemuaMapel(); // Segarkan database mapel seketika agar langsung update di Input Nilai
        } else { 
            Swal.fire('Gagal', res.message, 'error'); 
        } 
    }).catch(e => {
        showLoading(false); 
        
        // LEPASKAN KUNCI TOMBOL JIKA ERROR
        btnSubmit.disabled = false; 
        btnSubmit.classList.remove('pointer-events-none', 'opacity-70', 'cursor-not-allowed');
        btnSubmit.innerHTML = originalText; 
        
        Swal.fire('Error', 'Gagal menyimpan. Periksa koneksi internet.', 'error');
    }); 
});

function prosesUploadDrive(inputId, previewId, teksId, jenisKode) { 
    const fileInput = document.getElementById(inputId); const previewImg = document.getElementById(previewId); const teksKosong = document.getElementById(teksId); 
    fileInput.addEventListener('change', function(e) { 
        const kelas = document.getElementById('settingKelas').value; 
        if(!kelas) { Swal.fire('Tahan Dulu!', 'Silakan pilih KELAS di paling atas sebelum meng-upload stempel/ttd.', 'warning'); fileInput.value = ''; return; } 
        const file = e.target.files[0]; if (!file) return; 
        if (file.type !== "image/png") { Swal.fire('Ditolak', 'Harap masukkan format .PNG transparan!', 'error'); fileInput.value = ''; return; } 
        if (file.size > 5242880) { Swal.fire('Terlalu Besar', 'Maksimal ukuran gambar 5 MB.', 'error'); fileInput.value = ''; return; } 
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            const base64String = event.target.result; previewImg.src = base64String; previewImg.classList.remove('hidden'); teksKosong.classList.add('hidden'); showLoading(true); 
            
const formData = new URLSearchParams(); 
formData.append('action', 'uploadGambar'); 
formData.append('kelas', kelas); 
formData.append('jenis', jenisKode); 
formData.append('data', base64String); 
formData.append('token', sessionStorage.getItem('tokenMadasa')); // <--- TAMBAHKAN BARIS INI
			
            fetch(GAS_URL, {method:'POST', body:formData}).then(r=>r.json()).then(res => { showLoading(false); if(res.status === 'success') { Swal.fire({toast:true, position:'top-end', icon:'success', title: 'Tersimpan di Drive!', showConfirmButton:false, timer:2000}); } else { Swal.fire('Gagal Upload', res.message, 'error'); } }).catch(err => { showLoading(false); Swal.fire('Error', 'Jaringan terputus.', 'error'); }); 
        }; reader.readAsDataURL(file); 
    }); 
}
prosesUploadDrive('upload_wali', 'preview_wali', 'teks_wali', 'wali'); prosesUploadDrive('upload_kepala', 'preview_kepala', 'teks_kepala', 'kepala'); prosesUploadDrive('upload_stempel', 'preview_stempel', 'teks_stempel', 'stempel');

function exportRankingPDF() { 
    const kelas = document.getElementById('filterKelasRanking').value; 
    if (!kelas) return Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan tampilkan ranking kelas terlebih dahulu sebelum melakukan export.' }); 
    const elemenTabel = document.getElementById('bodyTabelRanking').closest('.overflow-x-auto'); 
    if (elemenTabel.innerText.includes('Silakan pilih kelas') || elemenTabel.innerText.includes('Belum ada data')) { return Swal.fire({ icon: 'error', title: 'Tabel Kosong', text: 'Tidak ada data santri yang bisa diexport ke PDF.' }); } 
    showLoading(true); 
    const pdfContainer = document.createElement('div'); pdfContainer.style.padding = '30px'; pdfContainer.style.backgroundColor = 'white'; 
    pdfContainer.innerHTML = ` <div style="text-align: center; border-bottom: 3px solid #059669; padding-bottom: 15px; margin-bottom: 25px;"> <h2 style="font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 700; color: #065f46; margin: 0; text-transform: uppercase;">Madrasah Darussalam</h2> <p style="font-family: 'Inter', sans-serif; margin: 5px 0 0 0; color: #4b5563; font-size: 14px; font-weight: 500;">Laporan Peringkat Akademik Santri - Kelas: <span style="color: #059669; font-weight: bold;">${kelas}</span></p> </div> `; 
    const tabelClone = elemenTabel.cloneNode(true); tabelClone.classList.remove('overflow-x-auto', 'border', 'rounded-xl', 'border-gray-200'); pdfContainer.appendChild(tabelClone); 
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); 
    pdfContainer.innerHTML += ` <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center; color: #94a3b8; font-size: 11px; font-style: italic; font-family: 'Inter', sans-serif;"> <p style="margin: 0;">Dokumen ini diterbitkan dan dicetak secara otomatis melalui Sistem Informasi Penilaian Santri - Madrasah Darussalam.</p> <p style="margin: 4px 0 0 0;">Dicetak pada: <b>${tanggalCetak}</b></p> </div> `; 
    const opt = { margin: [0.3, 0.3, 0.5, 0.3], filename: `Data_Ranking_${kelas.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }; 
    html2pdf().set(opt).from(pdfContainer).save().then(() => { showLoading(false); Swal.fire({ icon: 'success', title: 'Alhamdulillah', text: 'File PDF berhasil dibuat!', timer: 2000, showConfirmButton: false }); }).catch(err => { showLoading(false); Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat memproses PDF.' }); }); 
}

function exportBintangPelajarPDF() { 
    const wadah = document.getElementById('wadahBintangPelajar'); 
    if (wadah.innerText.includes('Memuat') || wadah.innerText.includes('Belum ada data')) { return Swal.fire({ icon: 'error', title: 'Data Kosong', text: 'Tidak ada data Bintang Pelajar yang bisa diexport saat ini.' }); } 
    showLoading(true); 
    const pdfContainer = document.createElement('div'); pdfContainer.style.padding = '30px'; pdfContainer.style.backgroundColor = '#f8fafc'; 
    pdfContainer.innerHTML = ` <div style="text-align: center; border-bottom: 3px solid #d97706; padding-bottom: 15px; margin-bottom: 25px;"> <h2 style="font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 700; color: #b45309; margin: 0; text-transform: uppercase;">Madrasah Darussalam</h2> <p style="font-family: 'Inter', sans-serif; margin: 5px 0 0 0; color: #78350f; font-size: 14px; font-weight: 500;">Laporan Eksekutif: Daftar Bintang Pelajar (Juara Umum Per Kelas)</p> </div> `; 
    const clone = wadah.cloneNode(true); clone.className = 'grid grid-cols-2 gap-4'; pdfContainer.appendChild(clone); 
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); 
    pdfContainer.innerHTML += ` <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 11px; font-style: italic; font-family: 'Inter', sans-serif;"> <p style="margin: 0;">Dokumen ini diterbitkan dan dicetak secara otomatis melalui Sistem Informasi Penilaian Santri - Madrasah Darussalam.</p> <p style="margin: 4px 0 0 0;">Dicetak pada: <b>${tanggalCetak}</b></p> </div> `; 
    const opt = { margin: [0.3, 0.3, 0.5, 0.3], filename: `Bintang_Pelajar_Darussalam.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }; 
    html2pdf().set(opt).from(pdfContainer).save().then(() => { showLoading(false); Swal.fire({ icon: 'success', title: 'Alhamdulillah', text: 'Laporan Bintang Pelajar berhasil diunduh!', timer: 2000, showConfirmButton: false }); }).catch(err => { showLoading(false); Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan.' }); }); 
}

function cetakDataNilai() {
    const kelas = document.getElementById('filterKelasDataNilai').value;
    if (!kelas) return Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan tampilkan laporan data nilai terlebih dahulu.' });
    
    const elemenTabel = document.getElementById('tabelDataNilai');
    const teksTabel = document.getElementById('bodyDataNilai').innerText;
    if (teksTabel.includes('Silakan pilih kelas') || teksTabel.includes('Belum ada data')) {
        return Swal.fire({ icon: 'error', title: 'Tabel Kosong', text: 'Tidak ada data nilai yang bisa dicetak.' });
    }
    
    // Kloning (copy) tabel agar tampilan asli di layar tidak rusak
    const tabelClone = elemenTabel.cloneNode(true);
    
    // Bersihkan semua class CSS Tailwind agar tabel murni diatur oleh CSS Print
    tabelClone.removeAttribute('class');
    tabelClone.querySelectorAll('th, td, tr, thead, tbody').forEach(el => el.removeAttribute('class'));
    
    // Hapus kolom AKSI (kolom paling kanan) dari header
    const headerRow = tabelClone.querySelector('thead tr');
    if (headerRow && headerRow.lastElementChild) headerRow.removeChild(headerRow.lastElementChild);
    
    // Hapus tombol AKSI dari isi datanya
    const bodyRows = tabelClone.querySelectorAll('tbody tr');
    bodyRows.forEach(tr => { if (tr.lastElementChild) tr.removeChild(tr.lastElementChild); });
    
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Buka Jendela/Tab Baru khusus untuk mode Print
    const printWindow = window.open('', '_blank');
    
    // Peringatan jika Pop-up diblokir oleh browser
    if (!printWindow) {
        return Swal.fire({ icon: 'error', title: 'Pop-up Diblokir!', text: 'Browser Anda memblokir tab baru. Silakan izinkan pop-up (Always allow pop-ups) pada address bar.' });
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <title>Cetak_Nilai_${kelas.replace(/\s+/g, '_')}</title>
            <style>
                /* Setingan Kertas Miring (Landscape) dan Margin */
                @page { size: landscape; margin: 10mm; }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; }
                
                /* Kop Laporan */
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h2 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: bold; }
                .header p { margin: 5px 0 0 0; font-size: 13px; }
                
                /* Tabel Nilai (Garis Hitam Tegas) */
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #000; padding: 6px 4px; font-size: 10px; text-align: center; white-space: nowrap; }
                th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; text-transform: uppercase; }
                td:nth-child(3) { text-align: left; /* Nama Santri Dibuat Rata Kiri */ }
                
                /* Footer Bawah */
                .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Madrasah Darussalam</h2>
                <p>Laporan Rekapitulasi Nilai Santri - Kelas: <b>${kelas}</b></p>
            </div>
            
            ${tabelClone.outerHTML}
            
            <div class="footer">
                Dokumen ini dicetak secara otomatis dari Sistem Informasi Penilaian Santri<br>
                Tanggal Cetak: ${tanggalCetak}
            </div>
            
            <script>
                // Beri jeda 1 detik agar halaman ke-render penuh sebelum dialog print muncul (Anti-Error HP)
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// =========================================================
// 1. FUNGSI CETAK DATA SANTRI (Kop Berlogo)
// =========================================================
function cetakDataSantri() {
    const filterKelas = document.getElementById('filterKelasSantri').value;
    const teksKelas = filterKelas === 'Semua' ? 'Semua Kelas' : filterKelas;
    let dataCetak = GLOBAL_DATA_SANTRI;
    
    if (filterKelas !== 'Semua') { dataCetak = dataCetak.filter(s => s.kelas === filterKelas); }
    if (!dataCetak || dataCetak.length === 0) {
        return Swal.fire({ icon: 'error', title: 'Data Kosong', text: 'Tidak ada data santri di kelas ini.' });
    }

    const tabelPrint = document.createElement('table');
    tabelPrint.innerHTML = `
        <thead>
            <tr>
                <th style="width: 3%;">NO</th><th style="width: 8%;">NIS</th>
                <th style="text-align: left; width: 15%;">NAMA LENGKAP</th>
                <th style="width: 5%;">L/P</th><th style="width: 10%;">KELAS</th>
                <th style="width: 15%;">TEMPAT, TGL LAHIR</th><th style="width: 15%;">NAMA ORTU</th>
                <th style="width: 10%;">NO. HP/WA</th><th style="text-align: left; width: 19%;">ALAMAT LENGKAP</th>
            </tr>
        </thead><tbody></tbody>`;
    const tbodyPrint = tabelPrint.querySelector('tbody');

    dataCetak.forEach((s, index) => {
        let jenisKelamin = s.jk === 'Laki-laki' ? 'L' : (s.jk === 'Perempuan' ? 'P' : s.jk);
        const trBaru = document.createElement('tr');
        trBaru.innerHTML = `<td>${index + 1}</td><td>${s.nis}</td><td style="text-align: left; font-weight: bold;">${s.nama}</td><td>${jenisKelamin}</td><td>${s.kelas}</td><td>${s.ttl}</td><td>${s.ayah} & ${s.ibu}</td><td>${s.hp}</td><td style="text-align: left;">${s.alamat}</td>`;
        tbodyPrint.appendChild(trBaru);
    });

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, '') + 'asset/logo.png';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire({ icon: 'error', title: 'Pop-up Diblokir!', text: 'Browser memblokir tab baru.' });

    printWindow.document.write(`
        <!DOCTYPE html><html lang="id"><head><title>Data_Santri_${teksKelas.replace(/\s+/g, '_')}</title>
        <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: 'Arial', sans-serif; font-size: 10px; color: #000; background: #fff; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 6px 4px; text-align: center; vertical-align: middle; }
            th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
            .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
        </style></head><body>
            <div style="display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                <img src="${logoUrl}" style="width: 65px; height: 65px; object-fit: contain; margin-right: 15px;">
                <div style="flex: 1; text-align: center; padding-right: 80px;">
                    <h2 style="margin: 0; font-size: 22px; text-transform: uppercase; font-weight: bold;">Madrasah Darussalam</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px;">Laporan Data Induk Santri Lengkap - Kelas: <b>${teksKelas}</b></p>
                </div>
            </div>
            ${tabelPrint.outerHTML}
           <div class="footer">Dokumen ini dicetak otomatis dari Sistem Penilaian Santri | Tanggal Cetak: ${tanggalCetak}</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 1000); };<\/script>
</body></html>
    `);
    printWindow.document.close();
}

// =========================================================
// 2. FUNGSI CETAK DATA NILAI (Kop Berlogo)
// =========================================================
function cetakDataNilai() {
    const kelas = document.getElementById('filterKelasDataNilai').value;
    if (!kelas) return Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan tampilkan laporan terlebih dahulu.' });
    
    const elemenTabel = document.getElementById('tabelDataNilai');
    const teksTabel = document.getElementById('bodyDataNilai').innerText;
    if (teksTabel.includes('Silakan pilih kelas') || teksTabel.includes('Belum ada data')) return Swal.fire({ icon: 'error', title: 'Kosong', text: 'Tidak ada data nilai.' });
    
    const tabelClone = elemenTabel.cloneNode(true);
    tabelClone.removeAttribute('class'); tabelClone.querySelectorAll('th, td, tr, thead, tbody').forEach(el => el.removeAttribute('class'));
    
    const headerRow = tabelClone.querySelector('thead tr');
    if (headerRow && headerRow.lastElementChild) headerRow.removeChild(headerRow.lastElementChild);
    const bodyRows = tabelClone.querySelectorAll('tbody tr');
    bodyRows.forEach(tr => { if (tr.lastElementChild) tr.removeChild(tr.lastElementChild); });
    
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, '') + 'asset/logo.png';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire({ icon: 'error', title: 'Pop-up Diblokir!', text: 'Browser memblokir tab baru.' });
    
    printWindow.document.write(`
        <!DOCTYPE html><html lang="id"><head><title>Cetak_Nilai_${kelas.replace(/\s+/g, '_')}</title>
        <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 6px 4px; font-size: 10px; text-align: center; white-space: nowrap; }
            th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; text-transform: uppercase; }
            td:nth-child(3) { text-align: left; }
            .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
        </style></head><body>
            <div style="display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                <img src="${logoUrl}" style="width: 65px; height: 65px; object-fit: contain; margin-right: 15px;">
                <div style="flex: 1; text-align: center; padding-right: 80px;">
                    <h2 style="margin: 0; font-size: 22px; text-transform: uppercase; font-weight: bold;">Madrasah Darussalam</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px;">Laporan Rekapitulasi Nilai Santri - Kelas: <b>${kelas}</b></p>
                </div>
            </div>
            ${tabelClone.outerHTML}
            <div class="footer">Dokumen ini dicetak otomatis dari Sistem Penilaian Santri | Tanggal Cetak: ${tanggalCetak}</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 1000); };<\/script>
</body></html>
    `);
    printWindow.document.close();
}

// =========================================================
// 3. FUNGSI CETAK RANKING KELAS (Kertas Legal)
// =========================================================
function cetakRanking() {
    const kelas = document.getElementById('filterKelasRanking').value;
    if (!kelas) return Swal.fire({ icon: 'warning', title: 'Pilih Kelas', text: 'Silakan tampilkan ranking terlebih dahulu sebelum mencetak.' });

    const tbody = document.getElementById('bodyTabelRanking');
    if (tbody.innerText.includes('Silakan pilih kelas') || tbody.innerText.includes('Belum ada data')) {
         return Swal.fire({ icon: 'error', title: 'Tabel Kosong', text: 'Tidak ada data untuk dicetak.' });
    }

    // Menyusun ulang tabel agar rapi saat dicetak
    const barisData = tbody.querySelectorAll('tr');
    let tabelPrintHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width: 8%;">Rank</th>
                    <th style="width: 15%;">NIS</th>
                    <th style="width: 47%; text-align: left;">Nama & Detail Santri</th>
                    <th style="width: 15%;">Total Nilai</th>
                    <th style="width: 15%;">Rata-Rata</th>
                </tr>
            </thead>
            <tbody>
    `;

    barisData.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length === 5) {
            const rank = tds[0].innerText;
            const nis = tds[1].innerText;
            
            // Ekstrak nama dan detail
            const nama = tds[2].querySelector('p.font-bold').innerText;
            const detailLines = tds[2].querySelectorAll('.space-y-0\\.5 p');
            let detailStr = '';
            detailLines.forEach(p => { detailStr += `<div style="font-size: 11px; color: #444; margin-top: 3px;">${p.innerHTML}</div>`; });

            const total = tds[3].innerText;
            const rata = tds[4].innerText;

            tabelPrintHTML += `
                <tr>
                    <td style="text-align: center; font-weight: bold; font-size: 16px;">${rank}</td>
                    <td style="text-align: center;">${nis}</td>
                    <td style="text-align: left;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${nama}</div>
                        ${detailStr}
                    </td>
                    <td style="text-align: center; font-weight: bold; font-size: 14px;">${total}</td>
                    <td style="text-align: center; font-weight: bold; font-size: 14px;">${rata}</td>
                </tr>
            `;
        }
    });
    tabelPrintHTML += `</tbody></table>`;

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const logoUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, '') + 'asset/logo.png';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire({ icon: 'error', title: 'Pop-up Diblokir!', text: 'Browser memblokir tab baru.' });

    printWindow.document.write(`
        <!DOCTYPE html><html lang="id"><head><title>Cetak_Ranking_${kelas.replace(/\s+/g, '_')}</title>
        <style>
       
           /* PENGATURAN KERTAS DIBEBASKAN KE BROWSER */
@page { margin: 15mm; }
body { font-family: 'Arial', sans-serif; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 10px 8px; vertical-align: top; }
            th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; text-transform: uppercase; }
            .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 20px; border-top: 1px dashed #aaa; padding-top: 10px; }
        </style></head><body>
            <div style="display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                <img src="${logoUrl}" style="width: 70px; height: 70px; object-fit: contain; margin-right: 15px;" onerror="this.style.display='none'">
                <div style="flex: 1; text-align: center; padding-right: 85px;">
                    <h2 style="margin: 0; font-size: 24px; text-transform: uppercase; font-weight: bold;">Madrasah Darussalam</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Laporan Peringkat Akademik Santri - Kelas: <b>${kelas}</b></p>
                </div>
            </div>
            ${tabelPrintHTML}
            <div class="footer">Dokumen ini dicetak otomatis dari Sistem Penilaian Santri | Tanggal Cetak: ${tanggalCetak}</div>
            <script>window.onload = function() { setTimeout(function() { window.print(); }, 1000); };<\/script>
        </body></html>
    `);
    printWindow.document.close();
}

// =========================================================
// 4. FUNGSI CETAK BINTANG PELAJAR (Kertas Legal)
// =========================================================
function cetakBintangPelajar() {
    const wadah = document.getElementById('wadahBintangPelajar');
    if (wadah.innerText.includes('Memuat') || wadah.innerText.includes('Belum ada data')) {
         return Swal.fire({ icon: 'error', title: 'Data Kosong', text: 'Tidak ada data Bintang Pelajar saat ini.' });
    }

    // Menyusun ulang kartu juara menjadi grid print dengan pemisah kategori
    let gridHTML = `<div style="display: flex; flex-wrap: wrap; gap: 2%; justify-content: flex-start;">`;
    
    Array.from(wadah.children).forEach(el => {
        // Jika elemen ini adalah Header Kategori (TK/IBT/SANA)
        if (el.classList.contains('col-span-full')) {
            gridHTML += `<div style="width: 100%; margin-top: 15px; margin-bottom: 10px; font-size: 16px; font-weight: bold; color: #b45309; border-bottom: 2px solid #b45309; padding-bottom: 5px;">${el.innerText}</div>`;
        } 
        // Jika elemen ini adalah Kartu Santri
        else if (el.classList.contains('bg-white')) {
            const isJuaraUmum = el.innerHTML.includes('JUARA UMUM');
            
            // Ambil nomor urut secara dinamis
            const nomorUrutDiv = el.querySelector('.absolute.-bottom-1.-right-1');
            const nomorUrut = nomorUrutDiv ? nomorUrutDiv.innerText : '1';
            
            const kelas = el.querySelector('p.uppercase').innerText;
            const nama = el.querySelector('h4').innerText;
            const totalRata = el.querySelector('p.text-xs.text-gray-500').innerText; 
            
            const detailLines = el.querySelectorAll('.border-t p');
            let detailStr = '';
            detailLines.forEach(p => { detailStr += `<div style="margin-bottom: 4px; font-size: 11px;">• ${p.innerText}</div>`; });

            // Tambahan page-break-inside: avoid agar kartu tidak terpotong separuh di kertas
            gridHTML += `
                <div style="border: 2px solid ${isJuaraUmum ? '#d97706' : '#000'}; padding: 15px; width: 49%; box-sizing: border-box; border-radius: 12px; margin-bottom: 15px; position: relative; page-break-inside: avoid;">
                    ${isJuaraUmum ? '<div style="position: absolute; top: 0; right: 0; background: #d97706; color: white; padding: 4px 8px; font-size: 10px; font-weight: bold; border-bottom-left-radius: 8px;">JUARA UMUM</div>' : ''}
                    <div style="position: absolute; top: 12px; left: 15px; font-size: 22px; font-weight: 900; color: ${isJuaraUmum ? '#d97706' : '#64748b'};">#${nomorUrut}</div>
                    <div style="text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                        <div style="font-size: 11px; font-weight: bold; background: #e5e7eb; display: inline-block; padding: 4px 12px; border-radius: 15px; margin-bottom: 8px;">${kelas}</div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">${nama}</h3>
                        <div style="font-size: 12px; margin-top: 8px; font-weight: bold;">${totalRata}</div>
                    </div>
                    <div style="color: #333;">${detailStr}</div>
                </div>
            `;
        }
    });
    gridHTML += `</div>`;

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tglTtd = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); // Tanggal untuk area TTD
    const logoUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, '') + 'asset/logo.png';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return Swal.fire({ icon: 'error', title: 'Pop-up Diblokir!', text: 'Browser memblokir tab baru.' });

    printWindow.document.write(`
        <!DOCTYPE html><html lang="id"><head><title>Cetak_Bintang_Pelajar</title>
        <style>
          @page { margin: 15mm; }
          body { font-family: 'Arial', sans-serif; font-size: 12px; color: #000; background: #fff; margin: 0; padding: 0; }
          .footer { text-align: center; font-size: 10px; font-style: italic; color: #555; margin-top: 30px; border-top: 1px dashed #aaa; padding-top: 10px; }
        </style></head><body>
            <div style="display: flex; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 10px; margin-bottom: 25px;">
                <img src="${logoUrl}" style="width: 70px; height: 70px; object-fit: contain; margin-right: 15px;" onerror="this.style.display='none'">
                <div style="flex: 1; text-align: center; padding-right: 85px;">
                    <h2 style="margin: 0; font-size: 24px; text-transform: uppercase; font-weight: bold; color: #b45309;">Madrasah Darussalam</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">Laporan Eksekutif: Daftar Bintang Pelajar (Juara Umum Per Tingkatan)</p>
                </div>
            </div>
            
            ${gridHTML}
            
            <div style="margin-top: 40px; display: flex; justify-content: flex-end; padding-right: 20px; page-break-inside: avoid;">
                <div style="text-align: center; width: 250px;">
                    <p style="margin: 0 0 5px 0; font-size: 14px;">Bangkalan, ${tglTtd}</p>
                    <p style="margin: 0; font-size: 14px; font-weight: bold;">Panitia Ujian Madrasah</p>
                    <div style="height: 80px;"></div>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; text-decoration: underline;">( .................................................... )</p>
                </div>
            </div>

            <div class="footer">Dokumen ini dicetak otomatis dari Sistem Penilaian Santri | Tanggal Cetak: ${tanggalCetak}</div>
            <script>window.onload = function() { setTimeout(function() { window.print(); }, 1000); };<\/script>
        </body></html>
    `);
    printWindow.document.close();
}

// =========================================================
// PENGGERAK JAM & KALENDER HIJRIYAH, MASEHI, PASARAN JAWA
// =========================================================
function updateWaktuLokal() {
    const sekarang = new Date();
    
  // 1. Update Jam, Menit, dan Detik (Format: 08:30:45)
    const jam = sekarang.getHours().toString().padStart(2, '0');
    const menit = sekarang.getMinutes().toString().padStart(2, '0');
    const detik = sekarang.getSeconds().toString().padStart(2, '0');
    const elemenJam = document.getElementById('waktu-jam');
    if (elemenJam) elemenJam.innerText = `${jam}:${menit}:${detik}`;

    // 2. Update Tanggal Masehi & Pasaran Jawa
    // Rumus menghitung hari Pasaran berdasarkan waktu Unix (Epoch 1970)
    const offsetWIB = 7 * 60 * 60 * 1000; // Penyesuaian Zona Waktu Indonesia (+7)
    const totalHari = Math.floor((sekarang.getTime() + offsetWIB) / 86400000);
    
    const arrPasaran = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
    const pasaranJawa = arrPasaran[(totalHari + 3) % 5]; // +3 adalah konstanta sinkronisasi kalender

    const opsiMasehi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let teksMasehi = sekarang.toLocaleDateString('id-ID', opsiMasehi);
    
    // Menyisipkan nama pasaran Jawa setelah nama Hari (Misal: Senin -> Senin Kliwon)
    let bagianTeks = teksMasehi.split(','); 
    teksMasehi = `${bagianTeks[0]} ${pasaranJawa}, ${bagianTeks[1]} M`;

    const elemenMasehi = document.getElementById('waktu-masehi');
    if (elemenMasehi) elemenMasehi.innerText = teksMasehi.toUpperCase();

   // 3. Update Tanggal Hijriyah (Anti-Bug Browser HP)
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const parts = formatter.formatToParts(sekarang);
        
        let hDay = "", hMonth = "", hYear = "";
        parts.forEach(p => {
            if (p.type === 'day') hDay = p.value;
            if (p.type === 'month') hMonth = p.value;
            if (p.type === 'year') hYear = p.value;
        });

        const namaBulanHijriyah = [
            "", "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", 
            "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", 
            "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
        ];
        
        let teksHijriyah = `${hDay} ${namaBulanHijriyah[parseInt(hMonth)]} ${hYear} H`;
        
        const elemenHijriyah = document.getElementById('waktu-hijriyah');
        if (elemenHijriyah) elemenHijriyah.innerText = teksHijriyah.toUpperCase();

    } catch (e) {
        console.log("Kalender Hijriyah tidak didukung.");
    }
}

// Jalankan saat web dibuka, lalu perbarui setiap detik
document.addEventListener("DOMContentLoaded", () => {
    updateWaktuLokal();
    setInterval(updateWaktuLokal, 1000);
});



// =========================================================
// FUNGSI MUTASI KELAS
// =========================================================
function loadTabelMutasi() {
    const kelasAsal = document.getElementById('mutasiKelasAsal').value;
    const tbody = document.getElementById('bodyTabelMutasi');
    document.getElementById('cekSemuaMutasi').checked = false;
    tbody.innerHTML = '';

    if (!kelasAsal) return;

    // Menarik data santri dari variabel global yang sudah ada
    const santriKelas = GLOBAL_DATA_SANTRI.filter(s => s.kelas === kelasAsal);
    
    if (santriKelas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-red-400 font-medium">Tidak ada santri di kelas ini.</td></tr>';
        return;
    }

    santriKelas.forEach((s) => {
        tbody.innerHTML += `
            <tr class="hover:bg-indigo-50 transition-all cursor-pointer" onclick="const cb = this.querySelector('.cek-mutasi'); cb.checked = !cb.checked;">
                <td class="p-3 text-center border-r border-gray-100" onclick="event.stopPropagation()">
                    <input type="checkbox" class="cek-mutasi w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" value="${s.nis}">
                </td>
                <td class="p-3 text-gray-600 font-medium border-r border-gray-100">${s.nis}</td>
                <td class="p-3 font-bold text-gray-800 border-r border-gray-100">${s.nama}</td>
                <td class="p-3 text-center"><span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">${s.kelas}</span></td>
            </tr>
        `;
    });
}

function toggleSemuaMutasi(source) {
    const checkboxes = document.querySelectorAll('.cek-mutasi');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function prosesMutasi() {
    const kelasTujuan = document.getElementById('mutasiKelasTujuan').value;
    const checkboxes = document.querySelectorAll('.cek-mutasi:checked');
    
    if (checkboxes.length === 0) return Swal.fire('Pilih Santri', 'Silakan centang minimal satu santri yang akan dimutasi.', 'warning');
    if (!kelasTujuan) return Swal.fire('Pilih Tujuan', 'Silakan pilih kelas tujuan mutasi atau status Lulus.', 'warning');

    let nisList = [];
    checkboxes.forEach(cb => nisList.push(cb.value));

    // KODE PERBAIKAN: Menambahkan Kotak Peringatan Cetak Rapor
    Swal.fire({
        title: 'Peringatan Mutasi!',
        html: `Anda akan memindahkan <b>${nisList.length} santri</b> ke: <b class="text-indigo-600">${kelasTujuan}</b><br><br>
               <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-sm text-left shadow-inner">
                   <i class="fas fa-exclamation-triangle text-amber-600 mr-2 text-lg"></i> <b>PERHATIAN PENTING:</b><br>
                   Pastikan semua <b>Rapor</b> kelas asal sudah dicetak! Setelah dimutasi, nama santri tidak akan muncul lagi di menu cetak kelas sebelumnya.
               </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#d33',
        confirmButtonText: '<i class="fas fa-check mr-2"></i> Ya, Lanjutkan Mutasi',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoading(true, "Memproses Mutasi...");
            
            const formData = new URLSearchParams();
            formData.append('action', 'mutasiSantri');
            formData.append('token', sessionStorage.getItem('tokenMadasa')); 
            formData.append('kelas_tujuan', kelasTujuan);
            formData.append('nis_list', JSON.stringify(nisList));

            fetch(GAS_URL, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') {
                    showLoading(false); 
                    Swal.fire('Berhasil!', res.message, 'success');
                    document.getElementById('mutasiKelasAsal').value = '';
                    document.getElementById('mutasiKelasTujuan').value = '';
                    document.getElementById('bodyTabelMutasi').innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400"><i class="fas fa-check-circle text-4xl mb-2 text-emerald-400 block"></i>Mutasi selesai.</td></tr>';
                    
                    // Segarkan ulang data lokal agar sinkron
                    loadDataSantri(); 
                } else {
                    showLoading(false);
                    Swal.fire('Gagal', res.message, 'error');
                }
            }).catch(e => {
                showLoading(false);
                Swal.fire('Error', 'Koneksi terputus ke server.', 'error');
            });
        }
    });
}

// =========================================================
// FUNGSI MENU NAVIGASI HP (SIDEBAR MOBILE)
// =========================================================
function toggleSidebarMobile() {
    const sidebar = document.querySelector('aside');
    
    // Jika sidebar sedang tersembunyi (hidden), maka TAMPILKAN
    if (sidebar.classList.contains('hidden')) {
        // --- SUNTIKAN RIWAYAT PALSU ---
        window.history.pushState({ menu: 'sidebar' }, "", "#menu");
        
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex', 'fixed', 'inset-y-0', 'left-0', 'w-64', 'z-[60]', 'shadow-2xl');
        
        // Buat layar gelap (overlay) di belakang sidebar
        if (!document.getElementById('overlay-sidebar')) {
            const overlay = document.createElement('div');
            overlay.id = 'overlay-sidebar';
            overlay.className = 'fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm transition-all';
            
            // Jika layar gelap diklik, kita perintahkan browser untuk mengeksekusi "back" otomatis
            overlay.onclick = () => { window.history.back(); }; 
            
            document.body.appendChild(overlay);
        }
        
    } else {
        // Jika sidebar sedang tampil, maka SEMBUNYIKAN KEMBALI
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0', 'w-64', 'z-[60]', 'shadow-2xl');
        
        // Hapus layar gelap
        const overlay = document.getElementById('overlay-sidebar');
        if (overlay) overlay.remove();
    }
}

function tampilkanProfilDeveloper() {
    // --- SUNTIKAN RIWAYAT PALSU ---
    window.history.pushState({ modal: 'profil' }, "", "#profil");

    Swal.fire({
        html: `
            <div class="text-center pt-1">
             
                <!-- Ganti bagian div pembungkus dan img dengan kode ini -->
<div class="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-emerald-500 mb-3 shadow-md overflow-hidden">
    <img src="asset/arom.png" alt="Profile" class="w-full h-full object-cover">
</div>
                
                <h3 class="text-lg font-heading font-bold text-gray-800 mb-0.5">Arom Kobama</h3>
                <p class="text-[11px] text-emerald-600 font-bold mb-3 tracking-widest uppercase">Fullstack Developer</p>
                
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-5 text-xs text-gray-600 text-center leading-relaxed">
                    <b class="text-gray-800">Madasa v1.0</b><br>
                    Sistem informasi ini dikembangkan dengan dedikasi untuk mempermudah digitalisasi penilaian santri.
                </div>
                
                <p class="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wider">Temukan saya di:</p>
                <div class="flex justify-center gap-3">
                    <a href="https://www.instagram.com/aromkobama/" target="_blank" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-all shadow-sm"><i class="fab fa-instagram text-base"></i></a>
                    <a href="https://www.tiktok.com/@putramadasa/" target="_blank" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 transition-all shadow-sm"><i class="fab fa-tiktok text-base"></i></a>
                    <a href="https://www.facebook.com/arom.kobama.2025/" target="_blank" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all shadow-sm"><i class="fab fa-facebook-f text-base"></i></a>
                </div>
            </div>
        `,
        width: '320px',
        showConfirmButton: true,
        confirmButtonText: '<i class="fas fa-times mr-2"></i>Tutup',
        confirmButtonColor: '#059669',
        showCloseButton: true,
        customClass: {
            popup: 'rounded-[1.5rem] p-4',
            confirmButton: 'rounded-xl font-bold px-5 py-2 text-sm shadow-md'
        }
    }).then(() => {
        // Jika user menutup pop-up via tombol "X" atau "Tutup" (bukan back HP),
        // hapus riwayat palsu tersebut agar tombol back tetap rapi.
        if (window.location.hash === "#profil") {
            window.history.back();
        }
    });
}

// =========================================================
// FITUR MOTIVASI BANNER UTAMA (IKHLAS MENGABDI)
// =========================================================
const dataMotivasiBanner = [
    { judul: "Benih Kebaikan", teks: "\"Setiap ilmu yang kau ajarkan adalah bibit amal jariyah yang akan terus mengalirkan pahala, bahkan saat engkau telah tiada.\"" },
    { judul: "Cahaya Ilmu", teks: "\"Jadilah lentera di tengah kegelapan, sebab satu kalimat hikmah yang kau sampaikan lebih berharga daripada dunia dan segala isinya.\"" },
    { judul: "Pahlawan Senyap", teks: "\"Meski jasamu sering tak terlihat, ingatlah bahwa Allah Maha Melihat setiap tetes keringat yang jatuh demi mencerdaskan ummat.\"" },
    { judul: "Ikhlas Mendidik", teks: "\"Bukan nominal yang menjadi tujuan, namun ridha Allah yang kau cari dalam setiap langkahmu memasuki ruang kelas setiap hari.\"" },
    { judul: "Jalan Surga", teks: "\"Barangsiapa menempuh jalan untuk menuntut atau mengajarkan ilmu, maka Allah akan memudahkan baginya jalan menuju surga.\"" },
    { judul: "Ladang Pahala", teks: "\"Jangan pernah mengeluh lelah, sebab setiap detik yang kau habiskan bersama murid-murid adalah investasi berharga di akhirat kelak.\"" },
    { judul: "Sabar Tanpa Tepi", teks: "\"Hadapi kenakalan murid dengan kesabaran yang indah, karena itulah ujian yang akan mengangkat derajatmu setinggi-tingginya di sisi Allah.\"" },
    { judul: "Hati Terpanggil", teks: "\"Panggilan jiwamu menjadi guru bukan sekadar profesi, melainkan amanah besar yang kelak akan dimintai pertanggungjawaban di hadapan-Nya.\"" },
    { judul: "Pelita Ummat", teks: "\"Tugasmu mulia karena engkau sedang menjaga warisan para Nabi, yakni menyebarkan ilmu yang bermanfaat bagi kehidupan manusia.\"" },
    { judul: "Tulus Mengabdi", teks: "\"Kemuliaan seorang guru terletak pada keikhlasan hati dalam berbakti, bukan pada pujian manusia maupun besaran materi yang diterima.\"" },
    { judul: "Batu Bata", teks: "\"Setiap nasihat baik yang kau berikan adalah batu bata yang sedang kau susun untuk membangun peradaban Islam yang kokoh di masa depan.\"" },
    { judul: "Kunci Hati", teks: "\"Ilmu akan sulit meresap ke dalam akal jika tidak disiram dengan keikhlasan hati. Dekati muridmu dengan kasih sayang, ajari dengan keteladanan.\"" },
    { judul: "Pewaris Peradaban", teks: "\"Jangan bersedih saat dunia terasa sempit, karena tugasmu adalah mendidik calon-calon pemimpin ummat yang akan mendoakanmu kelak.\"" },
    { judul: "Tetap Bersinar", teks: "\"Jaga semangatmu tetap menyala, karena engkau adalah sumber energi bagi murid-muridmu dalam menapaki jalan kebenaran.\"" },
    { judul: "Bakti Murni", teks: "\"Mengajar adalah bentuk ibadah yang agung. Luruskan niatmu semata-mata karena Allah, maka lelahmu akan berganti menjadi berkah.\"" },
    { judul: "Karsa Mulia", teks: "\"Niat tulusmu dalam mendidik adalah saksi bisu di hari kiamat nanti, bahwa engkau telah berusaha menjaga amanah-Nya sebaik mungkin.\"" },
    { judul: "Benih Abadi", teks: "\"Apa yang kau tanam di pikiran dan hati muridmu hari ini, akan menjadi panen kebaikan yang terus dipetik hingga akhir zaman.\"" },
    { judul: "Syukur Guru", teks: "\"Bersyukurlah karena tanganmu dipilih oleh Allah untuk membentuk karakter manusia. Itu adalah kehormatan yang tak dimiliki sembarang orang.\"" },
    { judul: "Ujian Sabar", teks: "\"Di balik setiap kesulitan mendidik, ada pahala sabar yang sedang dicatat oleh malaikat. Jangan pernah menyerah, Allah bersamamu.\"" },
    { judul: "Pemberi Harapan", teks: "\"Seringkali engkau adalah alasan seorang anak untuk terus bermimpi. Teruslah menjadi inspirasi yang membawa mereka dekat pada-Nya.\"" },
    { judul: "Etos Kerja", teks: "\"Profesionalitasmu dalam mendidik adalah cerminan iman. Berikan yang terbaik, karena engkau sedang bekerja untuk Allah SWT.\"" },
    { judul: "Cinta Ilmu", teks: "\"Mengajar adalah cara terbaik untuk terus belajar. Semakin engkau memberi, semakin Allah akan membukakan pintu hikmah untukmu.\"" },
    { judul: "Jiwa Tangguh", teks: "\"Badai tantangan dalam mendidik tidak boleh mematahkan semangatmu, karena kekuatanmu bersumber dari pertolongan Allah yang Maha Kuat.\"" },
    { judul: "Pendidik Sejati", teks: "\"Guru sejati adalah ia yang mendidik dengan cinta dan mengharap balasan hanya dari Allah, bukan dari manusia.\"" },
    { judul: "Teguh Berdiri", teks: "\"Tetaplah teguh sebagai penunjuk jalan kebaikan, meski keadaan sulit, karena setiap huruf yang kau ajarkan adalah cahaya di dalam kubur.\"" },
    { judul: "Senyum Ikhlas", teks: "\"Senyum ramahmu di depan kelas adalah sedekah. Ia mampu mencairkan hati murid yang keras dan membuka pintu hidayah.\"" },
    { judul: "Tangan Berkah", teks: "\"Tangan yang digunakan untuk menuliskan ilmu dan membimbing murid adalah tangan yang didoakan keberkahan oleh penduduk langit dan bumi.\"" },
    { judul: "Misi Suci", teks: "\"Engkau sedang berjuang mencetak generasi yang lebih baik dan lebih bertakwa dari generasimu. Teruskan perjuangan suci ini!\"" },
    { judul: "Pendar Cahaya", teks: "\"Jadilah guru yang tidak hanya transfer materi, tapi juga transfer nilai-nilai iman yang akan membimbing mereka hingga akhirat.\"" },
    { judul: "Dedikasi Hati", teks: "\"Keikhlasanmu adalah kunci keberkahan ilmu. Tanpanya, ilmu hanya akan menjadi pengetahuan, namun dengannya, ilmu menjadi hidayah.\"" },
    { judul: "Amanah Mulia", teks: "\"Mendidik manusia adalah pekerjaan para Nabi. Sadarilah betapa mulia posisi yang sedang engkau tempati saat ini.\"" },
    { judul: "Lelah Berkah", teks: "\"Lelahmu hari ini adalah saksi perjuangan di hari penghisaban. Tidurlah dengan tenang, Allah tidak menyia-nyiakan amal hambanya.\"" },
    { judul: "Waktu Emas", teks: "\"Setiap waktu yang kau habiskan di dalam kelas adalah kesempatan untuk mengukir sejarah kebaikan dalam diri seseorang.\"" }
];

let timerBannerMotivasi; 
let timeoutBannerTransisi; // Variabel baru untuk menampung sisa animasi

function rotasiMotivasiBanner() {
    const elJudul = document.getElementById('judulBanner');
    const elTeks = document.getElementById('teksBanner');
    
    if (!elJudul || !elTeks) return;

    // Bersihkan sisa animasi sebelumnya agar tidak bertabrakan saat menu diklik cepat
    clearTimeout(timeoutBannerTransisi);

    // 1. Efek Redup (Fade Out)
    elJudul.style.opacity = '0';
    elTeks.style.opacity = '0';

    // 2. Tunggu sebentar sampai teks menghilang, lalu ganti teksnya
    timeoutBannerTransisi = setTimeout(() => {
        const acak = Math.floor(Math.random() * dataMotivasiBanner.length);
        
        elJudul.innerText = dataMotivasiBanner[acak].judul;
        elTeks.innerText = dataMotivasiBanner[acak].teks;
        
        // 3. Efek Terang Kembali (Fade In)
        elJudul.style.opacity = '1';
        elTeks.style.opacity = '1';
    }, 700); 
}

function jalankanBannerOtomatis() {
    // Hentikan timer lama (jika ada)
    clearInterval(timerBannerMotivasi);
    
    // Langsung ganti teks 1 kali saat menu Utama dibuka
    rotasiMotivasiBanner();
    
    // Putar otomatis setiap 10 detik
    timerBannerMotivasi = setInterval(rotasiMotivasiBanner, 10000);
}

// --- JALANKAN WIDGET WA HANYA JIKA SUDAH LOGIN ---
document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem('tokenMadasa')) {
        // Beri jeda 500ms agar dashboard selesai dirender
        setTimeout(tampilkanWidgetWA, 500);

        // --- TAMBAHKAN BARIS INI ---
        setTimeout(tampilkanPromptPWA, 1500);
    }
});