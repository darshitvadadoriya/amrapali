# import frappe

# @frappe.whitelist()
# def get_latest_balance(warehouse, item=None):
#     """
#     Fetch the latest running balance for a specific warehouse and optionally for a specific item.

#     Args:
#         warehouse (str): The warehouse name.
#         item (str, optional): The item code. If not provided, calculates for all items.

#     Returns:
#         list: Latest running balance for the warehouse (and item, if specified).
#     """
#     if not warehouse:
#         frappe.throw("Warehouse is required")

#     # Build dynamic conditions
#     conditions = "WHERE combined_data.location = %(warehouse)s"
#     if item:
#         conditions += " AND combined_data.item_code = %(item)s"

#     # SQL query to fetch the latest running balance
#     query = f"""
#     SELECT
#         combined_data.location AS warehouse,
#         combined_data.item_code AS item,
#         combined_data.inward_quantity,
#         combined_data.outward_quantity,
#         combined_data.running_balance
#     FROM (
#         SELECT
#             location,
#             item_code,
#             SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS inward_quantity,
#             SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS outward_quantity,
#             SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS running_balance,
#             ROW_NUMBER() OVER (PARTITION BY location, item_code ORDER BY creation_date DESC) AS row_num
#         FROM (
#             -- Case 1: Stock Receive (Inward stock movement)
#             SELECT
#                 sr.location,
#                 sri.item_code,
#                 sri.quantity AS quantity,
#                 sri.creation AS creation_date,
#                 'IN' AS movement_type
#             FROM `tabStock Transfer Item` sri
#             INNER JOIN `tabStock Receive` sr ON sri.parent = sr.name
#             WHERE sr.docstatus = 1
#             UNION ALL
#             -- Case 2: Stock Issue (Outward stock movement)
#             SELECT
#                 si.location,
#                 sri.item_code,
#                 -sri.quantity AS quantity,
#                 sri.creation AS creation_date,
#                 'OUT' AS movement_type
#             FROM `tabStock Transfer Item` sri
#             INNER JOIN `tabStock Issue` si ON sri.parent = si.name
#             WHERE si.docstatus = 1
#             UNION ALL
#             -- Case 3: Purchase Inward (Inward stock movement)
#             SELECT
#                 pi.location,
#                 pi.item_code,
#                 pi.quantity AS quantity,
#                 pi.creation AS creation_date,
#                 'IN' AS movement_type
#             FROM `tabPurchase InWard Item` pi
#             LEFT JOIN `tabPurchase InWard` inward ON pi.parent = inward.name
#             WHERE pi.docstatus = 1
#         ) AS movement_data
#     ) AS combined_data
#     {conditions} AND combined_data.row_num = 1
#     """

#     # Execute the query
#     filters = {"warehouse": warehouse}
#     if item:
#         filters["item"] = item

#     try:
#         data = frappe.db.sql(query, filters, as_dict=True)
#     except Exception as e:
#         frappe.throw(f"Error fetching data: {e}")

#     return data



import frappe

@frappe.whitelist()
def get_latest_balance(warehouse, item=None):
    """
    Fetch the available balance for creating a new PO by deducting quantities
    committed in previous POs for the same location.

    Args:
        warehouse (str): The warehouse name.
        item (str, optional): The item code. If not provided, calculates for all items.

    Returns:
        list: Available balance for the warehouse (and item, if specified).
    """
    if not warehouse:
        frappe.throw("Warehouse is required")

    # Build dynamic conditions
    conditions = "WHERE combined_data.location = %(warehouse)s"
    if item:
        conditions += " AND combined_data.item_code = %(item)s"

    # SQL query to calculate running balance and adjust for committed quantities
    query = f"""
    WITH PurchaseOrderData AS (
        SELECT
            poi.item_code,
            SUM(poi.qty) AS committed_quantity,
            po.set_warehouse AS po_location
        FROM `tabPurchase Order Item` poi
        INNER JOIN `tabPurchase Order` po ON poi.parent = po.name
        WHERE po.docstatus = 1
        GROUP BY poi.item_code, po.set_warehouse
    ),
    CombinedStockData AS (
        SELECT
            location,
            item_code,
            SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS inward_quantity,
            SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS outward_quantity,
            SUM(quantity) OVER (PARTITION BY location, item_code ORDER BY creation_date) AS running_balance,
            ROW_NUMBER() OVER (PARTITION BY location, item_code ORDER BY creation_date DESC) AS row_num
        FROM (
            -- Case 1: Stock Receive (Inward stock movement)
            SELECT
                sr.location,
                sri.item_code,
                sri.quantity AS quantity,
                sri.creation AS creation_date,
                'IN' AS movement_type
            FROM `tabStock Transfer Item` sri
            INNER JOIN `tabStock Receive` sr ON sri.parent = sr.name
            WHERE sr.docstatus = 1
            UNION ALL
            -- Case 2: Stock Issue (Outward stock movement)
            SELECT
                si.location,
                sri.item_code,
                -sri.quantity AS quantity,
                sri.creation AS creation_date,
                'OUT' AS movement_type
            FROM `tabStock Transfer Item` sri
            INNER JOIN `tabStock Issue` si ON sri.parent = si.name
            WHERE si.docstatus = 1
            UNION ALL
            -- Case 3: Purchase Inward (Inward stock movement)
            SELECT
                pi.location,
                pi.item_code,
                pi.quantity AS quantity,
                pi.creation AS creation_date,
                'IN' AS movement_type
            FROM `tabPurchase InWard Item` pi
            LEFT JOIN `tabPurchase InWard` inward ON pi.parent = inward.name
            WHERE pi.docstatus = 1
        ) AS movement_data
    )
    SELECT
        combined_data.location AS warehouse,
        combined_data.item_code AS item,
        combined_data.inward_quantity,
        combined_data.outward_quantity,
        combined_data.running_balance,
        COALESCE(pod.committed_quantity, 0) AS committed_quantity,
        combined_data.running_balance - COALESCE(pod.committed_quantity, 0) AS available_balance
    FROM CombinedStockData combined_data
    LEFT JOIN PurchaseOrderData pod
        ON combined_data.item_code = pod.item_code AND combined_data.location = pod.po_location
    {conditions} AND combined_data.row_num = 1
    """

    # Execute the query
    filters = {"warehouse": warehouse}
    if item:
        filters["item"] = item

    try:
        data = frappe.db.sql(query, filters, as_dict=True)
    except Exception as e:
        frappe.throw(f"Error fetching data: {e}")

    return data

