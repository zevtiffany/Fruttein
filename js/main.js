/* ============================================
   MAIN INITIALIZATION SCRIPT
   ============================================ */

let memberManager;

window.addEventListener('firebaseReady', function () {
    // 1. Inisialisasi Sistem Member
    memberManager = new MemberManager();
    setupEventListeners();
    setupTableEventDelegation();

    // 2. Setup Auth Listener (dari auth.js)
    auth.onAuthStateChanged((user) => {
        currentAdmin = user;
        if (typeof updateAdminUI === 'function') updateAdminUI(user);
        if (memberManager) memberManager.render();
    });

    // 3. Listen for Preorder Form
    const poForm = document.getElementById('preorderForm');
    if (poForm) poForm.addEventListener('submit', submitPreorder);

    // 4. Initial load for PO dates dropdown customer
    loadPoDatesForCustomer();

    // 5. Setup Listener Table PO khusus Admin
    setupAdminPoTableListener();
});

/* ============================================
   EVENT LISTENERS UMUM
   ============================================ */
function setupEventListeners() {
    const memberName = document.querySelector(UI_SELECTORS.memberName);
    const memberPhone = document.querySelector(UI_SELECTORS.memberPhone);

    if (memberName && memberPhone) {
        memberName.addEventListener('keypress', handleEnter);
        memberPhone.addEventListener('keypress', handleEnter);
    }

    const pwField = document.getElementById('adminPassword');
    if (pwField) {
        pwField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                if (typeof adminLogin === 'function') adminLogin();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.is-open').forEach(function (m) {
                m.classList.remove('is-open');
                document.body.style.overflow = '';
            });
        }
    });
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        const memberName = document.querySelector(UI_SELECTORS.memberName);
        const memberPhone = document.querySelector(UI_SELECTORS.memberPhone);
        if (e.target === memberName) memberPhone.focus();
        else if (e.target === memberPhone) {
            if (typeof addMember === 'function') addMember();
        }
    }
}

/** Setup realtime listener for Admin Table */
function setupAdminPoTableListener() {
    db.collection(PO_DATES_COLLECTION)
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            const tbody = document.getElementById('poDatesBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (snapshot.docs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada tanggal PO disetel.</td></tr>';
                return;
            }

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const tr = document.createElement('tr');

                // Date parsing agar tidak geser timezone
                const dtParts = data.date.split('-');
                const niceDate = new Date(dtParts[0], dtParts[1] - 1, dtParts[2]).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

                // Status string
                const statusHTML = data.isOpen
                    ? `<span style="background:var(--green);color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">BUKA</span>`
                    : `<span style="background:var(--red);color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">TUTUP</span>`;

                const btnToggle = data.isOpen
                    ? `<button class="btn btn-action" style="background:#555;font-size:11px;" onclick="togglePoDate('${data.date}', false)">TUTUP</button>`
                    : `<button class="btn btn-action btn-success" style="font-size:11px;" onclick="togglePoDate('${data.date}', true)">BUKA</button>`;

                tr.innerHTML = `
          <td><strong>${niceDate}</strong><br><small style="color:#aaa;">${data.date}</small></td>
          <td>${statusHTML}</td>
          <td><strong>${data.totalItems || 0}</strong> / 10 barang</td>
          <td>
            ${btnToggle}
             <button class="btn btn-action" style="background:#2b6cb0;color:#fff;font-size:11px;" onclick="exportPoOrders('${data.date}')">CSV</button>
            <button class="btn btn-action btn-danger" style="font-size:11px;" onclick="deletePoDate('${data.date}')">DEL</button>
          </td>
        `;
                tbody.appendChild(tr);
            });
        });
}
