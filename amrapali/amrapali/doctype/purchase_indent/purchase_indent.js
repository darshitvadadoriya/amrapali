// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Purchase Indent", {
	refresh(frm) {

     
        set_email_recepiants(frm)

          
          frm.fields_dict.items.grid.after_rows_rendered = function() {
            // Check if there are rows in the table
            if (frm.doc.items.length) {
                // Get the last row (newly added row)
                let last_row = frm.doc.items[frm.doc.items.length - 1];
                if (!last_row['premium']) {  // Check if the field is not set
                    last_row['premium'] = '10';  // Set the default value
                    frm.refresh_field('items');  // Refresh to show the updated row
                }
            }
        };


       if(frm.doc.status != "Completed")
       {
            frm.add_custom_button("Create Stock Clearance", function () {
                // Create a new 'Purchase InWard' document
                let item_table = frm.doc.items.map(row => {
                    return {
                        item_code: row.item_code, 
                        item_name:row.item_name,
                        item_group:row.item_group,
                        uom:row.uom, 
                        quantity: row.quantity,
                        premium: row.premium,
                        location: row.location
                    };
                });

                frappe.new_doc('Stock Clearance', {
                    purchase_indent: frm.doc.name,
                    supplier: frm.doc.supplier,
                    vaulting_agent: frm.doc.vaulting_agent
                }).then(function(){
                    
                    i = 0
                        item_table.forEach(row => {
                            console.log(i+1);
                            cur_frm.add_child("items",{
                                item_code:row.item_code,
                                item_name:row.item_name,
                                item_group:row.item_group,
                                uom:row.uom,
                                quantity: row.quantity,
                                premium:row.premium,
                                location:row.location

                            })
                        
                        });
            
                        cur_frm.refresh_field("items")
                })
                
            });
        }
        
        
	},
    terms(frm){
        setTimeout(() => {
            set_indent(frm)
        }, 50);
    },
    refresh_template(frm){
         var template_data = frm.doc.terms
        frm.set_value("terms","")
        frm.set_value("terms",template_data)
        // set_indent(frm)
    },
   

});



frappe.ui.form.on('Purchase Indent Item', {
	quantity(frm) {
		calculate_total_quantity(frm)
        
	}
})



// calculate total quantity from child_table
function calculate_total_quantity(frm) {
    let total_quantity = 0;
    
    frm.doc.items.forEach(function(row) {
        total_quantity += row.quantity || 0;  
    });

    frm.set_value('total_quantity', total_quantity);
}



function set_indent(frm){
      const template = frm.doc.terms_and_consition;
    const indent_date = frm.doc.date
    const formatted_date = frappe.datetime.str_to_user(indent_date);
    const items = frm.doc.items
    const today = frappe.datetime.str_to_user(frappe.datetime.nowdate())

    const context = {
        today: today, // get today dare
        date: formatted_date,
        name: frm.doc.name,
        supplier: frm.doc.supplier,
        location: items[0].location,
        qty: items[0].quantity,
        uom: items[0].uom,
        premium: items[0].premium,
        item_code:items[0].item_code,
        custom_duty:items[0].custom_duty,
        vaulting_agent:frm.doc.vaulting_agent,
        shipment:items[0].shipment,
        international_supplier:items[0].international_supplier

    };
    const rendered_html = frappe.render_template(template, context);
    frm.set_value('terms_and_consition', rendered_html);
    
}


function set_email_recepiants(frm){ 
    $("[data-label='Email']").parent().click(function(){
        console.log("On click Email");



        // const email_dialog = new frappe.views.CommunicationComposer({
        //     doc: {
        //         doctype: frm.doc.doctype,
        //         name: frm.doc.name,
        //     },
        //     subject: `Custom Subject for ${frm.doc.name}`,
        //     recipients: 'darshit@sanskatechnolab.com', // Default email address from the form
        //     message: `Hello, this is a custom message for ${frm.doc.name}.`,
        // });

        // // Set additional values in the dialog if needed
        // email_dialog.dialog.set_value('subject', 'Your Custom Subject');
        // email_dialog.dialog.set_value('recipients', 'example@example.com');
        // email_dialog.dialog.set_value('content', 'Custom email content goes here.');

        // // Show the dialog
        // email_dialog.dialog.show();




        frappe.call({
            method:'amrapali.amrapali.doctype.purchase_indent.purchase_indent.get_supplier_emailids',
            args:{
                supplier:frm.doc.supplier
            },
            callback:function(r){
                
                console.log(r.message);
                
                data =r.message
                const email_list = data.map(item => item.email).join(", ");
                console.log(email_list);
               
                setTimeout(() => {
                    cur_dialog.set_value("recipients","")
                    cur_dialog.set_value("recipients",email_list)
                }, 500);

            }
        });
    })
}