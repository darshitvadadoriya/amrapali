# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt


# import frappe

# def execute(filters=None):
#     if not filters:
#         filters = {}

#     # Build dynamic conditions
#     conditions = ""
#     if filters.get("location"):
#         conditions += "AND combined_data.location = %(location)s "
#     if filters.get("item"):
#         conditions += "AND combined_data.item_code = %(item)s "
#     # if filters.get("from_date") and filters.get("to_date"):
#     #     conditions += "AND combined_data.posting_date BETWEEN %(from_date)s AND %(to_date)s "

#     query = f"""
#     SELECT
#         location,
#         item_code AS item,
#         quantity,
#         SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY location) AS running_balance
#     FROM (
#         -- Case 1: Stock Receive (Inward stock movement)
#         SELECT
#             sr.location,
#             sri.item_code,
#             sri.quantity AS quantity
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Receive` sr ON sri.parent = sr.name
#         WHERE
#             sr.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 2: Stock Issue (Outward stock movement)
#         SELECT
#             si.location,
#             sri.item_code,
#             -sri.quantity AS quantity  -- Outward is negative
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Issue` si ON sri.parent = si.name
#         WHERE
#             si.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 3: Purchase Inward (Inward stock movement)
#         SELECT
#             pi.location,
#             pi.item_code,
#             pi.quantity AS quantity
#         FROM
#             `tabPurchase InWard Item` pi
#         WHERE
#             pi.docstatus = 1
#     ) AS combined_data
#     WHERE 1=1 {conditions}
#     ORDER BY location, item_code
#     """

#     # Execute SQL
#     data = frappe.db.sql(query, filters, as_dict=True)

#     # Columns (Removed posting_date column)
#     columns = [
#         {"label": "Location", "fieldname": "location", "fieldtype": "Link", "options": "Warehouse", "width": 200},
#         {"label": "Item", "fieldname": "item", "fieldtype": "Link", "options": "Item", "width": 200},
#         {"label": "Quantity", "fieldname": "quantity", "fieldtype": "Float", "width": 150},
#         {"label": "Running Balance", "fieldname": "running_balance", "fieldtype": "Float", "width": 150},
#     ]

#     return columns, data



#============================================= With creation wise proper balance===================================


# import frappe

# def execute(filters=None):
#     if not filters:
#         filters = {}

#     # Build dynamic conditions
#     conditions = ""
#     if filters.get("location"):
#         conditions += "AND combined_data.location = %(location)s "
#     if filters.get("item"):
#         conditions += "AND combined_data.item_code = %(item)s "
#     # if filters.get("from_date") and filters.get("to_date"):
#     #     conditions += "AND combined_data.creation BETWEEN %(from_date)s AND %(to_date)s "

#     query = f"""
#     SELECT
#         location,
#         item_code AS item,
#         quantity,
#         SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY creation_date, location) AS running_balance
#     FROM (
#         -- Case 1: Stock Receive (Inward stock movement)
#         SELECT
#             sr.location,
#             sri.item_code,
#             sri.quantity AS quantity,
#             sri.creation AS creation_date
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Receive` sr ON sri.parent = sr.name
#         WHERE
#             sr.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 2: Stock Issue (Outward stock movement)
#         SELECT
#             si.location,
#             sri.item_code,
#             -sri.quantity AS quantity,  -- Outward is negative
#             sri.creation AS creation_date
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Issue` si ON sri.parent = si.name
#         WHERE
#             si.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 3: Purchase Inward (Inward stock movement)
#         SELECT
#             pi.location,
#             pi.item_code,
#             pi.quantity AS quantity,
#             pi.creation AS creation_date
#         FROM
#             `tabPurchase InWard Item` pi
#         WHERE
#             pi.docstatus = 1
#     ) AS combined_data
#     WHERE 1=1 {conditions}
#     ORDER BY location, item_code, creation_date
#     """

#     # Execute SQL
#     data = frappe.db.sql(query, filters, as_dict=True)

#     # Columns (with proper ordering and step-wise balance)
#     columns = [
#         {"label": "Location", "fieldname": "location", "fieldtype": "Link", "options": "Warehouse", "width": 200},
#         {"label": "Item", "fieldname": "item", "fieldtype": "Link", "options": "Item", "width": 200},
#         {"label": "Quantity", "fieldname": "quantity", "fieldtype": "Float", "width": 150},
#         {"label": "Running Balance", "fieldname": "running_balance", "fieldtype": "Float", "width": 150},
#     ]

#     return columns, data





# import frappe

# def execute(filters=None):
#     if not filters:
#         filters = {}

#     # Build dynamic conditions
#     conditions = ""
#     if filters.get("location"):
#         conditions += "AND combined_data.location = %(location)s "
#     if filters.get("item"):
#         conditions += "AND combined_data.item_code = %(item)s "
#     # if filters.get("from_date") and filters.get("to_date"):
#     #     conditions += "AND combined_data.creation BETWEEN %(from_date)s AND %(to_date)s "

