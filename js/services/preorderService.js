/* ============================================
   PREORDER SYSTEM FUNCTIONS
   ============================================ */

const PO_DATES_COLLECTION = 'po_dates';

/** Format Date as YYYY-MM-DD for consistency (Local timezone) */
function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Check if current time is past 13:00 (1 PM) */
function isPast13() {
    const now = new Date();
    return now.getHours() >= 13;
}

/** Customer UI: Load open PO Dates into select dropdown */
function loadPoDatesForCustomer() {
    const select = document.getElementById('poDate');
    const frontBadge = document.getElementById('frontPoQuotaBadge');

    if (!select) return;

    const msg = document.getElementById('poStatusMsg');
    if (msg) msg.style.display = 'none';

    select.innerHTML = '<option value="">Memuat tanggal...</option>';
    if (frontBadge) frontBadge.innerHTML = 'Memuat sisa stok PO...';

    db.collection(PO_DATES_COLLECTION)
        .orderBy('date', 'asc')
        .onSnapshot((snapshot) => {
            select.innerHTML = '';

            const now = new Date();
            // Format manual "YYYY-MM-DD" untuk hari ini berdasar zona waktu perangkat user
            const todayStr = formatDate(now);
            const pastCutoff = isPast13();
            let hasValidOptions = false;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data.isOpen) return; // Cek manual disini untuk menghindari kewajiban membuat Index di Firebase!

                const dateStr = data.date; // YYYY-MM-DD format langsung dari HTML5 input type="date"
                const qty = data.totalItems || 0;

                // Cek syarat tampil:
                // 1. Tanggalnya bukan yang sudah lewat (berdasarkan string komparasi YYYY-MM-DD)
                if (dateStr < todayStr) return;

                // 2. Jika tanggalnya persis hari ini, cek apakah sudah jam 13:00 siang
                if (dateStr === todayStr && pastCutoff) return; // Lewat H-4 cutoff jam 13:00

                // 3. Cek kuota penuh
                if (qty >= 10) return; // Kuota 10 habis

                // Jika lolos semua validasi:
                hasValidOptions = true;
                const opt = document.createElement('option');
                opt.value = dateStr;

                // Parsing manual agar tidak kena timezone shift UTC
                const parts = dateStr.split('-');
                const niceDate = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                opt.textContent = `${niceDate} (Sisa Kuota: ${10 - qty})`;
                select.appendChild(opt);
            });

            if (!hasValidOptions) {
                select.innerHTML = '<option value="">Maaf, tidak ada tanggal PO yang tersedia / kuota penuh</option>';
                if (frontBadge) frontBadge.innerHTML = '<span style="color:var(--red);">⚠️ Semua PO Penuh / Habis</span>';
            } else {
                // Add default prompt option
                const defOpt = document.createElement('option');
                defOpt.value = "";
                defOpt.textContent = "-- Pilih Tanggal --";
                defOpt.selected = true;
                defOpt.disabled = true;
                select.prepend(defOpt);

                // Front quota badge updater (get the very first valid option's quota)
                if (frontBadge) {
                    const firstValidDate = select.options[1].textContent;
                    frontBadge.innerHTML = `🌟 <strong>TERSEDIA:</strong> ${firstValidDate} <a href="#menu" style="color:inherit; text-decoration:underline;">(Pesan Sekarang)</a>`;
                }
            }
        }, (error) => {
            console.error("Error loading dates:", error);

            let errMsg = "Gagal memuat tanggal.";
            if (error.code === 'permission-denied') {
                errMsg = "Akses Ditolak: Cek Rules Firebase (allow read, write: if true;)";
            } else if (error.code === 'failed-precondition') {
                errMsg = "Gagal memuat: Database perlu index (Lihat Console)";
            }

            select.innerHTML = `<option value="">${errMsg}</option>`;
        });
}

