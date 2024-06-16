$('#contactForm').on('submit', function(event) {
    event.preventDefault();

    const nameInput = $("#username")
    const emailInput = $("#email")
    const subjectInput = $("#subject")
    const messageInput = $("#message")

    let contactFormData = {
        name: nameInput.val(),
        email: emailInput.val(),
        subject: subjectInput.val(),
        message: messageInput.val()
    }
    if(!$('#contactForm')[0].checkValidity()){
        return;
    }

    const successMessage = $("#successMessage")
    const errorMessage = $("#errorMessage")

    $.ajax({
        url: `contact`,
        method: 'POST',
        data: contactFormData,
        success: function(response) {
            errorMessage.hide()
            errorMessage.addClass("invisible")
            successMessage.show();
            successMessage.removeClass('invisible');

            // Clear input fields
            nameInput.val('')
            emailInput.val('')
            subjectInput.val('')
            messageInput.val('')
            $("#contactForm").removeClass('was-validated')
        },
        error: function(xhr, status, error) {
            successMessage.hide()
            successMessage.addClass("invisible")
            errorMessage.show();
            errorMessage.removeClass('invisible');
        }
    });
});


$("#successMessage").hide();
$("#errorMessage").hide();


