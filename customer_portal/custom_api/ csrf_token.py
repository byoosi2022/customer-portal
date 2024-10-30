import frappe

def force_session_refresh_without_logout(user):
    """Regenerate CSRF token without logging the user out."""
    # Ensure the user is authenticated
    if frappe.session.user == user and user != "Guest":
        # Generate and return a new CSRF token without logout
        return frappe.sessions.get_csrf_token()
    else:
        raise frappe.PermissionError("User is not logged in or session is invalid.")

@frappe.whitelist(allow_guest=True)
def regenerate_session():
    """Custom endpoint to regenerate the session and provide a new CSRF token."""
    user = frappe.session.user
    if user == "Guest":
        return {"error": "Not logged in"}
    
    # Regenerate the CSRF token
    try:
        csrf_token = force_session_refresh_without_logout(user)
        return {"csrf_token": csrf_token}
    except frappe.PermissionError as e:
        return {"error": str(e)}

