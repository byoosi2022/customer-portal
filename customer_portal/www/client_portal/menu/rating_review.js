// Modal and review elements
const reviewModal = document.getElementById('reviewModal');
const reviewBtn = document.getElementById('reviewBtn');
const closeModal = document.getElementById('closeModal');
const stars = document.querySelectorAll('.star');
const ratingText = document.getElementById('ratingText');
const submitReview = document.getElementById('submitReview');
let selectedRating = 0;

// Show modal when "Review" button is clicked
reviewBtn.addEventListener('click', function() {
    reviewModal.style.display = 'flex';
});

// Close modal when "×" button is clicked
closeModal.addEventListener('click', function() {
    reviewModal.style.display = 'none';
});

// Close modal if clicked outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === reviewModal) {
        reviewModal.style.display = 'none';
    }
});

// Handle star rating selection
stars.forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));
        updateRatingDisplay();
    });

    // Change color on hover
    star.addEventListener('mouseover', function() {
        const currentValue = parseInt(this.getAttribute('data-value'));
        updateStars(currentValue);
    });

    // Reset to current rating on mouse out
    star.addEventListener('mouseout', function() {
        updateStars(selectedRating);
    });
});

// Update the stars based on rating
function updateStars(rating) {
    stars.forEach(star => {
        if (parseInt(star.getAttribute('data-value')) <= rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

// Update the rating text
function updateRatingDisplay() {
    ratingText.innerText = `${selectedRating} out of 5`;
    updateStars(selectedRating);
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


// Submit the review using AJAX
submitReview.addEventListener('click', async function() {
    const comment = document.getElementById('comment').value.trim();

    // Validate rating and comment before sending
    if (selectedRating > 0 && comment !== "") {
        try {
            // Fetch CSRF token
            const csrfResponse = await fetch('/api/method/customer_portal.custom_api.auth.regenerate_session');  // Make sure to replace with actual CSRF token endpoint if different
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.message.csrf_token; // Extract CSRF token from the response

            console.log("CSRF Token:", csrfToken); // Log token to verify retrieval

            // Set the CSRF token as a cookie (optional, depending on the backend settings)
            document.cookie = `X-Frappe-CSRF-Token=${csrfToken}; path=/`;

            // Send the review data to Frappe using AJAX
            $.ajax({
                url: '/api/method/customer_portal.custom_api.create_reciew.create_review',  // The server-side function to call
                type: 'POST',
                headers: {
                    'X-Frappe-CSRF-Token': csrfToken // Include CSRF token in request headers
                },
                data: {
                    comment: comment,
                    rating: selectedRating
                },
                success: function(response) {
                    alert("Review submitted successfully!");
                    reviewModal.style.display = 'none'; // Close the modal after submission
                    resetReviewForm();
                },
                error: function(xhr, status, error) {
                    alert("Failed to submit your review. Please try again.");
                }
            });

        } catch (error) {
            alert("Failed to retrieve CSRF token. Please try again.");
            console.error("CSRF token fetch error:", error);
        }
    } else {
        alert('Please provide a rating and comment!');
    }
});

// Reset review form
function resetReviewForm() {
    document.getElementById('comment').value = "";  // Clear the comment field
    selectedRating = 0;
    updateRatingDisplay();  // Reset the rating display
}
