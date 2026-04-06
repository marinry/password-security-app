const API = 'http://localhost:3000';

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
            $('#headerStrength').text(res.strength).css('color', colorMap[res.strength] || '');
        },
        error: function() {
            $('#feedbackList').html('<p class="text-error/60 text-xs font-mono p-2">Cannot reach server — is node server.js running?</p>');
        }
    });
});

function resetScannerUI() {
    $('#strength').text('Score: 84 / Optimal').css('color', '');
    $('#crackTime').text('234 Years');
    $('#strengthScore').html('84<span class="text-sm font-normal text-secondary/40 ml-1">/100</span>');
    $('#entropyBars div').each(function(i) {
        if (i < 8) {
            $(this).removeClass('bg-surface-container-highest').addClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]');
        } else {
            $(this).removeClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]').addClass('bg-surface-container-highest');
        }
    });
}

function updateScannerUI(res) {
    var scoreMap = { Weak: 24,  Medium: 58, Strong: 91 };
    var crackMap = { Weak: '< 1 Second', Medium: '~3 Hours', Strong: '234+ Years' };
    var barMap   = { Weak: 3,   Medium: 6,  Strong: 10 };
    var colorMap = { Weak: '#ffb4ab', Medium: '#f9c74f', Strong: '#00e1ab' };

    $('#strength').text('Score: ' + res.strength).css('color', colorMap[res.strength] || '');
    $('#crackTime').text(crackMap[res.strength] || '—');
    $('#strengthScore').html((scoreMap[res.strength] || '—') + '<span class="text-sm font-normal text-secondary/40 ml-1">/100</span>');

    var filled = barMap[res.strength] || 0;
    $('#entropyBars div').each(function(i) {
        if (i < filled) {
            $(this).removeClass('bg-surface-container-highest').addClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]');
        } else {
            $(this).removeClass('bg-primary shadow-[0_0_12px_rgba(0,225,171,0.4)]').addClass('bg-surface-container-highest');
        }
    });

    var $list = $('#feedbackList').empty();
    var iconMap = {
        'Add uppercase letters':     { icon: 'title',      cls: 'text-error/60' },
        'Add numbers':               { icon: 'pin',        cls: 'text-error/60' },
        'Use at least 8 characters': { icon: 'straighten', cls: 'text-tertiary'  },
        'Strong password':           { icon: 'verified',   cls: 'text-primary'  }
    };

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
}

        }

        response.feedback.forEach(item => {
            feedbackList.append("<li>" + item + "</li>");
        });
    }
});

