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

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('adminLoginForm').style.display = 'none';
            document.getElementById('adminPassword').value = '';
        })
        .catch((err) => {
            errEl.textContent = '❌ Login gagal: Email atau password salah.';
            console.error('Auth error:', err.code);
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
    } else {
        // Belum login / sudah logout
        adminOnlyEls.forEach(el => el.style.display = 'none');
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminBadge) adminBadge.style.display = 'none';
        // Sembunyikan form login saat logout
        const form = document.getElementById('adminLoginForm');
        if (form) form.style.display = 'none';
    }
}

/* ---- Auth state listener diinisialisasi dari script.js (setelah memberManager siap) ---- */
