
var custom_custom_duty = 0;
var custom_duty_account;
var exchangerate;

frappe.ui.form.on('Purchase Invoice', {
    onload:async function(frm){
       
       if(frm.is_new()){
        exchangerate = await exchange_rate()
        console.log(exchangerate);
            $.each(frm.doc.items || [], function(i, v) {
                frappe.model.set_value(v.doctype, v.name, "custom_exchange_rate", exchangerate)
            })
       }
        
    },
    validate(frm) {
        get_duty_account(frm);

    },
    before_save(frm) {
        let total_custom_duty = 0;
        frm.doc.items.forEach(row => {
            total_custom_duty += row.custom_custom_duty;
        });

        frm.set_value("custom_total_custom_duty", total_custom_duty);

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
    set_warehouse(frm){
       set_location_wise_qty(frm)
    }

});

frappe.ui.form.on('Purchase Invoice Item', {
    custom_duty(frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        row.custom_custom_duty += row.custom_duty;

        calculate_custom_duty(frm, cdt, cdn);
        frm.refresh_field("items")
    },
    qty(frm, cdt, cdn) {
        // calculate_custom_duty(frm, cdt, cdn);
        calculate_internation_rate(frm, cdt, cdn);
        convert_inr_rate(frm, cdt, cdn);
        frm.refresh_field("items")
    },
    custom_internation_rate(frm, cdt, cdn) {
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
        console.log(item);
        exchangerate = await exchange_rate()
        item.custom_exchange_rate = exchangerate;
        frm.refresh_field('items');
        
    },

    
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
                console.log("Custom Duty Account:", r.message.default_customs_expense_account);
            } else {
                console.log("No default_customs_expense_account found for the selected company.");
            }
        }
    });
}


function convert_inr_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    
    // Calculate premium and rate
    var premium = row.custom_premium + row.custom_internation_rate;
    var total_premium = premium;
    var rate = total_premium * row.custom_conversion * row.custom_exchange_rate;
    var amount = rate * row.qty;

    // set rate and amount
    frappe.model.set_value(cdt, cdn, "rate", rate);
    frappe.model.set_value(cdt, cdn, "amount", amount);

    
}


function calculate_internation_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    row.custom_total_internation_rate = 0;
    var total_usd_rate = (row.custom_internation_rate + row.custom_premium) * row.qty
    row.custom_total_internation_rate += total_usd_rate;
    
    frm.refresh_field("items")
}


function set_location_wise_qty(frm,item=""){
    frappe.call({
        method:"amrapali.amrapali.override.api.stock_balance.get_latest_balance",
        args:{
            warehouse:frm.doc.set_warehouse,
            item:item
        },
        callback:function(r){
            console.log(r);
            if(r.message.length != 0){
                var stock_balance = r.message[0].available_balance
                frm.set_value("custom_available_stock",stock_balance)
                frm.refresh_field("custom_available_stock")
            }
            else{
                frm.set_value("custom_available_stock",0)
                frm.refresh_field("custom_available_stock")
            }
        }
    })
}


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