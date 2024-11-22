# # Copyright (c) 2024, Sanskar Technolab and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.utils import today, getdate
# from frappe.utils import flt
# from frappe.model.document import Document


# class TDSDiduction(Document):
# 	pass



# @frappe.whitelist()
# def get_tds_details(tax_category_name):
#     print("tax_category_name")
#     print("\n\n\n\n\n\n\n\n\n\n")
#     """
#     Fetch TDS rate and single_threshold from Tax Withholding Category.
#     Check if today's date is between from_date and to_date.

#     :param tax_category_name: Name of the Tax Withholding Category
#     :return: Dictionary with TDS rate and single_threshold or an error message
#     """
#     today_date = getdate(today())
    
#     # Fetch Tax Withholding Category details
#     tax_details = frappe.db.sql("""
#         SELECT tax_withholding_rate, single_threshold, from_date, to_date
#         FROM `tabTax Withholding Rate`
#         WHERE parent = %s
#     """, (tax_category_name), as_dict=True)
    
#     if not tax_details:
#         return {"error": f"Tax Withholding Category '{tax_category_name}' not found."}

#     # Check date range
#     tax_detail = tax_details[0]
#     from_date = getdate(tax_detail.get('from_date'))
#     to_date = getdate(tax_detail.get('to_date'))
    
#     if from_date <= today_date <= to_date:
#         return {
#             "tax_withholding_rate": tax_detail.get('tax_withholding_rate'),
#             "single_threshold": tax_detail.get('single_threshold'),
#             "message": "Today's date is within the valid date range."
#         }
#     else:
#         return {
#             "tds_rate": tax_detail.get('tax_withholding_rate'),
#             "single_threshold": tax_detail.get('single_threshold'),
#             "message": "Today's date is outside the valid date range."
#         }



# @frappe.whitelist()
# def get_sale_invoice():
#     # invoice_data = frappe.db.get_all("Sales Invoice",fields=["name","customer","total","grand_total"],filters={"status",["in",["Submitted","Paid","Partly Paid","Unpaid","Overdue"]]},as_dict=1)
#     invoice_data = frappe.db.get_all(
#     "Sales Invoice",
#     fields=["name", "customer", "total", "grand_total","status"],
#     filters={"status": ["in", ["Submitted", "Paid", "Partly Paid", "Unpaid", "Overdue"]]},
# )

#     return invoice_data


# @frappe.whitelist()
# def create_journal_entry(customer_name, tds_value, sales_invoice,company):
#     try:
        
#         # Create Journal Entry document
#         je = frappe.get_doc({
#             "doctype": "Journal Entry",
#             "company":company,
#             "posting_date":frappe.utils.nowdate(),
#             "accounts": [
#                 {
#                     "account": "TDS Payable - AD",
#                     "debit_in_account_currency": flt(tds_value),
#                     "debit": flt(tds_value),
#                     "account_currency": "INR",
#                 },
#                 {
#                     "account": "Debtors - AD",
#                     "party_type": "Customer",
#                     "party": customer_name,
#                     "credit_in_account_currency": flt(tds_value),
#                     "credit": flt(tds_value),
#                     "account_currency": "INR",
#                 },
#             ],
#             "custom_sales_invoice": sales_invoice,
#         })


#         # Insert and save the document
#         je.insert(ignore_permissions=True)
#         je.submit()  # Submit the document
        

#         return {"status": "success", "message": "Journal Entry created", "name": je.name}

#     except Exception as e:
        
#         return {"status": "error", "message": str(e)}
