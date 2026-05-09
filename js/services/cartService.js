/* ============================================
   CART SYSTEM FUNCTIONS
   ============================================ */

let cart = [];

function initCart() {
    const savedCart = localStorage.getItem('fruttein_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
    renderCartBadge();
}

function saveCart() {
    localStorage.setItem('fruttein_cart', JSON.stringify(cart));
}

function addToCart(id, name, price, hexColor) {
    const index = cart.findIndex(item => item.id == id);
    if (index >= 0) {
        cart[index].qty += 1;
    } else {
        cart.push({ id, name, price, hexColor, qty: 1 });
    }
    saveCart();
    renderCartBadge();

    // Simple visual feedback
    const btn = document.getElementById('addBtn-' + id);
    if (btn) {
        const originalText = "🛒 TAMBAH"; // Hardcode default to prevent stuck states
        btn.innerText = "✅ DITAMBAHKAN!";
        btn.style.backgroundColor = "var(--green)";
        btn.style.color = "white";
        // prevent multiple rapid clicks confusing the timeout
        if (btn.dataset.timeoutId) clearTimeout(parseInt(btn.dataset.timeoutId));

        const timeoutId = setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = ""; // reset to default css
            btn.style.color = "";
            btn.dataset.timeoutId = "";
        }, 1200);
        btn.dataset.timeoutId = timeoutId.toString();
    }
}

function updateCartQty(id, change) {
    const index = cart.findIndex(item => item.id == id);
    if (index >= 0) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        renderCartBadge();

        // If we are currently viewing the cart
        if (typeof renderCartModalList === 'function') {
            renderCartModalList();
        }
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id != id);
    saveCart();
    renderCartBadge();

    if (typeof renderCartModalList === 'function') {
        renderCartModalList();
    }
}

function getCartTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotalPrice() {
    return cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function clearCart() {
    cart = [];
    saveCart();
    renderCartBadge();
}

function renderCartBadge() {
    const badge = document.getElementById('floatingCartBadge');
    if (!badge) return;

    const totalItems = getCartTotalItems();
    const totalPrice = getCartTotalPrice();

    if (totalItems > 0) {
        badge.style.display = 'flex';
        badge.innerHTML = `
            <div class="cart-badge-info">
                <span class="cart-badge-icon">🛒</span>
                <span class="cart-badge-text">${totalItems} Item - ${formatRupiah(totalPrice)}</span>
            </div>
        `;
    } else {
        badge.style.display = 'none';
    }
}

function renderCartModalList() {
    const container = document.getElementById('cartItemsContainer');
    const totalInfo = document.getElementById('cartTotalPriceInfo');

    if (!container || !totalInfo) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; font-style: italic; color: var(--subtle);">Keranjang masih kosong.</p>';
        totalInfo.innerText = formatRupiah(0);
        return;
    }

    let html = '';
    cart.forEach(item => {
        // Evaluate dynamic hex color inherited from product CMS
        let blockColor = item.hexColor || '#C41E5E'; // fallback default

        // Simple generic luminance check for text contrast:
        // Assume (#FFD...) needs dark text. For pure programmatic genericness we can check first char if it's very light.
        // But for Fruttein's branding scope, #FFD6E0 is the main light one.
        const isLight = blockColor.toUpperCase() === '#FFD6E0';
        let textColor = isLight ? 'var(--black)' : 'white';
        let textShadow = isLight ? 'none' : '1px 1px 0 var(--black)';

        html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--glass-border);">
            <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                <div style="width: 50px; height: 50px; border-radius: 12px; border: 1px solid var(--glass-border); background: ${blockColor}; color: ${textColor}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 22px; font-weight: 800; text-shadow: ${textShadow}; box-shadow: inset 0 0 10px rgba(0,0,0,0.2);">
                    ${item.name.charAt(0)}
                </div>
                <div>
                    <div style="font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--white); letter-spacing: 0.5px;">${item.name}</div>
                    <div style="font-family: var(--font-mono); color: var(--neon); font-size: 13px; font-weight: 700;">${formatRupiah(item.price)}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" onclick="updateCartQty(${item.id}, -1)" style="width: 32px; height: 32px; border: 1px solid var(--subtle); background: rgba(255,255,255,0.05); color: var(--white); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">-</button>
                <div style="font-family: var(--font-mono); font-weight: 700; font-size: 14px; color: var(--white); width: 24px; text-align: center;">${item.qty}</div>
                <button type="button" onclick="updateCartQty(${item.id}, 1)" style="width: 32px; height: 32px; border: 1px solid var(--neon-dim); background: rgba(13,255,0,0.1); color: var(--neon); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">+</button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    totalInfo.innerText = formatRupiah(getCartTotalPrice());
}

// Intercept specific modal open to render cart data
const originalOpenModal = window.openModal;
if (typeof originalOpenModal === 'function') {
    window.openModal = function (modalId) {
        if (modalId === 'cartModal') {
            renderCartModalList();

            // Populasikan Dropdown Tanggal pada Cart Modal!
            if (typeof loadPoDatesForCustomer === 'function') {
                loadPoDatesForCustomer();
            }
        }
        originalOpenModal(modalId);
    }
}

// Call on load
document.addEventListener('DOMContentLoaded', () => {
    initCart();
});

