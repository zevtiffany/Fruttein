/* ============================================
   FRUTTEIN MEMBER MANAGEMENT SYSTEM
   ============================================ */

const MEMBERS_COLLECTION = 'members';

class MemberManager {
    constructor() {
        this.members = [];
        this.unsubscribe = null;
        this.listenToMembers();
    }

    /**
     * Realtime listener ke Firestore — otomatis update UI
     */
    listenToMembers() {
        this.unsubscribe = db.collection(MEMBERS_COLLECTION)
            .onSnapshot((snapshot) => {
                this.members = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data()
                }));
                // Sort client-side berdasarkan createdAt (aman untuk dokumen lama)
                this.members.sort((a, b) => {
                    const ta = a.createdAt ? a.createdAt.toMillis() : 0;
                    const tb = b.createdAt ? b.createdAt.toMillis() : 0;
                    return ta - tb;
                });
                this.render();
            }, (error) => {
                console.error('Firestore listener error:', error);
                showStatus('❌ Gagal memuat data: ' + (error.code || error.message), true);
            });
    }

    /**
     * Tambah member baru (khusus admin)
     */
    addMember(name, phone) {
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu!', true); return false; }
        if (!name.trim() || !phone.trim()) { alert(MESSAGES.EMPTY_FIELD); return false; }
        if (!/^[\d\s\-\+]+$/.test(phone)) { alert(MESSAGES.INVALID_PHONE); return false; }

        const newMember = {
            name: name.trim(),
            phone: phone.trim(),
            points: 0,
            purchases: 0,
            rewards: 0,
            joinDate: new Date().toLocaleDateString('id-ID'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        showStatus('⏳ Menyimpan member baru...', false);
        db.collection(MEMBERS_COLLECTION).add(newMember)
            .then(() => showStatus('✅ Member berhasil ditambahkan!', false))
            .catch(err => {
                showStatus('❌ Gagal tambah: ' + (err.code || err.message), true);
                console.error('Add error:', err);
            });

        return true;
    }

    /**
     * Tambah pembelian (khusus admin)
     */
    addPurchase(firestoreId) {
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu!', true); return; }

        const member = this.members.find(m => m.firestoreId === firestoreId);
        if (!member) { showStatus('❌ Member tidak ditemukan.', true); return; }

        const newPoints = member.points + LOYALTY_CONFIG.POINTS_PER_PURCHASE;
        const newPurchases = member.purchases + 1;

        showStatus('⏳ Menambah pembelian...', false);
        db.collection(MEMBERS_COLLECTION).doc(firestoreId)
            .update({ points: newPoints, purchases: newPurchases })
            .then(() => {
                showStatus('✅ Pembelian ditambahkan!', false);
                if (newPoints === LOYALTY_CONFIG.POINTS_FOR_REWARD) {
                    alert(MESSAGES.MILESTONE_10(member.name));
                } else if (LOYALTY_CONFIG.MILESTONE_REWARDS.includes(newPoints)) {
                    alert(MESSAGES.MILESTONE_5(member.name));
                }
            })
            .catch(err => {
                showStatus('❌ Gagal: ' + (err.code || err.message), true);
                console.error(err);
            });
    }

    /**
     * Klaim reward (khusus admin)
     */
    claimReward(firestoreId) {
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu!', true); return; }

        const member = this.members.find(m => m.firestoreId === firestoreId);
        if (!member || member.points < LOYALTY_CONFIG.POINTS_FOR_REWARD) return;

        const claimedPoints = Math.floor(member.points / LOYALTY_CONFIG.POINTS_FOR_REWARD) * LOYALTY_CONFIG.POINTS_FOR_REWARD;
        const rewardCount = Math.floor(claimedPoints / LOYALTY_CONFIG.POINTS_FOR_REWARD);
        const newPoints = member.points - claimedPoints;
        const newRewards = (member.rewards || 0) + rewardCount;

        showStatus('⏳ Memproses klaim reward...', false);
        db.collection(MEMBERS_COLLECTION).doc(firestoreId)
            .update({ points: newPoints, rewards: newRewards })
            .then(() => {
                showStatus('✅ Reward berhasil diklaim!', false);
                alert(MESSAGES.REWARD_CLAIMED(member.name, rewardCount, newPoints));
            })
            .catch(err => {
                showStatus('❌ Gagal klaim: ' + (err.code || err.message), true);
                console.error(err);
            });
    }

    /**
     * Hapus member (khusus admin)
     */
    deleteMember(firestoreId) {
        console.log('[deleteMember] dipanggil, id=', firestoreId, 'isAdmin=', isAdmin());
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu untuk menghapus!', true); return; }
        if (!firestoreId) { showStatus('❌ ID member tidak valid.', true); return; }

        customConfirm(MESSAGES.CONFIRM_DELETE).then(ok => {
            if (!ok) return;
            showStatus('⏳ Menghapus member...', false);
            db.collection(MEMBERS_COLLECTION).doc(firestoreId)
                .delete()
                .then(() => showStatus('✅ Member berhasil dihapus!', false))
                .catch(err => {
                    console.error('Delete error:', err);
                    if (err.code === 'permission-denied') {
                        showStatus('❌ Akses ditolak! Update Firestore Rules.', true);
                        alert('❌ Akses ditolak oleh Firestore!\n\nBuka Firebase Console → Firestore → Rules dan pastikan:\nallow write: if request.auth != null;');
                    } else {
                        showStatus('❌ Gagal hapus: ' + (err.code || err.message), true);
                    }
                });
        });
    }

    /**
     * Reset semua data member (khusus admin)
     */
    resetAllData() {
        console.log('[resetAllData] dipanggil, isAdmin=', isAdmin());
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu untuk reset!', true); return; }
        if (this.members.length === 0) { showStatus('⚠️ Tidak ada data untuk direset.', true); return; }

        customConfirm(MESSAGES.CONFIRM_RESET).then(ok1 => {
            if (!ok1) return;
            customConfirm(MESSAGES.CONFIRM_RESET_AGAIN).then(ok2 => {
                if (!ok2) return;
                showStatus('⏳ Mereset semua data...', false);
                const batch = db.batch();
                this.members.forEach(member => {
                    batch.delete(db.collection(MEMBERS_COLLECTION).doc(member.firestoreId));
                });
                batch.commit()
                    .then(() => showStatus('✅ Semua data telah direset!', false))
                    .catch(err => {
                        console.error('Reset error:', err);
                        if (err.code === 'permission-denied') {
                            showStatus('❌ Akses ditolak! Update Firestore Rules.', true);
                        } else {
                            showStatus('❌ Gagal reset: ' + (err.code || err.message), true);
                        }
                    });
            });
        });
    }

    /**
     * Export data ke CSV (khusus admin)
     */
    exportToCSV() {
        if (!isAdmin()) { showStatus('⚠️ Login admin dulu!', true); return; }
        if (this.members.length === 0) { alert(MESSAGES.EXPORT_EMPTY); return; }

        // Ambil semua PO orders untuk men-join data menu ke member
        db.collection('po_orders').get().then(poSnapshot => {
            // Kelompokkan menu per nomor HP
            const menuByPhone = {};
            poSnapshot.forEach(doc => {
                const po = doc.data();
                const phone = po.phone || '';
                if (!phone) return;
                if (!menuByPhone[phone]) menuByPhone[phone] = [];
                if (Array.isArray(po.items) && po.items.length > 0) {
                    po.items.forEach(item => {
                        menuByPhone[phone].push(`${item.name}(${item.qty}x)`);
                    });
                } else if (po.productName) {
                    menuByPhone[phone].push(po.productName);
                }
            });

            let csv = 'No,Nama Member,WhatsApp,Poin,Total Pembelian (Qty),Total Reward,Tanggal Bergabung,Menu Pernah Dipesan\n';
            this.members.forEach((member, index) => {
                const menuRaw = menuByPhone[member.phone] || [];
                // Hitung frekuensi per menu
                const freq = {};
                menuRaw.forEach(m => { freq[m] = (freq[m] || 0) + 1; });
                const menuStr = Object.entries(freq).map(([m, c]) => c > 1 ? `${m}x${c}` : m).join(' | ') || '-';
                csv += `${index + 1},"${member.name}","${member.phone}",${member.points},${member.purchases},"${member.rewards || 0}","${member.joinDate}","${menuStr.replace(/"/g, '""')}"\n`;
            });

            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
            element.setAttribute('download', `fruttein_members_${new Date().getTime()}.csv`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }).catch(err => {
            // Fallback export tanpa data menu jika gagal fetch PO
            console.warn('Gagal ambil PO untuk menu, export tanpa kolom menu:', err);
            let csv = 'No,Nama Member,WhatsApp,Poin,Total Pembelian (Qty),Total Reward,Tanggal Bergabung\n';
            this.members.forEach((member, index) => {
                csv += `${index + 1},"${member.name}","${member.phone}",${member.points},${member.purchases},"${member.rewards || 0}","${member.joinDate}"\n`;
            });
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
            element.setAttribute('download', `fruttein_members_${new Date().getTime()}.csv`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    }

    /**
     * Hitung status reward
     */
    getRewardStatus(points) {
        const rewards = Math.floor(points / LOYALTY_CONFIG.POINTS_FOR_REWARD);
        const remaining = points % LOYALTY_CONFIG.POINTS_FOR_REWARD;
        if (rewards > 0) return `✅ ${rewards} hadiah siap diambil (+${remaining} poin)`;
        return `⏳ ${LOYALTY_CONFIG.POINTS_FOR_REWARD - remaining} poin lagi`;
    }

    /**
     * Render tabel member
     */
    render() {
        const tbody = document.querySelector(UI_SELECTORS.membersBody);
        const emptyState = document.querySelector(UI_SELECTORS.emptyState);
        const tableWrap = document.querySelector(UI_SELECTORS.membersTable);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.members.length === 0) {
            emptyState.style.display = 'block';
            if (tableWrap) tableWrap.parentElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            if (tableWrap) tableWrap.parentElement.style.display = 'block';

            const admin = isAdmin();

            this.members.forEach((member, index) => {
                const isReady = member.points >= LOYALTY_CONFIG.POINTS_FOR_REWARD;

                const row = document.createElement('tr');
                row.dataset.id = member.firestoreId; // Simpan ID di data attribute

                // Buat sel tabel
                const tdNo = document.createElement('td');
                const tdNama = document.createElement('td');
                const tdPhone = document.createElement('td');
                const tdPoin = document.createElement('td');
                const tdBeli = document.createElement('td');
                const tdStatus = document.createElement('td');
                const tdAksi = document.createElement('td');

                tdNo.textContent = index + 1;

                tdNama.innerHTML = `<strong>${member.name}</strong><br><small class="member-join-date">${member.joinDate}</small>`;

                let displayPhone = member.phone;
                if (!admin) {
                    const cleanPhone = member.phone.replace(/\D/g, '');
                    if (cleanPhone.length >= 8) {
                        displayPhone = `${cleanPhone.substring(0, 4)}-****-${cleanPhone.substring(cleanPhone.length - 4)}`;
                    } else {
                        displayPhone = '****' + cleanPhone.substring(Math.max(0, cleanPhone.length - 2));
                    }
                    tdPhone.innerHTML = `<span>📱 ${displayPhone}</span>`;
                } else {
                    tdPhone.innerHTML = `<a href="${WHATSAPP_BASE_URL}&phone=${member.phone.replace(/\D/g, '')}" target="_blank" class="whatsapp-link">📱 ${displayPhone}</a>`;
                }

                tdPoin.innerHTML = `<span class="points-badge">${member.points} / ${LOYALTY_CONFIG.POINTS_FOR_REWARD}</span>`;

                tdBeli.innerHTML = `<strong>${member.purchases}</strong>`;

                tdStatus.innerHTML = `<span class="status-badge ${isReady ? 'status-ready' : 'status-pending'}">${this.getRewardStatus(member.points)}</span>`;

                if (admin) {
                    // ➕ Beli
                    const btnBeli = document.createElement('button');
                    btnBeli.className = 'btn btn-success btn-action';
                    btnBeli.textContent = '➕ Beli';
                    btnBeli.title = 'Tambah pembelian';
                    btnBeli.dataset.action = 'addPurchase';
                    tdAksi.appendChild(btnBeli);

                    // 🎁 Klaim (hanya jika reward siap)
                    if (isReady) {
                        const btnKlaim = document.createElement('button');
                        btnKlaim.className = 'btn btn-success btn-action';
                        btnKlaim.textContent = '🎁 Klaim';
                        btnKlaim.title = 'Klaim reward';
                        btnKlaim.dataset.action = 'claimReward';
                        tdAksi.appendChild(btnKlaim);
                    }

                    // ❌ Hapus
                    const btnHapus = document.createElement('button');
                    btnHapus.className = 'btn btn-danger btn-action';
                    btnHapus.textContent = '❌';
                    btnHapus.title = 'Hapus member';
                    btnHapus.dataset.action = 'delete';
                    tdAksi.appendChild(btnHapus);
                } else {
                    tdAksi.innerHTML = '<span style="color:#aaa;font-size:0.8em;">—</span>';
                }

                row.append(tdNo, tdNama, tdPhone, tdPoin, tdBeli, tdStatus, tdAksi);
                tbody.appendChild(row);
            });
        }

        // Update leaderboard homepage
        renderTopMembers(this.members, 4);
    }
}

/* ============================================
   EVENT DELEGATION untuk tabel member
   ============================================ */
function setupTableEventDelegation() {
    const tbody = document.querySelector(UI_SELECTORS.membersBody);
    if (!tbody) return;

    tbody.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const row = btn.closest('tr');
        const firestoreId = row ? row.dataset.id : null;
        const action = btn.dataset.action;

        console.log('[TableClick] action=', action, 'id=', firestoreId);

        if (!memberManager) return;

        if (action === 'addPurchase') memberManager.addPurchase(firestoreId);
        if (action === 'claimReward') memberManager.claimReward(firestoreId);
        if (action === 'delete') memberManager.deleteMember(firestoreId);
    });
}

/* ============================================
   PUBLIC FUNCTIONS UNTUK HTML ONCLICK
   ============================================ */
function addMember() {
    const nameInput = document.querySelector(UI_SELECTORS.memberName);
    const phoneInput = document.querySelector(UI_SELECTORS.memberPhone);
    if (memberManager.addMember(nameInput.value, phoneInput.value)) {
        nameInput.value = '';
        phoneInput.value = '';
        nameInput.focus();
    }
}

function exportMembers() { memberManager.exportToCSV(); }
function resetData() { memberManager.resetAllData(); }

async function syncPOToMembers() {
    if (!isAdmin()) { alert("Login admin dulu!"); return; }

    // Gunakan customConfirm agar UI konsisten dan tidak diblokir browser popup jika memungkinkan
    const confirmed = await new Promise(resolve => {
        if (typeof customConfirm === 'function') {
            customConfirm("Sinkronisasi ini akan menghitung ulang poin semua member berdasarkan TOTAL QTY riwayat Pre-Order (PO). Member baru akan didaftarkan otomatis, member lama akan di-update nilainya. Aman dijalankan berulang kali. Lanjutkan?").then(resolve);
        } else {
            resolve(confirm("Sinkronisasi ini akan menghitung ulang poin berdasarkan total qty PO lama... Lanjutkan?"));
        }
    });

    if (!confirmed) return;

    showStatus("⏳ Memulai sinkronisasi data riwayat PO ke Member...", false);

    try {
        const poSnapshot = await db.collection('po_orders').get();
        if (poSnapshot.empty) {
            showStatus("⚠️ Tidak ada data PO lama ditemukan.", true);
            return;
        }

        const poData = poSnapshot.docs.map(doc => doc.data());
        console.log(`Ditemukan ${poData.length} total riwayat pre-order.`);

        // Kelompokkan berdasarkan nomor telepon (WhatsApp)
        const grouped = {};
        poData.forEach(po => {
            const phone = po.phone ? po.phone.trim() : null;
            if (!phone) return;

            // Poin berdasarkan qty item per PO, bukan per PO
            const poQty = po.qty || 1;

            if (!grouped[phone]) {
                grouped[phone] = {
                    name: po.name || 'Pelanggan',
                    phone: phone,
                    purchases: 0,
                    points: 0
                };
            }
            grouped[phone].purchases += poQty;
            grouped[phone].points += poQty;
        });

        const uniquePhones = Object.keys(grouped);
        let newCount = 0;
        let updateCount = 0;

        for (const phone of uniquePhones) {
            const data = grouped[phone];
            const memberSnap = await db.collection(MEMBERS_COLLECTION).where('phone', '==', phone).get();

            if (memberSnap.empty) {
                // Buat member baru dengan total poin yang diakumulasi dari QTY
                await db.collection(MEMBERS_COLLECTION).add({
                    name: data.name,
                    phone: data.phone,
                    points: data.points,
                    purchases: data.purchases,
                    rewards: 0,
                    joinDate: new Date().toLocaleDateString('id-ID'),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                newCount++;
            } else {
                // Member sudah ada → SET ulang poin & purchases berdasarkan kalkulasi total QTY dari PO
                // Aman dari double-count karena kita SET bukan increment
                const existingDoc = memberSnap.docs[0];
                await db.collection(MEMBERS_COLLECTION).doc(existingDoc.id).update({
                    points: data.points,
                    purchases: data.purchases
                });
                console.log(`Member ${phone} diupdate: ${data.purchases} purchases, ${data.points} poin.`);
                updateCount++;
            }
        }

        const msg = `✅ Sinkronisasi Selesai! ${newCount} member baru didaftarkan, ${updateCount} member lama diperbarui poin-nya berdasarkan total qty PO.`;
        showStatus(msg, false);
        alert(msg);
    } catch (e) {
        console.error("Error during sync: ", e);
        showStatus("❌ Gagal sinkronisasi: " + e.message, true);
    }
}

/* ============================================
   TOP MEMBERS LEADERBOARD
   ============================================ */
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣'];

function renderTopMembers(members, limit) {
    limit = limit || 4;
    const container = document.getElementById('topMembersList');
    if (!container) return;

    if (!members || members.length === 0) {
        container.innerHTML = '<div class="leaderboard-empty">Belum ada member terdaftar</div>';
        return;
    }

    const sorted = members.slice().sort(function (a, b) { return b.points - a.points; });
    const top = sorted.slice(0, limit);

    container.innerHTML = top.map(function (member, idx) {
        return (
            '<div class="leaderboard-row">' +
            '<span class="leaderboard-rank">' + RANK_ICONS[idx] + '</span>' +
            '<span class="leaderboard-name">' + member.name + '</span>' +
            '<span class="leaderboard-pts">' + member.points + ' poin</span>' +
            '</div>'
        );
    }).join('');
}
