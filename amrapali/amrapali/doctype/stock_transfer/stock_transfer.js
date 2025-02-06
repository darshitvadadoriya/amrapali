// Copyright (c) 2025, Sanskar Technolab and contributors
// For license information, please see license.txt


frappe.ui.form.on("Stock Transfer", {
	
    purchase_indent: function (frm) {
        if (frm.doc.purchase_indent && frm.doc.from_location) {
            let purchase_indent = frm.doc.purchase_indent;
            let stock_issue_location = frm.doc.from_location;

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
	before_save(frm){
        calculate_total_quantity(frm)
    }
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