/** Customer UI: Submit Preorder Form */
function submitPreorder(e) {
    e.preventDefault();
    const msg = document.getElementById('poStatusMsg');
    const btn = document.getElementById('poSubmitBtn');

    const name = document.getElementById('poName').value.trim();
    const phone = document.getElementById('poPhone').value.trim();
    const gmaps = document.getElementById('poGmaps').value.trim();
    const landmark = document.getElementById('poLandmark').value.trim();
    const productVal = document.getElementById('poProduct').value;
    const qty = parseInt(document.getElementById('poQty').value, 10);
    const dateObjStr = document.getElementById('poDate').value;

    let productName = "Produk";
    if (productVal === '1') productName = "Nanamango";
    if (productVal === '2') productName = "Stropis";
    if (productVal === '3') productName = "Banavoca";

    if (!/^[0-9]+$/.test(phone)) {
        showPoStatus('⚠️ Nomor WhatsApp hanya boleh diisi dengan angka saja tanpa spasi/simbol.', true);
        return;
    }

    if (!gmaps || !landmark) {
        showPoStatus('⚠️ Ops! Link Gmaps & Penanda Visual wajib diisi.', true);
        return;
    }

    if (!dateObjStr) {
        showPoStatus('⚠️ Silakan pilih tanggal pengiriman yang valid.', true);
        return;
    }

    if (qty < 1 || qty > 10) {
        showPoStatus('⚠️ Jumlah pesanan tidak valid (1-10 barang).', true);
        return;
    }

    btn.disabled = true;
    btn.textContent = "MEMPROSES...";
    showPoStatus('⏳ Sedang mengecek kuota pesanan...', false);

    const docRef = db.collection(PO_DATES_COLLECTION).doc(dateObjStr);

    db.runTransaction((transaction) => {
        return transaction.get(docRef).then((dateDoc) => {
            if (!dateDoc.exists) {
                throw "Tanggal tidak ditemukan sistem.";
            }

            const data = dateDoc.data();
            const currentQty = data.totalItems || 0;

            if (!data.isOpen) throw "Tanggal tersebut sudah ditutup oleh Admin.";
            if (currentQty + qty > 10) throw `Maaf, kuota untuk tanggal tersebut tinggal sisa ${10 - currentQty} barang.`;

            // Update the quota
            transaction.update(docRef, { totalItems: currentQty + qty });
            return true; // Success
        });
    }).then(() => {
        // 2. Jika transaksi sukses, simpan data record PO ke dalam collection po_orders
        return db.collection('po_orders').add({
            name: name,
            phone: phone,
            gmaps: gmaps,
            landmark: landmark,
            productName: productName,
            qty: qty,
            deliveryDate: dateObjStr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(() => {
        // --- 3. Auto-Register Member & Add Purchase ---
        // Check if member already exists by phone number
        const membersRef = db.collection('members');
        return membersRef.where('phone', '==', phone).get().then(snapshot => {
            if (snapshot.empty) {
                // New member
                const newMember = {
                    name: name.trim(),
                    phone: phone.trim(),
                    points: typeof LOYALTY_CONFIG !== 'undefined' ? LOYALTY_CONFIG.POINTS_PER_PURCHASE : 1, // Fallback if config not loaded
                    purchases: 1, // 1st purchase
                    rewards: 0,
                    joinDate: new Date().toLocaleDateString('id-ID'),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                return membersRef.add(newMember);
            } else {
                // Existing member
                const memberDoc = snapshot.docs[0];
                const memberData = memberDoc.data();
                const pointsToAdd = typeof LOYALTY_CONFIG !== 'undefined' ? LOYALTY_CONFIG.POINTS_PER_PURCHASE : 1;

                return membersRef.doc(memberDoc.id).update({
                    points: (memberData.points || 0) + pointsToAdd,
                    purchases: (memberData.purchases || 0) + 1
                });
            }
        });
    }).then(() => {
        showPoStatus('✅ Pesanan & Data Member berhasil dicatat! Mengalihkan ke WhatsApp...', false);

        // Redirect ke WA
        setTimeout(() => {
            const waNumber = "6285204575882";
            const niceDate = new Date(dateObjStr.split('-')[0], dateObjStr.split('-')[1] - 1, dateObjStr.split('-')[2]).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const teks = `Halo Fruttein! Saya ingin PREORDER:\n\n*Nama:* ${name}\n*Nomor WA:* ${phone}\n*Link Gmaps:* ${gmaps}\n*Penanda Visual:* ${landmark}\n*Produk:* ${productName}\n*Jumlah:* ${qty} barang\n*Tgl Pengiriman:* ${niceDate}\n\nMohon konfirmasinya ya!`;

            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(teks)}`, '_blank');

            closeModal('preorderModal');
            document.getElementById('preorderForm').reset();
            btn.disabled = false;
            btn.textContent = "KIRIM PREORDER (WA)";
        }, 1500);

    }).catch((err) => {
        console.error("PO Transaction error:", err);
        showPoStatus(`❌ Gagal: ${err}`, true);
        btn.disabled = false;
        btn.textContent = "KIRIM PREORDER (WA)";
    });
}

function showPoStatus(text, isErr) {
    const msg = document.getElementById('poStatusMsg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.backgroundColor = isErr ? '#FFEBEB' : '#EDFCE8';
    msg.style.color = isErr ? '#E3000B' : '#007A2E';
}

/* ============================================
   ADMIN PO MANAGEMENT
   ============================================ */

/** Admin: Add new Open PO Date */
function addPoDate() {
    if (!isAdmin()) { alert('Login admin dulu!'); return; }

    const dateVal = document.getElementById('newPoDate').value; // format YYYY-MM-DD otomatis dari input date
    if (!dateVal) { alert('Pilih tanggalnya dulu!'); return; }

    // Save to DB
    db.collection(PO_DATES_COLLECTION).doc(dateVal).set({
        date: dateVal,
        isOpen: true,
        totalItems: 0 // initial quota used
    }, { merge: true }).then(() => {
        alert('✅ Tanggal PO berhasil ditambahkan/dibuka!');
        document.getElementById('newPoDate').value = "";
    }).catch(err => {
        alert('❌ Gagal: ' + err.message);
    });
}

/** Admin: Toggle Open/Close or delete */
function togglePoDate(dateStr, makeOpen) {
    if (!isAdmin()) return;

    db.collection(PO_DATES_COLLECTION).doc(dateStr).update({
        isOpen: makeOpen
    }).catch(err => alert(err.message));
}

/** Admin: Delete PO Date */
function deletePoDate(dateStr) {
    if (!isAdmin()) return;
    if (customConfirm) {
        customConfirm('Yakin ingin menghapus tanggal PO ini selamanya?').then(ok => {
            if (ok) db.collection(PO_DATES_COLLECTION).doc(dateStr).delete().catch(err => alert(err.message));
        });
    } else if (confirm('Yakin ingin menghapus tanggal PO ini selamanya?')) {
        db.collection(PO_DATES_COLLECTION).doc(dateStr).delete().catch(err => alert(err.message));
    }
}

/** Admin: Export PO Orders to CSV by Date */
function exportPoOrders(dateStr) {
    if (!isAdmin()) return;

    // Bypass the composite index requirement by sorting the data locally in Javascript!
    db.collection('po_orders')
        .where('deliveryDate', '==', dateStr)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                alert(`Belum ada pesanan masuk untuk tanggal ${dateStr}.`);
                return;
            }

            let docsData = [];
            snapshot.forEach(doc => docsData.push(doc.data()));

            // Sort in JS ascending
            docsData.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
                const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
                return timeA - timeB;
            });

            let csvContent = "Waktu Order,Nama Pemesan,WhatsApp,Link Gmaps,Penanda Visual,Produk,Jumlah\n";

            docsData.forEach(data => {
                // Remove the comma generated by default toLocaleString which pushes the CSV formatting
                const tsDate = data.timestamp ? data.timestamp.toDate().toLocaleString('id-ID').replace(',', ' -') : '-';

                // Escape quotes to prevent CSV breakage
                const name = `"${(data.name || '').replace(/"/g, '""')}"`;
                const phone = `"${(data.phone || '').replace(/"/g, '""')}"`;
                const gmaps = `"${(data.gmaps || '').replace(/"/g, '""')}"`;
                const landmark = `"${(data.landmark || '').replace(/"/g, '""')}"`;
                const product = `"${(data.productName || '').replace(/"/g, '""')}"`;
                const qty = data.qty || 0;

                csvContent += `${tsDate},${name},${phone},${gmaps},${landmark},${product},${qty}\n`;
            });

            // Buat file Blob dan unduh otomatis
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_PO_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        }).catch(error => {
            console.error("Export Error:", error);

            let errMsg = `Gagal mengunduh CSV: ${error.message}`;
            if (error.code === 'failed-precondition') {
                errMsg = "Gagal mengunduh: Butuh Index di Firebase untuk tabel po_orders (Cek Console)";
            }
            alert(errMsg);
        });
}
