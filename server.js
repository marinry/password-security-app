const express = require('express');
const cors = require('cors');
const zxcvbn = require('zxcvbn');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

console.log('Static files served from:', __dirname);

async function checkHIBP(password) {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    try {
        const response = await axios.get('https://api.pwnedpasswords.com/range/' + prefix, {
            headers: { 'Add-Padding': 'true' },
            timeout: 3000
        });
        const lines = response.data.split('\n');
        const match = lines.find(line => line.split(':')[0] === suffix);
        return match ? parseInt(match.split(':')[1]) : 0;
    } catch (e) {
        return null;
    }
}

app.post('/analyze', async (req, res) => {
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

    const zResult = zxcvbn(password);
    const zScore = zResult.score;
    const zCrack = zResult.crack_times_display.offline_fast_hashing_1e10_per_second;
    const zWarning = zResult.feedback.warning;
    const zSuggestions = zResult.feedback.suggestions;

    scanLog.push({ time: now, type: 'info', text: 'ZXCVBN: Pattern score ' + zScore + '/4 — est. crack time: ' + zCrack });
    if (zWarning) {
        scanLog.push({ time: now, type: 'warn', text: 'ZXCVBN: ' + zWarning });
    }

    const breachCount = await checkHIBP(password);
    if (breachCount === null) {
        scanLog.push({ time: now, type: 'warn', text: 'HIBP: Breach check unavailable' });
    } else if (breachCount > 0) {
        scanLog.push({ time: now, type: 'error', text: 'HIBP: Found in ' + breachCount.toLocaleString() + ' known data breaches' });
        feedback.unshift('This exact password has appeared in ' + breachCount.toLocaleString() + ' data breaches — never use it');
    } else {
        scanLog.push({ time: now, type: 'pass', text: 'HIBP: Not found in any known breach database' });
    }

    // Score calculation
    const scoreMap = { 0: 5, 1: 20, 2: 45, 3: 75, 4: 95 };
    score = scoreMap[zScore];
    if (breachCount > 0) score = Math.min(score, 10);
    if (/^[0-9]+$/.test(password)) score = Math.min(score, 15);
    if (/^[^a-zA-Z0-9]+$/.test(password)) score = Math.min(score, 20);
    if (password.length < 8) score = Math.min(score, 15);

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
    if (attackType === 'Unknown' && zWarning) {
        attackType = zWarning;
    } else if (attackType === 'Unknown') {
        attackType = zScore >= 3 ? 'Harder to guess' : 'Pattern-based attack likely';
        scanLog.push({ time: now, type: zScore >= 3 ? 'pass' : 'warn', text: 'ASSESSMENT: ' + attackType });
    }

    // Strength rating
    if (zScore >= 3 && (breachCount === 0 || breachCount === null)) strength = 'Strong';
    else if (zScore >= 2 && (breachCount === 0 || breachCount === null)) strength = 'Medium';
    else strength = 'Weak';

    // Crack time estimation
    /*var GUESSES_PER_SEC = 1e10;
    var keyspace = Math.pow(charsetSize || 1, password.length);
    var seconds = (keyspace / 2) / GUESSES_PER_SEC;

    if (seconds < 1) crackTime = 'Instantly';
    else if (seconds < 60) crackTime = Math.round(seconds) + ' seconds';
    else if (seconds < 3600) crackTime = Math.round(seconds / 60) + ' minutes';
    else if (seconds < 86400) crackTime = Math.round(seconds / 3600) + ' hours';
    else if (seconds < 31536000) crackTime = Math.round(seconds / 86400) + ' days';
    else if (seconds < 3.15e11) crackTime = Math.round(seconds / 31536000) + ' years';
    else crackTime = 'Longer than recorded history';*/
    const crackTimes = {
        online: zResult.crack_times_display.online_no_throttling_10_per_second,
        offline: zResult.crack_times_display.offline_slow_hashing_1e4_per_second,
        offlineFast: zResult.crack_times_display.offline_fast_hashing_1e10_per_second
    };

    // Feedback for improvement
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');
    if (password.length >= 8 && password.length < 12) feedback.push('Consider using 12 or more characters for better security');

    if (zWarning && !feedback.includes(zWarning)) feedback.push(zWarning);
    if (zSuggestions && zSuggestions.length > 0) {
        zSuggestions.forEach(function (s) {
            if (!feedback.includes(s)) feedback.push(s);
        });
    }

    if (feedback.length === 0) {
        feedback.push('Strong password');
    }

    res.json({ strength, score, attackType, crackTimes, feedback, scanLog, breached: breachCount });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});