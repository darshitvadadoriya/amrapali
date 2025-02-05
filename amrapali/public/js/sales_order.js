// Event handler for 'Sales Order' doctype
frappe.ui.form.on('Sales Order', {
    transaction_date(frm) {
        update_date(frm)
    },

    // Triggered when the customer field is changed
    customer(frm) {
    },

    onload:async function(frm){

        // remove custom buttons
        setTimeout(() => {
            frm.remove_custom_button('Pick List', 'Create');
            frm.remove_custom_button('Work Order', 'Create');
            frm.remove_custom_button('Material Request', 'Create');
            frm.remove_custom_button('Request for Raw Materials', 'Create');
            frm.remove_custom_button('Purchase Order', 'Create');
            frm.remove_custom_button('Project', 'Create');
        }, 100);

        


        if(frm.is_new()){
        
            if( !frm.doc.delivery_date ) {
                update_date(frm)
             }
         exchangerate = await exchange_rate()
         console.log(exchangerate);
             $.each(frm.doc.items || [], function(i, v) {
                 frappe.model.set_value(v.doctype, v.name, "custom_currency_exchange_rate", exchangerate)
             })
         // Calculate two business days after today
         
        
        }
     }
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
 
         // Log the formatted date for debugging purposes
         console.log(formattedDate);
 
         // Set the delivery_date field to the calculated date
         frm.set_value('delivery_date', formattedDate);
        
}

frappe.ui.form.on('Sales Order Item', {
    custom_premium(frm, cdt, cdn) {
        let row = locals[cdt][cdn]; 
        update_rate(frm, row); 
    },
    
    custom_mcx_rate(frm, cdt, cdn) {
        let row = locals[cdt][cdn]; 
        update_rate(frm, row); 
    },
    
    custom_currency_exchange_rate(frm, cdt, cdn){
        let row = locals[cdt][cdn]; 
        update_rate(frm, row);
    },

    items_add: async function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        set_exchange_rate(row) 
    },
    // weight calculation
    qty: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    },
    weight_uom: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    },
    custom_item_weight: function(frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        update_weight(frm, child);
    }

});

function update_rate(frm, row) {

    let custom_premium = row.custom_premium || 0;
    let custom_mcx_rate = row.custom_mcx_rate || 0;
    // let custom_currency_exchange_rate = row.custom_currency_exchange_rate;
    let rate = (custom_mcx_rate + custom_premium );

    if( row.custom_divide ) {
        rate /= row.custom_multiplier;
    }
    else {
        rate *= row.custom_multiplier;
    }
    
    frappe.model.set_value(row.doctype, row.name, 'rate', rate);
    frappe.model.set_value(row.doctype, row.name, 'custom_currency_exchange_rate', custom_currency_exchange_rate)
}

// Function to fetch the exchange rate from USD to INR
function exchange_rate() {
    return frappe.call({
        // Server-side method to get the exchange rate
        method: "erpnext.setup.utils.get_exchange_rate",
        args: {
            from_currency: "USD", // Source currency
            to_currency: "INR" // Target currency
        }
    }).then(response => {
        // Return the exchange rate from the server response
        return response.message;
    });
}

function set_exchange_rate(row) {
    exchange_rate().then(custom_currency_exchange_rate => {
        console.log(custom_currency_exchange_rate)
        frappe.model.set_value(row.doctype, row.name, 'custom_currency_exchange_rate', custom_currency_exchange_rate)
    })
}



// // Update weight and calculate total weight
// function update_weight(frm, child) {
//     // Get the item weight from the Item master (assuming the weight field exists)
//     frappe.db.get_value('Item', child.item_code, 'weight').then(res => {
//         let weight = res.message.weight || 0;
//         let qty = child.qty || 0;
        
//         if (child.uom === 'KG') {
//             // If UOM is KG, weight is in KG
//             child.weight = weight * qty;
//         } else if (child.uom === 'Gram') {
//             // If UOM is Gram, convert weight from KG to Gram
//             child.weight = (weight * 1000) * qty; // Convert KG to Gram
//         }
        
//         frm.refresh_field('items');  // Refresh the item table to show updated weight
//         calculate_total_weight(frm); // Recalculate total weight on the Sales Order level
//     });
// }

// function calculate_total_weight(frm) {
//     let total_weight = 0;
//     frm.doc.items.forEach(item => {
//         total_weight += item.weight || 0;
//     });
//     frm.set_value('total_net_weight', total_weight);  // Set total weight on Sales Order level
// }




// calculate weight
function update_weight(frm, child) {
    let custom_item_weight = child.custom_item_weight || 0;
    let qty = child.qty || 0;

    if (child.weight_uom == 'Kg') {
        let kg_to_gram = custom_item_weight * 1000 * qty; // Convert Kg to Gram and multiply by qty
        child.custom_total_item_weight = kg_to_gram 
        child.custom_pending_weight = kg_to_gram / 1000
    } else if (child.weight_uom == 'Gram') {
        let set_weight = custom_item_weight * qty; // Multiply weight by qty if already in Gram
        child.custom_total_item_weight = set_weight 
        child.custom_pending_weight = set_weight /1000
    }

    frm.refresh_field('items');
    calculate_total_weight(frm);
}

function calculate_total_weight(frm) {
    let total_weight = 0;
    frm.doc.items.forEach(item => {
        total_weight += item.custom_total_item_weight || 0;
    });
    frm.set_value('custom_total_weight', total_weight/1000);
    frm.set_value('custom_pending_weight', total_weight/1000);
}

