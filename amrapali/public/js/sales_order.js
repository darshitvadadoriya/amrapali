// Event handler for 'Sales Order' doctype
frappe.ui.form.on('Sales Order', {
    // Triggered when the customer field is changed
    customer(frm) {
        frappe.throw('hello'); // Simple alert to test the trigger
    },
    onload:async function(frm){
        if(frm.is_new()){
         exchangerate = await exchange_rate()
         console.log(exchangerate);
             $.each(frm.doc.items || [], function(i, v) {
                 frappe.model.set_value(v.doctype, v.name, "custom_currency_exchange_rate", exchangerate)
             })
        }
         
     }
});

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
    let rate = custom_mcx_rate + (custom_premium * custom_currency_exchange_rate);
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
