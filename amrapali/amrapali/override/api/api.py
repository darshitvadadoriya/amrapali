import frappe
import json
from frappe import render_template
from frappe.utils.pdf import get_pdf
from frappe.utils.print_format import report_to_pdf
from frappe import _
from frappe.utils import format_date
from frappe.desk.query_report import run

@frappe.whitelist()
def hello():
    
    hash = get_recipients_hashmap(recipient_doctype= 'Customer')

    return hash

@frappe.whitelist()
def get_report():
    # Run the report
    report = run(
        report_name='Accounts Receivable',
        filters={'Company': 'AMRAPALI INDUSTRIES LIMITED-Ahmedabad'}
    )
    
    # Get the result from the report
    report = report.get('result')

    # Initialize the hashmap
    report_hashmap = {}

    # Iterate over the report items
    for item in report:
        # Check if item is a dictionary
        if isinstance(item, dict):
            party = item.get('party')  # Assuming 'party' is the key for the customer name
            
            # Check if the party already exists in the hashmap
            if party in report_hashmap:
                # Append the item to the existing list for the party
                report_hashmap[party].append(item)
            else:
                # Initialize the list for the party if it doesn't exist and append the item
                report_hashmap[party] = [item]
    
    return report_hashmap

@frappe.whitelist()
def send_report_mail_1():
    report_hashmap = get_report()
    recipients_hashmap = get_recipients_hashmap(recipient_doctype = 'Customer')

    for key, value in report_hashmap.items():
        customer = key
        report = value
        pdf = print_report(report=report, customer=customer)
        send_report_mail_2(customer=customer, pdf=pdf, recipients=[(recipients_hashmap.get(customer)).get('email_id')])

def send_report_mail_2(customer, pdf, recipients):
    
    html_message = f"""
            <html>
                <body>
                    <p>Please find attached the document.</p>
                    <p>If you have any questions or need assistance, feel free to reach out.</p>
                    <p>Thank you for your business.</p>
                </body>
            </html>
            """

    email_args = {
        'recipients': recipients,
        'message': html_message,
        'subject': 'subject',
        'attachments': [{'fname': 'hello.pdf', 'fcontent': pdf}]
    }
    
    user_mail = get_user_mail()

    if user_mail:
        email_args['sender'] = user_mail

    frappe.enqueue(
        method=frappe.sendmail,
        queue='short',
        timeout=300,
        **email_args
    )

@frappe.whitelist()
def print_report(report, customer):
    """
    Generate a PDF report for Accounts Receivable with specific filters.
    Returns a PDF containing formatted data in a table structure.
    """
    try:
        # Extract rows from report result
        rows = report

        # Define the columns to include in the report with total calculation options
        labels = [
            {
                "fieldname": "serial_no",
                "label": "S.No.",
                "width": "5%",
                "calculate_total": False,
                "alignment": "left"
            },
            {
                "fieldname": "posting_date",
                "label": "Posting Date",
                "width": "15%",
                "calculate_total": False,
                "alignment": "center"
            },
            {
                "fieldname": "due_date",
                "label": "Due Date",
                "width": "15%",
                "calculate_total": False,
                "alignment": "center"
            },
            {
                "fieldname": "invoiced_in_account_currency",
                "label": "Invoice Amount",
                "width": "15%",
                "calculate_total": True,
                "number_format": True,
                "alignment": "right"
            },
            {
                "fieldname": "paid_in_account_currency",
                "label": "Paid Amount",
                "width": "15%",
                "calculate_total": True,
                "number_format": True,
                "alignment": "right"
            },
            {
                "fieldname": "outstanding_in_account_currency",
                "label": "Outstanding Amount",
                "width": "15%",
                "calculate_total": True,
                "number_format": True,
                "alignment": "right"
            }
        ]

        # Build the HTML table with styling
        html = f'''
        <style>
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                table-layout: fixed;
            }}
            th, td {{
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
                word-wrap: break-word;
            }}
            th {{
                background-color: #f8f8f8;
                font-weight: bold;
            }}
            td.numeric {{
                text-align: right;
            }}
            .total-row {{
                font-weight: bold;
                background-color: #f0f0f0;
            }}
            .currency::before {{
                content: "₹ ";
            }}
            .customer-header {{
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
                font-family: Arial, sans-serif;
            }}
        </style>
        <h3>Outstanding</h3>
        <div class="customer-header">Customer: {customer}</div>
        <div class="report-table">
            <table>
        '''
        
        html += set_labels(labels)

        # Initialize totals dictionary
        totals = {label["fieldname"]: 0 for label in labels if label.get("calculate_total")}
        
        # Add data rows and calculate totals
        for index, row in enumerate(rows, start=1):
            html += set_row(index, row, labels, totals)

        # Add totals row if any totals are being calculated
        if any(label.get("calculate_total") for label in labels):
            html += set_totals_row(labels, totals)

        html += '''
            </table>
        </div>
        '''

        return get_pdf(html=html, options={'orientation': 'Landscape'})

    except Exception as e:
        frappe.log_error(f"Error generating report: {str(e)}")
        frappe.throw("Error generating report. Please check the error log.")

