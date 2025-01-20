
import frappe

@frappe.whitelist()
def get_purchase_indent_item():

    indent = frappe.db.get(
        'Purchase Indent Item',
        filters= {
            'parent': 'PIN-01-2025-0016'
        }
    )

    return indent

@frappe.whitelist()
def sendmail(reference_doctype,reference_name, recipients, msg, subject):

    
    email_args = {
        'recipients': recipients,
        'message': msg,
        'subject': subject,
        'reference_doctype': reference_doctype,
        'reference_name': reference_doctype
    }

    attachments = [frappe.attach_print(reference_doctype, reference_name, file_name = reference_name)]



    if attachments:
        email_args['attachments'] = attachments

    frappe.enqueue(method = frappe.sendmail, queue = 'short', timeout = 300, **email_args)