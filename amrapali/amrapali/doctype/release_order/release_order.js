// Copyright (c) 2025, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Release Order", {


    refresh(frm) {
        console.log(frm.doc.customer);
    
        if(!frm.is_new()){
            // get the report data
        frappe.call({
            method: "amrapali.amrapali.doctype.release_order.release_order.get_report",
            args: {
                company: frm.doc.company,
                customer: frm.doc.customer
            },
            callback: function(r) {
                console.log(r.message);
                let total_due_sum = 0;
    
                // sum total_due for the specific customer
                $.each(r.message, function(key, data) {
                    if (key === frm.doc.customer) {
                        console.log(key);
                        console.log(data);
    
                        $.each(data, function(i, item) {
                            let total_due = parseFloat(item.total_due);
                            if (!isNaN(total_due)) {
                                total_due_sum += total_due;
                            }
                        });
                    }
                });
    
                
    
                // geth the credit limit
                frappe.call({
                    method: "amrapali.amrapali.doctype.release_order.release_order.get_credit_limit",
                    args: {
                        company: frm.doc.company,
                        customer: frm.doc.customer
                    },
                    callback: function(r) {
                      if(r.message)
                      {
                            let credit_limit = parseFloat(r.message);
                        
                            // check credit limit
                            if (total_due_sum < credit_limit ) {
                                frm.add_custom_button("Send SI & Release Order",function(){
                                   
                                    send_mail(frm)

                                })
                                
                            }
                    
                        }
                    }
                });
            }
        });
        }



        // set filter for authorized person
        frm.set_query('custom_authorized_person', function () {
            return {
                filters: {
                    'customer': frm.doc.customer
                }
            };
        });

         // set filter for authorized person
         frm.set_query('custom_pack_list', function () {
            return {
                filters: {
                    'customer': frm.doc.customer
                }
            };
        });
    }
    
});


function send_mail(frm) {


    frappe.confirm(
        'Are you sure you want to proceed sending an e-mail?',
        function () {

            frappe.dom.freeze("Sending Email. Please wait...");



            frappe.call({
                method: 'amrapali.amrapali.override.api.api.send_single_mail',
                args: {

                    'parent_doctype': frm.doctype,
                    'parent_name': frm.doc.name,
                    'data': [
                        {
                            'reference_doctype': frm.doctype,
                            'reference_name': frm.doc.name
                        },
                        {
                            'reference_doctype': 'Delivery Note',
                            'reference_name': frm.doc.reference_delivery_order
                        }
                    ],
                    'msg': 'Hello',
                    'subject': 'World',
                    'attachments': true,
                    'recipient_doctype': 'Vaulting Agent',
                    'recipient_field': 'custom_vaulting_agent',
                    'email_field': 'email_id'
                },
                callback: (res) => {
                    console.log(res, 'henjnfd')
                    // Unfreeze the screen
                    frappe.dom.unfreeze()

                    // Show success alert and refresh list view after completion
                    frappe.show_alert({ message: "Email Successfully Sent!", indicator: "green" });
                }
            })

        }
    )
}
