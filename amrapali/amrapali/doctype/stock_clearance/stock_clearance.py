# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document




class StockClearance(Document):
    def on_submit(self):
        # Fetch the Purchase Indent document
        indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        indent_item_hash_map = {
           data.get("name"): data
            for data in indent.items
        }

        
        # Loop through the items and append to stock_in
        for data in self.items:
            row = indent.append('stock_in', {})
            row.location = data.location
            row.custom_duty = data.custom_duty
            row.quantity = data.quantity
            row.record_id = data.name
            row.record_doc = data.parent
            row.item_code = data.item_code 
            row.premium = data.premium # Set item_code from the item table

            child_name = frappe.db.get_value(
                'Purchase Indent Item',

                fieldname=['name','pending_quantity'],

                filters= {
                    'parent': indent.name,
                    'item_code': data.item_code,
                    'premium': data.premium,
                    'location': data.location,
                    'uom': data.uom,
                },
                as_dict=1
                )  
            
            indent_item_hash_map[child_name.get("name")].pending_quantity = child_name.get("pending_quantity") - data.get("quantity")
            frappe.log_error('fds',str(indent_item_hash_map[child_name.get("name")]))
        # Save the indent after adding items to stock_in
        indent.items = []
        for key,data in indent_item_hash_map.items():
            indent.append("items",data)


        indent.save()

        balance_list = frappe.db.sql("""
            SELECT 
                location, 
                item_code,
                SUM(quantity) AS total_quantity, 
                SUM(custom_duty) AS total_custom_duty, 
                SUM(quantity * custom_duty) AS numerator
            FROM 
                `tabStock Balance In`
            WHERE 
                parent = %s
            GROUP BY 
                location, item_code;
        """, (self.purchase_indent), as_dict=True)

        # Fetch the parent document
        purchase_indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Initialize a dictionary to store the aggregated data by location and item_code
        location_data = {}

        for data in self.items:
            location = data.location
            item_code = data.item_code
            key = (location, item_code)

            if key not in location_data:
                location_data[key] = {
                    "total_quantity": 0,
                    "total_custom_duty": 0,
                    "premium": data.premium  # Include premium if required
                }
            location_data[key]["total_quantity"] += data.quantity
            location_data[key]["total_custom_duty"] += data.custom_duty

        # Initialize a set to keep track of updated location-item_code combinations
        updated_keys = set()

        for record in balance_list:
            key = (record.location, record.item_code)
            per_item_custom_duty = record.numerator / record.total_quantity if record.total_quantity else 0

            # Track updated keys
            updated_keys.add(key)

            # Check if the combination already exists in the child table
            row_exists = False
            for row in purchase_indent.stock_summary:
                if row.location == record.location and row.item_code == record.item_code:
                    # Update existing row
                    row.quantity = record.total_quantity
                    row.custom_duty = per_item_custom_duty
                    row_exists = True
                    break

            # If the row does not exist, create a new row in stock_summary
            if not row_exists:
                purchase_indent.append("stock_summary", {
                    "location": record.location,
                    "item_code": record.item_code,
                    "quantity": record.total_quantity,
                    "custom_duty": per_item_custom_duty,
                    "premium": location_data[key]["premium"]  # Use premium from the aggregated data
                })

        # Save the purchase_indent after updating stock_summary
        purchase_indent.save()
        frappe.db.commit()

        



        
                
    def on_cancel(self):
        indent = self.purchase_indent
        total_qty = self.total_quantity
        
        # Fetch the purchase indent details
        pending_quantity = frappe.db.get_value("Purchase Indent", indent, fieldname= ['pending_quantity'], as_dict=True)
        
        status = "Open"
        if pending_quantity:
            if pending_quantity.pending_quantity == 0:
                status = "Partly Complete"
            elif (pending_quantity.pending_quantity or 0) + total_qty == pending_quantity.total_quantity:
                status = "Open"
        
        total_pending_qty = total_qty + (pending_quantity.pending_quantity or 0)
        
        # Update the Purchase Indent with the new pending quantity and status
        frappe.db.set_value("Purchase Indent", indent, {"pending_quantity": total_pending_qty, "status": status})

        # Delete stock balances associated with the current stock clearance
        stock_balances = frappe.db.get_all(
            "Stock Balance In",
            filters={"record_doc": self.name},
            fields=["name"]
        )

        for stock_balance in stock_balances:
            frappe.delete_doc("Stock Balance In", stock_balance["name"])

        frappe.db.commit()

        # Fetch Purchase Indent details with stock information
        purchase_indent = frappe.get_doc('Purchase Indent', indent)

        purchase_indent_hashmap_items = {}

        for data in self.items:
            key = (data.item_code, data.location, data.premium)

            if key in purchase_indent_hashmap_items:
                purchase_indent_hashmap_items[key]['pending_quantity'] += data.quantity 

            else:
                purchase_indent_hashmap_items[key] = {
                    'item_code': data.item_code,
                    'quantity': data.quantity,
                    'location': data.location,
                    'premium': data.premium,
                    'total_quantity': data.quantity or 0,
                    'description': data.description,
                    'uom': data.uom,
                    'item_group': data.item_group,
                    'item_name': data.item_name
                }
        for row in purchase_indent.items:
            key = (row.item_code, row.location, row.premium)
            new_row = purchase_indent_hashmap_items.get(key)

            if new_row:
                row.pending_quantity += new_row.get('quantity')

        purchase_indent_hashmap = {}

        # Construct hashmap for stock items in Purchase Indent
        for data in purchase_indent.stock_in:
            key = (data.item_code, data.location, data.premium)
            
            # Update hashmap with total quantities and custom duty
            if key in purchase_indent_hashmap:
                purchase_indent_hashmap[key]['total_quantity'] += data.quantity or 0
                purchase_indent_hashmap[key]['total_custom_duty'] += (data.custom_duty or 0) * (data.quantity or 0)
            else:
                purchase_indent_hashmap[key] = {
                    'item_code': data.item_code,
                    'location': data.location,
                    'premium': data.premium,
                    'total_quantity': data.quantity or 0,
                    'total_custom_duty': (data.custom_duty or 0) * (data.quantity or 0)
                }
        rows_to_remove = []  # List to store rows to be removed

        # Update stock summary in Purchase Indent
        for row in purchase_indent.stock_summary:

            key = (row.item_code, row.location, row.premium)
            new_row = purchase_indent_hashmap.get(key)

            if new_row:
                # Update the quantity and custom duty in the existing row
                row.quantity = new_row['total_quantity']
                row.custom_duty = (
                    new_row['total_custom_duty'] / new_row['total_quantity']
                    if new_row['total_quantity'] > 0 else 0
                )
            else:
                # Add row to the removal list if it doesn't exist in the hashmap
                rows_to_remove.append(row)

        # After the loop, remove the stored rows
        for row in rows_to_remove:
            purchase_indent.stock_summary.remove(row)



        # Save the changes made to Purchase Indent
        purchase_indent.save()



            # for row in purchase_indent.stock_summary:
                


            # delete record from purchase indent stock in table
            # balance_in = frappe.db.get_all("Stock Balance In",fields=["*"], filters={"record_doc":self.name})

            # frappe.throw(str(balance_in))

            # for balance in balance_in:
            #     stock_summary = frappe.db.get_value(
            #         "Stock Summary",
            #         {"item_code": balance.item_code, "location": balance.location, "custom_duty": balance.custom_duty},
            #         ["name", "quantity","parent"],
            #         as_dict=True
            #     )
            #     qty_of_summary = float(stock_summary.quantity) - balance.quantity
            #     # qty_of_summary = float(stock_summary.quantity) - balance.quantity
            #     frappe.db.set_value("Stock Summary",stock_summary.name,"quantity",qty_of_summary)
            #     frappe.delete_doc("Stock Balance In",balance.name)
                
            #     # If quantity is 0 and parent is purchase_indent, delete Stock Summary row
            #     if qty_of_summary == 0.0 and stock_summary.parent == self.purchase_indent:
            #         frappe.delete_doc("Stock Summary", stock_summary.name) Put Case if the stock in is empty
            
            

