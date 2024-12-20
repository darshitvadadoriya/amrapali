# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockReceive(Document):
    # def on_update(self):
    #     indent = frappe.get_doc("Purchase Indent",self.purchase_indent)
    #     for data in self.items:
    #         row = indent.append('stock_in', {})
    #         row.location = self.location
    #         row.custom_duty = data.custom_duty
    #         row.quantity = data.quantity
    #         row.record_id = data.name
    #         row.record_doc = data.parent
    #     indent.save()
    
    def on_submit(self):
        # Fetch the Purchase Indent document
        indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Append data to 'stock_in' table in the Purchase Indent document
        for data in self.items:
            row = indent.append('stock_in', {})
            row.location = self.location
            row.custom_duty = data.custom_duty
            row.quantity = data.quantity
            row.record_id = data.name
            row.record_doc = data.parent
            row.item_code = data.item_code  # Set item_code here

        # Save the updated Purchase Indent document
        indent.save()

        # Fetch location-wise summary for Stock Balance In
        balance_in_list = frappe.db.sql("""
            SELECT 
                location, 
                SUM(quantity) AS total_quantity_in,
                SUM(custom_duty) AS total_custom_duty_in,
                COUNT(location) AS location_count_in
            FROM `tabStock Balance In`
            WHERE parent = %s
            GROUP BY location
        """, (self.purchase_indent,), as_dict=True)

        # Fetch location-wise summary for Stock Balance Out
        balance_out_list = frappe.db.sql("""
            SELECT 
                location, 
                SUM(quantity) AS total_quantity_out
            FROM `tabStock Balance Out`
            WHERE parent = %s
            GROUP BY location
        """, (self.purchase_indent,), as_dict=True)

        # Convert Stock Balance Out data to a dictionary for quick lookup
        balance_out_dict = {record.location: record.total_quantity_out for record in balance_out_list}

        # Fetch the parent Purchase Indent document again
        purchase_indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Create a dictionary from existing stock_summary for quick lookup
        existing_summary = {row.location: row for row in purchase_indent.stock_summary}

        # Iterate over the Stock Balance In records
        for record in balance_in_list:
            location = record.location
            total_quantity_in = record.total_quantity_in
            total_custom_duty_in = record.total_custom_duty_in
            location_count_in = record.location_count_in

            # Fetch the total quantity out for the same location
            total_quantity_out = balance_out_dict.get(location, 0)

            # Calculate net quantity
            net_quantity = total_quantity_in - total_quantity_out

            # Calculate per-location custom duty
            per_location_custom_duty = (
                total_custom_duty_in / location_count_in if location_count_in else 0
            )

            # Check if the location already exists in the 'stock_summary' table
            if location in existing_summary:
                # Update the existing row
                row = existing_summary[location]
                row.quantity = net_quantity
                row.item_code = self.items[0].item_code  # Set item_code
                if row.custom_duty != per_location_custom_duty:
                    # If custom duty differs, add a new row
                    purchase_indent.append("stock_summary", {
                        "location": location,
                        "quantity": net_quantity,
                        "custom_duty": per_location_custom_duty,
                        "item_code": self.items[0].item_code  # Set item_code
                    })
            else:
                # Add a new row
                purchase_indent.append("stock_summary", {
                    "location": location,
                    "quantity": net_quantity,
                    "custom_duty": per_location_custom_duty,
                    "item_code": self.items[0].item_code  # Set item_code
                })

        # Save the updated Purchase Indent document
        purchase_indent.save()



        
    def on_cancel(self):
        stock_issue = self.stock_issue
        total_qty = self.total_quantity
        pending_quantity = frappe.db.get_value("Stock Issue",stock_issue,["pending_quantity","total_quantity"],as_dict=1)
    
        
        total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        frappe.db.set_value("Stock Issue",stock_issue,"pending_quantity",total_pending_qty)
        
        # delete record from purchase indent stock in table
        # balance_in = frappe.db.get_all("Stock Balance In",fields=["*"], filters={"record_doc":self.name})
        # for balance in balance_in:
        #     frappe.delete_doc("Stock Balance In",balance.name)


       # Step 1: Get the Stock Balance In record
        balance_in = frappe.db.get_all("Stock Balance In", fields=["*"], filters={"record_doc": self.name})

        for row in balance_in:
            item_code = row.item_code
            location = row.location
            custom_duty = row.custom_duty
            quantity = row.quantity
            
            # Step 2: Check if the matching record exists in Stock Summary
            stock_summary = frappe.db.get_all("Stock Summary", fields=["*"], 
                                            filters={
                                                "item_code": item_code,
                                                "location": location,
                                                "custom_duty": custom_duty,
                                                "quantity": quantity
                                            })
            
            if stock_summary:
                # Step 3: Remove from Stock Summary table
                frappe.db.delete("Stock Summary", filters={
                    "item_code": item_code,
                    "location": location,
                    "custom_duty": custom_duty,
                    "quantity": quantity
                })
            
                # Step 5: Remove the processed record from Stock Balance In
                frappe.db.delete("Stock Balance In", filters={
                    "name": row.name
                })

              

                matching_summary = frappe.db.get_value(
                    "Stock Summary", 
                    {"item_code": item_code, "location": location, "custom_duty": custom_duty},
                    ["name", "quantity"]
                )
                
                print(matching_summary)
                print("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
                if matching_summary:
                    summary_name, existing_quantity = matching_summary
                    # Update the Stock Summary with the new quantity
                    frappe.db.set_value("Stock Summary", summary_name, "quantity", existing_quantity + quantity)
