

var custom_custom_duty = 0;
var custom_duty_account;
var exchangerate;


async function get_item(row, item_code) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Item',
                name: item_code
            },
            callback: (res) => {
                if (res.message) {
                    const item = res.message;
                    row.item_name = item.item_name;
                    row.conversion_factor = 1;
                    row.uom = item.stock_uom;
                    row.custom_conversion = item.custom_conversion;
                    resolve(); // Resolve when done
                } else {
                    reject('Item not found');
                }
            }
        });
    });
}

frappe.ui.form.on('Purchase Order', {
    refresh: function(frm) {
        setTimeout(() => {
            frm.remove_custom_button('Product Bundle', 'Get Items From');
            frm.remove_custom_button('Material Request', 'Get Items From');
            frm.remove_custom_button('Supplier Quotation', 'Get Items From');
            frm.remove_custom_button('Update Rate as per Last Purchase', 'Tools');
            frm.remove_custom_button('Link to Material Request', 'Tools');            
        }, 100);
    },
    custom_purchase_indent: async function (frm) {
        if(frm.doc.custom_purchase_indent && frm.doc.set_warehouse)
        {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Purchase Indent',
                    name: frm.doc.custom_purchase_indent
                },
                callback: async function (res) {
                    if (res.message) {
                
                        const items = res.message.stock_summary;
    
                        if (items && items.length > 0) {
                            // frm.set_value('set_warehouse', items[0].location);
    
                            // Clear existing rows in the child table
                            frm.clear_table('items');
    
                            const exchangerate = await exchange_rate(); // Fetch exchange rate
                            const value_date = frm.doc.schedule_date;
                            
                            // Flag to track if the message is shown
                            let sufficient_stock_found = false; 
                            // Iterate over items and fetch details asynchronously
                            for (const item of items) {
                                if (item.quantity > 0 && item.location == frm.doc.set_warehouse) {
                                    let row = frm.add_child('items'); // Add a new row
                                    row.item_code = item.item_code;
                                    row.custom_indent_reference_id = item.name;
                                    row.qty = item.quantity;
                                    row.custom_premium = item.premium;
                                    row.custom_exchange_rate = exchangerate;
                                    row.warehouse = item.location;
                                    row.custom_duty = item.custom_duty;
                                    row.custom_custom_duty = item.custom_duty * item.quantity;
                                    row.schedule_date = value_date;
    
                                    // Fetch item details and wait for completion
                                    await get_item(row, item.item_code);
                                    frm.script_manager.trigger('item_code', row.doctype, row.name);
                                    // Refresh the child table after setting all fields
                                    frm.refresh_field('items');

                                    sufficient_stock_found = true; // Stock is available for this item

                                }
                               
                            }

                          // If no sufficient stock was found, show the message
                            if (!sufficient_stock_found) {
                                frappe.msgprint("Stock is not available for any item at the selected location.");
                            }

    
                            // Refresh the child table after all rows are processed
                            frm.refresh_field('items');
                        } 
                    } else {
                        console.log('No data found for Purchase Indent');
                    }
                }
            });
        }
        else{
            frappe.msgprint("Please specify the Indent No and Location")
        }
    },

    transaction_date(frm) {
        update_date(frm)
    },
   
    onload:async function(frm){
                

       if(frm.is_new()){
        exchangerate = await exchange_rate()

            $.each(frm.doc.items || [], function(i, v) {
                frappe.model.set_value(v.doctype, v.name, "custom_exchange_rate", exchangerate)
            })
        update_date(frm)
       }
        
         //    selected supplier wise filtered purchase indent record in link field 
         frm.set_query("custom_purchase_indent", function() {
            
            return {
                "filters": {
                        "supplier":frm.doc.supplier,
                        "status":"Completed",
                    }
            }
        })
    },
    
    validate(frm) {
        get_duty_account(frm);

    },
    before_save(frm) {
        
        let total_custom_duty = 0;
        frm.doc.items.forEach(row => {
            row.custom_custom_duty = row.qty * row.custom_duty;
            total_custom_duty += row.custom_custom_duty;
        });

        frm.set_value('custom_total_custom_duty', total_custom_duty);
        frm.refresh_field('items');


        const existing_entry = frm.doc.taxes.find(row => row.account_head === custom_duty_account);
        if (existing_entry) {
            existing_entry.tax_amount = total_custom_duty;
        } else {
            frm.add_child("taxes", {
                charge_type: "Actual",
                account_head: custom_duty_account,
                tax_amount: total_custom_duty,
                description: "Custom Duty"
            });
        }
    },
    // set_warehouse(frm){
    //    set_location_wise_qty(frm)
    // },



});

