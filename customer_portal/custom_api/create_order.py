import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
# @frappe.xss_unsafe
def order_real_estate_item(item_code, customer=None):
    user = frappe.session.user
    if not customer:
        customer = frappe.db.get_value('Customer', {'custom_link_user_email': user}, 'name')
    if not customer:
        frappe.throw(_('No customer linked to the logged-in user. Please contact support if this is unexpected.'))
    
    custom_company = frappe.db.get_value('Customer', customer, 'custom_company')
    if not custom_company:
        frappe.throw(_('Customer does not have a linked company. Please ensure the customer profile is updated.'))
    
    draft_so = frappe.db.exists('Sales Order', {'customer': customer, 'docstatus': 0})

    try:
        if draft_so:
            so = frappe.get_doc('Sales Order', draft_so)
            existing_item = next((item for item in so.items if item.item_code == item_code), None)
            if existing_item:
                existing_item.qty += 1
            else:
                so.append('items', {
                    'item_code': item_code,
                    'qty': 1,
                    'rate': frappe.db.get_value('Item Price', {'item_code': item_code, 'selling': 1}, 'price_list_rate') or 0
                })
            so.save()
            frappe.db.commit()
            return {'message': 'Item added to existing draft Sales Order', 'sales_order': so.name}

        else:
            so = frappe.get_doc({
                'doctype': 'Sales Order',
                'customer': customer,
                'company': custom_company,
                'project': 'PROJ-0025',
                'cost_center': 'Main - MACL',
                'items': [{
                    'item_code': item_code,
                    'qty': 1,
                    'rate': frappe.db.get_value('Item Price', {'item_code': item_code, 'selling': 1}, 'price_list_rate') or 0
                }],
                'currency': frappe.db.get_single_value('Global Defaults', 'default_currency'),
                'transaction_date': frappe.utils.today(),
                'delivery_date': frappe.utils.add_days(frappe.utils.today(), 7),
                'order_type': 'Sales',
            })
            so.insert()
            frappe.db.commit()
            return {'message': 'New draft Sales Order created', 'sales_order': so.name}

    except Exception as e:
        # Log the error for review in the error log
        frappe.log_error(frappe.get_traceback(), _("Error placing order"))

        # Return the error message for development purposes
        frappe.throw(_("An error occurred while placing the order: {0}").format(str(e)))



import frappe

@frappe.whitelist()
def get_csrf_token():
    # Access the CSRF token directly from the request
    csrf_token = frappe.request.headers.get('X-Frappe-CSRF-Token')
    return {'csrf_token': csrf_token}


@frappe.whitelist()
def get_customer_for_logged_in_user():
    # Get the logged-in user
    user = frappe.session.user
    
    # Check if the user is linked to a Customer
    customer = frappe.db.get_value('Customer', {'custom_link_user_email': user}, 'name')
    
    if customer:
        customer_doc = frappe.get_doc('Customer', customer)
        return {
            'customer': customer_doc.name,
            'customer_name': customer_doc.customer_name
        }
    else:
        return {'message': 'No customer linked to this user.'}
