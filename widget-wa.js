document.addEventListener("DOMContentLoaded", function() {
    // 1. Buat elemen HTML untuk tombol WA (Ubah Nomor WA di atribut href)
    const waHTML = `
    <div id="wa-widget" class="fixed bottom-6 right-6 z-[9999] flex flex-col items-center cursor-grab select-none" style="touch-action: none;">
        <div class="bg-white text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg mb-2 whitespace-nowrap border border-emerald-100 pointer-events-none">
            Tanya Admin?
        </div>
        <a id="wa-link" href="https://wa.me/6281234567890?text=Assalamu'alaikum%20Admin,%20saya%20butuh%20bantuan%20terkait%20Sistem%20Madasa." target="_blank" class="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl transition-transform transform hover:scale-105 pointer-events-auto">
            <span class="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-50 animate-ping"></span>
            <i class="fab fa-whatsapp text-3xl relative z-10"></i>
        </a>
    </div>
    `;
    
    // Suntikkan HTML WA ke dalam <body>
    document.body.insertAdjacentHTML('beforeend', waHTML);

    // 2. Logika Efek Geser (Drag & Drop)
    const waWidget = document.getElementById('wa-widget');
    const waLink = document.getElementById('wa-link');

    let isDragging = false;
    let isMoved = false; 
    let startX, startY;

    // --- FUNGSI UNTUK DESKTOP (MOUSE) ---
    waWidget.addEventListener('mousedown', function(e) {
        isDragging = true;
        isMoved = false;
        startX = e.clientX - waWidget.getBoundingClientRect().left;
        startY = e.clientY - waWidget.getBoundingClientRect().top;
        waWidget.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        isMoved = true; 
        e.preventDefault(); 
        
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;

        newX = Math.max(0, Math.min(newX, window.innerWidth - waWidget.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - waWidget.offsetHeight));

        waWidget.style.left = newX + 'px';
        waWidget.style.top = newY + 'px';
        waWidget.style.bottom = 'auto'; 
        waWidget.style.right = 'auto';  
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        waWidget.style.cursor = 'grab';
    });

    // --- FUNGSI UNTUK HP / SMARTPHONE (TOUCH) ---
    waWidget.addEventListener('touchstart', function(e) {
        isDragging = true;
        isMoved = false;
        let touch = e.touches[0];
        startX = touch.clientX - waWidget.getBoundingClientRect().left;
        startY = touch.clientY - waWidget.getBoundingClientRect().top;
    }, {passive: false});

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        isMoved = true;
        e.preventDefault(); 
        let touch = e.touches[0];
        
        let newX = touch.clientX - startX;
        let newY = touch.clientY - startY;

        newX = Math.max(0, Math.min(newX, window.innerWidth - waWidget.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - waWidget.offsetHeight));

        waWidget.style.left = newX + 'px';
        waWidget.style.top = newY + 'px';
        waWidget.style.bottom = 'auto';
        waWidget.style.right = 'auto';
    }, {passive: false});

    document.addEventListener('touchend', function() {
        isDragging = false;
    });

    // --- PENCEGAH KLIK TIDAK SENGAJA ---
    waLink.addEventListener('click', function(e) {
        if (isMoved) {
            e.preventDefault(); 
        }
    });
});