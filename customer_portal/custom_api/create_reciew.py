import frappe
from frappe.model.document import Document
from datetime import datetime

# Ensure only logged-in users can create reviews
@frappe.whitelist()
def create_review(comment, rating):
    # Check if user is logged in
    if not frappe.session.user or frappe.session.user == "Guest":
        frappe.throw("You must be logged in to submit a review.")
    
    # Get current date and time
    current_datetime = datetime.now()
    current_date = current_datetime.date()
    current_time = current_datetime.time()

    # Create the Review document
    review = frappe.get_doc({
        "doctype": "Review",
        "date": current_date,
        "time": current_time,
        "comment": comment,
        "rating": rating,
        "user_id": frappe.session.user
    })

    # Insert the review into the database
    review.insert(ignore_permissions=True)
    frappe.db.commit()

    # Optionally, you can return a success message
    return {
        "message": "Review submitted successfully!",
        "review_id": review.name
    }
