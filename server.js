require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// API endpoint to safely deliver Firebase config to the frontend
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    });
});

// Serve everything else normally (CSS, JS, Images, etc)
// Vercel will handle static files via vercel.json, but this is for local fallback.
app.use(express.static(__dirname));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Fruttein Web Server running on http://localhost:${PORT}`);
        console.log(`🔐 Firebase Config is securely loaded from .env API endpoint`);
    });
}

module.exports = app;
