// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

var inward_pending_qty

frappe.ui.form.on("Stock Issue", {

    // add data in items child table based on purchase indent and location
    purchase_indent: function (frm) {
        if (frm.doc.purchase_indent && frm.doc.location) {
            let purchase_indent = frm.doc.purchase_indent;
            let stock_issue_location = frm.doc.location;

            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Purchase Indent",
                    name: purchase_indent
                },
                callback: function (response) {
                    if (response.message) {
                        let purchase_indent_doc = response.message;
                        let stock_summary = purchase_indent_doc.stock_summary || [];

                        // filter stock summary child table based on location and quantity
                        let matching_rows = stock_summary.filter(row => row.location === stock_issue_location && row.quantity != 0);
                        console.log(response)
                        frm.clear_table('items');

                        // Add matching rows to Stock Transfer Item child table
                        matching_rows.forEach(row => {
                            frappe.call({
                                method: "frappe.client.get_value",
                                args: {
                                    doctype: "Item",
                                    filters: { item_code: row.item_code },
                                    fieldname: ["item_name", "item_group", "stock_uom",]
                                },
                                callback: function (item_response) {
                                    if (item_response.message) {
                                        let item_data = item_response.message;

                                        // Add child row with fetched data
                                        let child = frm.add_child('items');
                                        child.item_code = row.item_code;
                                        child.quantity = row.quantity;
                                        child.custom_duty = row.custom_duty;
                                        child.item_name = item_data.item_name;
                                        child.item_group = item_data.item_group;
                                        child.uom = item_data.stock_uom;
                                        child.premium = row.premium;
                                        console.log(item_data)

                                        frm.refresh_field('items');
                                    }
                                }
                            });
                        });
                    }
                }
            });
        } else if (!frm.doc.location) {
            frappe.msgprint(__('Please select a location before setting the Purchase Indent.'));
        }
    },


    refresh(frm){
        if(frm.doc.docstatus == 1 && frm.doc.status != "Material Received")
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
});



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





