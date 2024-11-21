// Show the modal on "Contact Support" button click
document.getElementById('supportBtn').addEventListener('click', function() {
    document.getElementById('emailModal').style.display = 'block';
});

// Close the modal when "Cancel" or "×" is clicked
document.getElementById('cancelModalBtn').addEventListener('click', function() {
    document.getElementById('emailModal').style.display = 'none';
});
document.getElementById('closeModalBtn').addEventListener('click', function() {
    document.getElementById('emailModal').style.display = 'none';
});

// Handle the "Send" button click
document.getElementById('sendEmailSubmit').addEventListener('click', function() {
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const errorAlert = document.getElementById('errorAlert');

    // Fetch CSRF token using fetch API
    fetch('/api/method/customer_portal.custom_api.auth.regenerate_session', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(csrfData => {
        const csrfToken = csrfData.message.csrf_token; // Extract CSRF token from the response

        // Set the CSRF token as a cookie
        document.cookie = `X-Frappe-CSRF-Token=${csrfToken}; path=/`;

        // Send the email data using the CSRF token
        return fetch('/api/method/customer_portal.custom_api.send_mail.create_send_mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Frappe-CSRF-Token': csrfToken // Include CSRF token in request headers
            },
            body: JSON.stringify({
                subject: subject,
                content: message
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.message) {
            alert('Email sent successfully!');
            document.getElementById('emailModal').style.display = 'none';  // Close the modal on success
        } else {
            errorAlert.style.display = 'block';  // Show error alert if response is missing message
        }
    })
    .catch(error => {
        console.error('Error sending email:', error);
        errorAlert.style.display = 'block';  // Show error alert on failure
    });
});