function update_date(frm) {
    let transactionDate = new Date(frm.doc.transaction_date);
         let businessDaysAdded = 0;
 
         // Loop to add two business days
         while (businessDaysAdded < 2) {
             transactionDate.setDate(transactionDate.getDate() + 1);
             // Check if the current day is a business day (Monday to Friday)
             if (transactionDate.getDay() !== 0 && transactionDate.getDay() !== 6) {  // Sunday = 0, Saturday = 6
                 businessDaysAdded += 1;
             }
         }
 
         // Format the date as YYYY-MM-DD
         let formattedDate = transactionDate.getFullYear() + '-' 
                             + (transactionDate.getMonth() + 1).toString().padStart(2, '0') + '-'
                             + transactionDate.getDate().toString().padStart(2, '0');
 
 
         // Set the delivery_date field to the calculated date
         frm.set_value('schedule_date', formattedDate);
        
}

frappe.ui.form.on('Purchase Order Item', {
     
    custom_duty(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.custom_custom_duty += row.custom_duty;

        calculate_custom_duty(frm, cdt, cdn);
        frm.refresh_field("items")
    },
    qty(frm, cdt, cdn) {
        // calculate_custom_duty(frm, cdt, cdn);
        const row = locals[cdt][cdn];
      
        if(row.custom_rate_usd > 0)
        {
            calculate_internation_rate(frm, cdt, cdn);
            convert_inr_rate(frm, cdt, cdn);
        }
        frm.refresh_field("items")
    },
    custom_rate_usd(frm, cdt, cdn) {
        calculate_internation_rate(frm, cdt, cdn);
        convert_inr_rate(frm, cdt, cdn);
        frm.refresh_field("items")
    },
    custom_custom_duty(frm, cdt, cdn) {
        calculate_internation_rate(frm, cdt, cdn);
        convert_inr_rate(frm, cdt, cdn);
        frm.refresh_field("items")
    },
    custom_premium:function(frm,cdt,cdn){
        calculate_internation_rate(frm, cdt, cdn);
        convert_inr_rate(frm, cdt, cdn);
        frm.refresh_field("items")
    },

    items_add: async function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        exchangerate = await exchange_rate()
        item.custom_exchange_rate = exchangerate;
        frm.refresh_field('items');
        
    },
    item_code: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        // Check if the row is newly created or the item_code is being changed
        if (!row.__islocal || row.__unsaved) {
            item_wise_qty(frm,row.item_code)
        }


        
        const item = row.item_code
        const location = frm.doc.set_warehouse
        const indent = frm.doc.custom_purchase_indent
        
        frappe.call({
            method: "amrapali.amrapali.override.api.purchase_order.get_stock_summary", 
            args: {
                item: item,
                location: location,
                indent: indent
            },
            callback: function(response) {
                if(response.message.length == 0){
                    row.custom_validate_qty = 0
                }
                if (response && response.message && Array.isArray(response.message)) {

                    let filteredRecords = response.message

                    let latestRecord = filteredRecords[0];
                    var custom_duty = latestRecord.custom_duty
                    var qty = latestRecord.quantity
                    var indent_tab_id = latestRecord.name
                    
                    if (latestRecord) {
                        
                        if(custom_duty && qty && indent_tab_id)
                        {
                           
                            row.custom_duty = custom_duty
                            row.custom_validate_qty = qty
                            row.custom_indent_reference_id = indent_tab_id
                        }
                        else{
                            row.custom_validate_qty = 0
                        }
                    }
                } 
                

            }
        });
        
        
      
    }

    
});

function calculate_custom_duty(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);
    if (row.custom_duty && row.qty) {
        row.custom_custom_duty = row.qty * row.custom_duty;
    } else {
        row.custom_custom_duty = 0;
    }

}


function get_duty_account(frm) {
    var company = frm.doc.company;


    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Company",
            fieldname: "default_customs_expense_account",
            filters: { name: company }
        },
        callback: function (r) {
            if (r.message) {
                custom_duty_account = r.message.default_customs_expense_account
                
            } else {
                
            }
        }
    });
}




function convert_inr_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    
    rate = row.custom_internation_rate * row.custom_exchange_rate
    amount = rate * row.quantity    
    frappe.model.set_value(cdt, cdn, "rate", rate);
    frappe.model.set_value(cdt, cdn, "amount", amount);
}


function calculate_internation_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    var total_usd_rate = ((row.custom_rate_usd + row.custom_premium) * row.custom_conversion)
    row.custom_internation_rate = total_usd_rate;
    row.custom_total_internation_rate = row.qty * total_usd_rate;
    calculate_custom_duty(frm, cdt, cdn)
    frm.refresh_field("items")
}



// get item wise quantity from purchase indent
function item_wise_qty(frm,item){
    frappe.call({
        method:"amrapali.amrapali.override.api.stock_balance.item_wise_stock",
        args:{
            warehouse:frm.doc.set_warehouse,
            item:item,
            indent:frm.doc.custom_purchase_indent
        },
        callback:function(r){
            if(r.message){
                var stock_balance = r.message.quantity
              
            }
          
        }
    })
}


// get currency exchange rate
async function exchange_rate() {
        const response = await frappe.call({
            method: "erpnext.setup.utils.get_exchange_rate",
            args: {
                from_currency: "USD",
                to_currency: "INR",
            },
        });
        return response.message; 
    
}