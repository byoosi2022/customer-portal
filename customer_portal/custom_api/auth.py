import frappe
from frappe import throw, msgprint, _

@frappe.whitelist(allow_guest=True)
def get_keys():
    user = frappe.get_doc('User', frappe.session.user)

    # Generate a new API secret key for the user
    new_api_secret = user.custom_secret

    frappe.response["message"] = {
        "sid": frappe.session.sid,
        "user": user.name,
        "api_key": user.api_key,
        "api_secret": new_api_secret
    }
    return

import frappe
from frappe import _

@frappe.whitelist()
def generate_keys():
    """
    Generate API key and API secret for the currently logged-in user.

    :return: dict - A response dictionary containing the generated keys or an error message.
    """
    
    # Get the current user from the session
    user = frappe.session.user

    # Check if the user exists
    if not frappe.get_value("User", user):
        return {"message": _("User not found"), "status": "error"}

    try:
        # Fetch user details
        user_details = frappe.get_doc("User", user)

        # Generate API secret
        api_secret = frappe.generate_hash(length=15)

        # If API key is not set, generate API key
        if not user_details.api_key:
            api_key = frappe.generate_hash(length=15)
            user_details.api_key = api_key
        else:
            api_key = user_details.api_key  # Use existing API key if it already exists

        # Set the new API secret and any custom secret if needed
        user_details.api_secret = api_secret
        user_details.custom_secret = api_secret  # Set custom_secret field

        # Save user details
        user_details.save()

        # Optionally, commit the transaction (usually handled by Frappe)
        frappe.db.commit()

        return {
            "api_key": user_details.api_key,
            "api_secret": user_details.custom_secret,
            "message": _("API keys generated successfully."),
            "status": "success"
        }

    except Exception as e:
        # Log the error and return a message
        frappe.log_error(frappe.get_traceback(), "API Key Generation Error")
        return {
            "message": _("An error occurred: ") + str(e),
            "status": "error"
        }

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

