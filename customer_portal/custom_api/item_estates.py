import frappe

@frappe.whitelist(allow_guest=True)
def get_real_estate_items(search=None):
    # Fetch all item groups in Portal Item Groups show_on_portal
    # Set filters to include items from the fetched item groups
    filters_groups_checks = {'show_on_portal': 1}
    item_groups = frappe.get_all('Portal Item Group',
        filters=filters_groups_checks, 
        fields=['name']
    )

    # Extract the names into a list
    item_group_names = [group['name'] for group in item_groups]

    # Set filters to include items from the fetched item groups
    filters = {'item_group': ['in', item_group_names]}  # Use 'in' to filter by multiple item groups

    # If a search term is provided, add it to the filters for item_name
    if search:
        filters['item_name'] = ['like', f'%{search}%']  # Use 'like' for partial matching

    # Fetch items with the given filters
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
