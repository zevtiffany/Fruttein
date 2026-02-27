/* ============================================
   AUTH — FRUTTEIN ADMIN
   Hanya admin yang login yang bisa CUD member.
   ============================================ */

let currentAdmin = null; // null = belum login

/** Apakah saat ini ada admin yang login? */
function isAdmin() {
    return currentAdmin !== null;
}

/** Login admin dengan email & password */
function adminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('adminLoginError');

    if (!email || !password) {
        errEl.textContent = '⚠️ Email dan password wajib diisi.';
        return;
    }

    errEl.textContent = '';

    if (!auth) {
        errEl.textContent = '❌ Sistem gagal terhubung ke Firebase. Pastikan kamu membuka web melalui localhost dan memiliki koneksi internet.';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('adminLoginForm').style.display = 'none';
            document.getElementById('adminPassword').value = '';
        })
        .catch((err) => {
            // Tampilkan pesan error spesifik dari Firebase agar mudah di-debug
            let errorMsg = '❌ Login gagal: ';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMsg += 'Email atau password salah. Pastikan akun terdaftar di Firebase.';
            } else if (err.code === 'auth/invalid-api-key') {
                errorMsg += 'API Key Firebase tidak valid. Periksa konfigurasi kredensial.';
            } else if (err.code === 'auth/operation-not-allowed') {
                errorMsg += 'Metode login Email/Password belum diaktifkan di Firebase Console.';
            } else {
                errorMsg += err.message + ' (' + err.code + ')';
            }

            errEl.textContent = errorMsg;
            console.error('Auth error:', err.code, err.message);
        });
}

/** Logout admin */
function adminLogout() {
    auth.signOut();
}

/** Tampilkan / sembunyikan form login */
function toggleLoginForm() {
    const form = document.getElementById('adminLoginForm');
    form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'block' : 'none';
}

/** Update tampilan UI berdasarkan status login */
function updateAdminUI(user) {
    const adminOnlyEls = document.querySelectorAll('.admin-only');
    const loginBtn = document.getElementById('adminLoginToggleBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const adminBadge = document.getElementById('adminBadge');

    if (user) {
        // Admin sudah login
        adminOnlyEls.forEach(el => el.style.removeProperty('display'));
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (adminBadge) adminBadge.style.display = 'inline-block';

        // Khusus untuk tombol Naviasi Admin PO supaya display flex
        const adminNav = document.querySelector('a[onclick="openModal(\'adminPoModal\')"]');
        if (adminNav) adminNav.style.display = 'block';
    } else {
        // Belum login / sudah logout
        adminOnlyEls.forEach(el => el.style.display = 'none');
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminBadge) adminBadge.style.display = 'none';

        const adminNav = document.querySelector('a[onclick="openModal(\'adminPoModal\')"]');
        if (adminNav) adminNav.style.display = 'none';

        // Sembunyikan form login saat logout
        const form = document.getElementById('adminLoginForm');
        if (form) form.style.display = 'none';
    }
}

/* ---- Auth state listener diinisialisasi dari script.js (setelah memberManager siap) ---- */
