# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockClearance(Document):
    # def on_submit(self):
        
    #     indent = frappe.get_doc("Purchase Indent",self.purchase_indent)
    #     for data in self.items:
    #         row = indent.append('stock_in', {})
    #         row.location = data.location
    #         row.custom_duty = data.custom_duty
    #         row.quantity = data.quantity
    #         row.record_id = data.name
    #         row.record_doc = data.parent
    #     indent.save()
        
    
    #  # set summary of indent and location wise quantity available.
    #     balance_list = frappe.db.sql("""
    #         SELECT location, 
    #             SUM(quantity) AS total_quantity, 
    #             SUM(custom_duty) AS total_custom_duty,
    #             COUNT(location) AS location_count
    #         FROM `tabStock Balance In`
    #         WHERE parent = %s
    #         GROUP BY location
    #     """, (self.purchase_indent), as_dict=True)

    #     # Fetch the parent document
    #     purchase_indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

    #     # Initialize a list to keep track of updated locations
    #     updated_locations = []

    #     for record in balance_list:
    #         # Divide total custom duty by the count of the location
    #         per_location_custom_duty = record.total_custom_duty / record.location_count if record.location_count else 0

    #         # Track updated locations
    #         updated_locations.append(record.location)

    #         # Check if location already exists in the child table
    #         row_exists = False
    #         for row in purchase_indent.stock_summary:
    #             if row.location == record.location:
    #                 # update existing row
    #                 row.quantity = record.total_quantity
    #                 row.custom_duty = per_location_custom_duty
    #                 row_exists = True
    #                 break

    #         # if row is not exists then create new
    #         if not row_exists:
    #             purchase_indent.append("stock_summary", {
    #                 "location": record.location,
    #                 "quantity": record.total_quantity,
    #                 "custom_duty": per_location_custom_duty
    #             })

        
    #     purchase_indent.save()
    
    
    
    def on_submit(self):
        # Fetch the Purchase Indent document
        indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Loop through the items and append to stock_in
        for data in self.items:
            row = indent.append('stock_in', {})
            row.location = data.location
            row.custom_duty = data.custom_duty
            row.quantity = data.quantity
            row.record_id = data.name
            row.record_doc = data.parent
            row.item_code = data.item_code  # Set item_code from the item table

        # Save the indent after adding items to stock_in
        indent.save()

        # Fetch summary of balance by location and custom duty
        balance_list = frappe.db.sql("""
            SELECT location, 
                SUM(quantity) AS total_quantity, 
                SUM(custom_duty) AS total_custom_duty,
                COUNT(location) AS location_count
            FROM `tabStock Balance In`
            WHERE parent = %s
            GROUP BY location
        """, (self.purchase_indent), as_dict=True)

        # Fetch the parent document
        purchase_indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        # Initialize a dictionary to store the total quantities and custom duties by location
        location_data = {}

        for data in self.items:
            location = data.location
            if location not in location_data:
                location_data[location] = {
                    "total_quantity": 0,
                    "total_custom_duty": 0,
                    "item_codes": set()  # To track item_codes per location
                }
            location_data[location]["total_quantity"] += data.quantity
            location_data[location]["total_custom_duty"] += data.custom_duty
            location_data[location]["item_codes"].add(data.item_code)

        # Initialize a list to keep track of updated locations
        updated_locations = []

        for record in balance_list:
            # Divide total custom duty by the count of the location
            per_location_custom_duty = record.total_custom_duty / record.location_count if record.location_count else 0

            # Track updated locations
            updated_locations.append(record.location)

            # Check if location already exists in the child table
            row_exists = False
            for row in purchase_indent.stock_summary:
                if row.location == record.location:
                    # Update existing row
                    row.quantity = location_data[record.location]["total_quantity"]
                    row.custom_duty = per_location_custom_duty
                    row_exists = True
                    break

            # If row does not exist, create new row in stock_summary
            if not row_exists:
                # You can take the first item code from the set or handle multiple item_codes as per requirement
                purchase_indent.append("stock_summary", {
                    "location": record.location,
                    "quantity": location_data[record.location]["total_quantity"],
                    "custom_duty": per_location_custom_duty,
                    "item_code": list(location_data[record.location]["item_codes"])[0]  # Example: Taking the first item_code
                })

        # Save the purchase_indent after updating stock_summary
        purchase_indent.save()



        
                
    
    def on_cancel(self):
        indent = self.purchase_indent
        total_qty = self.total_quantity
        pending_quantity = frappe.db.get_value("Purchase Indent",indent,["pending_quantity","total_quantity"],as_dict=1)
    
        status = "Open"
        if pending_quantity.pending_quantity == 0:
            status = "Partly Complete"
        if pending_quantity.pending_quantity + self.total_quantity == pending_quantity.total_quantity:
            status = "Open"
        total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        frappe.db.set_value("Purchase Indent",indent,{"pending_quantity":total_pending_qty,"status":status})
        
        frappe.delete_doc("Stock Balance In",{"record_id":self.name})
        
        # delete record from purchase indent stock in table
        balance_in = frappe.db.get_all("Stock Balance In",fields=["*"], filters={"record_doc":self.name})
        for balance in balance_in:
            frappe.delete_doc("Stock Balance In",balance.name)



# @frappe.whitelist()
# def add_stock_in(docname):
#     current_doc = frappe.get_doc("Stock Clearance", docname)
    
#     purchase_indent = frappe.get_doc("Purchase Indent", current_doc.purchase_indent)
#     purchase_indent.reload()
#     print(f"Items in current_doc: {len(current_doc.items)}")

#     for item in current_doc.items:
#         print(f"Appending item: Location: {item.location}, Quantity: {item.quantity}, Custom Duty: {item.custom_duty}")
#         doc = frappe.new_doc("Stock Balance In")
#         doc.location =  item.location
#         doc.quantity = item.quantity
#         doc.custom_duty = item.custom_duty
#         doc.record_id = current_doc.name
#         doc.parentfield = "stock_in"
#         doc.parenttype = "Purchase Indent"
#         doc.parent = purchase_indent.name
		
#         doc.insert()
       
#     return purchase_indent.name

