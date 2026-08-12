const GAS_URL = 'https://script.google.com/macros/s/AKfycbx8JOJ6y1m0sLgqLPcMKr6zH39qAIageberRfGjLIpzI33ffSX2YjqV68lYzo_rHarV/exec';

// Gunakan URL unik pada setiap request agar browser/proxy tidak memakai ulang
// redirect sementara ContentService Google Apps Script.
function buildGasUrl() {
    const separator = GAS_URL.includes('?') ? '&' : '?';
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `${GAS_URL}${separator}__madasa_cb=${encodeURIComponent(nonce)}`;
}

function gasFetch(options = {}) {
    return fetch(buildGasUrl(), {
        ...options,
        cache: 'no-store',
        redirect: 'follow'
    });
}


// =========================================================
// JSONP KHUSUS READ-ONLY
// Dipakai untuk pembacaan status nilai agar tidak terhambat
// CORS redirect ContentService Google Apps Script.
// =========================================================
function gasJsonp(action, params = {}, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const callbackName = `__madasa_jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const url = new URL(GAS_URL);
        url.searchParams.set('action', action);
        url.searchParams.set('callback', callbackName);
        url.searchParams.set('__madasa_jsonp_cb', `${Date.now()}_${Math.random().toString(36).slice(2)}`);

        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });

        const script = document.createElement('script');
        let timer = null;
        let selesai = false;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            if (script.parentNode) script.parentNode.removeChild(script);
            try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        };

        window[callbackName] = (payload) => {
            if (selesai) return;
            selesai = true;
            cleanup();
            resolve(payload);
        };

        script.async = true;
        script.src = url.toString();
        script.onerror = () => {
            if (selesai) return;
            selesai = true;
            cleanup();
            reject(new Error('Gagal membaca data dari Apps Script melalui JSONP.'));
        };

        timer = setTimeout(() => {
            if (selesai) return;
            selesai = true;
            cleanup();
            reject(new Error('Permintaan JSONP ke Apps Script melebihi batas waktu.'));
        }, timeoutMs);

        document.head.appendChild(script);
    });
}

// Ekspos helper secara eksplisit agar selalu tersedia untuk seluruh halaman klasik.
window.buildGasUrl = buildGasUrl;
window.gasFetch = gasFetch;
window.gasJsonp = gasJsonp;
