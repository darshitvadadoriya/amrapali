// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Stock Clearance", {
// 	refresh(frm) {

// 	},
// });



var indent_pending_qty
var indent_id
frappe.ui.form.on("Stock Clearance", {
    refresh(frm){
        if(frm.doc.docstatus == "1")
        {
            // frm.add_custom_button(__('Stock Issue'), function() {
                
            //     // Create a new 'Stock Clearance' document
            //     let item_table = frm.doc.items.map(row => {
            //         return {
            //             item_code: row.item_code, 
            //             item_name:row.item_name,
            //             item_group:row.item_group,
            //             uom:row.uom, 
            //             custom_duty:row.custom_duty,
            //             quantity: row.quantity,
            //             premium: row.premium,
                    
            //         };
            //     });

            //     frappe.new_doc('Stock Issue', {
            //         stock_clearance: frm.doc.name,
            //         supplier: frm.doc.supplier,
            //         vaulting_agent: frm.doc.vaulting_agent
            //     }).then(function(){
                
            //             item_table.forEach(row => {
                            
            //                 cur_frm.add_child("items",{
            //                     item_code:row.item_code,
            //                     item_name:row.item_name,
            //                     item_group:row.item_group,
            //                     custom_duty:row.custom_duty,
            //                     uom:row.uom,
            //                     quantity: row.quantity,
            //                     premium:row.premium,

            //                 })
                        
            //             });
            
            //             cur_frm.refresh_field("items")
            //     })



            // }, __("Create"));
        }
    },
    validate(frm){
        get_indent_details(frm)
       
    },
	before_save(frm) {
        calculate_total_quantity(frm)
        if (frm.doc.total_quantity > indent_pending_qty) {
            frappe.throw(__("Your quantity is bigger than reference indent quantity. Pending Quantity is: <b>{0}</b>", [indent_pending_qty]));
        }
        
	},
    on_submit(frm){
        get_indent_details(frm)
        indent_id = frm.doc.purchase_indent;

        let pending_qty = indent_pending_qty - frm.doc.total_quantity
        var status = (indent_pending_qty == frm.doc.total_quantity) ? "Completed" : "Partly Complete";

        frappe.db.set_value("Purchase Indent",indent_id,{"pending_quantity":pending_qty,"status":status})
        
        // frappe.call({
        //     method: "amrapali.amrapali.doctype.stock_clearance.stock_clearance.add_stock_in",
        //     args: {
        //         docname: frm.doc.name  // Pass the current document name
        //     },
        //     callback: function(response) {
                
        //     }
        // });
        
        
        
    }
});

frappe.ui.form.on("Purchase InWard Item", {
	quantity(frm) {
        calculate_total_quantity(frm)
	},
});


// calculate total quantity from child_table
function calculate_total_quantity(frm) {
    let total_quantity = 0;
    
    frm.doc.items.forEach(function(row) {
        total_quantity += row.quantity || 0;  
    });

    frm.set_value('total_quantity', total_quantity);
}


function get_indent_details(frm){
    indent_id = frm.doc.purchase_indent;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Indent",
            name: indent_id
        },
        callback: function(response) {
            var indent_doc = response.message;  
            indent_pending_qty = indent_doc.pending_quantity == 0 ? indent_doc.total_quantity : indent_doc.pending_quantity
        }
    })
}




