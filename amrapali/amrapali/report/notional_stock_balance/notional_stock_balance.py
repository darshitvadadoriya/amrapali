# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe

@frappe.whitelist()
def execute(filters=None):
      
	columns, data = ['parent','item_code','location', 'quantity', 'custom_duty'], []

	columns = [
        {
            "label": "Purchase Indent",
            "fieldname": "parent",
            "fieldtype": "Link",
   			"options": "Purchase Indent",
            "width": 250
        },
        {
            "label": "Item",
            "fieldname": "item_code",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Location",
            "fieldname": "location",
            "fieldtype": "Data",
            "width": 180
        },
        {
            "label": "Quantity",
            "fieldname": "quantity",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": "Custom Duty",
            "fieldname": "custom_duty",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Premium",
            "fieldname": "premium",
            "fieldtype": "Data",
            "width": 120
        }
    ]

	data = getdata(filters)
	return columns, data


@frappe.whitelist()
def getdata(filters):
    # Ensure quantity > 0 is added to the filters
    filters["quantity"] = [">", 0]
    
    # Fetch data from the 'Stock Summary' doctype
    data = frappe.get_all(
        doctype='Stock Summary',
        filters=filters,
        fields=['parent', 'item_code', 'location', 'quantity', 'custom_duty','premium'],
    )
    
    print(data)  # Log the data for debugging
    return data
