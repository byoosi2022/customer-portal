# In your custom app, create a whitelisted API function to fetch items
import frappe
@frappe.whitelist(allow_guest=True)
def get_real_estate_items(search=None):
    # Get all items with item_group 'REAL ESTATE'
    filters = {'item_group': 'REAL ESTATE'}

    # If a search term is provided, add it to the filters
    if search:
        filters['item_name'] = ['like', f'%{search}%']  # Use 'like' for partial matching

    items = frappe.get_all('Item', 
        filters=filters, 
        fields=['item_name', 'item_code', 'image', 'description']
    )
    
    # For each item, get the corresponding price from the 'Item Price' doctype
    for item in items:
        price_data = frappe.get_value('Item Price', 
            filters={'item_code': item['item_code'], 'selling': 1}, 
            fieldname='price_list_rate'
        )
        item['price'] = price_data if price_data else 'N/A'  # Set 'N/A' if price is not found
    
    return items or []

