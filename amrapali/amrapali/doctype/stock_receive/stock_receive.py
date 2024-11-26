# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockReceive(Document):
    def on_cancel(self):
        stock_issue = self.stock_issue
        total_qty = self.total_quantity
        pending_quantity = frappe.db.get_value("Stock Issue",stock_issue,["pending_quantity","total_quantity"],as_dict=1)
    
        
        total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        frappe.db.set_value("Stock Issue",stock_issue,"pending_quantity",total_pending_qty)
