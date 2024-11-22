
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

async function fetchOrders() {
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.payment_made.get_customer_payment_made');
        const result = await response.json();

        const payments = result.message && result.message.payments;

        if (payments) {
            const orderItemsContainer = document.getElementById('invoice-items');
            // Initialize the total amount and total outstanding
            let totalAmount = 0;

            payments.forEach(payment => {
                // Add the item amount to the total amount
                totalAmount += payment.paid_amount;

                // Create row for each payment
                const paymentRow = document.createElement('tr');
                paymentRow.innerHTML = `
                    <td>${payment.name}</td>
                    <td>${payment.posting_date}</td>
                    <td>${payment.status}</td>
                    <td>₦${payment.paid_amount.toLocaleString()}</td>
                    <td>₦${payment.custom_amount_paid_till_date.toLocaleString()}</td>
                    <td>₦${payment.custom_balance.toLocaleString()}</td>
                `;
                orderItemsContainer.appendChild(paymentRow);
            });

            // After all payments are processed, add the total amount row
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td colspan="3" style="text-align:right;"><strong>Total Amount</strong></td>
                <td>
                    <span id="total-amount">₦${totalAmount.toLocaleString()}</span>
                </td>
            `;
            orderItemsContainer.appendChild(totalRow);

        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}


function togglePaymentSchedule(orderId) {
    const scheduleRow = document.getElementById(`schedule-${orderId}`);
    scheduleRow.style.display = scheduleRow.style.display === 'none' ? '' : 'none';
}

document.addEventListener('DOMContentLoaded', fetchOrders);
