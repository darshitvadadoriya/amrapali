import frappe
import json
from frappe import render_template
from frappe.utils.pdf import get_pdf
from frappe.utils.print_format import report_to_pdf
from frappe import _

from frappe.desk.query_report import run

@frappe.whitelist()
def hello_world():

    temp = run(report_name = "Accounts Receivable")
    return temp







def get_recipient_email(recipient_doctype, recipient_name, email_field='email_id'):
    """
    Get recipient email from any doctype
    
    Args:
        recipient_doctype (str): DocType of the recipient (e.g., 'Customer', 'Vaulting Agent')
        recipient_name (str): Name of the recipient record
        email_field (str): Field name containing the email address
    """
    if not recipient_name:
        frappe.throw(f"Recipient name not provided for {recipient_doctype}")
        
    email = frappe.db.get_value(recipient_doctype, recipient_name, email_field)
    if not email:
        frappe.throw(f"Email not found for {recipient_doctype}: {recipient_name}")
    return email

def get_recipients_hashmap(recipient_doctype, email_field='email_id'):
    """
    Retrieves a hashmap of recipient names and their associated email IDs
    """
    recipient_list = frappe.db.get_all(
        doctype=recipient_doctype,
        fields=['name', email_field]
    )
    return {item['name']: {'name': item['name'], 'email_id': item[email_field]} 
            for item in recipient_list}

def get_docs_array_from_list(list):
    """Extracts document names from the input list"""
    return [item.get('name') for item in list]

def get_docs_and_customers(docs, doctype, recipient_field='customer'):
    """Fetches documents with recipient field"""
    if not docs:
        return []
    
    return frappe.db.get_all(
        doctype=doctype,
        fields=['name', recipient_field],
        filters={'name': ['in', docs]}
    )

def get_dn_and_customers(docs, doctype, recipient_field='customer'):
    """Fetches delivery notes with recipient field and packing list"""
    if not docs:
        return []
    
    return frappe.db.get_all(
        doctype=doctype,
        fields=['name', recipient_field, 'custom_pack_list'],
        filters={'name': ['in', docs]}
    )

@frappe.whitelist()
def sendmail(reference_doctype, reference_name, recipients, msg, subject, attachments=None):
    """Helper function to send an email"""
    email_args = {
        'recipients': recipients,
        'message': msg,
        'subject': subject,
        'reference_doctype': reference_doctype,
        'reference_name': reference_name
    }

    if attachments:
        email_args['attachments'] = attachments

    frappe.enqueue(
        method=frappe.sendmail,
        queue='short',
        timeout=300,
        **email_args
    )

    return f"Email queued to {recipients} with subject '{subject}'"

@frappe.whitelist()
def send_bulk_mail_delivery_order(list, doctype, recipient_doctype='Customer', recipient_field='customer', email_field='email_id'):
    """Send bulk delivery order emails"""
    if isinstance(list, str):
        try:
            list = json.loads(list)
        except json.JSONDecodeError as e:
            frappe.throw(f"Invalid JSON data: {e}")

    delivery_notes = get_docs_array_from_list(list)
    deliver_notes_list = get_dn_and_customers(
        docs=delivery_notes, 
        doctype='Delivery Note',
        recipient_field=recipient_field
    )
    recipient_hashmap = get_recipients_hashmap(recipient_doctype, email_field)

    default_letterhead = frappe.db.get_value('Letter Head', {'is_default': 1}, 'name')

    for item in deliver_notes_list:
        recipient_name = item.get(recipient_field)
        data = recipient_hashmap.get(recipient_name)
        
        if not data:
            frappe.log_error(f"Recipient {recipient_name} not found in {recipient_doctype}")
            continue

        attachments = []
        
        # Add main document attachment
        attachment = frappe.attach_print(
            doctype=doctype,
            name=item.get('name'),
            file_name=item.get('name'),
            letterhead = default_letterhead
        )
        attachments.append(attachment)
        
        # Add packing list if exists
        if item.get('custom_pack_list'):

            pack_list_attachment = frappe.attach_print(
                doctype='Packing List',
                name=item.get('custom_pack_list'),
                file_name=item.get('custom_pack_list'),
                letterhead = default_letterhead
            )

            attachments.append(pack_list_attachment)

        sendmail(
            reference_doctype=doctype,
            reference_name=item.get('name'),
            recipients=data.get('email_id'),
            msg=f'Hello, please find the attached {doctype}.',
            subject=doctype,
            attachments=attachments
        )

@frappe.whitelist()
def send_bulk_mail(list, doctype, recipient_doctype='Customer', recipient_field='customer', email_field='email_id'):
    """Send bulk emails for any document type"""
    if isinstance(list, str):
        try:
            list = json.loads(list)
        except json.JSONDecodeError as e:
            frappe.throw(f"Invalid JSON data: {e}")

    docs = get_docs_array_from_list(list)
    doc_list = get_docs_and_customers(
        docs=docs, 
        doctype=doctype,
        recipient_field=recipient_field
    )
    recipient_hashmap = get_recipients_hashmap(recipient_doctype, email_field)

    for item in doc_list:
        recipient_name = item.get(recipient_field)
        data = recipient_hashmap.get(recipient_name)
        
        if not data:
            frappe.log_error(f"Recipient {recipient_name} not found in {recipient_doctype}")
            continue

        attachment = frappe.attach_print(
            doctype=doctype,
            name=item.get('name'),
            file_name=item.get('name')
        )

        sendmail(
            reference_doctype=doctype,
            reference_name=item.get('name'),
            recipients=data.get('email_id'),
            msg=f'Hello, please find the attached {doctype}.',
            subject=doctype,
            attachments=[attachment]
        )

@frappe.whitelist()
def send_single_mail(parent_doctype, parent_name, data, recipient_doctype, recipient_field, msg, subject, attachments):
    """Send single email with attachments"""
    try:
        data = json.loads(data)
    except json.JSONDecodeError as e:
        frappe.throw(f"Invalid JSON data: {e}")

    attachment_list = []
    doc = frappe.get_doc(parent_doctype, parent_name)

    # Get recipient's email
    recipient_name = doc.get(recipient_field)
    if not recipient_name:
        frappe.throw(f"Recipient field '{recipient_field}' is not set in {parent_doctype}: {parent_name}")

    recipients = get_recipient_email(recipient_doctype, recipient_name)

    # Handle attachments
    if frappe.utils.cstr(attachments).lower() == 'true':
        for value in data:
            reference_name = value.get("reference_name")
            reference_doctype = value.get("reference_doctype")

            if reference_name and reference_doctype:
                try:
                    attachment = frappe.attach_print(
                        doctype=reference_doctype,
                        name=reference_name,
                        file_name=reference_name
                    )
                    attachment_list.append(attachment)
                except Exception as e:
                    error_msg = f"Error attaching print for {reference_doctype}: {reference_name} - {str(e)}"
                    frappe.log_error(error_msg)
                    frappe.throw(f"Failed to generate attachment for {reference_doctype}: {reference_name}")

    sendmail(
        reference_doctype=parent_doctype,
        reference_name=parent_name,
        recipients=recipients,
        msg=msg,
        subject=subject,
        attachments=attachment_list
    )
    
    
    
    
    
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