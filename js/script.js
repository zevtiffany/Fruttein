/* ============================================
   FRUTTEIN MEMBER MANAGEMENT SYSTEM
   ============================================ */

class MemberManager {
  constructor() {
    this.members = this.loadMembers();
    this.render();
  }

  /**
   * Load members dari localStorage
   */
  loadMembers() {
    try {
      const data = localStorage.getItem(LOYALTY_CONFIG.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading members:', error);
      return [];
    }
  }

  /**
   * Save members ke localStorage
   */
  saveMembers() {
    try {
      localStorage.setItem(LOYALTY_CONFIG.STORAGE_KEY, JSON.stringify(this.members));
    } catch (error) {
      console.error('Error saving members:', error);
    }
  }

  /**
   * Tambah member baru
   */
  addMember(name, phone) {
    if (!name.trim() || !phone.trim()) {
      alert(MESSAGES.EMPTY_FIELD);
      return false;
    }

    if (!/^[\d\s\-\+]+$/.test(phone)) {
      alert(MESSAGES.INVALID_PHONE);
      return false;
    }

    const newMember = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      points: 0,
      joinDate: new Date().toLocaleDateString('id-ID'),
      purchases: 0
    };

    this.members.push(newMember);
    this.saveMembers();
    this.render();
    return true;
  }

  /**
   * Tambah pembelian (1 poin per pembelian)
   */
  addPurchase(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (member) {
      member.points += LOYALTY_CONFIG.POINTS_PER_PURCHASE;
      member.purchases += 1;
      this.saveMembers();
      this.render();
      
      // Notifikasi untuk milestone
      if (member.points === LOYALTY_CONFIG.POINTS_FOR_REWARD) {
        alert(MESSAGES.MILESTONE_10(member.name));
      } else if (LOYALTY_CONFIG.MILESTONE_REWARDS.includes(member.points)) {
        alert(MESSAGES.MILESTONE_5(member.name));
      }
    }
  }

  /**
   * Klaim reward (setiap 10 poin = 1 hadiah)
   */
  claimReward(memberId) {
    const member = this.members.find(m => m.id === memberId);
    if (member && member.points >= LOYALTY_CONFIG.POINTS_FOR_REWARD) {
      const claimedPoints = Math.floor(member.points / LOYALTY_CONFIG.POINTS_FOR_REWARD) * LOYALTY_CONFIG.POINTS_FOR_REWARD;
      const rewardCount = Math.floor(claimedPoints / LOYALTY_CONFIG.POINTS_FOR_REWARD);
      member.points -= claimedPoints;
      member.rewards = (member.rewards || 0) + rewardCount;
      this.saveMembers();
      this.render();
      alert(MESSAGES.REWARD_CLAIMED(member.name, rewardCount, member.points));
    }
  }

  /**
   * Hapus member
   */
  deleteMember(memberId) {
    if (confirm(MESSAGES.CONFIRM_DELETE)) {
      this.members = this.members.filter(m => m.id !== memberId);
      this.saveMembers();
      this.render();
      alert(MESSAGES.DELETED);
    }
  }

  /**
   * Reset semua data member (untuk administrator)
   */
  resetAllData() {
    if (confirm(MESSAGES.CONFIRM_RESET)) {
      if (confirm(MESSAGES.CONFIRM_RESET_AGAIN)) {
        this.members = [];
        this.saveMembers();
        this.render();
        alert(MESSAGES.RESET_SUCCESS);
      }
    }
  }

  /**
   * Export data ke CSV
   */
  exportToCSV() {
    if (this.members.length === 0) {
      alert(MESSAGES.EXPORT_EMPTY);
      return;
    }

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
    if (rewards > 0) {
      return `✅ ${rewards} hadiah siap diambil (+${remaining} poin)`;
    }
    return `⏳ ${LOYALTY_CONFIG.POINTS_FOR_REWARD - remaining} poin lagi`;
  }

  /**
   * Render tabel member
   */
  render() {
    const tbody = document.querySelector(UI_SELECTORS.membersBody);
    const emptyState = document.querySelector(UI_SELECTORS.emptyState);
    const table = document.querySelector(UI_SELECTORS.membersTable).parentElement;

    tbody.innerHTML = '';

    if (this.members.length === 0) {
      emptyState.style.display = 'block';
      table.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      table.style.display = 'block';

      this.members.forEach((member, index) => {
        const isReady = member.points >= LOYALTY_CONFIG.POINTS_FOR_REWARD;
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td><strong>${member.name}</strong><br><small class="member-join-date">${member.joinDate}</small></td>
          <td>
            <a href="${WHATSAPP_BASE_URL}&phone=${member.phone.replace(/\D/g, '')}" target="_blank" class="whatsapp-link">
              📱 ${member.phone}
            </a>
          </td>
          <td>
            <span class="points-badge">${member.points} / ${LOYALTY_CONFIG.POINTS_FOR_REWARD}</span>
          </td>
          <td><strong>${member.purchases}</strong></td>
          <td>
            <span class="status-badge ${isReady ? 'status-ready' : 'status-pending'}">
              ${this.getRewardStatus(member.points)}
            </span>
          </td>
          <td>
            <button class="btn btn-success btn-action" onclick="memberManager.addPurchase(${member.id})" title="Tambah pembelian">➕ Beli</button>
            ${isReady ? `<button class="btn btn-success btn-action" onclick="memberManager.claimReward(${member.id})" title="Klaim reward">🎁 Klaim</button>` : ''}
            <button class="btn btn-danger btn-action" onclick="memberManager.deleteMember(${member.id})" title="Hapus member">❌</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  }
}

/**
 * Initialize Member Manager dan Event Listeners
 */
let memberManager;

document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
});

/**
 * Initialize aplikasi
 */
function initializeApp() {
  memberManager = new MemberManager();
}

/**
 * Setup semua event listeners
 */
function setupEventListeners() {
  const memberName = document.querySelector(UI_SELECTORS.memberName);
  const memberPhone = document.querySelector(UI_SELECTORS.memberPhone);

  if (memberName && memberPhone) {
    memberName.addEventListener('keypress', handleEnter);
    memberPhone.addEventListener('keypress', handleEnter);
  }
}

/**
 * Handle Enter key untuk form input
 */
function handleEnter(e) {
  if (e.key === 'Enter') {
    const memberName = document.querySelector(UI_SELECTORS.memberName);
    const memberPhone = document.querySelector(UI_SELECTORS.memberPhone);
    
    if (e.target === memberName) {
      memberPhone.focus();
    } else if (e.target === memberPhone) {
      addMember();
    }
  }
}

/**
 * Tambah member dari form
 */
function addMember() {
  const nameInput = document.querySelector(UI_SELECTORS.memberName);
  const phoneInput = document.querySelector(UI_SELECTORS.memberPhone);

  if (memberManager.addMember(nameInput.value, phoneInput.value)) {
    nameInput.value = '';
    phoneInput.value = '';
    nameInput.focus();
  }
}

/**
 * Export data member ke CSV
 */
function exportMembers() {
  memberManager.exportToCSV();
}

/**
 * Reset semua data member
 */
function resetData() {
  memberManager.resetAllData();
}
