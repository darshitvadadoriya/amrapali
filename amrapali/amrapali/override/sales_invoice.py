import frappe


def on_cancel(doc, method):
    if doc.custom_tds_applied == 1:
        journal_entry_id = doc.custom_journal_entry
        
        jv = frappe.get_doc("Journal Entry",journal_entry_id)
        jv.cancel()