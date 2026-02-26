/* ============================================
   FIREBASE CONFIGURATION — FRUTTEIN
   ============================================ */

// Firebase Configuration (injected by Node.js Server from .env)
const firebaseConfig = window.FIREBASE_ENV_CONFIG || {
    // Fallback error catcher
    apiKey: "MISSING_ENV_CONFIG",
    authDomain: "MISSING_ENV_CONFIG",
    projectId: "MISSING_ENV_CONFIG"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Instance global yang dipakai di seluruh app
const db = firebase.firestore();
const auth = firebase.auth();
