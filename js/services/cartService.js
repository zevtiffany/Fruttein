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

function addToCart(id, name, price, img) {
    const index = cart.findIndex(item => item.id == id);
    if (index >= 0) {
        cart[index].qty += 1;
    } else {
        cart.push({ id, name, price, img, qty: 1 });
    }
    saveCart();
    renderCartBadge();

    // Simple visual feedback
    const btn = event.currentTarget || event.target;
    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "✓ DITAMBAHKAN";
        btn.style.backgroundColor = "var(--green, #4CAF50)";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = ""; // reset to default css
        }, 1000);
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
        container.innerHTML = '<p style="text-align: center; font-style: italic; color: var(--grey);">Keranjang masih kosong.</p>';
        totalInfo.innerText = formatRupiah(0);
        return;
    }

    let html = '';
    cart.forEach(item => {
        html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ccc;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <img src="${item.img || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid var(--black);">
                <div>
                    <div style="font-weight: 800; font-size: 14px;">${item.name}</div>
                    <div style="color: var(--red); font-size: 13px; font-weight: 700;">${formatRupiah(item.price)}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" onclick="updateCartQty(${item.id}, -1)" style="width: 28px; height: 28px; border: 2px solid var(--black); background: #f0f0f0; border-radius: 4px; font-weight: 800; cursor: pointer;">-</button>
                <div style="font-weight: 800; font-size: 14px; width: 20px; text-align: center;">${item.qty}</div>
                <button type="button" onclick="updateCartQty(${item.id}, 1)" style="width: 28px; height: 28px; border: 2px solid var(--black); background: var(--green); color: white; border-radius: 4px; font-weight: 800; cursor: pointer;">+</button>
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
