import frappe

@frappe.whitelist(allow_guest=True)
def get_users_with_role(user_name):
    # Query the `User` table and join with `Has Role` to filter by role
    users = frappe.db.sql("""
        SELECT u.name
        FROM `tabUser` u
        JOIN `tabHas Role` r ON u.name = r.parent
        WHERE r.role = "System Manager"
        AND u.name = %s
    """, (user_name,), as_dict=True)
    return users