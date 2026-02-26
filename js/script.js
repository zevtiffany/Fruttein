/* ============================================
   FRUTTEIN MEMBER MANAGEMENT SYSTEM
   — Firebase Firestore Edition —
   ============================================ */

const MEMBERS_COLLECTION = 'members';
const PO_DATES_COLLECTION = 'po_dates';

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
   * Render tabel member — pakai event delegation (bukan inline onclick)
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
   (Lebih reliable daripada inline onclick)
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
   INISIALISASI
   ============================================ */
let memberManager;

document.addEventListener('DOMContentLoaded', function () {
  memberManager = new MemberManager();
  setupEventListeners();
  setupTableEventDelegation();

  // Setup auth listener SETELAH memberManager siap
  auth.onAuthStateChanged((user) => {
    currentAdmin = user;
    updateAdminUI(user);
    if (memberManager) memberManager.render();
  });

  // Listen for Preorder Form
  const poForm = document.getElementById('preorderForm');
  if (poForm) poForm.addEventListener('submit', submitPreorder);

  // Initial load for PO dates
  loadPoDatesForCustomer();
});

/* ============================================
   EVENT LISTENERS
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
      if (e.key === 'Enter') adminLogin();
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
    else if (e.target === memberPhone) addMember();
  }
}

/* ============================================
   PUBLIC FUNCTIONS
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
   MODAL FUNCTIONS
   ============================================ */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  if (modalId === 'preorderModal') {
    // Refresh the dates specifically on open just in case
    loadPoDatesForCustomer();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) { modal.classList.remove('is-open'); document.body.style.overflow = ''; }
}

function handleOverlayClick(event, modalId) {
  if (event.target === event.currentTarget) closeModal(modalId);
}

function openPreorderModal(productId) {
  const select = document.getElementById('poProduct');
  if (select) select.value = productId;
  openModal('preorderModal');
}

/* ============================================
   PREORDER SYSTEM FUNCTIONS
   ============================================ */

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
  if (!select) return;

  const msg = document.getElementById('poStatusMsg');
  if (msg) msg.style.display = 'none';

  select.innerHTML = '<option value="">Memuat tanggal...</option>';

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
      } else {
        // Add default prompt option
        const defOpt = document.createElement('option');
        defOpt.value = "";
        defOpt.textContent = "-- Pilih Tanggal --";
        defOpt.selected = true;
        defOpt.disabled = true;
        select.prepend(defOpt);
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
  const address = document.getElementById('poAddress').value.trim();
  const productVal = document.getElementById('poProduct').value;
  const qty = parseInt(document.getElementById('poQty').value, 10);
  const dateObjStr = document.getElementById('poDate').value;

  let productName = "Produk";
  if (productVal === '1') productName = "Nanamango";
  if (productVal === '2') productName = "Stropis";
  if (productVal === '3') productName = "Banavoca";

  if (!address) {
    showPoStatus('⚠️ Ops! Alamat pengiriman belum diisi.', true);
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
      address: address,
      productName: productName,
      qty: qty,
      deliveryDate: dateObjStr,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(() => {
    showPoStatus('✅ Pesanan berhasil dicatat! Mengalihkan ke WhatsApp...', false);

    // Redirect ke WA
    setTimeout(() => {
      const waNumber = "6285204575882";
      const niceDate = new Date(dateObjStr.split('-')[0], dateObjStr.split('-')[1] - 1, dateObjStr.split('-')[2]).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const teks = `Halo Fruttein! Saya ingin PREORDER:\n\n*Nama:* ${name}\n*Nomor WA:* ${phone}\n*Alamat Pengiriman:* ${address}\n*Produk:* ${productName}\n*Jumlah:* ${qty} barang\n*Tgl Pengiriman:* ${niceDate}\n\nMohon konfirmasinya ya!`;

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
  if (confirm('Yakin ingin menghapus tanggal PO ini selamanya?')) {
    db.collection(PO_DATES_COLLECTION).doc(dateStr).delete().catch(err => alert(err.message));
  }
}

/** Setup realtime listener for Admin Table */
document.addEventListener('DOMContentLoaded', () => {
  // Listener tabel admin khusus PO
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
});

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

      let csvContent = "Waktu Order,Nama Pemesan,WhatsApp,Alamat,Produk,Jumlah\n";

      docsData.forEach(data => {
        const tsDate = data.timestamp ? data.timestamp.toDate().toLocaleString('id-ID') : '-';

        // Escape quotes to prevent CSV breakage
        const name = `"${(data.name || '').replace(/"/g, '""')}"`;
        const phone = `"${(data.phone || '').replace(/"/g, '""')}"`;
        const addr = `"${(data.address || '').replace(/"/g, '""')}"`;
        const product = `"${(data.productName || '').replace(/"/g, '""')}"`;
        const qty = data.qty || 0;

        csvContent += `${tsDate},${name},${phone},${addr},${product},${qty}\n`;
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
