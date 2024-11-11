// Function to fetch customer balance data from the API
async function userInfo() {
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.orders.get_customer_balance_from_gl');
        
        // Check if response is successful
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();

        // Check if data contains the expected message structure
        if (data && data.message) {
            // Extract relevant data from the message object
            const { Customer, 'Abr': customer_abbreviation, 'Email': email } = data.message;

            // Update HTML elements with fetched data
            document.getElementById('abbr').textContent = customer_abbreviation;
            
            document.getElementById('customer-name').textContent = Customer;
            document.getElementById('email').textContent = email;
        } else {
            console.error("Unexpected response structure:", data);
            // Optionally set an error message in HTML if needed
        }
    } catch (error) {
        console.error("Error fetching customer data:", error);
        // Optionally, set error messages in HTML elements here
    }
}

// Call the function to fetch and display data when the page loads
window.onload = function() {
    userInfo();
};
