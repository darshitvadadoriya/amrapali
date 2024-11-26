# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StockIssue(Document):
    def on_cancel(self):
        in_ward = self.in_ward
        total_qty = self.total_quantity
        pending_quantity = frappe.db.get_value("Purchase InWard",in_ward,["pending_quantity","total_quantity"],as_dict=1)
    
        status = "Open"
        if pending_quantity.pending_quantity == 0:
            status = "Partly Complete"
        if pending_quantity.pending_quantity + self.total_quantity == pending_quantity.total_quantity:
            status = "Open"
        total_pending_qty = total_qty + pending_quantity.pending_quantity
        
        frappe.db.set_value("Purchase InWard",in_ward,{"pending_quantity":total_pending_qty,"status":status})
