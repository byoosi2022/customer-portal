from frappe import _

def get_data():
    return [
        {
            "label": _("Orders"),
            "icon": "fa fa-list",
            "items": [
                {
                    "type": "doctype",
                    "name": "Sales Order",
                    "label": _("Sales Orders"),
                    "route": "/sales-order",
                }
            ]
        }
    ]
