function fetchStatementData() {
    const fromDate = document.getElementById('from_date').value;
    const toDate = document.getElementById('to_date').value;

    // Constructing the API URL with query parameters for date filters
    const apiUrl = `/api/method/customer_portal.custom_api.statement.get_customers_statement?from_date=${fromDate}&to_date=${toDate}`;

    // Fetching the data from the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const statement = data.message;

            // Populate statement summary
            document.getElementById('customer_name').innerText = statement.customer || 'N/A';
            document.getElementById('balance_brought_forward').innerText = formatCurrency(statement.balance_brought_forward) || '₦0';
            document.getElementById('grand_total_amount').innerText = formatCurrency(statement.grand_total_amount) || '₦0';
            document.getElementById('total_paid_amount').innerText = formatCurrency(statement.total_paid_amount) || '₦0';
            document.getElementById('outstanding_amount').innerText = formatCurrency(statement.outstanding_amount) || '₦0';

            const tableBody = document.getElementById('statement_data');
            tableBody.innerHTML = ''; // Clear previous rows

            // Helper function to create rows for different data types
            function createRow(type, postingDate, amount, paymentAmount, runningBalance, details = '') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${type}</td>
                    <td>${postingDate}</td>
                    <td>${formatCurrency(amount)}</td>
                    <td>${formatCurrency(paymentAmount)}</td> <!-- Payment Amount Column -->
                    <td>${formatCurrency(runningBalance)}</td>
                    <td>${details}</td>
                `;
                tableBody.appendChild(row);
            }

            // Track the running balance starting with balance brought forward
            let currentRunningBalance = parseFloat(statement.balance_brought_forward) || 0;

            // Process Sales Invoice Data
            if (statement.sales_invoice_data && statement.sales_invoice_data.length > 0) {
                statement.sales_invoice_data.forEach(invoice => {
                    currentRunningBalance += parseFloat(invoice.amount);
                    createRow(
                        'Invoice',
                        invoice.posting_date,
                        invoice.amount,
                        0, // No payment amount for invoice
                        currentRunningBalance.toFixed(2),
                        `Invoice Name: ${invoice.invoice_name}, Item: ${invoice.item_code}`
                    );
                });
            }

            // Process Payment Data
            if (statement.payments && statement.payments.length > 0) {
                statement.payments.forEach(payment => {
                    currentRunningBalance -= parseFloat(payment.paid_amount);
                    createRow(
                        'Payment',
                        payment.posting_date,
                        0, // No amount for payment in this column
                        payment.paid_amount, // Payment amount in the separate column
                        currentRunningBalance.toFixed(2),
                        `Payment Entry: ${payment.payment_entry_name}`
                    );
                });
            }

            // Process GL Entries Data
            if (statement.gl_entries && statement.gl_entries.length > 0) {
                statement.gl_entries.forEach(glEntry => {
                    currentRunningBalance -= parseFloat(glEntry.debit); // Debit reduces balance
                    createRow(
                        'GL Entry',
                        glEntry.posting_date,
                        glEntry.debit,
                        0, // No payment amount for GL Entry
                        currentRunningBalance.toFixed(2),
                        `Voucher No: ${glEntry.voucher_no}, Cost Center: ${glEntry.cost_center}`
                    );
                });
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to format currency as Naira (₦)
function formatCurrency(amount) {
    // Ensure the amount is a valid number
    if (isNaN(amount)) {
        return '₦0.00';
    }

    // Convert the amount to a number and format it as Naira currency
    const number = parseFloat(amount);
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(number);
}

function downloadStatement() {
    // Extract the content to be downloaded
    var contentToDownload = `
        <div class="content">
            <div class="company-header">
                <img src="${document.getElementById('logo').src}" alt="Company Logo" class="company-logo">
                <div class="company-info">
                    <h2>METRO AND CASTLE LIMITED</h2>
                    <p>METRO MALL, ATLANTIC LAYOUT ESTATES,</p>
            <p>LEKKI GARDEN PHASE 4 ROAD, GENERAL PAINT B/STOP,</p>
            <p>LEKKI EXPRESSWAY, LAGOS.</p>
            <p>PHONE: 09154793665, 08097814209</p>
            <p>Info@metroandcastle.com www.metroandcastle.com</p></center>
                </div>
            </div>
            <h1>Customer Statement</h1>
            <div class="balances">
                <div class="balance-item">
                    <p><strong>Customer:</strong> <span id="customer_name">${document.getElementById('customer_name').textContent}</span></p>
                    <p><strong>Balance Brought Forward:</strong> <span id="balance_brought_forward">${document.getElementById('balance_brought_forward').textContent}</span></p>
                </div>
                <div class="balance-item">
                    <p><strong>Grand Total Amount:</strong> <span id="grand_total_amount">${document.getElementById('grand_total_amount').textContent}</span></p>
                    <p><strong>Total Paid Amount:</strong> <span id="total_paid_amount">${document.getElementById('total_paid_amount').textContent}</span></p>
                    <p><strong>Outstanding Amount:</strong> <span id="outstanding_amount">${document.getElementById('outstanding_amount').textContent}</span></p>
                </div>
            </div>
            <table class="statement-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Posting Date</th>
                        <th>Amount</th>
                        <th>Payment Amount</th>
                        <th>Running Balance</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${document.getElementById('statement_data').innerHTML}
                </tbody>
            </table>
        </div>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f9;
                margin: 0;
                padding: 0;
                color: #333;
            }

            .content {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 8px;
                max-width: 800px;
                margin: 0 auto;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }

            .company-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                border-bottom: 2px solid #f1f1f1;
                padding-bottom: 10px;
            }

            .company-logo {
                width: 300px; /* Adjust size of the logo */
                height: auto;
            }

            .company-info h2 {
                color: #4A90E2;
                margin: 0;
                font-size: 24px;
            }

            .company-info p {
                font-size: 14px;
                color: #555;
                margin: 0;
            }

            h1 {
                color: #4A90E2;
                font-size: 24px;
                text-align: center;
                margin-bottom: 20px;
            }

            .balances {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 10px 0;
                border-bottom: 2px solid #f1f1f1;
            }

            .balance-item {
                width: 48%;
                display: flex;
                flex-direction: column;
            }

            .balances p {
                font-size: 14px;
                margin: 8px 0;
                color: #555;
            }

            .balances strong {
                color: #4A90E2;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            table th,
            table td {
                padding: 12px;
                text-align: left;
                border: 1px solid #f1f1f1;
                font-size: 14px;
            }

            table th {
                background-color: #4A90E2;
                color: white;
            }

            table td {
                background-color: #f9f9f9;
            }

            table tr:nth-child(even) td {
                background-color: #f1f1f1;
            }

            table tr:hover td {
                background-color: #e1e1e1;
            }

            @media print {
                body {
                    background-color: #fff;
                }

                .content {
                    box-shadow: none;
                    margin: 0;
                    padding: 20px;
                    width: 100%;
                }

                table {
                    border: 1px solid #ddd;
                }

                table th {
                    background-color: #333;
                    color: #fff;
                }
            }
        </style>
    `;

    // Create a Blob from the content
    var blob = new Blob([contentToDownload], { type: 'text/html' });

    // Create a link element for downloading the content
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customer_statement.html'; // Name of the downloaded file

    // Programmatically click the link to trigger the download
    link.click();
}



// print PDF SECTION


