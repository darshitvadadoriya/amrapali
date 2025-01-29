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




# set or create company permission 
@frappe.whitelist()
def manage_user_permission(company, user):
   

    # Get the existing User Permission
    doc_name = frappe.db.get_value('User Permission', {'user': user, 'allow': 'Company'}, ['name'])

    # check role is Admin or not
    is_admin = 'Admin' in [role.role for role in frappe.get_all('Has Role', filters={'parent': user}, fields=['role'])]

    if is_admin:
        frappe.errprint(f"User {user} has Administrator role. Skipping User Permission creation.")
    else:
        if doc_name:
            # if user permission is exists then 
            frappe.db.set_value("User Permission", doc_name, 'for_value', company)
        else:
            # if permission is not exists then create new
            new_doc = frappe.new_doc("User Permission")
            new_doc.user = user
            new_doc.allow = "Company"
            new_doc.for_value = company
            new_doc.insert()

    return "User permission processed successfully"
