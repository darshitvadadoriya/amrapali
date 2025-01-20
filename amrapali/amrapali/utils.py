def sendmail(doc, recipients, msg, subject, attachments = None):

    
    email_args = {
        'recipients': recipients,
        'message': msg,
        'subject': subject,
        'reference_doctype': doc.doctype,
        'reference_name': doc.name
    }

    if attachments:
        email_args['attachments'] = attachments

    frappe.enqueue(method = frappe.sendmail, queue = 'short', timeout = 300)