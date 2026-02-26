/* ============================================
   UI & MODAL LOGIC
   ============================================ */

/* ---- Custom Confirm Dialog (mengganti window.confirm) ---- */
function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customConfirmOverlay');
        const msgEl = document.getElementById('customConfirmMsg');
        const okBtn = document.getElementById('customConfirmOk');
        const cancelBtn = document.getElementById('customConfirmCancel');
        if (!overlay) { resolve(window.confirm(message)); return; }

        msgEl.textContent = message;
        overlay.style.display = 'flex';

        function cleanup() {
            overlay.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        }
        function onOk() { cleanup(); resolve(true); }
        function onCancel() { cleanup(); resolve(false); }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

/* ---- Status bar helper ---- */
function showStatus(msg, isError) {
    const bar = document.getElementById('memberStatusBar');
    if (!bar) return;
    bar.textContent = msg;
    bar.style.display = 'block';
    bar.style.background = isError ? '#E3000B' : '#007A2E';
    bar.style.color = '#fff';
    clearTimeout(bar._timer);
    bar._timer = setTimeout(() => { bar.style.display = 'none'; }, 5000);
}

/* ============================================
   MODAL CORE FUNCTIONS
   ============================================ */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
    if (modalId === 'preorderModal') {
        // Refresh the dates specifically on open just in case
        if (typeof loadPoDatesForCustomer === 'function') {
            loadPoDatesForCustomer();
        }
    }
}

/** Buka modal PO khusus dengan mengunci pilihan produknya */
function openPreorderModal(productId) {
    const sel = document.getElementById('poProduct');
    if (sel) {
        sel.value = productId;

        // Explicitly hide all other options so it can't be changed natively
        Array.from(sel.options).forEach(opt => {
            if (opt.value != productId) {
                opt.style.display = 'none';
                opt.disabled = true;
            } else {
                opt.style.display = '';
                opt.disabled = false;
            }
        });
    }
    openModal('preorderModal');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.remove('is-open'); document.body.style.overflow = ''; }
}

function handleOverlayClick(event, modalId) {
    if (event.target === event.currentTarget) closeModal(modalId);
}
