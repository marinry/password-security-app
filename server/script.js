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

