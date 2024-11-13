// Ensure the sidebar is initially open when the page loads
window.onload = function() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("content").classList.remove("full-width");
};

// Toggle Sidebar Function with Footer Adjustment
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
    const footer = document.getElementById("footer");
    
    // Toggle sidebar open/close state
    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        sidebar.classList.add("closed");
        content.classList.add("full-width");
        footer.classList.add("full-width-footer");  // Add full-width to footer when sidebar is closed
    } else {
        sidebar.classList.remove("closed");
        sidebar.classList.add("open");
        content.classList.remove("full-width");
        footer.classList.remove("full-width-footer");  // Remove full-width from footer when sidebar is open
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

// JavaScript to detect when the user scrolls and trigger the fade-in/out effect
window.addEventListener('scroll', function() {
    var footer = document.querySelector('.footer');
    var scrollPosition = window.scrollY;  // Get the current scroll position

    // If the scroll position is greater than 100px, fade out the footer
    if (scrollPosition > 100) {
        footer.style.opacity = 0;  // Fade out footer
    } else {
        footer.style.opacity = 1;  // Fade in footer when scrolling is less than 100px
    }
});






