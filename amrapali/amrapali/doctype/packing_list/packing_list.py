# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe import _
import json
from frappe.model.document import Document
from frappe.utils import flt


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
                        "weightoz":data.weightoz,
						"status": "Active"
					})
                    doc.insert()
            else:
                error_message = ", ".join(error_lst) + " Already exists in Bar Numbers"
                frappe.throw(error_message)
        
        # if doctype is Sales Order
        if self.doctype_list == "Sales Order":
            for data in self.delivered_items:
                doc = frappe.get_doc("Bar Numbers",data.bar_no)
                doc.packing_list_created = 1
                doc.save()
              
        # if self.inout_ward == "Out Ward":
        #     so_weight = frappe.db.get_value("Sales Order",self.document,"custom_pending_weight",as_dict=1)
           
        #     if flt(self.total_bar_weight) > flt(so_weight.custom_total_weight):
        #         frappe.throw("Packing list weight exceeds the sales order weight.")
                
        #     if flt(self.total_bar_weight) < flt(so_weight.custom_total_weight):
        #         pending_qty = float(so_weight.custom_total_weight) - float(self.total_bar_weight)
        #         frappe.db.set_value("Sales Order",self.document,"custom_pending_weight",pending_qty)
        
        if self.inout_ward == "Out Ward":
            so_weight = frappe.db.get_value("Sales Order", self.document, "custom_pending_weight", as_dict=True)
    
            # Ensure the comparison is done with floating-point numbers for accurate weight comparison
            if flt(self.total_bar_weight) > flt(so_weight.custom_pending_weight):
                frappe.throw("Packing list weight exceeds the sales order weight.")
            
            elif flt(self.total_bar_weight) < flt(so_weight.custom_pending_weight):
                pending_qty = flt(so_weight.custom_pending_weight) - flt(self.total_bar_weight)
                frappe.db.set_value("Sales Order", self.document, "custom_pending_weight", pending_qty)

                
        

                
        
                
       
   

    # def on_cancel(self):
    #     if self.inout_ward == 'In Ward':
    #         for row in self.delivered_items:
    #             frappe.delete_doc("Bar Numbers",row.bar_no)
        
    #     if self.inout_ward == 'Out Ward':
    #         for row in self.delivered_items:
    #             frappe.db.set_value("Bar Numbers",row.bar_no,"packing_list_created",0)
            
    #         so_weight = frappe.db.get_value("Sales Order",self.document,"custom_total_weight",as_dict=1)
    #         weight = so_weight.custom_pending_weight + self.total_bar_weight
    #         frappe.db.set_value("Sales Order",self.document,"custom_pending_weight",weight)
    
    def on_cancel(self):
        weight_summary = {}

        if self.inout_ward == 'In Ward':
            for row in self.delivered_items:
                frappe.delete_doc("Bar Numbers", row.bar_no)

        if self.inout_ward == 'Out Ward':
            for row in self.delivered_items:
                frappe.db.set_value("Bar Numbers", row.bar_no, "packing_list_created", 0)

                item_code = row.item_code
                weight = flt(row.weight)  # Ensure weight is treated as a float

                weight_summary[item_code] = weight_summary.get(item_code, 0) + weight

            for item_code, weight in weight_summary.items():
                sales_order_items = frappe.get_all(
                    "Sales Order Item",
                    filters={"parent": self.document, "item_code": item_code},
                    fields=["name", "custom_pending_weight"]
                )

                for sales_order_item in sales_order_items:
                    new_weight = flt(sales_order_item.custom_pending_weight) + weight  # Ensure custom_pending_weight is also treated as a float
                    frappe.db.set_value("Sales Order Item", sales_order_item.name, "custom_pending_weight", new_weight)

            # Update custom_pending_weight in Sales Order
            so_weight = frappe.db.get_value("Sales Order", self.document, "custom_pending_weight", as_dict=True)
            new_so_weight = flt(so_weight.custom_pending_weight) + flt(self.total_bar_weight)  # Ensure the weights are treated as floats
            frappe.db.set_value("Sales Order", self.document, "custom_pending_weight", new_so_weight)

        frappe.db.commit()



    
    def on_submit(self):
       if self.inout_ward == "Out Ward":
            weight_summary = {}

            # Group delivered items by item_code and sum their weights
            for item in self.delivered_items:
                item_code = item.item_code
                weight = item.weight
                weight_summary[item_code] = weight_summary.get(item_code, 0) + weight

            for item_code, weight in weight_summary.items():
                sales_order_items = frappe.get_all(
                    "Sales Order Item",
                    filters={"parent": self.document, "item_code": item_code},
                    fields=["name", "custom_pending_weight"]
                )

                # **NEW CODE: Calculate total pending weight for validation**
                total_custom_pending_weight = sum(item.custom_pending_weight for item in sales_order_items)

                # **NEW CODE: Validation to prevent over-delivery**
                if weight > total_custom_pending_weight:
                    frappe.throw(
                        _(f"Total delivered weight ({weight}) for Item {item_code} exceeds the pending weight ({total_custom_pending_weight}) in Sales Order.")
                    )

                # Update custom_pending_weight in Sales Order Items
                for sales_order_item in sales_order_items:
                    new_weight = max(0, sales_order_item.custom_pending_weight - weight)
                    frappe.db.set_value("Sales Order Item", sales_order_item.name, "custom_pending_weight", new_weight)

            # Recalculate total pending weight for the Sales Order
            total_pending_weight = sum(item.custom_pending_weight for item in frappe.get_all(
                "Sales Order Item",
                filters={"parent": self.document},
                fields=["custom_pending_weight"]
            ))

            frappe.db.set_value("Sales Order", self.document, "custom_pending_weight", total_pending_weight)
            frappe.db.commit()

        

    
    
    def validate(self):
         
        
        
        row_no_lst = []
        unknown_lst = []
        try:
        
            if self.doctype_list == "Sales Order":
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
                
            if self.doctype_list == "Sales Order":
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
        delivery_note_data = frappe.get_doc("Sales Order",delivery_id,as_dict=1)
        return delivery_note_data
    
    
@frappe.whitelist()
def get_doc_data(doctype,doc_name):
    return frappe.get_doc(doctype,doc_name)


# get used sales order from packing list link field
# @frappe.whitelist()
# def get_used_so():
#     used_delivery = []
#     delivery = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"Out Ward","docstatus": ["!=", 2]})
#     for data in delivery:
#         used_delivery.append(data["document"])
#     return used_delivery





# get used purchaser order id from packing list link field
@frappe.whitelist()
def get_used_purchase():
    used_purchase = []
    purchase = frappe.get_list("Packing List",fields=["document"],filters={"inout_ward":"In Ward","docstatus": ["!=", 2]})
    for data in purchase:
        used_purchase.append(data["document"])
    return used_purchase

@frappe.whitelist()
def get_packing_list(name):
    packing_list = frappe.get_doc("Sales Order",name,as_dict=1)
    return packing_list



@frappe.whitelist()
def get_indent(item_code_list):
    item_code_list = json.loads(item_code_list)
    indent_list = frappe.get_list("Bar Numbers",fields=["purchase_indent"],filters={"status":"Active","item_code":["in",item_code_list],"packing_list_created":0})
    flat_list = [item["purchase_indent"] for item in indent_list]
    return flat_list