#     query = f"""
#     SELECT
#         location,
#         item_code AS item,
#         SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) AS inward_quantity,
#         SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) AS outward_quantity,
#         SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY creation_date, location) AS running_balance
#     FROM (
#         -- Case 1: Stock Receive (Inward stock movement)
#         SELECT
#             sr.location,
#             sri.item_code,
#             sri.quantity AS quantity,
#             sri.creation AS creation_date,
#             'IN' AS movement_type
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Receive` sr ON sri.parent = sr.name
#         WHERE
#             sr.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 2: Stock Issue (Outward stock movement)
#         SELECT
#             si.location,
#             sri.item_code,
#             -sri.quantity AS quantity,  -- Outward is negative
#             sri.creation AS creation_date,
#             'OUT' AS movement_type
#         FROM
#             `tabStock Transfer Item` sri
#         INNER JOIN
#             `tabStock Issue` si ON sri.parent = si.name
#         WHERE
#             si.docstatus = 1
#             AND sri.docstatus = 1
#         UNION ALL
#         -- Case 3: Purchase Inward (Inward stock movement)
#         SELECT
#             pi.location,
#             pi.item_code,
#             pi.quantity AS quantity,
#             pi.creation AS creation_date,
#             'IN' AS movement_type
#         FROM
#             `tabPurchase InWard Item` pi
#         WHERE
#             pi.docstatus = 1
#     ) AS combined_data
#     WHERE 1=1 {conditions}
#     GROUP BY location, item_code, creation_date
#     ORDER BY location, item_code, creation_date
#     """

#     # Execute SQL
#     data = frappe.db.sql(query, filters, as_dict=True)

#     # Columns (with separate inward and outward columns)
#     columns = [
#         {"label": "Location", "fieldname": "location", "fieldtype": "Link", "options": "Warehouse", "width": 200},
#         {"label": "Item", "fieldname": "item", "fieldtype": "Link", "options": "Item", "width": 200},
#         {"label": "Inward Quantity", "fieldname": "inward_quantity", "fieldtype": "Float", "width": 150},
#         {"label": "Outward Quantity", "fieldname": "outward_quantity", "fieldtype": "Float", "width": 150},
#         {"label": "Running Balance", "fieldname": "running_balance", "fieldtype": "Float", "width": 150},
#     ]

#     return columns, data





import frappe

@frappe.whitelist()
def execute(filters=None):
    if not filters:
        filters = {}

    # Build dynamic conditions
    conditions = ""
    if filters.get("location"):
        conditions += "AND combined_data.location = %(location)s "
    if filters.get("item"):
        conditions += "AND combined_data.item_code = %(item)s "
    if filters.get("company"):
        conditions += "AND combined_data.company = %(company)s "  # Filter based on company in the parent table
  
    query = f"""
    SELECT
        location,
        item_code AS item,
        SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) AS inward_quantity,
        SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) AS outward_quantity,
        SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY creation_date, location) AS running_balance
    FROM (
        -- Case 1: Stock Receive (Inward stock movement)
        SELECT
            sr.location,
            sri.item_code,
            sri.quantity AS quantity,
            sri.creation AS creation_date,
            'IN' AS movement_type,
            sr.company  -- Company field from Stock Receive (parent table)
        FROM
            `tabStock Transfer Item` sri
        INNER JOIN
            `tabStock Receive` sr ON sri.parent = sr.name
        WHERE
            sr.docstatus = 1
            AND sri.docstatus = 1
        UNION ALL
        -- Case 2: Stock Issue (Outward stock movement)
        SELECT
            si.location,
            sri.item_code,
            -sri.quantity AS quantity,  -- Outward is negative
            sri.creation AS creation_date,
            'OUT' AS movement_type,
            si.company  -- Company field from Stock Issue (parent table)
        FROM
            `tabStock Transfer Item` sri
        INNER JOIN
            `tabStock Issue` si ON sri.parent = si.name
        WHERE
            si.docstatus = 1
            AND sri.docstatus = 1
        UNION ALL
        -- Case 3: Purchase Inward (Inward stock movement)
        SELECT
            pi.location,
            pi.item_code,
            pi.quantity AS quantity,
            pi.creation AS creation_date,
            'IN' AS movement_type,
            inward.company
        FROM
            `tabPurchase InWard Item` pi
        Left Join
			`tabPurchase InWard` inward
		ON
			pi.parent = inward.name
        WHERE
            pi.docstatus = 1
    ) AS combined_data
    WHERE 1=1 {conditions}
    GROUP BY location, item_code, creation_date
    ORDER BY location, item_code, creation_date
    """

    # Execute SQL query with filters
    data = frappe.db.sql(query, filters, as_dict=True)

    # Columns to return for the front-end table
    columns = [
        {"label": "Location", "fieldname": "location", "fieldtype": "Link", "options": "Warehouse", "width": 200},
        {"label": "Item", "fieldname": "item", "fieldtype": "Link", "options": "Item", "width": 200},
        {"label": "Inward Quantity", "fieldname": "inward_quantity", "fieldtype": "Float", "width": 150},
        {"label": "Outward Quantity", "fieldname": "outward_quantity", "fieldtype": "Float", "width": 150},
        {"label": "Running Balance", "fieldname": "running_balance", "fieldtype": "Float", "width": 150},
    ]

    return columns, data
