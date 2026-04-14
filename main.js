//const API = 'http://localhost:3000';
const API = 'https://password-security-app-production-465c.up.railway.app';

/* ══════════════════════════════════════════
   TIPS
══════════════════════════════════════════ */
var tips = [
    "Use 4+ random unrelated words as a passphrase — length beats complexity.",
    "Never reuse passwords across sites. A breach on one exposes all.",
    "A password manager means you only need to remember one strong master password.",
    "Adding a number and symbol to a weak word doesn't make it strong.",
    "The longer the password, the exponentially longer it takes to crack.",
    "Avoid personal info like birthdays, names, or pet names — attackers try these first.",
    "Passphrases like 'correct-horse-battery-staple' are strong and memorable.",
    "Enable two-factor authentication wherever possible — passwords alone aren't enough.",
    "Dictionary attacks try common words first. Avoid real words without modification.",
    "Changing one character in an old password is not a new password."
];
var tipIndex = 0;

function showTip(index) {
    var $tip = $('#tipText');
    $tip.css('opacity', 0);
    setTimeout(function() {
        $tip.text(tips[index]);
        $tip.css('opacity', 1);
    }, 300);
}

$(document).ready(function() {
    tipIndex = Math.floor(Math.random() * tips.length);
    showTip(tipIndex);

    $('#nextTip').on('click', function() {
        tipIndex = (tipIndex + 1) % tips.length;
        showTip(tipIndex);
    });

    // Auto-rotate every 10 seconds
    setInterval(function() {
        tipIndex = (tipIndex + 1) % tips.length;
        showTip(tipIndex);
    }, 10000);

    resetScannerUI();
    $('#headerStrength').text('No input yet').css('color', '');
});

/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
function switchView(viewId) {
    $('.view').removeClass('active');
    $('#' + viewId).addClass('active');
    $('.nav-item').removeClass('active');
    $('#nav-' + viewId).addClass('active');
}

/* ══════════════════════════════════════════
   SCANNER
══════════════════════════════════════════ */
var passwordInput     = document.getElementById('passwordInput');
var scannerPlaceholder = document.getElementById('scanner-placeholder');
var scannerLog        = document.getElementById('scanner-log');

if (passwordInput) {
    passwordInput.addEventListener('input', function(e) {
        if (e.target.value.length > 0) {
            scannerPlaceholder.classList.add('opacity-0', 'pointer-events-none');
            scannerLog.classList.remove('opacity-40');
            scannerLog.classList.add('opacity-100');
        } else {
            scannerPlaceholder.classList.remove('opacity-0', 'pointer-events-none');
            scannerLog.classList.add('opacity-40');
            scannerLog.classList.remove('opacity-100');
        }
    });
}

// Visibility toggle
$('#toggleVisibility').on('click', function() {
    var $pw = $('#passwordInput');
    var $icon = $(this).find('.material-symbols-outlined');
    if ($pw.attr('type') === 'password') {
        $pw.attr('type', 'text');
        $icon.text('visibility_off');
        $(this).contents().filter(function() { return this.nodeType === 3; }).last().replaceWith(' HIDE');
    } else {
        $pw.attr('type', 'password');
        $icon.text('visibility');
        $(this).contents().filter(function() { return this.nodeType === 3; }).last().replaceWith(' SHOW');
    }
});

$('#passwordInput').on('input', function() {
    var password = $(this).val();
    if (!password) {
        resetScannerUI();
        $('#headerStrength').text('No input yet').css('color', '');
        return;
    }

    $.ajax({
        url: API + '/analyze',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ password: password }),
        success: function(res) {
            updateScannerUI(res);
            var colorMap = { Weak: '#ffb4ab', Medium: '#f9c74f', Strong: '#00e1ab' };
            $('#headerStrength').text(res.strength + ' • ' + (res.attackType || 'Unknown Risk'))
                       .css('color', colorMap[res.strength] || '');
        },
        error: function() {
             $('#feedbackList').html(
        '<div class="p-4 bg-surface-container-low rounded border border-outline-variant/5">' +
            '<div class="flex items-center gap-3 mb-2">' +
                '<span class="material-symbols-outlined text-error/60 text-xl">warning</span>' +
                '<p class="text-sm text-on-background font-bold uppercase tracking-tight">Server Error</p>' +
            '</div>' +
            '<p class="text-secondary/60 text-xs leading-relaxed">Cannot reach the analysis server.</p>' +
        '</div>'
            );
        }
    });
});

