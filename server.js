const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

console.log('Static files served from:', __dirname);

app.post('/analyze', (req, res) => {
    const password = req.body.password || '';
    let strength = 'Weak';
    let feedback = [];
    let score = 0;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    if (score >= 70) {
    strength = 'Strong';
    } else if (score >= 40) {
    strength = 'Medium';
    } else {
    strength = 'Weak';
    }

    if (!/[A-Z]/.test(password))  feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password))  feedback.push('Add numbers');
    if (password.length < 8)      feedback.push('Use at least 8 characters');

    if (feedback.length === 0) {
        feedback.push('Strong password');
    }

    res.json({ strength, score, feedback });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});