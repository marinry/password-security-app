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
    let attackType = 'Unknown';

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    if (/password|admin|qwerty|letmein|welcome/i.test(password)) {
        attackType = 'Dictionary Attack';
        feedback.push('Avoid common words or known weak passwords');
    } else if (/1234|abcd|qwerty|1111|0000/i.test(password)) {
        attackType = 'Pattern Attack';
        feedback.push('Avoid predictable sequences or keyboard patterns');
    } else if (/(.)\1{2,}/.test(password)) {
        attackType = 'Repetition-Based Guessing';
        feedback.push('Avoid repeated characters like aaa or 111');
    } else if (password.length < 8) {
        attackType = 'Brute Force Attack';
    } else {
        attackType = 'Harder to guess';
    }


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

    res.json({ strength, score, attackType, feedback });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});