def set_labels(labels):
    """
    Create the table header with the given labels and apply column widths and alignment.
    """
    html = '<thead><tr>'
    for label in labels:
        width = label.get("width", "auto")
        alignment = label.get("alignment", "left")
        html += f'<th style="width: {width}; text-align: {alignment};">{label["label"]}</th>'
    html += '</tr></thead>'
    return html

def set_row(index, row, labels, totals):
    """
    Create a table row and update totals if specified.
    """
    html = '<tr>'
    
    # Add Serial Number with its alignment
    html += set_column(
        index, 
        width=labels[0]["width"],
        alignment=labels[0].get("alignment", "left")
    )

    if isinstance(row, dict):
        for label in labels[1:]:  # Skip serial number
            fieldname = label["fieldname"]
            value = row.get(fieldname, '')
            if fieldname == 'posting_date' or fieldname == 'due_date':
                value = format_date(value, 'dd-MM-yyyy')
            # Update totals if needed
            if label.get("calculate_total") and value:
                try:
                    totals[fieldname] += float(str(value).replace(',', '').replace('₹', ''))
                except (ValueError, TypeError):
                    pass
            
            # Format the cell
            html += set_column(
                value,
                label["width"],
                is_numeric=label.get("number_format", False),
                alignment=label.get("alignment", "left")
            )
    
    html += '</tr>'
    return html

def set_totals_row(labels, totals):
    """
    Create the totals row using calculated totals.
    """
    html = '<tr class="total-row">'
    html += f'<td style="text-align: center;">Total</td>'  # First column is "Total"
    
    for label in labels[1:]:  # Skip serial number
        if label.get("calculate_total"):
            value = totals.get(label["fieldname"], 0)
            html += set_column(
                value,
                label["width"],
                is_numeric=label.get("number_format", False),
                alignment=label.get("alignment", "left")
            )
        else:
            alignment = label.get("alignment", "left")
            html += f'<td style="width: {label["width"]}; text-align: {alignment};"></td>'
    
    html += '</tr>'
    return html

def set_column(element, width="auto", is_numeric=False, alignment="left"):
    """
    Format a single table cell with specified width, number formatting and alignment.
    """
    if element is None:
        element = ''

    # Format numbers
    if is_numeric and element:
        try:
            value = float(str(element).replace(',', '').replace('₹', ''))
            formatted_value = '{:,.2f}'.format(value)
            return f'<td class="numeric currency" style="width: {width}; text-align: {alignment};">{formatted_value}</td>'
        except (ValueError, TypeError):
            pass

    return f'<td style="width: {width}; text-align: {alignment};">{element}</td>'
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
    """Fetches documents with recipient field(s)"""

    if not docs:
        return []

    # Ensure recipient_field is a list
    if isinstance(recipient_field, str):
        recipient_field = [recipient_field]  # Convert string to list

    # Fetch the required fields
    fields = ['name'] + recipient_field  # Always include 'name'

    return frappe.db.get_all(
        doctype=doctype,
        fields=fields,
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
def sendmail(reference_doctype, reference_name, recipients, msg, subject,attachments=None):
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

    user_mail = get_user_mail()

    if user_mail:
        email_args['sender'] = user_mail

    frappe.enqueue(
        method=frappe.sendmail,
        queue='short',
        timeout=300,
        **email_args
    )
    
     # log communication in form history
    comm = frappe.get_doc({
        "doctype": "Communication",
        "subject": subject,
        "content": msg,
        "communication_type": "Communication",
        "reference_doctype": reference_doctype,
        "reference_name": reference_name,
        "recipients": recipients,
        "sender": user_mail or frappe.session.user,
    })
    comm.insert(ignore_permissions=True)
    frappe.db.commit()
    

    return f"Email queued to {recipients} with subject '{subject}'"

@frappe.whitelist()
def get_user_mail():

    current_user = frappe.session.user

    return frappe.db.get_value('User Email', {'parent': current_user, 'idx': 1, 'enable_outgoing': 1}, 'email_id')

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

        html_message = f"""
            <html>
                <body>
                    <p>Please find attached the document.</p>
                    <p>If you have any questions or need assistance, feel free to reach out.</p>
                    <p>Thank you for your business.</p>
                </body>
            </html>
            """
            
        sendmail(
            reference_doctype=doctype,
            reference_name=item.get('name'),
            recipients=data.get('email_id'),
            msg=html_message,
            subject=item.get('name'),
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
            subject=item.get('name'),
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