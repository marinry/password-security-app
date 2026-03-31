const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

console.log("STATIC FILES SERVED FROM:", __dirname);

app.use(express.static(__dirname));

app.post('/analyze', (req, res) => {
    const password = req.body.password || '';

    let strength = 'Weak';
    let feedback = [];

    if (password.length >= 8) {
        strength = 'Medium';
    }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8) {
        strength = 'Strong';
    }
    if (!/[A-Z]/.test(password)) {
        feedback.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
        feedback.push('Add numbers');
    }
    if (password.length < 8) {
        feedback.push('Use at least 8 characters');
    }
    if (feedback.length === 0) {
        feedback.push('Strong password');
    }
    res.json({ strength, feedback });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
