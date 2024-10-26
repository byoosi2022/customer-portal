import frappe

def get_portal_context(context):
    # Check if the logged-in user is an admin (System Manager role)
    if 'System Manager' in frappe.get_roles(frappe.session.user):
        # Fetch all sales orders for admin
        sales_orders = frappe.get_all('Sales Order', fields=['name', 'customer', 'status', 'transaction_date'])
    else:
        # Fetch sales orders for the logged-in customer
        sales_orders = frappe.get_all('Sales Order', filters={'customer': frappe.session.user}, fields=['name', 'customer', 'status', 'transaction_date'])

    # Pass the sales orders to the context
    context.sales_orders = sales_orders
    context.title = "Customer Portalww"
    

