// Function to fetch and display customer profile data
function fetchCustomerProfile() {
    const url = "https://portal.metrogroupng.com/api/method/customer_portal.custom_api.user_profile.get_customer_profile";

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            if (data.message && data.message.length > 0) {
                const profile = data.message[0];
                console.log(profile)

                // Update profile information
                document.getElementById("customer-name").textContent = `${profile.salute || ''} ${profile.first_name || ''} ${profile.last_name || ''}`;
                document.getElementById("customer-email").textContent = profile.user_id || '';
                document.getElementById("customer-phone").textContent = profile.mobile || '';
                document.getElementById("customer-address").textContent = `${profile.street_1 || ''}, ${profile.city_ba || ''}, ${profile.country_ba || ''}`;
                document.getElementById("company").textContent = profile.campany_name || '';

                // Update profile image if available
                const profileImage = document.getElementById("customer-image");
                if (profile.image) {
                    profileImage.src = profile.image;
                } else {
                    profileImage.src = "default-image-path.jpg"; // Use a default image if none exists
                }
            } else {
                console.log("No profile data found.");
            }
        })
        .catch(error => console.error("Error fetching profile data:", error));
}

// Function to toggle the update form visibility and button text
function toggleUpdateForm() {
    const updateForm = document.getElementById("update-form");
    const updateButton = document.querySelector(".edit-profile-btn");

    if (updateForm.style.display === "none" || updateForm.style.display === "") {
        updateForm.style.display = "block";  // Show the form
        updateButton.textContent = "Cancel Update";  // Change button text
    } else {
        updateForm.style.display = "none";  // Hide the form
        updateButton.textContent = "Update Profile";  // Reset button text
    }
}

// Function to save changes to the customer profile, including image upload
async function updateCustomerProfile() {
    // Retrieve form data
    const formData = new FormData();
    formData.append("first_name", document.getElementById("first_name").value);
    formData.append("last_name", document.getElementById("last_name").value);
    formData.append("phone", document.getElementById("phone").value);
    formData.append("address", document.getElementById("address").value);
    formData.append("city", document.getElementById("city").value);
    formData.append("state", document.getElementById("state").value);

    // Check if an image file is selected and append it
    const profileImage = document.getElementById("profile_image").files[0];
    if (profileImage) {
        formData.append("profile_image", profileImage);
    }

    try {
        // Fetch CSRF token from the server
        const csrfResponse = await fetch('https://portal.metrogroupng.com/api/method/customer_portal.custom_api.auth.regenerate_session', {
            method: 'GET',
            credentials: 'include' // Ensure cookies are sent with the request
        });

        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.message.csrf_token; // Extract CSRF token from the response
        console.log("CSRF Token:", csrfToken); // Log token to verify retrieval

        // Use AJAX to send the form data, including the image file
        $.ajax({
            url: "/api/method/customer_portal.custom_api.user_profile.update_customer_profile",
            type: "POST",
            processData: false, // Required for file upload
            contentType: false, // Required for file upload
            data: formData,
            headers: {
                'X-Frappe-CSRF-Token': csrfToken // Include CSRF token in request headers
            },
            success: function(response) {
                if (response.message && response.message.status === "success") {
                    alert("Profile updated successfully!");
                    fetchCustomerProfile(); // Refresh the profile data after a successful update
                } else {
                    alert(response.message ? response.message.message : "Failed to update profile.");
                }
            },
            error: function(err) {
                console.error("Error updating profile:", err);
                alert("An error occurred while updating the profile.");
            }
        });
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
        alert("Failed to fetch CSRF token. Please try again later.");
    }
}

// Initialize profile fetching on page load
document.addEventListener("DOMContentLoaded", fetchCustomerProfile);
