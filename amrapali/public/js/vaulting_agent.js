frappe.ui.form.on('Vaulting Agent',{
    address(frm) {
        frappe.call({
            method: 'frappe.contacts.doctype.address.address.get_address_display',
            args: {
                address_dict: frm.doc.address
            },
            callback: (res) => {
                frm.set_value("vaulting_agent_address", res.message);
            }
        });
    }
})