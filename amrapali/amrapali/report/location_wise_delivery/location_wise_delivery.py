# Copyright (c) 2025, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import today, add_days

def get_data(filters): 
    """
    Fetches and processes delivery note data based on applied filters.
    
    Args:
        filters (dict): Contains filter parameters including date range, company, warehouse, 
                       customer, and vaulting agent
    """
    
    # Build child data filters
    child_filters = {}
    if filters.get('location'):
        child_filters['warehouse'] = filters.get('location')

    # Fetch child data (Delivery Note Items)
    child_data = frappe.get_all(
        doctype='Delivery Note Item',
        filters=child_filters,
        fields=['*']
    )
    
    # Build parent data filters with date range
    parent_filters = {}

    parent_filters['docstatus'] = 1

    if filters.get('company'):
        parent_filters['company'] = filters.get('company')
    if filters.get('customer'):
        parent_filters['customer'] = filters.get('customer')
    if filters.get('custom_vaulting_agent'):
        parent_filters['custom_vaulting_agent'] = filters.get('custom_vaulting_agent')
    
    # Add date range filters
    if filters.get('from_date'):
        parent_filters['posting_date'] = ['>=', filters.get('from_date')]
    if filters.get('to_date'):
        parent_filters['posting_date'] = ['<=', filters.get('to_date')]
    
    # If both dates are present, use between condition
    if filters.get('from_date') and filters.get('to_date'):
        parent_filter3s['posting_date'] = ['between', (filters.get('from_date'), filters.get('to_date'))]

    # Fetch parent data (Delivery Notes)
    parent_data = frappe.get_all(
        doctype='Delivery Note',
        filters=parent_filters,
        fields=['name', 'customer', 'posting_date', 'company', 'custom_vaulting_agent']
    )

    # Rest of the code remains same...
    parent_data_map = { item['name']: item for item in parent_data }

    authorized_people = frappe.get_all(
        doctype='Authorized Person Details',
        fields=['parent', 'authorized_person_details']
    )

    authorized_people_map = {}
    for item in authorized_people:
        if item['parent'] not in authorized_people_map:
            authorized_people_map[item['parent']] = []
        authorized_people_map[item['parent']].append(item['authorized_person_details'])

    authorized_people_parent_data = frappe.get_all(
        doctype='Authorized Person',
        fields=['name', 'authorized_person']
    )

    authorized_people_parent_data_map = {item['name']: item for item in authorized_people_parent_data}

    filtered_child_data = [
        child for child in child_data 
        if child.parent in parent_data_map
    ]

    for child in filtered_child_data:
        parent_info = parent_data_map.get(child.parent)
        
        if parent_info:
            child.customer = parent_info['customer']
            child.posting_date = parent_info['posting_date']
            child.company = parent_info['company']
            child.custom_vaulting_agent = parent_info['custom_vaulting_agent']

        authorized_person_child = authorized_people_map.get(child.parent)

        if authorized_person_child:
            authorized_person_names = []
            for authorized_person_detail in authorized_person_child:
                authorized_person = authorized_people_parent_data_map.get(authorized_person_detail)
                if authorized_person:
                    authorized_person_names.append(authorized_person['authorized_person'])
            if authorized_person_names:
                child.authorized_person = ', '.join(authorized_person_names)

    return filtered_child_data

def execute(filters=None):
    """
    Main execution function for the report.
    
    Args:
        filters (dict): Filter parameters passed from the report UI
    """
    
    # Initialize default date filters if not provided
    if not filters:
        filters = {}
    if not filters.get('from_date'):
        filters['from_date'] = today()
    if not filters.get('to_date'):
        filters['to_date'] = today()

    columns = [
    {
        "label": "Delivery Note",
        "fieldname": "parent",
        "fieldtype": "Link",
        "options": "Delivery Note",
        "width": 150
    },
    {
        "label": "Posting Date",
        "fieldname": "posting_date",
        "fieldtype": "Date",
        "width": 130
    },
    {
        "label": "Customer",
        "fieldname": "customer",
        "fieldtype": "Link",
        "options": "Customer",
        "width": 180
    },
    {
        "label": "Vaulting Agent",
        "fieldname": "custom_vaulting_agent",
        "fieldtype": "data",
        "width": 100
    },
    {
        "label": "Item",
        "fieldname": "item_name",
        "fieldtype": "data",
        "width": 130
    },
    {
        "label": "Quantity",
        "fieldname": "qty",
        "fieldtype": "data",
        "width": 100
    },
    {
        "label": "Rate",
        "fieldname": "rate",
        "fieldtype": "Currency",
        "width": 100
    },
    {
        "label": "Amount",
        "fieldname": "amount",
        "fieldtype": "Currency",
        "width": 150
    },
    {
        "label": "UOM",
        "fieldname": "stock_uom",
        "fieldtype": "data",
        "width": 70
    },
    {
        "label": "Location",
        "fieldname": "warehouse",
        "fieldtype": "data",
        "width": 150
    },
    {
        "label": "Authorized Person",
        "fieldname": "authorized_person",
        "fieldtype": "data",
        "width": 200
    },
    {
        "label": "Company",
        "fieldname": "company",
        "fieldtype": "data",
        "width": 130
    },
    ]
    data = get_data(filters=filters)
    return columns, data