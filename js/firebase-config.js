/* ============================================
   FIREBASE CONFIGURATION — FRUTTEIN (SERVERLESS SAFE)
   ============================================ */

let db;
let auth;

async function initFirebase() {
    try {
        // Fetch config securely from Node.js / Vercel Serverless Endpoint
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error("Failed to fetch Firebase Config");

        const firebaseConfig = await response.json();

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Assign global instances
        db = firebase.firestore();
        auth = firebase.auth();

        console.log("🔥 Firebase Successfully Initialized via API");

        // Dispatch an event so the rest of the application knows Firebase is ready
        window.dispatchEvent(new Event('firebaseReady'));

    } catch (err) {
        console.error("❌ Firebase Init Error:", err);
    }
}

// Start Initialization
initFirebase();
