// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

var inward_pending_qty

frappe.ui.form.on("Stock Issue", {
    refresh(frm){
        // if(frm.doc.pending_quantity != 0)
        // {
            frm.add_custom_button(__('Create Stock Receive'), function() {
                
                // Create a new 'Purchase InWard' document
                let item_table = frm.doc.items.map(row => {
                return {
                    item_code: row.item_code, 
                    item_name:row.item_name,
                    item_group:row.item_group,
                    uom:row.uom, 
                    quantity: row.quantity,
                    premium: row.premium,
                
                };
            });

            frappe.new_doc('Stock Receive', {
                stock_issue: frm.doc.name,
                custom_duty:frm.doc.custom_duty,
                by_air__sea:frm.doc.by_air__sea,
                air_way_bill_no:frm.doc.air_way_bill_no,
                remarks:frm.doc.remarks
            }).then(function(){
            
                    item_table.forEach(row => {
                        
                        cur_frm.add_child("items",{
                            item_code:row.item_code,
                            item_name:row.item_name,
                            item_group:row.item_group,
                            uom:row.uom,
                            quantity: row.quantity,
                            premium:row.premium,
                            // location:row.location

                        })
                    
                    });
        
                    cur_frm.refresh_field("items")
            })



        });
    // }
    },
	before_save(frm) {
        calculate_total_quantity(frm)   
	},
    after_save(frm){
        get_ward_details(frm)
    },
    on_submit(frm){
        get_ward_details(frm)
        in_ward_id = frm.doc.in_ward;

        let pending_qty = inward_pending_qty - frm.doc.total_quantity
        console.log("Pending QTY");
            console.log(pending_qty);
            console.log("TOtal QTY");
            console.log(frm.doc.total_quantity);
        var status = (inward_pending_qty == frm.doc.total_quantity) ? "Completed" : "Partly Complete";

        frappe.db.set_value("Purchase InWard",in_ward_id,{"pending_quantity":pending_qty,"status":status})
          
    }
});




function get_ward_details(frm){
    in_ward_id = frm.doc.in_ward;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase InWard",
            name: in_ward_id
        },
        callback: function(response) {
            var inward_doc = response.message;  
            inward_pending_qty = inward_doc.pending_quantity == 0 ? inward_doc.total_quantity : inward_doc.pending_quantity
        }
    })
}


frappe.ui.form.on('Stock Transfer Item', {
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
