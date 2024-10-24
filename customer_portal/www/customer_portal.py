import frappe

def get_portal_context(context):
    # Check if the logged-in user is an admin (System Manager role)
    if "System Manager" in frappe.get_roles(frappe.session.user):
        # Admin can see all sales orders
        sales_orders = frappe.get_all('Sales Order', fields=['name', 'customer', 'status', 'transaction_date'])
    else:
        # Regular customers only see their own sales orders
        customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
        sales_orders = frappe.get_all('Sales Order', filters={'customer': customer}, fields=['name', 'status', 'transaction_date'])
    
    # Pass the sales orders to the context
    context.sales_orders = sales_orders
    return context

