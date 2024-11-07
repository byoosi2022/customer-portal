import frappe

@frappe.whitelist(allow_guest=True)
def get_item_groups(company=None):
    """
    Fetch all item groups that are marked to show on the portal.
    """
    filters_groups_checks = {'show_on_portal': 1,'company':company}
    item_groups = frappe.get_all('Portal Item Group', filters=filters_groups_checks, fields=['name','company'])
    return item_groups or []  # Return an empty list if no groups are found

@frappe.whitelist(allow_guest=True)
def get_company_list():
    """
    Fetch all companies that are marked to show on the portal.
    """
    filters_company_checks = {'custom_show_on_portal': 1}
    company_list = frappe.get_all('Company', filters=filters_company_checks, fields=['name'])
    return company_list or []  # Return an empty list if no companies are found

@frappe.whitelist()
def get_real_estate_items(search=None, item_group=None, custom_company=None):
    """
    Fetch real estate items based on search term and optional item group and company.
    """

    # Fetch item groups and companies set to show on the portal
    item_groups = frappe.get_all('Portal Item Group', filters={'show_on_portal': 1}, fields=['name'])
    item_group_names = [group['name'] for group in item_groups]

    company_list = frappe.get_all('Company', filters={'custom_show_on_portal': 1}, fields=['name'])
    company_names = [company['name'] for company in company_list]

    # Initialize filters
    filters = {
        'item_group': ['in', item_group_names],
        'custom_company': ['in', company_names]
    }

    # Apply optional filters
    if custom_company:
        filters['custom_company'] = custom_company
    if item_group:
        filters['item_group'] = item_group
    if search:
        filters['item_name'] = ['like', f'%{search}%']

    # Fetch items based on constructed filters
    items = frappe.get_all(
        'Item',
        filters=filters,
        fields=['item_name', 'item_code', 'image', 'description', 'custom_company', 'item_group'],
        limit=None
    )

    # Append price and quantity to each item
    for item in items:
        # Fetch price data
        price_data = frappe.get_value('Item Price', {'item_code': item['item_code'], 'selling': 1}, 'price_list_rate')
        item['price'] = price_data if price_data else 'N/A'

        # Fetch quantity data
        quantity_data = frappe.get_value('Bin', {'item_code': item['item_code']}, 'actual_qty')
        item['quantity'] = quantity_data if quantity_data else 0

    return items if items else []



import frappe

@frappe.whitelist(allow_guest=True)
def get_item_groups_by_company():
    """
    Fetch all item groups from Portal Item Group, grouped by company.
    Each company will contain its item groups and their respective items.
    """
    # Fetch all item groups that are marked to show on the portal, including their associated companies
    item_groups = frappe.get_all('Portal Item Group', filters={'show_on_portal': 1}, fields=['name', 'company'])

    # Initialize a dictionary to hold companies and their item groups and items
    companies_data = {}

    for group in item_groups:
        company_name = group['company']
        item_group_name = group['name']

        # If the company is not in the dictionary, initialize it with a new structure
        if company_name not in companies_data:
            companies_data[company_name] = {
                'item_groups': {}
            }

        # If the item group is not already under the company, add it with an empty item list
        if item_group_name not in companies_data[company_name]['item_groups']:
            companies_data[company_name]['item_groups'][item_group_name] = []

        # Fetch items under this item group and company
        items = frappe.get_all(
            'Item',
            filters={
                'item_group': item_group_name,
                'custom_company': company_name
            },
            fields=['item_name', 'item_code', 'image', 'description']
        )

        # Append items to the appropriate item group under the company
        companies_data[company_name]['item_groups'][item_group_name].extend(items)

    return companies_data or {}  # Return an empty dictionary if no data is found