function resetScannerUI() {
    $('#strength').text('Awaiting analysis').css('color', '');
    $('#crackTime').text('—');
    $('#strengthScore').html('—<span class="text-sm font-normal text-secondary/40 ml-1">/100</span>');

    $('#entropyBars div').each(function() {
        $(this)
            .removeClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]')
            .addClass('bg-surface-container-highest');
    });

    $('#feedbackList').html(
        '<div class="p-4 bg-surface-container-low rounded border border-outline-variant/5">' +
            '<div class="flex items-center gap-3 mb-2">' +
                '<span class="material-symbols-outlined text-secondary/40 text-xl">info</span>' +
                '<p class="text-sm text-on-background font-bold uppercase tracking-tight">Waiting for input</p>' +
            '</div>' +
            '<p class="text-secondary/60 text-xs leading-relaxed">Type a password to begin analysis.</p>' +
        '</div>'
    );
}

function updateScannerUI(res) {
    var colorMap = { Weak: '#ffb4ab', Medium: '#f9c74f', Strong: '#00e1ab' };
    var score = res.score || 0;
    var filled = Math.max(1, Math.ceil(score / 10));

    $('#strength').text((res.strength || 'Unknown') + ' • ' + (res.attackType || 'Unknown Risk'))
                  .css('color', colorMap[res.strength] || '');

    $('#crackTime').text(res.crackTime || '—');
    $('#strengthScore').html(score + '<span class="text-sm font-normal text-secondary/40 ml-1">/100</span>');

    $('#entropyBars div').each(function(i) {
        if (i < filled) {
            $(this)
                .removeClass('bg-surface-container-highest')
                .addClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]');
        } else {
            $(this)
                .removeClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]')
                .addClass('bg-surface-container-highest');
        }
    });

    var $list = $('#feedbackList').empty();

    var iconMap = {
        'Add uppercase letters': { icon: 'title', cls: 'text-error/60' },
        'Add lowercase letters': { icon: 'text_fields', cls: 'text-error/60' },
        'Add numbers': { icon: 'pin', cls: 'text-error/60' },
        'Add special characters': { icon: 'emergency', cls: 'text-tertiary' },
        'Use at least 8 characters': { icon: 'straighten', cls: 'text-tertiary' },
        'Consider using 12 or more characters for better security': { icon: 'expand', cls: 'text-secondary/40' },
        'Avoid common words or known weak passwords': { icon: 'menu_book', cls: 'text-error/60' },
        'Avoid predictable sequences or keyboard patterns': { icon: 'grid_view', cls: 'text-tertiary' },
        'Avoid repeated characters like aaa or 111': { icon: 'repeat', cls: 'text-tertiary' },
        'Strong password': { icon: 'verified', cls: 'text-primary' }
    };

    if (res.feedback && res.feedback.length > 0) {
        res.feedback.forEach(function(msg) {
            var meta = iconMap[msg] || { icon: 'info', cls: 'text-secondary/40' };
            $list.append(
                '<div class="p-4 bg-surface-container-low rounded border border-outline-variant/5">' +
                    '<div class="flex items-center gap-3 mb-2">' +
                        '<span class="material-symbols-outlined ' + meta.cls + ' text-xl">' + meta.icon + '</span>' +
                        '<p class="text-sm text-on-background font-bold uppercase tracking-tight">' + msg + '</p>' +
                    '</div>' +
                '</div>'
            );
        });
    } else {
        $list.append(
            '<div class="p-4 bg-surface-container-low rounded border border-outline-variant/5">' +
                '<div class="flex items-center gap-3 mb-2">' +
                    '<span class="material-symbols-outlined text-secondary/40 text-xl">info</span>' +
                    '<p class="text-sm text-on-background font-bold uppercase tracking-tight">No feedback available</p>' +
                '</div>' +
            '</div>'
        );
    }

    var $log = $('#scanner-log').empty();
    if (res.scanLog && res.scanLog.length > 0) {
        res.scanLog.forEach(function(line) {
            var cls = line.type === 'error' ? 'text-error/70'
                    : line.type === 'warn'  ? 'text-tertiary/80'
                    : line.type === 'pass'  ? 'text-primary/80'
                    : 'text-secondary/50';
            $log.append(
                '<p class="flex gap-4"><span class="text-outline">[' + line.time + ']</span>' +
                '<span class="' + cls + '">' + line.text + '</span></p>'
            );
        });
    }
}

/* ══════════════════════════════════════════
   COMPARE
══════════════════════════════════════════ */

// Visibility toggles on compare inputs
$('#toggleCompare1').on('click', function() {
    var $i = $('#compareInput1');
    $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
    $(this).text($i.attr('type') === 'password' ? 'visibility' : 'visibility_off');
});
$('#toggleCompare2').on('click', function() {
    var $i = $('#compareInput2');
    $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
    $(this).text($i.attr('type') === 'password' ? 'visibility' : 'visibility_off');
});

