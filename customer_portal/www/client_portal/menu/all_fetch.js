// Function to fetch customer balance data from the API
async function fetchCustomerBalance() {
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.orders.get_customer_balance_from_gl');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Function to format currency with commas and two decimal places
        function formatCurrency(amount) {
            return `₦ ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Extract relevant data
        const { Customer, 'Account Currency': currency, 'Abr': customer_abbreviation, 'Available Credits': credits, 'Email': email, 'Balance Payable': balance } = data.message;

        // Update HTML elements with fetched data customer-detail
        document.getElementById('title-name').textContent = "Hello " + Customer;
        document.getElementById('abbr').textContent = customer_abbreviation;
        document.getElementById('customer-name').textContent = Customer;
        document.getElementById('customer-detail').textContent = Customer;
        document.getElementById('email').textContent = email;
        document.getElementById('email-detail').textContent = email;
        document.getElementById('currency').textContent = currency;
        document.getElementById('available-credits').textContent = formatCurrency(credits);
        document.getElementById('balance-payable').textContent = formatCurrency(balance);
        
    } catch (error) {
        console.error('Failed to fetch customer balance:', error);
        // Optionally, you could set error messages in the HTML elements here.
    }
}

// Function to fetch customer payment details dynamically
async function fetchLastPayment() {
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.orders.get_last_payment');
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        // Ensure the response contains the expected fields
        if (data.message) {
            const { "Total Amount": totalAmount, 
                    "Balance Payable": balancePayable, 
                    "Paid On": paidOn, 
                    "Payments": paymentsCount } = data.message;

            // Function to format currency
            function formatCurrency(amount) {
                return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            // Format and display the data for Last Payment
            document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
            document.getElementById('balance-payable-last').textContent = formatCurrency(balancePayable);
            document.getElementById('paid-on').textContent = new Date(paidOn).toLocaleDateString(); // Format date
            document.getElementById('payments-count').textContent = paymentsCount;
        } else {
            console.error("No message data in response.");
        }
    } catch (error) {
        console.error("Error fetching last payment details: ", error);
        // Optionally, display a message if the data fetch fails
        document.getElementById('total-amount').textContent = "Error loading data";
        document.getElementById('balance-payable-last').textContent = "Error loading data";
        document.getElementById('paid-on').textContent = "Error loading data";
        document.getElementById('payments-count').textContent = "Error loading data";
    }
}

// Function to fetch and display shared documents
async function fetchSharedDocuments() {
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.orders.get_shared_documents');
        if (!response.ok) {
            throw new Error('Failed to fetch shared documents');
        }

        const data = await response.json();

        // Ensure the response structure is as expected
        const documents = data.message.message;

        const documentsList = document.getElementById('documents-list');

        // Clear the previous list
        documentsList.innerHTML = '';

        // Loop through the documents and create list items with download links
        documents.forEach(file => {
            const listItem = document.createElement('li');
            listItem.innerHTML = ` 
                <a href="${file.file_url}" target="_blank">${file.file_name}</a> 
                (${file.file_type})
            `;
            documentsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching shared documents:', error);
    }
}

// Call both functions to fetch and display the data when the page loads
window.onload = function() {
    fetchCustomerBalance();
    fetchLastPayment();
    fetchSharedDocuments();
};
