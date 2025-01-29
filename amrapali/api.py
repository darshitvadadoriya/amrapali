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



# getting the company list when user click on company name
@frappe.whitelist()
def get_company_list():
    return frappe.get_all("Company", fields=["name"], ignore_permissions=True)


# get current logged in user role
@frappe.whitelist(allow_guest=1)
def roles(email):

    roles = []
    user = frappe.get_doc("User", email)
    
    user_roles = user.get("roles")

    for role in user_roles:
        roles.append(role.role)

    return roles