function levenshtein(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
            dp[i][j] = i === 0 ? j : j === 0 ? i : 0;
        }
    }
    for (var i = 1; i <= m; i++) {
        for (var j = 1; j <= n; j++) {
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[m][n];
}

function similarityPct(a, b) {
    if (!a && !b) return 0;
    var maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    return Math.round((1 - levenshtein(a, b) / maxLen) * 100);
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

$('#compareInput1, #compareInput2').on('input', function() {
    var pw1 = $('#compareInput1').val();
    var pw2 = $('#compareInput2').val();
    if (!pw1 || !pw2) return;

    var pct  = similarityPct(pw1, pw2);
    var dist = levenshtein(pw1, pw2);
    var now  = new Date().toTimeString().slice(0, 8);

    // Find common prefix
    var prefixLen = 0;
    while (prefixLen < pw1.length && prefixLen < pw2.length && pw1[prefixLen] === pw2[prefixLen]) {
        prefixLen++;
    }
    var prefix = pw1.slice(0, prefixLen);
    var rest1  = pw1.slice(prefixLen);
    var rest2  = pw2.slice(prefixLen);

    // Gauge + bar
    $('#comparePct').text(pct + '%');
    var circumference = 2 * Math.PI * 70; // ~440
    $('#compareCircleBar').css('stroke-dashoffset', circumference - (circumference * pct / 100));
    $('#compareBarFill').css('width', pct + '%');
    $('#compareBarPct').text(pct + '%');

    // Risk label + colour
    var riskLabel, riskClass;
    if (pct >= 70)      { riskLabel = 'HIGH RISK';  riskClass = 'text-error'; }
    else if (pct >= 40) { riskLabel = 'MODERATE';   riskClass = 'text-tertiary'; }
    else                { riskLabel = 'LOW RISK';    riskClass = 'text-primary'; }
    $('#compareRiskLabel').text(riskLabel).attr('class', 'font-headline text-2xl font-bold tracking-tight mb-2 ' + riskClass);
    // Also update circle colour
    $('#compareCircleBar').attr('class', riskClass);

    // Overlap highlight — matching chars in green, differing in white
    function buildHighlight(prefix, rest) {
        var html = '';
        if (prefix) {
            html += '<span class="text-primary border-b-2 border-primary/50 pb-1">' + escHtml(prefix) + '</span>';
        }
        if (rest) {
            html += '<span class="text-on-surface">' + escHtml(rest) + '</span>';
        }
        return html;
    }
    $('#overlapPw1').html(buildHighlight(prefix, rest1));
    $('#overlapPw2').html(buildHighlight(prefix, rest2));

    // Log
    var $log = $('#compareLog').empty();
    $log.append('<p><span class="text-outline">[' + now + ']</span> Scan started...</p>');
    if (prefixLen > 0) {
        $log.append('<p><span class="text-outline">[' + now + ']</span> <span class="text-primary">MATCH:</span> Shared prefix \'' + escHtml(prefix) + '\' (' + prefixLen + ' chars)</p>');
    } else {
        $log.append('<p><span class="text-outline">[' + now + ']</span> No shared prefix found.</p>');
    }
    $log.append('<p><span class="text-outline">[' + now + ']</span> Edit distance: ' + dist + ' character' + (dist !== 1 ? 's' : '') + '</p>');
    $log.append('<p><span class="text-outline">[' + now + ']</span> Similarity: ' + pct + '%</p>');
    var resultColor = pct >= 70 ? '#ffb4ab' : pct >= 40 ? '#ffb4aa' : '#00e1ab';
    $log.append('<p><span class="text-outline">[' + now + ']</span> Result: <span style="color:' + resultColor + ';font-weight:bold;">' + riskLabel + '</span></p>');

    // Ladder prediction
    var numMatch1 = pw1.match(/(\d+)/);
    var numMatch2 = pw2.match(/(\d+)/);
    var v3 = '???';
    if (numMatch1 && numMatch2) {
        var n1 = parseInt(numMatch1[1]);
        var n2 = parseInt(numMatch2[1]);
        var diff = n2 - n1;
        if (diff !== 0) {
            v3 = pw2.replace(numMatch2[0], String(n2 + diff));
        }
    }
    $('#ladderV1').text(pw1);
    $('#ladderV2').text(pw2);
    $('#ladderV3').text(v3);

    // Individual strength from server
    analyzeForCompare('#compareStrength1', '#compareCrack1', pw1);
    analyzeForCompare('#compareStrength2', '#compareCrack2', pw2);
});

function analyzeForCompare(strengthSel, crackSel, pw) {
    $('#scanner-log').html(
        '<p class="flex gap-4"><span class="text-outline">[' + new Date().toTimeString().slice(0,8) + ']</span>' +
        '<span class="text-secondary/40">Analyzing...</span></p>'
    );
    
    $.ajax({
        url: API + '/analyze',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ password: pw }),
        success: function(res) {
           var colorMap = { Weak: '#ffb4ab', Medium: '#f9c74f', Strong: '#00e1ab' };
            $(strengthSel).text(res.strength || 'Unknown').css('color', colorMap[res.strength] || '');
            $(crackSel).text(res.crackTime || '—');
        }
    });
}