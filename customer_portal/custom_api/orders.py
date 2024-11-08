# In your_custom_app/api/sales_order.py
import frappe
from frappe import _

@frappe.whitelist()
def get_customer_sales_orders():
    # Get the currently logged-in user
    customer_email = frappe.session.user
    
    # Fetch customer record using the logged-in user's email
    customer = frappe.get_all('Customer', filters={'custom_link_user_email': customer_email}, fields=['name'])
    
    if not customer:
        return {'message': _('No customer found for this user.')}

    customer_name = customer[0].name

    # Fetch sales orders for the customer
    sales_orders = frappe.get_all('Sales Order', 
                                  filters={'customer': customer_name,
                                           'status': ['!=', 'Cancelled']  # Exclude orders with status "Cancelled"
                                           }, 
                                  fields=['name', 'transaction_date', 'grand_total', 'status', 'payment_terms_template','advance_paid'])

    # Retrieve items and payment schedules for each sales order
    for order in sales_orders:
        # Fetch items for the order
        items = frappe.get_all('Sales Order Item',
                               filters={'parent': order.name},
                               fields=['item_code', 'item_name', 'qty', 'rate', 'amount'])
        order['items'] = items

        # Fetch payment schedule for the order
        payment_schedule = frappe.get_all('Payment Schedule',
                                          filters={'parent': order.name},
                                          fields=['payment_term', 'due_date', 'custom_penality_percent',
                                                  'custom_penality_amount','custom_payment_amount_penality','invoice_portion', 'payment_amount', 'outstanding'])
        order['payment_schedule'] = payment_schedule

    return {'sales_orders': sales_orders}


@frappe.whitelist()
def get_customer_sales_invoices():
    # Get the currently logged-in user
    customer_email = frappe.session.user
    
    # Fetch customer record using the logged-in user's email
    customer = frappe.get_all('Customer', filters={'custom_link_user_email': customer_email}, fields=['name'])
    
    if not customer:
        return {'message': _('No customer found for this user.')}

    customer_name = customer[0].name

    # Fetch sales Invoice for the customer
    sales_invoice = frappe.get_all('Sales Invoice', 
                                  filters={'customer': customer_name,
                                           'status': ['!=', 'Cancelled']  # Exclude invoices with status "Cancelled"
                                           }, 
                                  fields=['name', 'posting_date', 'grand_total', 'status','outstanding_amount'])

    # Retrieve items 
    for invoice in sales_invoice:
        # Fetch items for the invoice
        items = frappe.get_all('Sales Invoice Item',
                               filters={'parent': invoice.name},
                               fields=['item_code', 'item_name', 'qty', 'rate', 'amount'])
        invoice['items'] = items

   

    return {'sales_invoice': sales_invoice}


@frappe.whitelist()
def get_customer_delivery_notes():
    # Get the currently logged-in user
    customer_email = frappe.session.user
    
    # Fetch customer record using the logged-in user's email
    customer = frappe.get_all('Customer', filters={'custom_link_user_email': customer_email}, fields=['name'])
    
    if not customer:
        return {'message': _('No customer found for this user.')}

    customer_name = customer[0].name

    # Fetch sales Invoice for the customer
    sales_invoice = frappe.get_all('Delivery Note', 
                                  filters={'customer': customer_name,
                                           'status': ['!=', 'Cancelled']  # Exclude invoices with status "Cancelled"
                                           }, 
                                  fields=['name', 'posting_date', 'grand_total', 'status'])

    # Retrieve items 
    for invoice in sales_invoice:
        # Fetch items for the invoice
        items = frappe.get_all('Delivery Note Item',
                               filters={'parent': invoice.name},
                               fields=['item_code', 'item_name', 'qty', 'rate', 'amount'])
        invoice['items'] = items

   

    return {'sales_invoice': sales_invoice}
