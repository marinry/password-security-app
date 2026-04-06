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


        $.ajax({
            url: 'http://localhost:3000/analyze',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({password: password}),

            success: function (response) {
                updateUI(response);
            },

            error: function () {
                $('#feedbackList').html("<li>Error connecting to server</li>");
            }
        });
    });

    function updateUI(response) {
        const strengthText = $('#strength');
        const feedbackList = $('#feedbackList');

        strengthText.text("Strength: " + response.strength);
        feedbackList.empty();

        strengthText.removeClass("weak medium strong");

        if(response.strength === "Weak") {
            strengthText.addClass("weak");
        } else if(response.strength === "Medium") {
            strengthText.addClass("medium");
        } else if(response.strength === "Strong") {
            strengthText.addClass("strong");
        }

        response.feedback.forEach(item => {
            feedbackList.append("<li>" + item + "</li>");
        });
    }
});

