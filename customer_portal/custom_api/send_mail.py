import frappe
from frappe import _
from datetime import datetime

@frappe.whitelist()
def create_send_mail(subject, content):
    # Log the incoming parameters for debugging
    frappe.logger().info(f"Subject: {subject}")
    frappe.logger().info(f"Content: {content}")

    # Check if user is logged in
    if not frappe.session.user or frappe.session.user == "Guest":
        frappe.throw(_("You must be logged in to submit a review."))

    # Ensure subject and content are provided
    if not subject or not content:
        frappe.throw(_("Both subject and message content are required."))

    # Get current date and time
    current_datetime = datetime.now()
    current_date = current_datetime.date()
    current_time = current_datetime.time()

    # Create the Customer Portal Mails document
    review = frappe.get_doc({
        "doctype": "Customer Portal Mails",
        "date": current_date,
        "time": current_time,
        "subject": subject,
        "message": content,
        "user_id": frappe.session.user
    })

    # Insert the Customer Portal Mails into the database
    review.insert(ignore_permissions=True)
    frappe.db.commit()

    # Optionally, you can return a success message
    return {
        "message": _("Your mail was submitted successfully!"),
        "review_id": review.name,
         "sub": subject,
         "mes":content
    }
