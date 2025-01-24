// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt


var item_code_lst = []
var validate

frappe.ui.form.on("Packing List", {

    setup: function (frm) {

        frm.get_docfield("delivered_items").allow_bulk_edit = 1; // set download and upload button for child table
    },
    refresh: function (frm) {

   
            frm.set_query("document", function() {
                    return {
                        "filters": {
                        "docstatus": "1 ",
                        }
                    };
            });

            // hide get bars button
            if(frm.doc.docstatus >= 1){
                
            }


            

            if(!frm.is_new()){
                frappe.call({
                    method: "amrapali.amrapali.doctype.packing_list.packing_list.get_doc_data",
                    args: {
                        doctype: frm.doc.doctype_list,
                        doc_name: frm.doc.document,
                    },
                    callback:function(r){
                            
                            if(frm.doc.doctype_list == "Sales Order")
                                {
                                        var order_item_list = r.message.items
                                        item_code_list = []
                                        // item_code array
                                        order_item_list.forEach(function(data,i){
                                            console.log(data.item_code);
                                            item_code_list.push(data.item_code)
                                        }) 
                                        console.log(order_item_list);

                                        set_order_table(order_item_list)
                                }     
                    }
                })
            }
            else{
                 // Set the HTML field value
                cur_frm.fields_dict.sales_order_items.$wrapper.html("");
            }

    },

    inout_ward: function (frm) {
        var ward_value = frm.doc.inout_ward
        frm.doc.document = ""
        frm.clear_table("delivered_items"); //clear child table on change option
        frm.clear_table("purchase_items"); //clear child table on change option

        // if ward val is inward set purchase receipt
        if (ward_value == 'In Ward') {
            cur_frm.set_value("naming_series", "PR-PAC-.YYYY.-")
            cur_frm.set_value("doctype_list", "Purchase Receipt")
            frm.set_df_property("document", 'label', "Purchase Receipt");
            // frm.set_df_property("total_bar_weight_from", 'label', "Total Bar Weight From Purchase Receipt");
            get_used_purchase(frm) // get used delivery note list

        }
        // if ward val is inward set delivery note
        if (ward_value == 'Out Ward') {
            cur_frm.set_value("naming_series", "SO-PAC-.YYYY.-")
            cur_frm.set_value("doctype_list", "Sales Order")
            frm.set_df_property("document", 'label', "Sales Order");
            // frm.set_df_property("total_bar_weight_from", 'label', "Total Bar Weight From Delivery Note");
            get_used_delivery(frm) // get used delivery note list


        }

    },


    document: async function (frm) {
        
        var doctype = frm.doc.doctype_list
        var doc_name = frm.doc.document

        
      
        if(frm.doc.doctype_list == "Sales Order")
        {
            if (frm.doc.doctype_list === "Sales Order") {
                get_purchase_indent(frm); 
            }
            
            frappe.db.get_value(doctype, frm.doc.document, 'customer')
            .then(r => {
                if (r && r.message) {
                    frm.set_value('customer', r.message.customer);
                }
            });
        }

        if(frm.doc.doctype_list == "Purchase Receipt")
            {
                frappe.db.get_value(doctype, frm.doc.document, 'supplier')
                .then(r => {
                    console.log(r);
                    if (r && r.message) {
                        frm.set_value('supplier', r.message.supplier);
                    }
                });
                frappe.db.get_value(doctype, frm.doc.document, 'custom_purchase_indent')
                .then(r => {
                    console.log(r);
                    if (r && r.message) {
                        frm.set_value('indent', r.message.custom_purchase_indent);
                    }
                });
            }


        frappe.call({
            method: "amrapali.amrapali.doctype.packing_list.packing_list.get_doc_data",
            args: {
                doctype: doctype,
                doc_name: doc_name,
            },
            callback: function (r) {

            
                item_code_lst = []
                var child_table

                
                console.log(r.message.items);
                if(frm.doc.doctype_list == "Sales Order")
                {
                        var order_item_list = r.message.items
                        item_code_list = []
                        // item_code array
                        order_item_list.forEach(function(data,i){
                            console.log(data.item_code);
                            item_code_list.push(data.item_code)
                        }) 
                        

                        

                        // set filter of item code show items only added in selected Sales order
                        frm.set_query("item_code", "delivered_items", function (doc, cdt, cdn) {
                        let row = locals[cdt][cdn];
                        return {
                            "filters": {
                            "item_code":["in",item_code_list]
                            },
                        };
                        });

                        // set filters on purchase indent
                        if(item_code_list)
                        {
                            
                            //  Purchase indent filter(get indent reference id from bar number list)
                            frappe.call({
                                method:"amrapali.amrapali.doctype.packing_list.packing_list.get_indent",
                                args:{
                                    item_code_list: item_code_list
                                },
                                callback:function(r){
                                    console.log(r);
                                    let indent_list = r.message
                                    frm.set_query("purchase_indent", function () {

                                        return {
                                        "filters": {
                                            "name":["in",indent_list]
                                        },
                                        };
                                    });
                                }
                            })
                        }
                    }
                
                



               
                var total_weight_from_prev = r.message.total_qty
                var items_data = r.message.items
                if (doctype == "Purchase Receipt") {
                    child_table = "purchase_items"
                    frm.clear_table("purchase_items");
                }
                if (doctype == "Sales Order") {
                    child_table = "delivered_items"
                    frm.clear_table("delivered_items");
                }
                $.each(items_data, function (index, data) {
                    item_code_lst.push(data.item_code)
                    console.log(child_table);
                    // add record automatic in child table
                    frm.add_child(child_table, {
                        item_code: data.item_code,
                        warehouse: data.warehouse,
                        uom: data.uom
                    });
                })
                // refresh field after set data
                frm.refresh_field(child_table);


            }
        })
    },


    
    get_bars: function(frm) {
        // Get the list of purchase indent items from the current form document
        purchase_indents = frm.doc.purchase_indent;
        indent_list = [];
    
        // Loop through the purchase indents and collect their associated 'purchase_indent_item'
        for (let i = 0; i < purchase_indents.length; i++) {
            indent_list.push(purchase_indents[i].purchase_indent_item);  // Add each purchase_indent_item to the list
        }
    
        // get bar list as per selected indent
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Bar Numbers',  
                fields: ['*'], 
                filters: {
                    'purchase_indent': ['in', indent_list],
                    'item_code':['in', item_code_list],

                }
            },
            callback: function(r) {
    
                // Check if the response contains a 'message' and it is an array (indicating the data was returned successfully)
                if (r.message && Array.isArray(r.message)) {
                    // If the message exists and contains an array, reset the 'delivered_items' child table in the form
                    frm.doc.delivered_items = [];  
                    frm.refresh_field('delivered_items');  
                    
                    // Loop through each bar number record returned in the API response
                    r.message.forEach(element => {
                        // For each record, we create a new row in the 'delivered_items' child table
                        let new_row = frm.add_child('delivered_items');  // Add a new row to the child table
    
                        // Set the values for the new row using data from the current element in the response
                        new_row.item_code = element.item_code;
                        new_row.bar_no = element.bar_no;
                        new_row.uom = element.uom;
                        new_row.weight = element.weight;
                        new_row.weightoz = element.weightoz;
                        new_row.warehouse = element.warehouse;
                        
                        
                        // Refresh the child table field to show the newly added row
                        frm.refresh_field('delivered_items');
                        frm.script_manager.trigger('item_code', new_row.doctype, new_row.name);	
                    });
    
                    // Refresh the child table field again after all rows have been added
                    frm.refresh_field('delivered_items');
                    
                   
                } else {
                    // If no data is found, show a message to the user
                    frappe.msgprint(__('No data found.'));
                }
            }
        });
    }
    
});


