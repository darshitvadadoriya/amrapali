# Copyright (c) 2025, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe

def get_data(filters):
    # Filters for child table (Sales Order Item)
    child_filters = {}
    # Apply filter if 'item_name' is provided in filters
    if filters.get('item_name'):
        child_filters['item_name'] = filters['item_name']

    # Fetch data from 'Sales Order Item' with required fields
    child_data = frappe.get_all(
        doctype='Sales Order Item',
        fields=['item_name', 'qty', 'uom', 'base_net_rate', 'base_net_amount', 'parent', 'item_code'],
        filters=child_filters
    )

    # Filters for parent table (Sales Order)
    parent_filters = {'docstatus': 1, 'per_delivered': ['<', 100]}  # Include only submitted and partially delivered sales orders
    if filters.get('company'):
        parent_filters['company'] = filters['company']  # Filter by company if provided
    if filters.get('name'):
        parent_filters['name'] = filters['name']  # Filter by sales order name if provided
    if filters.get('warehouse'):
        parent_filters['set_warehouse'] = filters['warehouse']  # Filter by warehouse if provided
    if filters.get('customer'):
        parent_filters['customer'] = filters['customer']  # Filter by customer if provided

    # Apply date filters
    if filters.get('from_date') and filters.get('to_date'):
        parent_filters['delivery_date'] = ['between', [filters.get('from_date'), filters.get('to_date')]]
    elif filters.get('from_date'):
        parent_filters['delivery_date'] = ['>=', filters.get('from_date')]
    elif filters.get('to_date'):
        parent_filters['delivery_date'] = ['<=', filters.get('to_date')]


    # Fetch data from 'Sales Order' with required fields
    parent_data = frappe.get_all(
        doctype='Sales Order',
        filters=parent_filters,
        fields=['name', 'customer', 'delivery_date', 'company', 'set_warehouse', 'rounded_total', 'status', 'per_delivered']
    )

    # Create a mapping of parent sales order data for quick lookup
    parent_data_map = {item['name']: item for item in parent_data}

    # Filter child data to include only items that belong to the filtered parent sales orders
    filtered_child_data = [
        child for child in child_data
        if child['parent'] in parent_data_map
    ]

    # Enrich child data with parent sales order details
    for child in filtered_child_data:
        parent_info = parent_data_map.get(child['parent'])
        if parent_info:
            # Add parent information to the child record
            child['customer'] = parent_info['customer']
            child['delivery_date'] = parent_info['delivery_date']
            child['company'] = parent_info['company']
            child['set_warehouse'] = parent_info['set_warehouse']
            child['rounded_total'] = parent_info['rounded_total']
            child['status'] = parent_info['status']
            child['per_delivered'] = parent_info['per_delivered']

    return filtered_child_data

def execute(filters=None):
    # Define report columns with labels, fieldnames, fieldtypes, and widths
    columns = [
        {
            "label": "Sales Order",
            "fieldname": "parent",
            "fieldtype": "Link",
            "options": "Sales Order",
            "width": 200
        },
        {
            "label": "Item Code",
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 100
        },
        {
            "label": "Customer",
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 180
        },
        {
            "label": "Value Date",
            "fieldname": "delivery_date",
            "fieldtype": "Date",
            "width": 140
        },
        {
            "label": "Quantity",
            "fieldname": "qty",
            "fieldtype": "Float",
            "width": 80
        },
        {
            "label": "UOM",
            "fieldname": "uom",
            "fieldtype": "Data",
            "width": 80
        },
        {
            "label": "Rate",
            "fieldname": "base_net_rate",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": "Amount",
            "fieldname": "base_net_amount",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": "Total",
            "fieldname": "rounded_total",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": "Company",
            "fieldname": "company",
            "fieldtype": "Link",
            "options": "Company",
            "width": 150
        },
        {
            "label": "Warehouse",
            "fieldname": "set_warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
    ]

    # Fetch filtered data
    data = get_data(filters)
    return columns, data
