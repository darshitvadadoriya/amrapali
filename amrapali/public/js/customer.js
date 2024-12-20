frappe.ui.form.on('Customer', {
    custom_company_register_address(frm) {
        frappe.call({
            method: 'frappe.contacts.doctype.address.address.get_address_display',
            args: {
                address_dict: frm.doc.custom_company_register_address
            },
            callback: (res) => {
                frm.set_value("custom_company_register_address_details", res.message);
            }
        });
    },
    custom_corporate_address(frm) {
        frappe.call({
            method: 'frappe.contacts.doctype.address.address.get_address_display',
            args: {
                address_dict: frm.doc.custom_corporate_address
            },
            callback: (res) => {
                frm.set_value("custom_corporate_address_details", res.message);
            }
        });
    },
    custom_delivery_address(frm) {
        frappe.call({
            method: 'frappe.contacts.doctype.address.address.get_address_display',
            args: {
                address_dict: frm.doc.custom_delivery_address
            },
            callback: (res) => {
                frm.set_value("custom_delivery_address_details", res.message);
            }
        });
    },
    custom_same_as_register_address(frm) {
        if (frm.doc.custom_same_as_register_address == '1') {
            frm.set_value("custom_corporate_address", frm.doc.custom_company_register_address);
        } else if (frm.doc.custom_same_as_register_address == '0') {
            frm.set_value("custom_corporate_address", '');
        }
    },
    custom_same_as_company_register_address(frm) {
        if (frm.doc.custom_same_as_company_register_address == '1') {
            frm.set_value("custom_delivery_address", frm.doc.custom_company_register_address);
        } else if (frm.doc.custom_same_as_company_register_address == '0') {
            frm.set_value("custom_delivery_address", '');
        }
    },
    custom_bank_details(frm) {
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Bank Account',
                fieldname: ['account','account_name','bank','account_type','custom_branch_name','branch_code','bank_account_no'],
                filters: {
                    name: frm.doc.custom_bank_details
                }
            },
            callback: (res) => {
                if (res && res.message) {
                    let details_html = `
    <strong>Account Name:</strong> ${res.message.account_name || ''} 
    <strong>Account:</strong> ${res.message.account || ''} 
    <strong>Bank:</strong> ${res.message.bank || ''} 
    <strong>Account Type:</strong> ${res.message.account_type || ''} 
    <strong>Branch Name:</strong> ${res.message.custom_branch_name || ''} 
    <strong>Branch Code:</strong> ${res.message.branch_code || ''} 
    <strong>Bank Account No:</strong> ${res.message.bank_account_no || ''}
                `;
                

                    frm.set_value('custom_bank_account_details', details_html)
                    console.log(res)
                } else {
                    console.log("No document found for the given name.");
                }
            }
        });
        
        
    }
});
