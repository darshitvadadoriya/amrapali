import frappe
import json

@frappe.whitelist()
def send_bulk_mail_delivery_order(list, doctype):
    # Convert list from JSON string if needed.
    if isinstance(list, str):
        try:
            list = json.loads(list)
        except json.JSONDecodeError as e:
            frappe.throw(f"Invalid JSON data: {e}")

    # Get invoice names from the list.
    delivery_notes = get_docs_array_from_list(list)

    # Fetch invoice and customer details.
    deliver_notes_list = get_dn_and_customers(docs=delivery_notes, doctype = 'Delivery Note')

    # Get customer email details.
    customer_hashmap = get_customers_emails()

    # Iterate through the list and prepare attachments.
    for item in deliver_notes_list:
        # Fetch customer details using the customer name.
        data = customer_hashmap.get(item.get('customer'))

        attachments = []
        # Prepare the attachment for the email.
        attachment = frappe.attach_print(
            doctype=doctype,
            name=item.get('name'),
            file_name=item.get('name')
        )

        attachments.append(attachment)
        
        if item.get('custom_pack_list'):
            attachment = frappe.attach_print(
                doctype='Packing List',
                name = item.get('custom_pack_list'),
                file_name = item.get('custom_pack_list')
            )

        attachments.append(attachment)


        # Send the email.
        result = sendmail(
            reference_doctype=doctype,
            reference_name=item.get('name'),
            recipients=data.get('email_id'),
            msg='Hello, please find the attached Delivery Note.',
            subject='Delivery Note',
            attachments=attachments,
        )


# Extracts a list of invoice names from the input list of dictionaries.
def get_docs_array_from_list(list):
    docs = []

    for item in list:
        docs.append(item.get('name'))  # Add the 'name' key from each dictionary.

    return docs


# Fetches invoice and customer details for the provided invoice names.
def get_docs_and_customers(docs, doctype):
    if not docs:
        return {}

    doc_list = frappe.db.get_all(
        doctype= doctype,
        fields=['name', 'customer'],  # Fetch invoice name and customer name.
        filters={'name': ['in', docs]}  # Filter invoices by the given names.
    )

    return doc_list

    # Fetches invoice and customer details for the provided invoice names.
def get_dn_and_customers(docs, doctype):
    if not docs:
        return {}

    doc_list = frappe.db.get_all(
        doctype= doctype,
        fields=['name', 'customer','custom_pack_list'],  # Fetch invoice name and customer name.
        filters={'name': ['in', docs]}  # Filter invoices by the given names.
    )

    return doc_list


# Retrieves a hashmap of customer names and their associated email IDs.
def get_customers_emails():
    customer_list = frappe.db.get_all(
        doctype='Customer',
        fields=['name', 'email_id']  # Fetch customer names and email IDs.
    )

    # Create a hashmap with customer names as keys.
    customer_hash_map = {item['name']: item for item in customer_list}

    return customer_hash_map


# Sends bulk emails for the provided list of invoices and attaches PDFs.
@frappe.whitelist()
def send_bulk_mail(list, doctype):
    # Convert list from JSON string if needed.
    if isinstance(list, str):
        try:
            list = json.loads(list)
        except json.JSONDecodeError as e:
            frappe.throw(f"Invalid JSON data: {e}")

    # Get invoice names from the list.
    invoices = get_docs_array_from_list(list)

    # Fetch invoice and customer details.
    invoice_list = get_docs_and_customers(docs=invoices, doctype= 'Sales Invoice')

    # Get customer email details.
    customer_hashmap = get_customers_emails()

    # Iterate through the list and prepare attachments.
    for item in invoice_list:
        # Fetch customer details using the customer name.
        data = customer_hashmap.get(item.get('customer'))

        # Prepare the attachment for the email.
        attachment = frappe.attach_print(
            doctype=doctype,
            name=item.get('name'),
            file_name=item.get('name')
        )

        # Send the email.
        result = sendmail(
            reference_doctype=doctype,
            reference_name=item.get('name'),
            recipients=data.get('email_id'),
            msg='Hello, please find the attached sales invoices.',
            subject='Sales Invoices',
            attachments=[attachment],
        )


# Helper function to send an email with the provided details.
@frappe.whitelist()
def sendmail(reference_doctype, reference_name, recipients, msg, subject, attachments=None):
    # Prepare email arguments.
    email_args = {
        'recipients': recipients,
        'message': msg,
        'subject': subject,
        'reference_doctype': reference_doctype,
        'reference_name': reference_name  # Use actual reference_name here.
    }

    # Add attachments if available.
    if attachments:
        email_args['attachments'] = attachments

    # Enqueue email to be sent asynchronously.
    frappe.enqueue(
        method=frappe.sendmail,
        queue='short',
        timeout=300,
        **email_args
    )

    return f"Email queued to {recipients} with subject '{subject}'"
