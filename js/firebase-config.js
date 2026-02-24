/* ============================================
   FIREBASE CONFIGURATION — FRUTTEIN
   ============================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCAOvfUmpytTA30lu0a3c-IYIvL8sk0Jmc",
    authDomain: "fruttein-b3a41.firebaseapp.com",
    projectId: "fruttein-b3a41",
    storageBucket: "fruttein-b3a41.firebasestorage.app",
    messagingSenderId: "278970143189",
    appId: "1:278970143189:web:5fa6462abdf907b38ead5c",
    measurementId: "G-S16TLV8345"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Instance global yang dipakai di seluruh app
const db = firebase.firestore();
const auth = firebase.auth();
