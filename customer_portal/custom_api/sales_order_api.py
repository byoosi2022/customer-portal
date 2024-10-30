import frappe
from frappe import _
from datetime import datetime

@frappe.whitelist()
def post_sales_order(order_data):
    # Parse the incoming JSON data
    order_data = frappe.parse_json(order_data)
    
    customer = order_data.get('customer')
    items = order_data.get('items', [])
    
    # Check for an existing draft Sales Order for the customer
    existing_order = frappe.get_all('Sales Order',
                                    filters={
                                        'customer': customer,
                                        'docstatus': 0  # 0 means draft
                                    },
                                    limit=1)
    
    if existing_order:
        # If a draft Sales Order exists, update it
        sales_order_name = existing_order[0].name
        sales_order = frappe.get_doc('Sales Order', sales_order_name)
        
        # Process each item
        for item in items:
            if isinstance(item['delivery_date'], str):
                item['delivery_date'] = datetime.strptime(item['delivery_date'], '%Y-%m-%d').date()
            
            # Check if item already exists in the Sales Order items
            existing_item = next((i for i in sales_order.items if i.item_code == item['item_code']), None)
            
            if existing_item:
                # Update the rate and quantity of the existing item
                existing_item.rate = item['rate']
                existing_item.qty += item['qty']  # Adjust quantity as needed
            else:
                # Add a new item if it doesn't exist
                sales_order.append('items', {
                    'item_code': item['item_code'],
                    'qty': item['qty'],
                    'rate': item['rate'],
                    'delivery_date': item['delivery_date'],
                    'item_name': item['item_name']
                })
        
        # Save the updated sales order
        sales_order.save()
        frappe.db.commit()
        
        return {
            'success': True,
            'message': _('Sales order updated successfully.'),
            'sales_order': sales_order.name
        }
    
    else:
        # If no draft Sales Order exists, create a new one
        new_order = frappe.get_doc({
            'doctype': 'Sales Order',
            'order_type': order_data.get('order_type', 'Sales'),
            'customer': customer,
            'company': order_data.get('company'),
            'project': order_data.get('project'),
            'transaction_date': order_data.get('date'),
            'delivery_date': datetime.strptime(order_data.get('delivery_date'), '%Y-%m-%d').date() if isinstance(order_data.get('delivery_date'), str) else order_data.get('delivery_date'),
            'items': []
        })
        
        # Add items to the new sales order
        for item in items:
            if isinstance(item['delivery_date'], str):
                item['delivery_date'] = datetime.strptime(item['delivery_date'], '%Y-%m-%d').date()
                
            new_order.append('items', {
                'item_code': item['item_code'],
                'qty': item['qty'],
                'rate': item['rate'],
                'delivery_date': item['delivery_date'],
                'item_name': item['item_name']
            })
        
        # Insert the new sales order into the database
        new_order.insert()
        frappe.db.commit()
        
        return {
            'success': True,
            'message': _('Sales order created successfully.'),
            'sales_order': new_order.name
        }