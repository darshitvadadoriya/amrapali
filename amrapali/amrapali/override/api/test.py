import frappe
import json
from frappe.utils.pdf import get_pdf
from frappe import _



# test pdf generation
@frappe.whitelist()
def test_pdf():
    pdf_content = frappe.get_print(
                "Sales Invoice",
                "SINV-25-00003",
                print_format="Tax Invoice",
            )
    
    pdf = get_pdf(pdf_content)
  
    file_data = frappe.get_doc(
                {
                    "doctype": "File",
                    "file_name": "dk.pdf",
                    "content": pdf,
                }
            )
    file_data.insert(ignore_permissions=True)
    frappe.db.commit()