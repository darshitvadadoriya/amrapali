# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockReceive(Document):
  
    def on_submit(self):
        # Fetch the Purchase Indent document once
        indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Append data to 'stock_in' table in the Purchase Indent document
        for data in self.items:
            indent.append('stock_in', {
                "location": self.location,
                "custom_duty": data.custom_duty,
                "quantity": data.quantity,
                "record_id": data.name,
                "record_doc": data.parent,
                "item_code": data.item_code,
                "premium": data.premium,
            })

        # Save the updated Purchase Indent document
        indent.save()

        # Fetch summaries for Stock Balance In and Out
        balance_in_list = frappe.db.sql("""
            SELECT 
                location, 
                item_code,
                premium,
                SUM(quantity) AS total_quantity_in,
                SUM(custom_duty) AS total_custom_duty_in,
                COUNT(location) AS location_count_in
            FROM `tabStock Balance In`
            WHERE parent = %s
            GROUP BY location, item_code, premium
        """, (self.purchase_indent), as_dict=True)

        balance_out_list = frappe.db.sql("""
            SELECT 
                location, 
                item_code,
                premium,
                SUM(quantity) AS total_quantity_out
            FROM `tabStock Balance Out`
            WHERE parent = %s
            GROUP BY location, item_code, premium
        """, (self.purchase_indent), as_dict=True)

        # Convert Stock Balance Out data to a dictionary for quick lookup
        balance_out_dict = {
            (record.location, record.item_code, record.premium): record.total_quantity_out
            for record in balance_out_list
        }

        # Create a dictionary from existing stock_summary for quick lookup
        existing_summary = {
            (row.location, row.item_code, row.premium): row for row in indent.stock_summary
        }

        # Iterate over the Stock Balance In records
        for record in balance_in_list:
            location = record.location
            item_code = record.item_code
            premium = record.premium
            total_quantity_in = record.total_quantity_in
            total_custom_duty_in = record.total_custom_duty_in
            location_count_in = record.location_count_in

            # Fetch the total quantity out for the same location, item_code, and premium
            total_quantity_out = balance_out_dict.get((location, item_code, premium), 0)

            # Calculate net quantity
            net_quantity = total_quantity_in - total_quantity_out

            # Calculate per-location custom duty
            per_location_custom_duty = (
                total_custom_duty_in / location_count_in if location_count_in else 0
            )

            # Check if the entry exists in 'stock_summary'
            key = (location, item_code, premium)
            if key in existing_summary:
                row = existing_summary[key]
                row.quantity = net_quantity
                row.custom_duty = per_location_custom_duty
            else:
                indent.append("stock_summary", {
                    "location": location,
                    "quantity": net_quantity,
                    "custom_duty": per_location_custom_duty,
                    "item_code": item_code,
                    "premium": premium,
                })

        # Save the updated Purchase Indent document
        indent.save()




        
    def on_cancel(self):
        stock_issue = self.stock_issue
        total_qty = self.total_quantity
        pending_quantity = frappe.db.get_value("Stock Issue",stock_issue,["pending_quantity","total_quantity"],as_dict=1)
    
        status = "Material Issue"
        if pending_quantity.pending_quantity == 0:
            status = "Partly Complete"
        if pending_quantity.pending_quantity + self.total_quantity == pending_quantity.total_quantity:
            status = "Material Issue"
        total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        frappe.db.set_value("Stock Issue",stock_issue,{"pending_quantity":total_pending_qty,"status":status})
        

        balance_in = frappe.db.get_all("Stock Balance In", fields=["*"], filters={"record_doc": self.name})
        balance_out = frappe.db.get_all("Stock Balance Out", fields=["*"], filters={"record_doc": self.stock_issue})

        # Process Stock Balance In
        for balance in balance_in:
            # Check if a matching row exists in the "Stock Summary" table
            stock_summary = frappe.db.get_value(
                "Stock Summary",
                {"item_code": balance.item_code, "location": balance.location},
                ["name", "quantity"],
                as_dict=True
            )

            if stock_summary:
                # Delete the balance record from the "Stock Balance In" table
                frappe.delete_doc("Stock Balance In", balance.name)
                frappe.delete_doc("Stock Summary", stock_summary.name)

        # Process Stock Balance Out
        for out_balance in balance_out:
            # Check if a matching row exists in the "Stock Summary" table
            stock_summary = frappe.db.get_value(
                "Stock Summary",
                {"item_code": out_balance.item_code, "location": out_balance.location, "custom_duty": out_balance.custom_duty},
                ["name", "quantity"],
                as_dict=True
            )
           
            if stock_summary:
                # Update the quantity in the "Stock Summary" table (add the "Stock Balance Out" quantity)
                new_quantity = stock_summary.quantity + out_balance.quantity
                frappe.db.set_value("Stock Summary", stock_summary.name, "quantity", new_quantity)
                
