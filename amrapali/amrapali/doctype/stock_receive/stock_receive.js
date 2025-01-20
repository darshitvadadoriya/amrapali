// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

var stock_issue_pending_qty
var stock_issue_id

frappe.ui.form.on("Stock Receive", {
    validate(frm){
        get_stock_issue_details(frm)
    },
	before_save(frm) {
        calculate_total_quantity(frm)   
        if (frm.doc.total_quantity > stock_issue_pending_qty) {
            frappe.throw(__("Your quantity is bigger than reference stock issue quantity. Pending Quantity is: <b>{0}</b>", [stock_issue_pending_qty]));
        }

	},
    after_save(frm){
        get_stock_issue_details(frm)
    },
    on_submit(frm){
        get_stock_issue_details(frm)
        stock_issue = frm.doc.stock_issue;
        // set status and pending quantity in linked stock issue form
        let pending_qty = stock_issue_pending_qty - frm.doc.total_quantity
        var status = (stock_issue_pending_qty == frm.doc.total_quantity) ? "Material Received" : "Partly Received";
        
        frappe.db.set_value("Stock Issue",stock_issue,{"pending_quantity":pending_qty,"status":status})
          
    }

});


function get_stock_issue_details(frm){
    stock_issue_id = frm.doc.stock_issue;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Stock Issue",
            name: stock_issue_id
        },
        callback: function(response) {
            var stockissue_doc = response.message;  
            
           
            stock_issue_pending_qty = stockissue_doc.pending_quantity == 0 ? stockissue_doc.total_quantity : stockissue_doc.pending_quantity
            
            console.log(stock_issue_pending_qty);

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
