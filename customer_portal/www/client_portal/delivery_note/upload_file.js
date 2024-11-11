// Show the upload form when the "Upload Document" button is clicked
document.getElementById('upload-document-btn').addEventListener('click', function() {
    document.getElementById('upload-form').style.display = 'block';
    document.getElementById('upload-document-btn').style.display = 'none'; // Hide the upload button
});

// Handle cancel upload action
document.getElementById('cancel-upload-btn').addEventListener('click', function() {
    document.getElementById('upload-form').style.display = 'none';
    document.getElementById('upload-document-btn').style.display = 'block'; // Show the upload button again
});

// Handle document upload
document.getElementById('submit-upload-btn').addEventListener('click', async function() {
    const fileInput = document.getElementById('document-file');
    const file = fileInput.files[0]; // Get the selected file
    
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    // Show loading spinner
    document.getElementById('loading-spinner').style.display = 'block';

    // Create FormData object to send the file as multipart data
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Fetch CSRF token from the server using vanilla fetch
        const csrfResponse = await fetch('https://portal.metrogroupng.com/api/method/customer_portal.custom_api.auth.regenerate_session', {
            method: 'GET',
            credentials: 'include', // Ensure cookies are sent with the request
        });

        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.message.csrf_token; // Extract CSRF token from the response
        console.log("CSRF Token:", csrfToken); // Log token to verify retrieval

        // Set the CSRF token as a cookie
        document.cookie = `X-Frappe-CSRF-Token=${csrfToken}; path=/`;

        // Send the file data to the server with CSRF token in headers
        const response = await fetch('/api/method/customer_portal.custom_api.orders.upload_document', {
            method: 'POST',
            headers: {
                'X-Frappe-CSRF-Token': csrfToken // Include CSRF token in request headers
            },
            body: formData, // Send the FormData with the file
        });

        if (!response.ok) {
            throw new Error('Failed to upload the document');
        }

        const data = await response.json();
        
        // Check the response status and give feedback to the user
        if (data.message.message === 'Success') {
            alert('Document uploaded successfully');
            fetchSharedDocuments();  // Refresh the list of shared documents
        } else {
            alert('Failed to upload the document');
        }

        // Hide the upload form and show the upload button again
        document.getElementById('upload-form').style.display = 'none';
        document.getElementById('upload-document-btn').style.display = 'block';

    } catch (error) {
        console.error('Error uploading document:', error);
        alert('Error uploading document');
    } finally {
        // Hide the loading spinner once the upload is complete
        document.getElementById('loading-spinner').style.display = 'none';
    }
});
