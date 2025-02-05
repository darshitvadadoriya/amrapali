# Copyright (c) 2025, Sanskar Technolab and contributors
# For license information, please see license.txt

import frappe
from frappe.desk.query_report import run
from frappe.model.document import Document


class ReleaseOrder(Document):
	pass



@frappe.whitelist()
def get_report(company, customer):
    report = run(
        report_name='Accounts Receivable',
        filters={
            'company': company,
            'party_type': 'customer',
            'party': [customer]
        },
        ignore_prepared_report=True
    )

    report_data = report.get('result', [])
    report_hashmap = {}

    for item in report_data:
        if isinstance(item, dict):
            party = item.get('party')
            if party:
                report_hashmap.setdefault(party, []).append(item)
    
    return report_hashmap

# get credit limit from customer master
@frappe.whitelist()
def get_credit_limit(customer, company):
    credit_limit = frappe.db.get_value(
        "Credit Limit",
        {"parent": customer, "company": company},
        "credit_limit"
    )
    return credit_limit
