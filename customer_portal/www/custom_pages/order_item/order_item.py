import frappe
from frappe.utils import nowdate

@frappe.whitelist(allow_guest=True)
def get_real_estate_items(context, posting_date=None):
    # Fetch real estate items from the Item DocType
    items = frappe.get_all(
        'Item',
        filters={'item_group': 'REAL ESTATE'},
        fields=['item_code', 'item_name', 'description', 'standard_rate']
    )

    # Update context with the fetched items and title
    context.items = items
    context.title = 'Real Estate Products'
    context.posting_date = nowdate()




