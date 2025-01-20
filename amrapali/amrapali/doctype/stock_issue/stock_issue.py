# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockIssue(Document):
    def on_submit(self):
        indent = frappe.get_doc("Purchase Indent", self.purchase_indent)

        for data in self.items:
            row = indent.append('stock_out', {})
            row.location = self.location
            row.custom_duty = data.custom_duty
            row.quantity = data.quantity
            row.record_id = data.name
            row.record_doc = data.parent
            row.item_code = data.item_code  
            row.premium = data.premium
        indent.save()

    
    def on_cancel(self):
        stock_clearance = self.stock_clearance
        total_qty = self.total_quantity
        # pending_quantity = frappe.db.get_value("Stock Clearance",stock_clearance,["pending_quantity","total_quantity"],as_dict=1)
    
        # status = "Open"
        # if pending_quantity.pending_quantity == 0:
        #     status = "Partly Complete"
        # if pending_quantity.pending_quantity + self.total_quantity == pending_quantity.total_quantity:
        #     status = "Open"
        # total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        # frappe.db.set_value("Stock Clearance",stock_clearance,{"pending_quantity":total_pending_qty,"status":status})

        # delete record from purchase indent stock in table
        balance_in = frappe.db.get_all("Stock Balance Out",fields=["*"], filters={"record_doc":self.name})
        for balance in balance_in:
            frappe.delete_doc("Stock Balance Out",balance.name)
         
        
     
    
