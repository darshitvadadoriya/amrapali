import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cint, flt



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




# create delivery note
@frappe.whitelist()
def make_delivery_note(source_name, target_doc=None):
	def set_missing_values(source, target):
		target.run_method("set_missing_values")
		target.run_method("set_po_nos")
		target.run_method("calculate_taxes_and_totals")

	# def update_item(source_doc, target_doc, source_parent):
	# 	target_doc.qty = flt(source_doc.qty) - flt(source_doc.delivered_qty)
	# 	target_doc.stock_qty = target_doc.qty * flt(source_doc.conversion_factor)

	# 	target_doc.base_amount = target_doc.qty * flt(source_doc.base_rate)
	# 	target_doc.amount = target_doc.qty * flt(source_doc.rate)

	doclist = get_mapped_doc(
		"Delivery Note",
		source_name,
		{
			"Delivery Note": {"doctype": "Release Order"},
			"Delivery Note Item": {
				"doctype": "Delivery Note Item",
				"field_map": {
					"name": "si_detail",
					"parent": "custom_against_delivery_order",
					"serial_no": "serial_no",
					"cost_center": "cost_center",
				},
				# "postprocess": update_item,

			},
			"Sales Taxes and Charges": {"doctype": "Sales Taxes and Charges", "reset_value": True},
			"Sales Team": {
				"doctype": "Sales Team",
				"field_map": {"incentives": "incentives"},
				"add_if_empty": True,
			},
		},
		target_doc,
		set_missing_values,
	)

	return doclist