require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Menjalankan file statis yang ada di folder root ini
app.use(express.static(__dirname));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Fruttein Web Server running on http://localhost:${PORT}`);
        console.log(`✨ Kredensial Firebase sekarang langsung di-inject (ditambahkan) saat "npm run build"`);
    });
}

module.exports = app;
