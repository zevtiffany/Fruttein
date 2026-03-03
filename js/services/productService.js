/* ============================================
   PRODUCT CMS SYSTEM
   Functions for reading and displaying products
   ============================================ */

const PRODUCTS_COLLECTION = 'products';
let isProductsSeeded = false;

// Default products to seed the database if it's completely empty
const defaultProducts = [
    {
        id: 1, // Using numeric IDs for easier frontend cart mapping initially
        name: 'Nanamango',
        price: 17000,
        description: 'Kombinasi sempurna Buah Naga, Pisang, Mangga & Golden Nectar untuk rasa yang eksplosif.',
        image: 'assets/images/Nanamango.jpeg',
        tagText: 'BEST SELLER',
        tagColor: '', // default red neo-brutalism in CSS uses no extra class
        hexColor: '#C41E5E', // exact branding color
        isActive: true,
        order: 1
    },
    {
        id: 2,
        name: 'Stropis',
        price: 17000,
        description: 'Manis dan lezat dari kombinasi Strawberry, Pisang, Yoghurt & Golden Nectar.',
        image: 'assets/images/Stropis.jpeg',
        tagText: 'FAVORIT',
        tagColor: 'menu-tag--blue',
        hexColor: '#FFD6E0',
        isActive: true,
        order: 2
    },
    {
        id: 3,
        name: 'Banavoca',
        price: 17000,
        description: 'Kaya nutrisi dari Alpukat, Pisang, Fresh Milk & Golden Nectar yang creamy.',
        image: 'assets/images/Banavoca.jpeg',
        tagText: 'CREAMY',
        tagColor: 'menu-tag--green',
        hexColor: '#6B8E23',
        isActive: true,
        order: 3
    }
];

/** 
 * Automatically seed the DB with 3 default items if collection is empty
 */
async function seedProductsIfNeeded() {
    if (isProductsSeeded) return;

    try {
        const snapshot = await db.collection(PRODUCTS_COLLECTION).limit(1).get();
        if (snapshot.empty) {
            console.log("Database products kosong. Mengisi dengan 3 menu default FRUTTEIN...");
            const batch = db.batch();
            defaultProducts.forEach(prod => {
                // we'll use auto-ID as the document key, but keep the `id` field inside for the cart
                const newRef = db.collection(PRODUCTS_COLLECTION).doc(prod.id.toString());
                batch.set(newRef, prod);
            });
            await batch.commit();
            console.log("Berhasil mengisi menu default.");
        }
        isProductsSeeded = true;
    } catch (e) {
        console.error("Gagal melakukan seeding produk:", e);
    }
}

/**
 * Load Active Products for the Customer Homepage Menu
 */
function loadProductsForCustomer() {
    const container = document.getElementById('menuGridContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; font-family: var(--font-number); font-size: 20px;">Memuat Menu...</div>';

    // First ensure we have products seeded
    seedProductsIfNeeded().then(() => {
        // Then listen to the collection in real-time
        // Avoiding .where() combined with .orderBy() to prevent mandatory composite index creation
        db.collection(PRODUCTS_COLLECTION)
            .orderBy('order', 'asc')
            .onSnapshot(snapshot => {
                let html = '';

                if (snapshot.empty) {
                    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; font-weight:800; color: var(--red);">Belum ada menu yang tersedia. Hubungi Admin.</div>';
                    return;
                }

                let activeCount = 0;

                snapshot.docs.forEach(doc => {
                    const data = doc.data();

                    // Filter in memory to bypass composite index requirement
                    if (!data.isActive) return;
                    activeCount++;

                    const docId = doc.id; // Usually we use Firebase ID, but our cart relies on numeric IDs currently
                    const numericId = data.id || parseInt(docId) || Date.now();

                    // Construct color classes specific to Fruttein's CSS
                    let tagHtml = '';
                    if (data.tagText) {
                        const tagClass = data.tagColor ? `menu-tag ${data.tagColor}` : `menu-tag`;
                        tagHtml = `<span class="${tagClass}">${data.tagText.toUpperCase()}</span>`;
                    }

                    html += `
                        <div class="menu-item" style="border-top: 8px solid ${data.hexColor || '#000'};">
                            <img src="${data.image}" alt="${data.name}" onerror="this.src='https://via.placeholder.com/300x300.png?text=NO+IMAGE'">
                            <div class="menu-item-content">
                                ${tagHtml}
                                <h3>${data.name}</h3>
                                <p class="menu-price" style="font-size: 20px; font-weight: 800; font-family: var(--font-hero); margin-bottom: 8px;">${formatRupiah(data.price)}</p>
                                <p>${data.description}</p>
                                <a href="javascript:void(0)" id="addBtn-${numericId}" onclick="addToCart(${numericId}, '${data.name}', ${data.price}, '${data.hexColor || ''}')" class="order-link">🛒 TAMBAH</a>
                            </div>
                        </div>
                    `;
                });

                if (activeCount === 0) {
                    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; font-weight:800; color: var(--red);">Belum ada menu yang aktif. Hubungi Admin.</div>';
                } else {
                    container.innerHTML = html;
                }
            }, error => {
                console.error("Error memuat produk:", error);
                container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--red);">Gagal memuat produk. Cek koneksi Anda.</div>`;
            });
    });
}

/* ============================================
   ADMIN FUNCTIONS (CRUD Products)
   ============================================ */

