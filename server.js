const express = require('express');
const cors = require('cors');
const app = express();
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
    let crackTime = 'Unknown';
    var scanLog = [];

    if (password.length > 128) {
        return res.json({
            strength: 'Invalid',
            score: 0,
            attackType: 'N/A',
            crackTime: 'N/A',
            feedback: ['Password exceeds maximum length of 128 characters'],
            scanLog: []
        });
    }

    // Entropy calculation
    var charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    var entropy = password.length * Math.log2(charsetSize || 1);
    var now = new Date().toTimeString().slice(0, 8);
    scanLog.push({ time: now, type: 'info', text: 'Scan started — ' + password.length + ' characters' });
    scanLog.push({ time: now, type: 'info', text: 'Entropy: ' + (entropy ? entropy.toFixed(1) : '—') + ' bits | Charset: ' + charsetSize });

    // Score calculation
    if (password.length >= 8) score += 15;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    if (entropy >= 50) score += 10;
    if (/password|admin|qwerty|letmein/i.test(password)) score -= 30;
    if (/(.)\1{2,}/.test(password)) score -= 10;
    if (/1234|abcd|qwerty/i.test(password)) score -= 20;
    score = Math.max(0, Math.min(100, score));

    // Attack type detection
    if (/password|admin|qwerty|letmein|welcome/i.test(password)) {
        attackType = 'Dictionary Attack';
        feedback.push('Avoid common words or known weak passwords');
        scanLog.push({ time: now, type: 'error', text: 'DICTIONARY: Common password pattern matched' });
    } else if (/1234|abcd|qwerty|1111|0000/i.test(password)) {
        attackType = 'Pattern Attack';
        feedback.push('Avoid predictable sequences or keyboard patterns');
        scanLog.push({ time: now, type: 'error', text: 'PATTERN: Predictable structure detected' });
    } else if (/(.)\1{2,}/.test(password)) {
        attackType = 'Repetition-Based Guessing';
        feedback.push('Avoid repeated characters like aaa or 111');
        scanLog.push({ time: now, type: 'error', text: 'REPETITION: Repeated characters or sequences found' });
    } else if (password.length < 8 || entropy < 28) {
        attackType = 'Brute Force Attack';
        feedback.push('Short passwords are extremely vulnerable to brute-force attacks');
        scanLog.push({ time: now, type: 'error', text: 'BRUTE FORCE: Low complexity increases guessability' });
    }
    if (/^[0-9]+$/.test(password)) {
        feedback.push('Avoid using numbers only — extremely easy to brute-force');
        attackType = 'Brute Force Attack';
        scanLog.push({ time: now, type: 'warn', text: 'NUMERIC ONLY: Password contains only digits' });
    }
    if (/^[^a-zA-Z0-9]+$/.test(password)) {
        feedback.push('Avoid using symbols only — limited character variety');
        scanLog.push({ time: now, type: 'warn', text: 'SYMBOL ONLY: Password contains only special characters' });
    }
    if (attackType === 'Unknown') {
        attackType = 'Harder to guess';
        scanLog.push({ time: now, type: 'pass', text: 'ASSESSMENT: Password is harder to guess' });
    }

    // Strength rating
    if (score >= 70) {
        strength = 'Strong';
    } else if (score >= 40) {
        strength = 'Medium';
    } else {
        strength = 'Weak';
    }

    // Crack time estimation
    var GUESSES_PER_SEC = 1e10;
    var keyspace = Math.pow(charsetSize || 1, password.length);
    var seconds = (keyspace / 2) / GUESSES_PER_SEC;

    if (seconds < 1) crackTime = 'Instantly';
    else if (seconds < 60) crackTime = Math.round(seconds) + ' seconds';
    else if (seconds < 3600) crackTime = Math.round(seconds / 60) + ' minutes';
    else if (seconds < 86400) crackTime = Math.round(seconds / 3600) + ' hours';
    else if (seconds < 31536000) crackTime = Math.round(seconds / 86400) + ' days';
    else if (seconds < 3.15e11) crackTime = Math.round(seconds / 31536000) + ' years';
    else crackTime = 'Longer than recorded history';

    // Feedback for improvement
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');
    if (password.length >= 8 && password.length < 12) feedback.push('Consider using 12 or more characters for better security');

    if (feedback.length === 0) {
        feedback.push('Strong password');
    }

    res.json({ strength, score, attackType, crackTime, feedback, scanLog });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});