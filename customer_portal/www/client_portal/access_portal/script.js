const container = document.getElementById("container");

document.getElementById("signUp").addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

document.getElementById("signIn").addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

document.getElementById("signUpLink").addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("right-panel-active");
});

document.getElementById("signInLink").addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.remove("right-panel-active");
});

// JavaScript to toggle password visibility
document.getElementById('toggleSignupPassword').addEventListener('click', function() {
    const signupPasswordInput = document.getElementById('signupPassword');
    const type = signupPasswordInput.type === 'password' ? 'text' : 'password';
    signupPasswordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon based on visibility
});

document.getElementById('toggleLoginPassword').addEventListener('click', function() {
    const loginPasswordInput = document.getElementById('loginPassword');
    const type = loginPasswordInput.type === 'password' ? 'text' : 'password';
    loginPasswordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon based on visibility
});


document.querySelector(".login-container form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Get the input values from the login form
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
        // Send a login request to the Frappe ERPNext API
        const response = await fetch(`/api/method/customer_portal.custom_api.auth.login?usr=${encodeURIComponent(email)}&pwd=${encodeURIComponent(password)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        console.log("API Response:", result); // Log the API response for debugging

        // Check if the response contains the sid or user information, indicating a successful login
        if (response.ok && result.message && result.message.sid) {
            // Store API credentials if needed (e.g., session storage for further requests)
            sessionStorage.setItem("sid", result.message.sid);
            sessionStorage.setItem("api_key", result.message.api_key);
            sessionStorage.setItem("api_secret", result.message.api_secret);

            // Redirect to the client portal on successful login
            window.location.href = "https://portal.metrogroupng.com/client_portal/client";
        } else {
            // Show an error message if login fails
            alert("Login failed. Please check your credentials.");
        }
    } catch (error) {
        // Handle network or unexpected errors
        console.error("Error during login:", error);
        alert("An error occurred. Please try again later.");
    }
});


document.addEventListener("DOMContentLoaded", function () {
    // Handle the signup form submission
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent the default form submission

        // Get the input values from the signup form
        const firstNameInput = e.target.querySelector('input[type="text"]');
        const emailInput = e.target.querySelector('input[type="email"]');
        const passwordInput = e.target.querySelector('input[type="password"]');

        // Debugging: Check if inputs are found
        console.log("First Name Input:", firstNameInput);
        console.log("Email Input:", emailInput);
        console.log("Password Input:", passwordInput);

        if (!firstNameInput || !emailInput || !passwordInput) {
            console.error("One or more input fields are not found.");
            alert("Please fill out all fields.");
            return; // Exit if any input is not found
        }

        const firstName = firstNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            // Fetch CSRF token
            const csrfResponse = await fetch('https://portal.metrogroupng.com/api/method/customer_portal.custom_api.auth.regenerate_session', {
                method: 'GET',
                credentials: 'include' // Include credentials for cross-origin requests
            });

            if (!csrfResponse.ok) {
                throw new Error("Failed to fetch CSRF token");
            }

            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.message.csrf_token;
            document.cookie = `X-Frappe-CSRF-Token=${csrfToken}; path=/`; // Set CSRF token as cookie

            // Send a signup request to the Frappe ERPNext API
            const response = await fetch("/api/method/customer_portal.custom_api.auth.sign_up", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-Frappe-CSRF-Token': csrfToken  // Include CSRF token
                },
                body: JSON.stringify({ first_name: firstName, email: email, password: password })
            });

            const result = await response.json();
            console.log("API Response:", result.message.message); // Log the API response for debugging

            // Check if the signup was successful
            if (result.message.message == "User created successfully.") {
                alert(result.message.message); // Notify the user of success
                window.location.href = "https://portal.metrogroupng.com/client_portal/client"; // Redirect after signup
            } else {
                alert(result.message || "Signup failed. Please try again.");
            }
        } catch (error) {
            console.error("Error during signup:", error);
            alert("An error occurred. Please try again later.");
        }
    });
});
