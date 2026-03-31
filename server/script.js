$(document).ready(function () {

    $('#passwordInput').on('input', function () {
        const password = $(this).val();

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