/** Load all products (active & inactive) for the CMS Table */
let adminProductsStore = [];
function loadAdminProducts() {
    const tbody = document.getElementById('adminProductsBody');
    if (!tbody) return;

    db.collection(PRODUCTS_COLLECTION).orderBy('order', 'asc').onSnapshot(snapshot => {
        adminProductsStore = [];
        let html = '';

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada produk.</td></tr>';
            return;
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            // Store for easy edit retrieval
            adminProductsStore.push({ ...data, docId });

            const statusBadge = data.isActive
                ? '<span style="background:var(--green); color:white; padding:4px 8px; border-radius:4px; font-weight:800; font-size:12px;">AKTIF</span>'
                : '<span style="background:var(--red); color:white; padding:4px 8px; border-radius:4px; font-weight:800; font-size:12px;">OFF</span>';

            html += `
                <tr>
                    <td style="text-align:center;">${data.order || 0}</td>
                    <td>
                        <img src="${data.image}" style="width:50px; height:50px; object-fit:cover; border:2px solid var(--black); border-radius:4px;" onerror="this.src='https://via.placeholder.com/50?text=NO+IMG'">
                    </td>
                    <td>
                        <strong>${data.name}</strong><br>
                        <small style="color:var(--grey);">${data.description.substring(0, 30)}...</small>
                    </td>
                    <td>${formatRupiah(data.price)}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td>
                        <div style="display:flex; gap:5px; flex-wrap:wrap;">
                            <button onclick="editProduct('${docId}')" style="background:var(--yellow); border:2px solid var(--black); font-weight:800; padding:4px 8px; cursor:pointer;">✏️ Edit</button>
                            <button onclick="toggleProductActive('${docId}', ${data.isActive})" style="background:${data.isActive ? '#ccc' : 'var(--blue)'}; border:2px solid var(--black); font-weight:800; padding:4px 8px; cursor:pointer;">
                                ${data.isActive ? '👁️ Sembunyikan' : '👁️ Tampilkan'}
                            </button>
                            <button onclick="deleteProduct('${docId}', '${data.name}')" style="background:var(--red); color:white; border:2px solid var(--black); font-weight:800; padding:4px 8px; cursor:pointer;">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
}

function resetProductForm() {
    document.getElementById('adminProductForm').reset();
    document.getElementById('prodDocId').value = '';
    document.getElementById('prodId').value = '';
    document.getElementById('prodSaveBtn').innerText = 'SIMPAN PRODUK BARU';
    document.getElementById('prodSaveBtn').style.background = 'var(--primary)';
}

function editProduct(docId) {
    const prod = adminProductsStore.find(p => p.docId === docId);
    if (!prod) return;

    document.getElementById('prodDocId').value = docId;
    document.getElementById('prodId').value = prod.id || '';
    document.getElementById('prodName').value = prod.name || '';
    document.getElementById('prodPrice').value = prod.price || '';
    document.getElementById('prodDesc').value = prod.description || '';
    document.getElementById('prodImage').value = prod.image || '';
    document.getElementById('prodTagText').value = prod.tagText || '';
    document.getElementById('prodTagColor').value = prod.tagColor || '';
    document.getElementById('prodHexColor').value = prod.hexColor || '';
    document.getElementById('prodIsActive').checked = prod.isActive;
    document.getElementById('prodOrder').value = prod.order || 0;

    document.getElementById('prodSaveBtn').innerText = 'UPDATE PRODUK';
    document.getElementById('prodSaveBtn').style.background = 'var(--yellow)';
}

async function saveAdminProduct(e) {
    e.preventDefault();
    if (!isAdmin()) {
        alert("Akses Ditolak. Silakan login sebagai Admin.");
        return;
    }

    const docId = document.getElementById('prodDocId').value;

    // Auto generate an ID for new products to be used by the cart
    const prodIdRaw = document.getElementById('prodId').value;
    const numericId = prodIdRaw ? parseInt(prodIdRaw) : Date.now();

    const productData = {
        id: numericId,
        name: document.getElementById('prodName').value.trim(),
        price: parseInt(document.getElementById('prodPrice').value),
        description: document.getElementById('prodDesc').value.trim(),
        image: document.getElementById('prodImage').value.trim(),
        tagText: document.getElementById('prodTagText').value.trim(),
        tagColor: document.getElementById('prodTagColor').value.trim(),
        hexColor: document.getElementById('prodHexColor').value.trim() || '#000000',
        isActive: document.getElementById('prodIsActive').checked,
        order: parseInt(document.getElementById('prodOrder').value) || 0
    };

    try {
        if (docId) {
            // Update existing
            await db.collection(PRODUCTS_COLLECTION).doc(docId).update(productData);
            alert("Produk berhasil diperbarui!");
        } else {
            // Add new using standard auto-id (or forcing numeric string if we preferred, but auto-id is safer for scale)
            await db.collection(PRODUCTS_COLLECTION).add(productData);
            alert("Produk baru berhasil ditambahkan!");
        }
        resetProductForm();
    } catch (err) {
        console.error("Gagal menyimpan produk:", err);
        alert("Gagal menyimpan produk: " + err.message);
    }
}

async function deleteProduct(docId, name) {
    if (!isAdmin()) return;

    // We cannot use confirm() if we want strictly custom UI, but for admin a native confirm is often acceptable.
    // Fruttein has a customConfirm, let's use standard confirm for admin simplicity unless there's a strict rule.
    if (confirm(`Apakah Anda yakin ingin MENGHAPUS produk "${name}" secara PERMANEN dari menu?`)) {
        try {
            await db.collection(PRODUCTS_COLLECTION).doc(docId).delete();
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus produk: " + err.message);
        }
    }
}

async function toggleProductActive(docId, currentStatus) {
    if (!isAdmin()) return;
    try {
        await db.collection(PRODUCTS_COLLECTION).doc(docId).update({
            isActive: !currentStatus
        });
    } catch (err) {
        console.error(err);
        alert("Gagal mengubah status produk.");
    }
}
