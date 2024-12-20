# Copyright (c) 2024, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PurchaseIndent(Document):
	pass

@frappe.whitelist()
def get_supplier_emailids(supplier):
    email_list = []
    email_ids = frappe.get_all("Email Recipient",fields=["email"],filters={'parent':supplier})
    for i in email_ids:
        email_list.append(i.email)
    return email_ids