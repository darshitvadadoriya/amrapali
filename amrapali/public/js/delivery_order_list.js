
async function send_bulk_mail(listview) {


    const selected_records = listview.get_checked_items();
    console.log(selected_records)

    frappe.confirm(
        'Are you sure you want to proceed sending e-mail?',
        function () {

            frappe.dom.freeze("Sending Emails. Please wait...");



            frappe.call({
                method: 'amrapali.amrapali.override.api.api.send_bulk_mail_delivery_order',
                args: {
                    'list': selected_records,
                    'doctype': listview.doctype
                },
                callback: (res) => {
                    console.log(res, 'henjnfd')
                    // Unfreeze the screen
                    frappe.dom.unfreeze()

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
       
        listview.page.add_inner_button("Send Bulk Mail", function () {
            send_bulk_mail(listview);
        });;
    },
};

