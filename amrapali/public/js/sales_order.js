// Event handler for 'Sales Order' doctype
frappe.ui.form.on('Sales Order', {
    transaction_date(frm) {
        update_date(frm)
    },

    // Triggered when the customer field is changed
    customer(frm) {
    },
    onload:async function(frm){
        if(frm.is_new()){
         exchangerate = await exchange_rate()
         console.log(exchangerate);
             $.each(frm.doc.items || [], function(i, v) {
                 frappe.model.set_value(v.doctype, v.name, "custom_currency_exchange_rate", exchangerate)
             })
         // Calculate two business days after today
        update_date(frm)
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
    }

});

function update_rate(frm, row) {

    let custom_premium = row.custom_premium || 0;
    let custom_mcx_rate = row.custom_mcx_rate || 0;
    let custom_currency_exchange_rate = row.custom_currency_exchange_rate;
    let rate = (custom_mcx_rate + (custom_premium * custom_currency_exchange_rate));
    rate *= row.custom_multiplier;
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
