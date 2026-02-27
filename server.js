require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the main index.html file with injected ENV variables
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');

    // Read the original HTML file
    let html = fs.readFileSync(indexPath, 'utf8');

    // Create a script block containing the secure Firebase configuration from .env
    const envScript = `
    <script>
      // Injected automatically from Node.js Backend (.env)
      window.FIREBASE_ENV_CONFIG = {
          apiKey: "${process.env.FIREBASE_API_KEY}",
          authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
          projectId: "${process.env.FIREBASE_PROJECT_ID}",
          storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
          messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
          appId: "${process.env.FIREBASE_APP_ID}",
          measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}"
      };
    </script>
    `;

    // Inject the configuration right before firebase-config.js is loaded
    html = html.replace('<script src="js/firebase-config.js"></script>', envScript + '<script src="js/firebase-config.js"></script>');

    res.send(html);
});

// Serve everything else normally (CSS, JS, Images, etc)
app.use(express.static(__dirname));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Fruttein Web Server running on http://localhost:${PORT}`);
        console.log(`🔐 Firebase Config is securely loaded from .env`);
    });
}

module.exports = app;
