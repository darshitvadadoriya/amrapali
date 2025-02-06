var single_threshold
var tax_withholding_rate
var tds_category
var customer_account
var company_account
var rates
var single_invoice_amount

frappe.ui.form.on('Sales Invoice Item', {

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


frappe.ui.form.on('Sales Invoice', {

    onload: function (frm) {

        // sending invoice to customer
        frm.add_custom_button('Send mail', function () {

            frappe.confirm(
                'Are you sure you want to proceed sending an e-mail?',
                function () {
        
                    frappe.dom.freeze("Sending Email. Please wait...");
        
        
        
                    frappe.call({
                        method: 'amrapali.amrapali.override.api.api.send_single_mail',
                        args: {

                            'parent_doctype': frm.doctype,
                            'parent_name': frm.doc.name,
                            'data': [
                                {
                                    'reference_doctype': frm.doctype,
                                    'reference_name': frm.doc.name
                                }
                               
                            ],

                            'msg': `Dear ${frm.doc.customer_name},\n\nPlease find attached the invoice ${frm.doc.name} for your recent purchase. If you have any questions or need assistance, feel free to reach out.\n\nThank you!`,
                            'subject': frm.doc.name,
                            'attachments': true,
                            'recipient_doctype': 'Customer',
                            'recipient_field': 'customer',
                            'email_field': 'email_id'

                        },
                        callback: (res) => {
                            console.log(res, 'henjnfd')
                            // Unfreeze the screen
                            frappe.dom.unfreeze()
        
                            // Show success alert and refresh list view after completion
                            frappe.show_alert({ message: "Email Successfully Sent!", indicator: "green" });
                        }
                    })
        
                }
            )
        });

        if (frm.is_new() && frm.doc.__islocal) {
            // Fields set to blank on duplicate form from another form
            frm.set_value('custom_tds_applied', 0);
            frm.set_value('custom_jv', '');
        }
    },
    customer: async function (frm) {
        
        await check_customer_taxcategory(frm)
    },
    refresh: async function (frm) {

        // remove custom buttons
        setTimeout(() => {
            frm.remove_custom_button('Maintenance Schedule', 'Create');
            frm.remove_custom_button('Dunning', 'Create');
            frm.remove_custom_button('Invoice Discounting', 'Create');
            frm.remove_custom_button('Fetch Timesheet');
            frm.remove_custom_button('Quality Inspection(s)','Create');
            frm.remove_custom_button('Quotation', 'Get Items From');
            frm.remove_custom_button('Delivery Order', 'Get Items From');
            frm.remove_custom_button('Sales Order', 'Get Items From');
    
        }, 100);
        
        await check_customer_taxcategory(frm)

        if (frm.doc.custom_tds_applied != 1 && frm.doc.docstatus == "1") {
            frm.add_custom_button("Deduct TDS", async function () {

                frappe.confirm('Are you sure you want to Deduct TDS on this invoice?', async function () {  
                    window.close(); 
                  
                frappe.dom.freeze("TDS Deduct in progress...");

                try {
                    let customer = frm.doc.customer;

                    // Fetch customer details
                    const customerData = await frappe.call({
                        method: "frappe.client.get",
                        args: { doctype: "Customer", name: customer },
                    });

                    if (customerData && customerData.message) {
                        let customerAccount;
                        customerData.message.accounts.forEach((data) => {

                            if (frm.doc.company == data.company) {
                                customerAccount = data.account;
                                console.log(customerAccount);
                            }
                        });

                        const taxCategory = customerData.message.custom_tds_category;

                        if (taxCategory) {
                            // Fetch Tax Withholding Category details
                            const taxCategoryData = await frappe.call({
                                method: "frappe.client.get",
                                args: { doctype: "Tax Withholding Category", name: taxCategory },
                            });

                            if (taxCategoryData && taxCategoryData.message) {
                                const { accounts: accountList, rates } = taxCategoryData.message;

                                let companyAccount;
                                accountList.forEach((data) => {
                                    if (data.company == frm.doc.company) {
                                        companyAccount = data.account;
                                    }
                                });

                                if (companyAccount) {
                                    // Get current fiscal year
                                    const fiscalYearData = await frappe.call({
                                        method: "frappe.client.get_value",
                                        args: {
                                            doctype: "Fiscal Year",
                                            filters: {
                                                'year_start_date': ['<=', new Date()],
                                                'year_end_date': ['>=', new Date()],
                                            },
                                            fieldname: ['name', 'year_start_date', 'year_end_date'],
                                        },
                                    });

                                    if (fiscalYearData && fiscalYearData.message) {
                                        const { year_start_date, year_end_date } = fiscalYearData.message;

                                        // Match rates within the fiscal year range
                                        rates.forEach((rate) => {
                                            const fromDate = new Date(rate.from_date);
                                            const toDate = new Date(rate.to_date);

                                            if (fromDate >= new Date(year_start_date) && toDate <= new Date(year_end_date)) {
                                                const taxWithholdingRate = rate.tax_withholding_rate;
                                                const singleInvoiceAmount = rate.single_threshold;

                                                if (frm.doc.total > singleInvoiceAmount) {
                                                    const tcsAmount = ((frm.doc.total - singleInvoiceAmount) * taxWithholdingRate) / 100;
                                                    cutTds(frm, tcsAmount, customerAccount, companyAccount);
                                                } else {
                                                    frappe.msgprint("The invoice total is less than the deduction limit amount.");
                                                }
                                            }
                                        });
                                    } else {
                                        frappe.msgprint("Current Fiscal Year not found.");
                                    }
                                } else {
                                    frappe.msgprint("No company account found for the Tax Withholding Category.");
                                }
                            }
                        } else {
                            frappe.msgprint("No TDS category found for the customer.");
                        }
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    frappe.dom.unfreeze();
                }
                },
                function () {
                   console.log("Action not perform");
                })
            });
        }
    },
    // custom_apply_tcs(frm) {
    //     if (frm.doc.custom_apply_tcs == 1) {

    //         processCustomerDetails(frm);

    //     }
    //     else {

    //         var tbl = frm.doc.taxes || [];
    //         tbl.forEach((row, index) => {
    //             if (row.account_head == company_account) {
    //                 cur_frm.get_field("taxes").grid.grid_rows[index].remove();
    //             }
    //         });

    //         frm.refresh_field("taxes");


    //     }
    // }
});

async function cutTds(frm, tcsAmount, customerAccount, companyAccount) {
    console.log(customerAccount);
    try {
        const response = await frappe.call({
            method: "amrapali.amrapali.override.api.tds.create_journal_entry",
            args: {
                sales_invoice: frm.doc.name,
                customer_name: frm.doc.customer,
                tds_value: tcsAmount,
                company: frm.doc.company,
                customer_account: customerAccount,
                company_account: companyAccount,
                outstanding_amount: frm.doc.outstanding_amount,
            },
        });

        if (response && response.message) {
            const journalEntry = response.message.name;

            if (journalEntry) {
                await frappe.db.set_value("Sales Invoice", frm.doc.name, {
                    "custom_tds_applied": 1,
                    "custom_jv": journalEntry,
                });
                frappe.show_alert({ message: "TDS deduction completed successfully!", indicator: "green" });
            }
        }
    } catch (error) {
        console.error(error);
    }
}








// for check tax category tds or tcs
async function check_customer_taxcategory(frm){
    if(frm.doc.customer)
    {
        const customer_tax = await frappe.call({
            method: "frappe.client.get",
            args: { doctype: "Customer", name: frm.doc.customer },
        });

        if(customer_tax.message){
            var customer_data = customer_tax.message
            if(customer_data.custom_apply_tds == 1)
            {
                // if apply tds in customer then then show checkbox in Invoice
                frm.set_df_property("custom_tds_applied", "hidden", 0);
            }
            else{
                frm.set_df_property("custom_tds_applied", "hidden", 1);

                // set timeout for loading buttona and after remove
                setTimeout(() => {
                    frm.remove_custom_button("Deduct TDS");
                }, 10);
            }
        }
    }

}







// calculate weight
function update_weight(frm, child) {
    let custom_item_weight = child.custom_item_weight || 0;
    let qty = child.qty || 0;

    if (child.weight_uom == 'Kg') {
        child.custom_total_item_weight = custom_item_weight * 1000 * qty; // Convert Kg to Gram and multiply by qty
        console.log(child.custom_total_item_weight);
    } else if (child.weight_uom == 'Gram') {
        child.custom_total_item_weight = custom_item_weight * qty; // Multiply weight by qty if already in Gram
        console.log(child.custom_total_item_weight);
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
}
