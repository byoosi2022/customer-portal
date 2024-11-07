// Open the modal to select a company
function openCompanyModal() {
    document.getElementById("companyModal").style.display = "block";
    loadCompanyOptions();
}

// Close the modal
function closeModal() {
    document.getElementById("companyModal").style.display = "none";
}

// Fetch and display companies in the modal
async function loadCompanyOptions() {
    showLoading();
    try {
        const response = await fetch('/api/method/customer_portal.custom_api.item_estates.get_company_list');
        const data = await response.json();
        if (data.message) {
            const modalCompanyList = document.getElementById("modal-company-list");
            modalCompanyList.innerHTML = '';  // Clear previous entries
            data.message.forEach(company => {
                // const listCompany = document.createElement("li");
                const listItem = document.createElement("li");
                listItem.innerHTML = `<button onclick="selectCompany('${company.name}')">${company.name}</button>`;
                
                // listCompany.innerHTML = `<a href="#" onclick="selectCompany('${company.name}')">${company.name}</a>`;
                // modalCompanyList.appendChild(listCompany);
                modalCompanyList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    } finally {
        hideLoading();
    }
}

// Function to handle company selection
function selectCompany(companyName) {
    closeModal();  // Close modal after selection
    document.getElementById("selected-company-group").textContent = companyName;
    document.getElementById("company-list").innerHTML = `<li>${companyName}</li>`;
    loadItemGroups(companyName);  // Load item groups for selected company
    loadItemsForCompany(companyName);  // Load all items for selected company
}

// Select an item group from the sidebar and filter items based on it
function selectItemGroup(itemGroup) {
    selectedItemGroup = itemGroup;
    document.getElementById("selected-item-group").textContent = itemGroup;
    fetchRealEstateItems('', itemGroup, selectedCompanyGroup);
}
// Load item groups for the selected company
async function loadItemGroups(companyName) {
    showLoading();
    try {
        const response = await fetch(`/api/method/customer_portal.custom_api.item_estates.get_item_groups?company=${companyName}`);
        const data = await response.json();
        if (data.message) {
            const itemGroupsList = document.getElementById("item-groups-list");
            itemGroupsList.innerHTML = '';  // Clear previous entries
            data.message.forEach(group => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `<a href="#" onclick="selectItemGroup('${group.name}')">${group.name}</a>`;
                itemGroupsList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Error loading item groups:', error);
    } finally {
        hideLoading();
    }
}

// Load all items for the selected company
async function loadItemsForCompany(companyName) {
    showLoading();
    try {
        const response = await fetch(`/api/method/customer_portal.custom_api.item_estates.get_real_estate_items?custom_company=${companyName}`);
        const data = await response.json();
        if (data.message) {
            displayItems(data.message);
        }
    } catch (error) {
        console.error('Error loading items:', error);
    } finally {
        hideLoading();
    }
}

// Display items in the main content section
function displayItems(items) {
    const itemList = document.getElementById("item-list");
    itemList.innerHTML = '';  // Clear previous entries

    if (items.length === 0) {
        itemList.innerHTML = '<p>No items found.</p>';
        return;
    }

    items.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.className = "thumb-item";
        itemCard.innerHTML = `
                <img src="${item.image || 'default-image.jpg'}" alt="${item.item_name}">
                <h3>${item.item_name}</h3>
                <p>${item.description || 'No description available.'}</p>
                <p class="price">${formatCurrency(item.price)}</p>
                ${item.quantity > 0 ? `<p class="quantity">Qty Available: ${item.quantity}</p>` : `<p class="quantity">Out of stock</p>`}
                <div class="button-container">
                    <button onclick="viewItem('${item.item_code}')">View Orders</button>
                    <button onclick="addToCart('${item.item_code}', '${item.item_name}', '${item.price}', ${item.quantity})">Add to Cart</button>
                </div>
            `;
        itemList.appendChild(itemCard);
    });
}

// Utility functions for loading indicators
function showLoading() {
    document.getElementById("loading-indicator").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading-indicator").style.display = "none";
}
// Function to format currency with commas and two decimal places
function formatCurrency(amount) {
    return `₦ ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Fetch items based on search term, item group, and company group
async function fetchRealEstateItems(search = '', itemGroup = '', companyGroup = '') {
    showLoading();
    try {
        const response = await fetch(`/api/method/customer_portal.custom_api.item_estates.get_real_estate_items?search=${search}&item_group=${itemGroup}&custom_company=${companyGroup}`);
        const data = await response.json();
        if (data.message) {
            displayItems(data.message);
        }
    } catch (error) {
        console.error('Error fetching items:', error);
    } finally {
        hideLoading();
    }
}

// Global variables to store selected filters
let selectedItemGroup = '';
let selectedCompanyGroup = '';

// Update the display of selected filters and instructions
function updateSelectedFilters() {
    document.getElementById("selected-item-group").textContent = selectedItemGroup || 'None';
    document.getElementById("selected-company-group").textContent = selectedCompanyGroup || 'None';

    const instructions = document.getElementById("filter-instructions");
    if (!selectedItemGroup && !selectedCompanyGroup) {
        instructions.textContent = "Please select an item group and a company to view items.";
    } else if (!selectedItemGroup) {
        instructions.textContent = "Please select an item group to continue.";
    } else if (!selectedCompanyGroup) {
        instructions.textContent = "Please select a company to continue.";
    } else {
        instructions.textContent = "Both filters are selected. Fetching items...";
    }
}

// Function to select company group and trigger fetch if both filters are selected
function selectCompanyGroup(companyGroup) {
    selectedCompanyGroup = companyGroup;
    console.log(`Selected company group: ${companyGroup}`);
    updateSelectedFilters();

    // Only fetch items when both filters are selected
    if (selectedItemGroup && selectedCompanyGroup) {
        const searchTerm = document.getElementById("search").value;
        fetchRealEstateItems(searchTerm, selectedItemGroup, selectedCompanyGroup);
        fetchRealEstateItems(searchTerm, selectedCompanyGroup, selectedItemGroup);
    }
}

// Check if the user is logged in and toggle login/logout links accordingly
function checkLoginStatus() {
    showLoading();
    fetch('/api/method/frappe.auth.get_logged_user', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            const loginLink = document.getElementById("login-link");
            const logoutLink = document.getElementById("logout-link");
            if (data.message) {
                loginLink.style.display = "none";
                logoutLink.style.display = "block";
            } else {
                loginLink.style.display = "block";
                logoutLink.style.display = "none";
            }
        })
        .catch(error => {
            console.error("Error checking login status:", error);
            document.getElementById("login-link").style.display = "block";
            document.getElementById("logout-link").style.display = "none";
        })
        .finally(() => hideLoading());
}

// Log the user out
function logoutUser() {
    showLoading();
    fetch('/api/method/logout', {
        method: 'GET',
        credentials: 'include'
    })
        .then(() => {
            window.location.href = "/client_portal/access_portal/login#";
        })
        .catch(error => console.error("Error logging out:", error))
        .finally(() => hideLoading());
}

// Function to view item added to the cart
function viewItem(itemCode) {
    window.location.href = '/client_portal/cart';
}

// Function to add an item to the cart
function addToCart(itemCode, itemName, itemPrice, availableQuantity) {
    if (availableQuantity <= 0) {
        alert(`Sorry, ${itemName} is out of stock.`);
        return;
    }

    // Get the selected company (ensure the company is selected before adding)
    const selectedCompany = document.getElementById("selected-company-group").textContent;

    if (!selectedCompany || selectedCompany === 'None') {
        alert('Please select a company before adding items to the cart.');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(item => item.item_code === itemCode && item.company === selectedCompany);

    if (existingItemIndex > -1) {
        if (cart[existingItemIndex].quantity < availableQuantity) {
            cart[existingItemIndex].quantity += 1;
            alert(`Added one more ${itemName} to the cart.`);
        } else {
            alert(`Cannot add more ${itemName}. Insufficient stock.`);
        }
    } else {
        cart.push({
            item_code: itemCode,
            item_name: itemName,
            price: parseFloat(itemPrice),
            quantity: 1,
            company: selectedCompany  // Add the selected company to the cart item
        });
        alert(`Added ${itemName} to the cart.`);
    }

    // Save the updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Call loadCart() to update the cart display and update cart icon
    loadCart();
}

// Function to update the cart icon count
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    // Update the cart icon count
    document.getElementById("cart-count").textContent = totalItems;
}

// Load the cart data and update the display (including icon)
function loadCart() {
    updateCartIcon(); // Update the cart icon count on page load or cart update

    // You can also update the cart display here (if needed), such as showing the cart items in a modal or cart page
}


function searchItems() {
    const searchTerm = document.getElementById("search").value;
    fetchRealEstateItems(searchTerm, selectedItemGroup, selectedCompanyGroup);
}

// Function to filter and display item categories based on search input
function searchCategories() {
    const searchInput = document.getElementById("category-search").value.toLowerCase();
    const categoryList = document.getElementById("item-groups-list"); // Assuming this is the ID for the category list

    // Loop through all category items and toggle visibility based on search match
    Array.from(categoryList.getElementsByTagName("li")).forEach(item => {
        const categoryName = item.textContent.toLowerCase();
        
        if (categoryName.includes(searchInput)) {
            item.style.display = "";  // Show item
        } else {
            item.style.display = "none";  // Hide item
        }
    });
}


// Call the fetch functions on page load
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    // fetchRealEstateItems();
    loadCart();
});

