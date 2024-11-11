
// Check if the user is logged in and toggle login/logout links accordingly
function checkLoginStatus() {
    fetch('/api/method/frappe.auth.get_logged_user', {
        method: 'GET',
        credentials: 'include' // Important for sending cookies with the request
    })
        .then(response => response.json())
        .then(data => {
            const loginLink = document.getElementById("login-link");
            const logoutLink = document.getElementById("logout-link");

            if (data.message) {
                // User is logged in
                loginLink.style.display = "none";
                logoutLink.style.display = "block";
            } else {
                // User is not logged in
                loginLink.style.display = "block";
                logoutLink.style.display = "none";
            }
        })
        .catch(error => {
            console.error("Error checking login status:", error);
            // Default to logged-out view if there’s an error
            document.getElementById("login-link").style.display = "block";
            document.getElementById("logout-link").style.display = "none";
        });
}

// Log the user out
function logoutUser() {
    fetch('/api/method/logout', {
        method: 'GET',
        credentials: 'include'
    })
        .then(() => {
            window.location.href = "/client_portal/access_portal/login"; // Redirect to login page after logout
        })
        .catch(error => console.error("Error logging out:", error));
}

// Call the checkLoginStatus function on page load
document.addEventListener("DOMContentLoaded", checkLoginStatus);