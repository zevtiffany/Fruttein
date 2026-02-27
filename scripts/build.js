const fs = require('fs');
const path = require('path');
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
};

const jsContent = `/* ============================================
   FIREBASE CONFIGURATION \u2014 FRUTTEIN (BUILD GENERATED)
   ============================================ */

const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 4)};

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

    console.log("\ud83d\udd25 Firebase Successfully Initialized via Build Env");
    console.log("🔍 Firebase Debug Status: Project ID is", firebaseConfig.projectId ? "Aman" : "KOSONG/UNDEFINED!");

    // Dispatch an event so the rest of the application knows Firebase is ready
    window.dispatchEvent(new Event('firebaseReady'));

} catch (err) {
    console.error("\u274c Firebase Init Error:", err);
}
`;

const outputPath = path.join(__dirname, '..', 'js', 'firebase-config.js');
fs.writeFileSync(outputPath, jsContent);
console.log('✅ Firebase configuration injected from environment variables.');
