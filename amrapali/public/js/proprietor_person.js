frappe.ui.form.on('Proprietor Person',{
    proprietor_person_address(frm) {
        frappe.call({
            method: 'frappe.contacts.doctype.address.address.get_address_display',
            args: {
                address_dict: frm.doc.proprietor_person_address
            },
            callback: (res) => {
                frm.set_value("proprietor_person_address_details", res.message);
            }
        });
    }
})