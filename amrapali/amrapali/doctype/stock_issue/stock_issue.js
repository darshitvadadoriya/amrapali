// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

var inward_pending_qty

frappe.ui.form.on("Stock Issue", {
    refresh(frm){
        if(frm.doc.docstatus == 1)
        {
            frm.add_custom_button(__('Create Stock Receive'), function() {
                
                // Create a new 'Stock Issue' document
                let item_table = frm.doc.items.map(row => {
                return {
                    item_code: row.item_code, 
                    item_name:row.item_name,
                    item_group:row.item_group,
                    uom:row.uom, 
                    custom_duty:row.custom_duty,
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
                            custom_duty:row.custom_duty,
                            quantity: row.quantity,
                            premium:row.premium,
                            // location:row.location

                        })
                    
                    });
        
                    cur_frm.refresh_field("items")
            })



        });
    }
    },
	before_save(frm) {
        calculate_total_quantity(frm)  
        if (frm.doc.total_quantity > inward_pending_qty) {
            frappe.throw(__("Your quantity is bigger than reference Stock clearance quantity. Pending Quantity is: <b>{0}</b>", [inward_pending_qty]));
        } 
	},
    after_save(frm){
        get_ward_details(frm)
    },
    on_submit(frm){
        get_ward_details(frm)
        stock_clearance = frm.doc.stock_clearance;

        let pending_qty = inward_pending_qty - frm.doc.total_quantity
        console.log("Pending QTY");
            console.log(pending_qty);
            console.log("TOtal QTY");
            console.log(frm.doc.total_quantity);
        var status = (inward_pending_qty == frm.doc.total_quantity) ? "Completed" : "Partly Complete";

        frappe.db.set_value("Stock Clearance",stock_clearance,{"pending_quantity":pending_qty,"status":status})
          
    }
});




function get_ward_details(frm){
    stock_clearance = frm.doc.stock_clearance;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Stock Clearance",
            name: stock_clearance
        },
        callback: function(response) {
            var stock_clearance_doc = response.message;  
            inward_pending_qty = stock_clearance_doc.pending_quantity == 0 ? stock_clearance_doc.total_quantity : stock_clearance_doc.pending_quantity
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
