/* ============================================
   FIREBASE CONFIGURATION — FRUTTEIN (BUILD GENERATED)
   ============================================ */

const firebaseConfig = {
    "apiKey": "AIzaSyCAOvfUmpytTA30lu0a3c-IYIvL8sk0Jmc",
    "authDomain": "fruttein-b3a41.firebaseapp.com",
    "projectId": "fruttein-b3a41",
    "storageBucket": "fruttein-b3a41.firebasestorage.app",
    "messagingSenderId": "278970143189",
    "appId": "1:278970143189:web:5fa6462abdf907b38ead5c",
    "measurementId": "G-S16TLV8345"
};

let db;
let auth;

try {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Assign global instances
    db = firebase.firestore();
    auth = firebase.auth();

    console.log("🔥 Firebase Successfully Initialized via Build Env");

    // Dispatch an event so the rest of the application knows Firebase is ready
    window.dispatchEvent(new Event('firebaseReady'));

} catch (err) {
    console.error("❌ Firebase Init Error:", err);
}
