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
// Function to format currency with commas and two decimal places
function formatCurrency(amount) {
    return `₦ ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Load items from the cart and display them
function loadCartItems() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach((item, index) => {
        if (item.price && item.quantity) { // Check if price and quantity exist
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            cartItemsContainer.innerHTML += `
                <tr>
                    <td class="cart-item">
                        <img src="${item.image || 'https://via.placeholder.com/50x50'}" alt="${item.item_name}">
                        <span>${item.item_name}</span>
                    </td>
                    <td>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input" onchange="updateQuantity(${index}, this.value)">
                    </td>
                    <td class="unit-price">${formatCurrency(item.price)}</td>
                    <td class="item-total" id="item-total-${index}">${formatCurrency(itemTotal)}</td>
                    <td>
                        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                    </td>
                </tr>
            `;
        }
    });

    // Ensure subtotal is formatted correctly
    subtotalElement.innerText = formatCurrency(subtotal);
}

// Remove item from cart and local storage postSalesOrder
function removeItem(index) {
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cartItems));
    loadCartItems();
}
async function postSalesOrder() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if any item in the cart has a selected company
    const selectedCompany = cartItems[0]?.company || null; // Assuming all items in cart belong to the same company

    if (!selectedCompany) {
        alert('Please select a company before posting the order.');
        return;
    }

    // Show loading message and spinner
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loadingContainer';
    loadingContainer.style.position = 'fixed';
    loadingContainer.style.top = '0';
    loadingContainer.style.left = '0';
    loadingContainer.style.width = '100%';
    loadingContainer.style.height = '100%';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.justifyContent = 'center';
    loadingContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingContainer.style.zIndex = '9999';

    const loadingMessage = document.createElement('div');
    loadingMessage.innerText = 'Processing your order, please wait...';
    loadingMessage.style.color = '#fff';
    loadingMessage.style.marginBottom = '10px';
    loadingMessage.style.fontSize = '18px';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    loadingContainer.appendChild(loadingMessage);
    loadingContainer.appendChild(spinner);
    document.body.appendChild(loadingContainer);

    const orderData = {
        series: `SAL-ORD-${new Date().getFullYear()}.`,
        order_type: "Sales",
        customer: '',
        date: new Date().toISOString().slice(0, 10),
        delivery_date: new Date().toISOString().slice(0, 10),
        company: selectedCompany,  // Set company to the selected one
        project: "PROJ-0025",
        items: []
    };

    let csrfToken = '';

    try {
        // Fetch CSRF token
        const csrfResponse = await $.ajax({
            url: '/api/method/customer_portal.custom_api.auth.regenerate_session',
            type: 'GET',
            xhrFields: { withCredentials: true }
        });

        csrfToken = csrfResponse.message.csrf_token;
        console.log("CSRF Token:", csrfToken); // Log token to verify retrieval
        document.cookie = `X-Frappe-CSRF-Token=${csrfToken}; path=/`; // Set CSRF token as cookie

        // Fetch customer data
        const customerResponse = await $.ajax({
            url: '/api/method/customer_portal.custom_api.create_order.get_customer_for_logged_in_user',
            type: 'GET',
            xhrFields: { withCredentials: true }
        });

        if (customerResponse.message) {
            orderData.customer = customerResponse.message.customer;
        } else {
            alert('Unable to fetch customer data. Please try again or log in to the portal.');
            removeLoadingMessage();
            return;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('An error occurred while fetching data.');
        removeLoadingMessage();
        return;
    }

    cartItems.forEach(item => {
        if (item.item_name && item.quantity > 0) {
            orderData.items.push({
                item_code: item.item_name,
                delivery_date: orderData.delivery_date,
                qty: item.quantity,
                item_name: item.item_name,
                rate: item.price,
                warehouse: "Metro and Castle Warehouse - MACL"
            });
        }
    });

    if (orderData.items.length === 0) {
        alert('No items with quantity greater than zero to post.');
        removeLoadingMessage();
        return;
    }

    try {
        // Post the sales order with CSRF token as header and cookie
        const orderResponse = await $.ajax({
            url: '/api/method/customer_portal.custom_api.sales_order_api.post_sales_order',
            type: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Frappe-CSRF-Token': csrfToken  // Ensure csrfToken has a valid value
            },
            xhrFields: { withCredentials: true }, // Maintain session cookies
            data: JSON.stringify({ order_data: orderData }),
            success: function (orderResult) {
                console.log('Order Result:', orderResult);
                if (orderResult.message.success) {
                    alert('Your order was created successfully!');
                    localStorage.removeItem('cart');
                    window.location.href = '/client_portal/my_cart/cart';
                } else {
                    const errorMessage = typeof orderResult.message === 'object'
                        ? JSON.stringify(orderResult.message)
                        : orderResult.message;
                    alert('Failed to create sales order: ' + errorMessage);
                }
            },
            error: function (error) {
                console.error('Error posting sales order:', error);
                alert('An error occurred while creating the sales order.');
            },
            complete: function () {
                removeLoadingMessage();
            }
        });

    } catch (error) {
        console.error('Error posting sales order:', error);
        alert('An error occurred while creating the sales order.');
    }
}

function removeLoadingMessage() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
        loadingContainer.remove();
    }
}


// CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
.spinner {
border: 8px solid rgba(255, 255, 255, 0.3);
border-left-color: #ffffff;
border-radius: 50%;
width: 40px;
height: 40px;
animation: spin 1s linear infinite;
}

@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);


// Add event listener for the checkout button
document.querySelector('.checkout-btn').addEventListener('click', postSalesOrder);

// JavaScript to handle quantity changes, removing items, and updating totals
document.addEventListener('DOMContentLoaded', function () {
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');

    // Function to update subtotal
    function updateSubtotal() {
        let subtotal = 0;
        cartItems.querySelectorAll('.item-total').forEach(item => {
            // Correctly parse the total without currency symbol
            subtotal += parseFloat(item.textContent.replace('₦', '').replace(/,/g, '').trim()) || 0;
        });
        subtotalElement.textContent = formatCurrency(subtotal); // Updating subtotal with currency symbol
    }

    // Function to update item total based on quantity and unit price
    function updateItemTotal(row) {
        const quantityInput = row.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value, 10) || 0; // Default to 0 if NaN
        const unitPriceText = row.querySelector('.unit-price').textContent.replace('₦', '').replace(/,/g, '').trim();
        const unitPrice = parseFloat(unitPriceText); // Handle currency format

        // Calculate the total for this item
        const total = quantity * unitPrice;

        // Update the item total with formatted currency
        row.querySelector('.item-total').textContent = formatCurrency(total);
    }

    // Event delegation for remove buttons and quantity change
    cartItems.addEventListener('click', function (event) {
        if (event.target.classList.contains('remove-btn')) {
            const row = event.target.closest('tr');
            const index = Array.from(cartItems.children).indexOf(row); // Get the index of the row
            removeItem(index); // Call removeItem function
        }
    });

    // Event listener for quantity change to update item total and subtotal
    cartItems.addEventListener('input', function (event) {
        if (event.target.classList.contains('quantity-input')) {
            const row = event.target.closest('tr');
            updateItemTotal(row);  // Update total for this row
            updateSubtotal();      // Update subtotal after quantity change
        }
    });

    // Load cart items on page load
    loadCartItems();
});
