import frappe

def before_save(doc, method):
    for item in doc.items:
        if item.custom_validate_qty is not None and float(item.qty) > float(item.custom_validate_qty):
            frappe.throw(f"Item quantity is not matched. Please validate the quantity in row {item.idx}")

def on_submit(doc, method):
    for item in doc.items:
        # Get the name of the Stock Summary document
        if item.custom_indent_reference_id:
            qty = frappe.get_value(
                "Stock Summary",
                item.custom_indent_reference_id,
                "quantity",
                as_dict=1
            )
            # Update the quantity in Stock Summary
            frappe.db.set_value(
                "Stock Summary",
                item.custom_indent_reference_id,
                "quantity",
                float(qty.quantity) - float(item.qty)
            )
        
        
def on_cancel(doc, method):
    for item in doc.items:
        if item.custom_indent_reference_id:
            qty = frappe.get_value(
                "Stock Summary",
                item.custom_indent_reference_id,
                "quantity",
                as_dict=1
            )
            # Update the quantity in Stock Summary
            frappe.db.set_value(
                "Stock Summary",
                item.custom_indent_reference_id,
                "quantity",
                float(qty.quantity) + float(item.qty)
            )

@frappe.whitelist()
def get_stock_summary(item, location, indent):
    # Fetch all matching records, ordered by creation
    stock_summary = frappe.db.get_all(
        "Stock Summary",
        filters={"item_code": item, "location": location, "parent": indent},
        fields=["custom_duty", "quantity", "name"],
        order_by="creation desc"
    )

    # Return the first record with non-zero quantity or None
    return stock_summary
