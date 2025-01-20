// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Purchase Indent", {
	refresh(frm) {

        set_email_recepiants(frm)
       
//refresh template on input 
        // if(!frm.is_new())
        // {
        //      // for update indent template on change value in form
        //     $.each(frm.fields_dict, function(fieldname, field) {
        //         $(field.input).on('change', function() {
        //             frm.trigger('refresh_template');
        //         });
        //     });

        //     // Attach change event listener to fields in the form
        //     $(frm.fields_dict['items'].grid.wrapper).on('change', '.grid-row input', function() {
        //         frm.trigger('refresh_template');
        //     });

        
            
        //     frm.fields_dict.items.grid.after_rows_rendered = function() {
        //         // Check if there are rows in the table
        //         if (frm.doc.items.length) {
        //             // Get the last row (newly added row)
        //             let last_row = frm.doc.items[frm.doc.items.length - 1];
        //             if (!last_row['premium']) {  // Check if the field is not set
        //                 last_row['premium'] = '10';  // Set the default value
        //                 frm.refresh_field('items');  // Refresh to show the updated row
        //             }
        //         }
        //     };
        // }


       if(frm.doc.status != "Completed" && frm.doc.docstatus == 1)
       {
            frm.add_custom_button("Create Stock Clearance", function () {
                // Create a new 'Purchase InWard' document
                let item_table = frm.doc.items.map(row => {
                    return {
                        item_code: row.item_code, 
                        item_name:row.item_name,
                        item_group:row.item_group,
                        uom:row.uom, 
                        quantity: row.pending_quantity,
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

    validate: function(frm) {

        // set current row quantity as pending quantity
        frm.doc.items.forEach(function(row) {
            if (row.quantity) {
                frappe.model.set_value(row.doctype, row.name, 'pending_quantity', row.quantity);
            }
        });

        // on validate to sum of pending quantity and set in pending quantity field
        let total = 0;

        if (frm.doc.items) {
            frm.doc.items.forEach(row => {
                total += row.pending_quantity; 
            });
        }

        frm.set_value('pending_quantity', total);

        calculate_total_quantity(frm) //set value of total quantity in total quantity field.
    },

    
    terms(frm) {
        setTimeout(function() {
            set_indent(frm);
        }, 50);
    },
    
    
    refresh_template(frm) {
            
        let template_data = frm.doc.terms;
        frm.set_value('terms', null);
    
        frm.refresh_field('terms');

        frm.set_value('terms', template_data);
        frm.refresh_field('terms');
        
    }
    
    

});




frappe.ui.form.on('Purchase Indent Item', {
    quantity(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);

        if (row.quantity) {
            frappe.model.set_value(cdt, cdn, 'pending_quantity', row.quantity);
        }

        // Recalculate the total quantity if necessary
        calculate_total_quantity(frm);
    }
});



// calculate total quantity from child_table
function calculate_total_quantity(frm) {
    let total_quantity = 0;
    
    frm.doc.items.forEach(function(row) {
        total_quantity += row.quantity || 0;  
    });

    frm.set_value('total_quantity', total_quantity);
}



 function set_indent(frm) {
    const template = frm.doc.terms_and_consition;
    const indent_date = frm.doc.date;
    const formatted_date = frappe.datetime.str_to_user(indent_date);
    const items = frm.doc.items;
    const today = frappe.datetime.str_to_user(frappe.datetime.nowdate());

    const context = {
        today: today, // get today's date
        date: formatted_date,
        name: frm.doc.name,
        supplier: frm.doc.supplier,
        location: items[0].location,
        qty: items[0].quantity,
        uom: items[0].uom,
        premium: items[0].premium,
        purpose: items[0].purpose,
        item_code: items[0].item_code,
        custom_duty: items[0].custom_duty,
        vaulting_agent: frm.doc.vaulting_agent,
        shipment: items[0].shipment,
        international_supplier: items[0].international_supplier
    };

    // Wait for template rendering to complete (if asynchronous operation occurs here in future)
    const rendered_html =  frappe.render_template(template, context);
    frm.set_value('terms_and_consition', rendered_html);
}


function set_email_recepiants(frm){ 
    $("[data-label='Email']").parent().click(function(){
        console.log("On click Email");



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



// change child table this link field to set data in template
// frappe.ui.form.on('Purchase Indent Item', {
// 	international_supplier(frm) {
// 		// your code here
//         frm.trigger('refresh_template');
// 	}
// })