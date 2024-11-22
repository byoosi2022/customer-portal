import frappe
from frappe import _

@frappe.whitelist()
def get_customer_payment_made():
    # Get the currently logged-in user's email
    customer_email = frappe.session.user
    
    # Fetch the customer using the logged-in user's email
    customer = frappe.get_all('Customer', 
                              filters={'custom_link_user_email': customer_email}, 
                              fields=['name'])
    
    # If no customer is found, return a message
    if not customer:
        return {'message': _('No customer found for this user.')}

    customer_name = customer[0].name

    # Fetch all active quotations for the customer
    quotations = frappe.get_all('Payment Entry', 
                                filters={'party_name': customer_name, 
                                         'status': ['!=', 'Cancelled']},  # Exclude cancelled quotations
                                fields=['name', 'posting_date', 'paid_amount', 'status','custom_amount_paid_till_date','custom_balance'])

    return {'payments': quotations}
