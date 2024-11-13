import frappe
from frappe import _

@frappe.whitelist()
def get_customer_quotes():
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
    quotations = frappe.get_all('Quotation', 
                                filters={'party_name': customer_name, 
                                         'status': ['!=', 'Cancelled']},  # Exclude cancelled quotations
                                fields=['name', 'transaction_date', 'grand_total', 'status'])

    # Fetch items for each quotation and add to the quotation data
    for quote in quotations:
        # Fetch quotation items
        items = frappe.get_all('Quotation Item',
                               filters={'parent': quote.name},
                               fields=['item_code', 'item_name', 'qty', 'rate', 'amount'])
        quote['items'] = items

    return {'quotes': quotations}
