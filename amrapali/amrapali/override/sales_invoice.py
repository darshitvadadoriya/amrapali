import frappe





def on_cancel(doc, method):
    if doc.custom_tds_applied == 1:
        journal_entry_id = doc.custom_journal_entry
        
        jv = frappe.get_doc("Journal Entry",journal_entry_id)
        jv.cancel()


def before_save(doc,method):
    msg = 'Hello, My Name is Malav'
    attachments = [frappe.attach_print(doc.doctype, doc.name, file_name = doc.name)]
    temp = sendmail(doc, ['malav@sanskartechnolab.com'], msg, 'New Mailll', attachments=attachments)