frappe.ui.form.on('Packing Purchase Items', {
    net_weight: function (frm, cdt, cdn) {
        totl_bars(frm, frm.doc.purchase_items);
    }
})

frappe.ui.form.on('Packing Delivery Items', {
    net_weight: function (frm, cdt, cdn) {
        totl_bars(frm, frm.doc.delivered_items);
    },
    
})






function get_used_purchase(frm) {
    frappe.call({
        method: 'amrapali.amrapali.doctype.packing_list.packing_list.get_used_purchase',
        callback: function (r) {
            console.log(r);
            // set filters for purchase doc link field
            frm.set_query("document", function () {
                return {
                    filters: [
                        ["Purchase Receipt", "name", "not in", r.message],
                        ["Purchase Receipt", "docstatus", "=", "1"]  // Filtering 'name' field in Purchase Receipt doctype
                    ]
                };
            });
            
            
        }
    })
}



function get_used_delivery(frm) {
    frappe.call({
        method: 'amrapali.amrapali.doctype.packing_list.packing_list.get_used_delivery',
        callback: function (r) {
            console.log(r);
            // set filters for Sales Order doc link field
            frm.set_query("document", function () {
                return {
                    filters: [
                        ["Sales Order", "name", "not in", r.message],
                        ["Sales Order", "docstatus", "=", "1"]  // Filtering 'name' field in Sales Order doctype
                    ]
                };
            });
            
            
        }
    })
}

function get_purchase_indent(frm) {

    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Sales Order',
            name: frm.doc.document
        },
        callback: function(res) {
            frm.set_value('purchase_indent',[])
            if (res && res.message) {
                console.log('Sales Order:', res.message.purchase_indent);
                if(res.message.purchase_indent) {
                    setTimeout(async () => {
                        frm.set_value('purchase_indent',[{
                            'purchase_indent_item':  res.message.purchase_indent
                        }])
                    }, 10);
                }
                
                 // Set timeout duration in milliseconds (e.g., 1000ms = 1 second)
                frm.refresh_field('purchase_indent')
                // Fetch Purchase Indent Item with explicit error handlin
            } else {
                frappe.msgprint(__('Sales Order not found.'));
            }
        },
        error: function(err) {
            console.error('Error fetching Sales Order:', err);
        }
    });
    
    
    
}









function set_order_table(data) {
    // HTML content for the table with dynamic rows
    const tableHTML = `
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 20px 0;
                font-size: 14px;
                background-color: #fff;
            }
            thead {
                background-color: #f3f4f6;
            }
            thead th {
                padding: 10px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #d1d8dd;
            }
            tbody td {
                padding: 8px;
                border: 1px solid #d1d8dd;
                white-space: nowrap;
            }
            tbody tr:nth-child(even) {
                background-color: #f9fafb;
            }
            tbody tr:hover {
                background-color: #f3f4f6;
            }
            tbody tr td:last-child {
                text-align: right;
            }
        </style>
        <span>Sales Order Items</span>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Value Date</th>
                    <th>MCX Rate</th>
                    <th>Premium</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                </tr>
            </thead>
            <tbody>
                ${data
                    .map(
                        (row) => `
                    <tr>
                        <td>${row.item_code}</td>
                        <td>${frappe.datetime.str_to_user(row.delivery_date)}</td>
                        <td>${row.custom_mcx_rate}</td>
                        <td>${row.custom_premium}</td>
                        <td>${row.qty}</td>
                        <td>${row.rate}</td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>`;

    // Set the HTML field value
    cur_frm.fields_dict.sales_order_items.$wrapper.html(tableHTML);
}