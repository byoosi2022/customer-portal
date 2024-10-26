# about.py
import frappe

def get_context(context):
 context.title = 'Frappe-Vue'
 return context

@frappe.whitelist(allow_guest=True)
def get_properties():
     # Get all items with item_group 'REAL ESTATE'
    items = frappe.get_all('Item', 
        filters={'item_group': 'REAL ESTATE'}, 
        fields=['item_name', 'item_code', 'image', 'description']
    )
    
    # For each item, get the corresponding price from the 'Item Price' doctype
    for item in items:
        price_data = frappe.get_value('Item Price', 
            filters={'item_code': item['item_code'], 'selling': 1}, 
            fieldname='price_list_rate'
        )
        item['price'] = price_data if price_data else 'N/A'  # Set 'N/A' if price is not found
    print(items)
    return items
