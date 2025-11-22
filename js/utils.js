/**
 * Fruttein Utilities - Constants & Configuration
 * File ini berisi semua constants dan config yang digunakan di aplikasi
 */

// ============================================
// WHATSAPP CONFIGURATION
// ============================================
const WHATSAPP_NUMBER = '6285204575882';
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

// ============================================
// BUSINESS INFORMATION
// ============================================
const BUSINESS_INFO = {
  name: 'Fruttein Juice Shop',
  address: 'Jl. Kendal Sari No.43, Malang, Indonesia',
  phone: '+62 852-0457-5882',
  whatsapp: WHATSAPP_NUMBER,
  instagram: 'fruttein',
  year: new Date().getFullYear()
};

// ============================================
// PRODUCTS
// ============================================
const PRODUCTS = [
  {
    id: 1,
    name: 'Nampisga',
    price: 10000,
    description: 'Kombinasi sempurna Buah Naga, Pisang, Mangga & Golden Nectar untuk rasa yang eksplosif.',
    image: 'assets/images/mango.jpg'
  },
  {
    id: 2,
    name: 'Stropis',
    price: 10000,
    description: 'Manis dan lezat dari kombinasi Strawberry, Pisang, Yoghurt & Golden Nectar.',
    image: 'assets/images/strawberry.jpg'
  },
  {
    id: 3,
    name: 'Alpisan',
    price: 10000,
    description: 'Kaya nutrisi dari Alpukat, Pisang, Fresh Milk & Golden Nectar yang creamy.',
    image: 'assets/images/avocado.jpg'
  }
];

// ============================================
// LOYALTY PROGRAM CONFIG
// ============================================
const LOYALTY_CONFIG = {
  POINTS_PER_PURCHASE: 1,
  POINTS_FOR_REWARD: 10,
  MILESTONE_REWARDS: [5, 10],
  STORAGE_KEY: 'frutteinMembers'
};

// ============================================
// UI SELECTORS
// ============================================
const UI_SELECTORS = {
  memberName: '#memberName',
  memberPhone: '#memberPhone',
  membersBody: '#membersBody',
  emptyState: '#emptyState',
  membersTable: '#membersTable'
};

// ============================================
// MESSAGES
// ============================================
const MESSAGES = {
  EMPTY_FIELD: '⚠️ Silahkan isi nama dan nomor WhatsApp!',
  INVALID_PHONE: '⚠️ Nomor WhatsApp tidak valid!',
  CONFIRM_DELETE: 'Apakah Anda yakin ingin menghapus member ini?',
  DELETED: '✅ Member berhasil dihapus',
  
  MILESTONE_5: (name) => `✨ ${name} sudah punya 5 poin, 5 poin lagi untuk reward!`,
  MILESTONE_10: (name) => `🎉 Selamat! ${name} telah mengumpulkan 10 poin!\n\nPoin siap ditukarkan dengan hadiah menarik Fruttein!`,
  REWARD_CLAIMED: (name, rewards, points) => `✅ Reward Diklaim!\n\n${name} mendapatkan ${rewards} hadiah\n\nSisa Poin: ${points}`,
  
  CONFIRM_RESET: '⚠️ PERINGATAN: Tindakan ini akan menghapus SEMUA data member!\n\nApakah Anda yakin?',
  CONFIRM_RESET_AGAIN: 'Klik OK sekali lagi untuk mengonfirmasi penghapusan',
  RESET_SUCCESS: '✅ Semua data member telah dihapus',
  
  EXPORT_EMPTY: '⚠️ Tidak ada data member untuk diexport'
};
