// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Purchase Indent", {
	refresh(frm) {

        // exchange rate
        frappe.call({
            method: "erpnext.setup.utils.get_exchange_rate",
            args: {
              from_currency: "USD",
              to_currency: "INR",
            },
            callback: function (r) {
                console.log(r);
            }
          });


          
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
            frm.add_custom_button("Create Inward", function () {
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

                frappe.new_doc('Purchase InWard', {
                    purchase_indent: frm.doc.name,
                    supplier: frm.doc.supplier,
                    vaulting_agent: frm.doc.vaulting_agent
                }).then(function(){
                
                        item_table.forEach(row => {
                            
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
