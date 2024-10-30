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
        user_doc = frappe.get_doc('User', user)
        
        # If custom_secret is not set, generate keys
        if not user_doc.custom_secret:
            generate_keys()  # Call the function to generate keys
            user_doc = frappe.get_doc('User', user)  # Re-fetch user doc to get updated keys
        
        # Ensure the user has the Portal role profile
        ensure_user_role(user)  # Assign the "Portal" role profile
        
        return {
            'customer': customer_doc.name,
            'customer_name': customer_doc.customer_name,
            'api_key': user_doc.api_key,
            'secret_key': user_doc.custom_secret
        }
    else:
        try:
            # Get the full name of the logged-in user
            user_doc = frappe.get_doc('User', user)
            full_name = user_doc.full_name or user  # Fallback to username if full name is not set

            # Create a new Customer if it doesn't exist
            new_customer = frappe.get_doc({
                'doctype': 'Customer',
                'custom_link_user_email': user,
                'customer_name': full_name,  # Set the full name as customer name
                'customer_group': 'All Customer Groups',  # Specify a valid customer group
                'territory': 'All Territories'  # Specify a valid territory
            })
            
            new_customer.insert(ignore_permissions=True)  # Insert the customer document
            frappe.db.commit()  # Explicitly commit the changes to the database
            
            # Generate keys for the user if they don't have them
            if not user_doc.custom_secret:
                generate_keys()  # Call the function to generate keys
                user_doc = frappe.get_doc('User', user)  # Re-fetch user doc to get updated keys
            
            # Ensure the user has the Portal role profile
            ensure_user_role(user)  # Assign the "Portal" role profile
            
            return {
                'customer': new_customer.name,
                'customer_name': new_customer.customer_name,
                'api_key': user_doc.api_key,
                'secret_key': user_doc.custom_secret
            }

        except frappe.exceptions.ValidationError as e:
            frappe.log_error(f"Error creating customer: {e}", "Customer Creation Error")
            return {'message': f"Error creating customer: {e}"}

        except Exception as e:
            frappe.log_error(f"Unexpected error: {e}", "Customer Creation Error")
            return {'message': "An unexpected error occurred while creating the customer."}


def ensure_user_role(user, role_profile_name="portal"):
    """
    Ensure the user has the specified role profile. If not, assign it.
    
    :param user: str - Username of the user.
    :param role_profile_name: str - Role profile to assign (default is "Portal").
    """
    user_doc = frappe.get_doc("User", user)
    
    # Set the role profile name to "Portal"
    user_doc.role_profile_name = role_profile_name
    
    # Save the user document
    user_doc.save()
    frappe.db.commit()  # Commit changes


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
