import frappe


def before_save(doc,method):
    # for item in doc.items:
    #     if item.custom_validate_qty not None and item.custom_validate_qty and not 0:
        
    #         frappe.throw(f"Item quantity is not matched then validate quantity in row {item.idx}")

    for item in doc.items:
        if item.custom_validate_qty is not None and float(item.qty) > float(item.custom_validate_qty):
            frappe.throw(f"Item quantity is not matched. Please validate the quantity in row {item.idx}")


@frappe.whitelist()
def get_stock_summary(item, location, indent):
    # Fetch all matching records, ordered by creation
    stock_summary = frappe.db.get_all(
        "Stock Summary",
        filters={"item": item, "location": location, "parent": indent},
        fields=["custom_duty", "quantity"],
        order_by="creation desc"
    )
    # Return the first record with non-zero quantity or None
    return stock_summary
