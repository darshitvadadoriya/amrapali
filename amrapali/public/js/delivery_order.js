frappe.ui.form.on("Delivery Note", {
    refresh(frm){
       setTimeout(() => {
        frm.remove_custom_button('Shipment', 'Create');
        frm.remove_custom_button('Installation Note', 'Create');
        frm.remove_custom_button('Delivery Trip', 'Create');
        frm.remove_custom_button('Sales Invoice', 'Create');
        frm.remove_custom_button('Packing Slip', 'Create');
        frm.remove_custom_button('Quality Inspection(s)','Create');

        frm.remove_custom_button('Sales Order', 'Get Items From');
       }, 100);

       frm.add_custom_button('Release Order',function(){
          
        frappe.model.open_mapped_doc({
            method: "amrapali.amrapali.override.api.delivery_order.make_delivery_note",
            frm: cur_frm,
        });

    }, 'Create');

    },
    onload: function (frm) {

        if (frm.is_new()) {
           
            setTimeout(() => {
                frm.set_value("letter_head", "");
                frm.refresh_field("letter_head")
            }, 1000);
        }


        // sending invoice to customer
        frm.add_custom_button('Send DO PDF', function () {

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
                                    'reference_doctype': 'Packing List',
                                    'reference_name': frm.doc.custom_pack_list
                                }
                            ],
                            // 'msg': `Dear ${frm.doc.customer_name},\n\nPlease find attached the invoice ${frm.doc.name} for your recent purchase. If you have any questions or need assistance, feel free to reach out.\n\nThank you!`,
                            'msg': `
                                    <html>
                                        <body>
                                        <p>Dear ${frm.doc.customer_name},</p>
                                        <p>Please find attached the document.</p>
                                        <p>If you have any questions or need assistance, feel free to reach out.</p>
                                        <p>Thank you!</p>
                                        </body>
                                    </html>
                                    `,
                            'subject': "Delivery Order:" + frm.doc.name,
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
        });
    },
	customer(frm) {
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Customer',
                name: frm.doc.customer,
            },
            callback: (res) => {

                authorized_persons = res.message.custom_authorized_person

                frm.set_value('custom_authorized_person', authorized_persons)
                
            }
        })


        // set filter for packing list
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Packing List',
                filters:{customer:frm.doc.customer},
            },
            callback: (res) => {
                console.log(res);
                let data = res.message
                let packing_list = data.map(item => item.name);
                frm.set_query("custom_pack_list",function(){
                
                    console.log(packing_list);
                    return{
                        filters:{
                            name:["in",packing_list],
                            inout_ward:"Out Ward",
                        }
                    }
                })
                
            }
        })
	},
});



frappe.ui.form.on('Delivery Note Item', {

    // weight calculation
    qty: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    },
    weight_uom: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    },
    custom_item_weight: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    }
    
});



// calculate weight
function update_weight(frm, child) {
    let custom_item_weight = child.custom_item_weight || 0;
    let qty = child.qty || 0;

    if (child.weight_uom == 'Kg') {
        child.custom_total_item_weight = custom_item_weight * 1000 * qty; // Convert Kg to Gram and multiply by qty
        console.log(child.custom_total_item_weight);
    } else if (child.weight_uom == 'Gram') {
        child.custom_total_item_weight = custom_item_weight * qty; // Multiply weight by qty if already in Gram
        console.log(child.custom_total_item_weight);
    }

    frm.refresh_field('items');
    calculate_total_weight(frm);
}

function calculate_total_weight(frm) {
    let total_weight = 0;
    frm.doc.items.forEach(item => {
        total_weight += item.custom_total_item_weight || 0;
    });
    frm.set_value('custom_total_weight', total_weight/1000);
}

