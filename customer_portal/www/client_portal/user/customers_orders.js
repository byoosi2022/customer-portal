// Ensure the sidebar is initially open when the page loads
window.onload = function() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("content").classList.remove("full-width");
};

// Toggle Sidebar Function
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
    
    // Toggle sidebar open/close state
    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebar.classList.add("closed");
        content.classList.add("full-width");
    } else {
        sidebar.classList.remove("closed");
        sidebar.classList.add("open");
        content.classList.remove("full-width");
    }
}

// Toggle Profile Dropdown
function toggleProfileMenu() {
    const profileDropdown = document.getElementById("profileDropdown");
    profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
}

// Logout User
function logoutUser() {
    alert("Logging out...");
    // Add logout logic (e.g., clear session, redirect)
}


