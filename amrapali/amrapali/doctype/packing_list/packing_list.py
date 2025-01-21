# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PackingList(Document):
    def before_submit(self):
        
        match_qty = []
        
        if self.doctype_list == "Purchase Receipt":
            error_lst = []
            for data in self.delivered_items:
                doc_check = frappe.db.exists("Bar Numbers", {"bar_no": data.bar_no})
                
                if doc_check:
                    error_lst.append(data.bar_no)
            if not error_lst:
                for data in self.delivered_items:
                    doc = frappe.get_doc({
						"doctype": "Bar Numbers",
						"bar_no": data.bar_no,
                        'purchase_indent': self.indent,
						"item_code": data.item_code,
						"warehouse": data.warehouse,
						"weight": data.weight,
						"status": "Active"
					})
                    doc.insert()
            else:
                error_message = ", ".join(error_lst) + " Already exists in Bar Numbers"
                frappe.throw(error_message)
        
        # if doctype is delivery note
        if self.doctype_list == "Delivery Note":
            for data in self.delivered_items:
                doc = frappe.get_doc("Bar Numbers",data.bar_no)
                doc.status = "Delivered"
                doc.save()
                
       
   

    def on_cancel(self):
        if self.inout_ward == 'In Ward':
            for row in self.delivered_items:
                frappe.delete_doc("Bar Numbers",row.bar_no)
        
        if self.inout_ward == 'Out Ward':
            for row in self.delivered_items:
                frappe.db.set_value("Bar Numbers",row.bar_no,"status","Active")

        
    
    
    def validate(self):
        row_no_lst = []
        unknown_lst = []
        try:
        
            if self.doctype_list == "Delivery Note":
                inactive_bar_numbers = []
                for data in self.delivered_items:
                    print(data.bar_no)
                    if not data.bar_no:
                        row_no_lst.append(str(data.idx))
                    
                    if data.bar_no:
                        dl_doc = get_delivery_note(self.document)
                        doc = bar_number_data(data.bar_no)
                      
                        if doc.status == "Active":
                            data.item_code = doc.item_code
                            data.weight = doc.weight
                            data.warehouse = doc.warehouse
                        else:
                            inactive_bar_numbers.append(doc.name)
                            
                        for item_data in dl_doc.items:
                            if item_data.item_code != data.item_code:
                                unknown_lst.append(data.item_code)

                if inactive_bar_numbers:
                    error_message = ", ".join(inactive_bar_numbers) + " - These bar numbers are inactive or delivered"
                    frappe.throw(error_message)
          
                                
                    
                if row_no_lst:
                    error_message = ", ".join(row_no_lst) + " - This row have not bar numbers"
                    frappe.throw(error_message)
            
                    
                    
            # set total qty in total quantity field
            if self.doctype_list == "Purchase Receipt":
                total_qty = sum(item.weight for item in self.delivered_items)
                self.total_bar_weight = total_qty
                self.total_bars = max(item.idx for item in self.delivered_items)
                
            if self.doctype_list == "Delivery Note":
                total_qty = sum(item.weight for item in self.delivered_items)
                self.total_bar_weight = total_qty
                # count child table total rows and set in bars
                self.total_bars = max(item.idx for item in self.delivered_items)
        except Exception as e:
            print(e)
  
        
def bar_number_data(bar_no):
        bar_number_data = frappe.get_doc("Bar Numbers",bar_no)
        return bar_number_data
    
def get_delivery_note(delivery_id):
        delivery_note_data = frappe.get_doc("Delivery Note",delivery_id,as_dict=1)
        return delivery_note_data
    
    
@frappe.whitelist()
def get_doc_data(doctype,doc_name):
    print(doctype,doc_name)
    print("\n\n\n\n\n\n\n\n")
    return frappe.get_doc(doctype,doc_name)


# get used delibery noteid from packing list link field
@frappe.whitelist()
def get_used_delivery():
    used_delivery = []
    delivery = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"Out Ward"})
    for data in delivery:
        used_delivery.append(data["document"])
    return used_delivery


# get used purchaser order id from packing list link field
@frappe.whitelist()
def get_used_purchase():
    used_purchase = []
    purchase = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"In Ward","docstatus": ["!=", "Cancelled"]})
    for data in purchase:
        used_purchase.append(data["document"])
    return used_purchase

@frappe.whitelist()
def get_packing_list(name):
    packing_list = frappe.get_doc("Delivery Note",name,as_dict=1)
    return packing_list