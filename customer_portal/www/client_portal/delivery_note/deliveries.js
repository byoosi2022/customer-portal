
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
        const response = await fetch('/api/method/customer_portal.custom_api.orders.get_customer_delivery_notes');
        const result = await response.json();

        const salesOrders = result.message && result.message.sales_invoice;
        // console.log(result);

        if (salesOrders) {
            const orderItemsContainer = document.getElementById('invoice-items');
            // Initialize the total amount and total advance paid
            let totalAmount = 0;
            salesOrders.forEach(order => {
                // Assuming there's only one item per order as per your example
                order.items.forEach(item => {
                    // console.log(item);
                    // Add the item amount to the total amount
                    totalAmount += item.amount;
                
                    // Create row for each sales order
                    const orderRow = document.createElement('tr');
                    orderRow.innerHTML = `
                        <td>${item.item_code}</td> <!-- Display item code here -->
                        <td>${order.name}</td>
                        <td>${order.posting_date}</td>
                        <td>${order.status}</td>
                        <td>₦${item.amount.toLocaleString()}</td>
                     
                      
                    `;
                    orderItemsContainer.appendChild(orderRow);
                });


            });

             // After all orders are processed, add the total amount row
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td colspan="4" style="text-align:right;"><strong>Total Amount</strong></td>
                <td colspan="2">
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
