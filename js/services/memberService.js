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

        let csv = 'No,Nama Member,WhatsApp,Poin,Total Pembelian,Total Reward,Tanggal Bergabung\n';
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

                tdPhone.innerHTML = `<a href="${WHATSAPP_BASE_URL}&phone=${member.phone.replace(/\D/g, '')}" target="_blank" class="whatsapp-link">📱 ${member.phone}</a>`;

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
