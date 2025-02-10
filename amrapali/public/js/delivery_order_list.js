
async function send_bulk_mail(listview) {


    const selected_records = listview.get_checked_items();
    
    // Return false if no records are selected
    if (!selected_records.length) {
        frappe.msgprint(__('Please select at least one record'));
        return false;
    }

    // Check if any record is in Draft or Cancelled state
    const hasDraftOrCancelled = selected_records.some(record => 
        record.docstatus === 0 || // Draft
        record.docstatus === 2    // Cancelled
    );

    if (hasDraftOrCancelled) {
        frappe.msgprint(__('Selected records contain Draft or Cancelled documents'));
        return false;
    }
    console.log(selected_records)

    frappe.confirm(
        'Are you sure you want to proceed sending e-mail?',
        function () {

            frappe.dom.freeze("Sending Emails. Please wait...");



            frappe.call({
                method: 'amrapali.amrapali.override.api.api.send_bulk_mail_delivery_order',
                args: {
                    'list': selected_records,
                    'doctype': listview.doctype,
                    'recipient_doctype': 'Vaulting Agent',
                    'recipient_field': 'custom_vaulting_agent'
                },
                callback: (res) => {
                    console.log(res, 'henjnfd')
                    // Unfreeze the screen
                    frappe.dom.unfreeze()
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 4000);

                    // Show success alert and refresh list view after completion
                    frappe.show_alert({ message: "Emails Successfully Sent!", indicator: "green" });
                }
            })

        },
        function () {
            // No action
        }
    );



}




frappe.listview_settings['Delivery Note'] = {
    refresh: function (listview) {
       
        listview.page.add_inner_button("Send Bulk DO PDF", function () {
            send_bulk_mail(listview);
        });;
    },
};

