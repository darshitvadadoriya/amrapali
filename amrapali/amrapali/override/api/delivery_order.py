import frappe

def on_submit(doc,method):
    # on submit to status set delivered in bar numbers
    if doc.custom_pack_list:
        doc = frappe.get_doc("Packing List",doc.custom_pack_list)        
        for item in doc.delivered_items:
            frappe.db.set_value("Bar Numbers",item.bar_no,"status","Delivered")
    
def on_cancel(doc,method):
    # on cancel to status set Active in bar numbers
    if doc.custom_pack_list:
        doc = frappe.get_doc("Packing List",doc.custom_pack_list)        
        for item in doc.delivered_items:
            frappe.db.set_value("Bar Numbers",item.bar_no,"status","Active")

