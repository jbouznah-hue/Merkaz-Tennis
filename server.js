const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SIGNATURES_FILE = path.join(DATA_DIR, 'signatures.json');

// Initialize signatures file
if (!fs.existsSync(SIGNATURES_FILE)) {
    fs.writeFileSync(SIGNATURES_FILE, JSON.stringify({ signatures: [] }));
}

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Get signatures
app.get('/api/signatures', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(SIGNATURES_FILE, 'utf8'));
        res.json(data);
    } catch (err) {
        res.json({ signatures: [] });
    }
});

// Add signature
app.post('/api/sign', (req, res) => {
    try {
        const { signerName, signerRole, signatureData } = req.body;

        if (!signerName || !signatureData) {
            return res.status(400).json({ error: 'Missing signerName or signatureData' });
        }

        const data = JSON.parse(fs.readFileSync(SIGNATURES_FILE, 'utf8'));

        // Check if this role already signed
        const existing = data.signatures.find(s => s.signerRole === signerRole);
        if (existing) {
            return res.status(409).json({ error: 'Ce document a deja ete signe pour ce role.' });
        }

        const signature = {
            id: Date.now().toString(36),
            signerName,
            signerRole,
            signatureData,
            signedAt: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || ''
        };

        data.signatures.push(signature);
        fs.writeFileSync(SIGNATURES_FILE, JSON.stringify(data, null, 2));

        res.json({ success: true, signature: { id: signature.id, signedAt: signature.signedAt } });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Merkaz Tennis CDC server running on port ${PORT}`);
});
