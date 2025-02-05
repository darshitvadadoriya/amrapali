var single_threshold
var tax_withholding_rate
var tds_category = "TDSTDS Receivable - AD"

var company_account
var company_name
var customer_name
var sales_invoice_id
var outstanding_amount
var total
var rates

async function send_bulk_mail(listview) {

    const selected_records = listview.get_checked_items();

    if (!selected_records.length) {
        frappe.msgprint(__('Please select at least one record'));
        return false;
    }

    // Check if any record is in Draft or Cancelled state
    const hasDraftOrCancelled = selected_records.some(record => 
        record.docstatus === 0 || // Draft
        record.docstatus === 2    // Cancelled
    );

    if (hasDraftOrCancelled) {
        frappe.msgprint(__('Selected records contain Draft or Cancelled documents'));
        return false;
    }
    console.log(selected_records)

    frappe.confirm(
        'Are you sure you want to proceed sending e-mail?',
        function () {

            frappe.dom.freeze("Sending Emails. Please wait...");



            frappe.call({
                method: 'amrapali.amrapali.override.api.api.send_bulk_mail',
                args: {
                    'list': selected_records,
                    'doctype': listview.doctype
                },
                callback: (res) => {
                    console.log(res, 'henjnfd')
                    // Unfreeze the screen
                    frappe.dom.unfreeze()

                    // Show success alert and refresh list view after completion
                    frappe.show_alert({ message: "Emails Successfully Sent!", indicator: "green" });
                }
            })

        },
        function () {
            // No action
        }
    );



}


frappe.listview_settings['Sales Invoice'] = {
    refresh: function (listview) {
        listview.page.add_inner_button("Deduct TDS", function () {
            frappe.confirm('Are you sure you want to Deduct TDS on this invoices?', async function () {
                window.close();
                deduct_tds(listview);
            },
                function () {
                    console.log("Action not perform");
                })
        });;
        listview.page.add_inner_button("Send Bulk Mail", function () {
            send_bulk_mail(listview);
        });;
    },
};



async function deduct_tds(listview) {

    const selected_records = listview.get_checked_items();

    // freez screen with a custom message
    frappe.dom.freeze("Processing TDS deduction. Please wait...");

    await tds_deduct(selected_records);

    // unfreez screen
    frappe.dom.unfreeze()

    // success alert message
    frappe.show_alert({ message: "TDS deduction completed successfully!", indicator: "green" });

    //  refresh the list view after 3 seconds
    setTimeout(() => {
        window.location.reload()
    }, 3000);
}


async function tds_deduct(selected_records) {
    var applied_tds_list = []
    for (const data of selected_records) {
        console.log(data);

        if (!data.name) {
            frappe.msgprint("Sales Invoice is missing in the selected row.");
            continue;
        }

        const sales_invoice_id = data.name;

        try {
            // Fetch Sales Invoice details
            const salesInvoice = await frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Sales Invoice",
                    filters: { name: sales_invoice_id, docstatus: 1 },
                    fieldname: ["customer", "company", "custom_tds_applied", "status", "total", "outstanding_amount", "custom_apply_tcs"],
                },
            });

            console.log("TCS APPLIED ALREADY");
            console.log(salesInvoice.message.custom_apply_tcs == 0);

            if (
                salesInvoice.message &&
                salesInvoice.message.custom_tds_applied != 1 &&
                salesInvoice.message.status != "Cancelled" &&
                salesInvoice.message.custom_apply_tcs == 0
            ) {
                const {
                    customer: customer_name,
                    company: company_name,
                    total,
                    outstanding_amount,
                } = salesInvoice.message;

                const tds_value = (total * tax_withholding_rate) / 100;

                // Fetch Customer details
                const customer = await frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Customer",
                        name: customer_name,
                    },
                });

                if (!customer.message) {
                    console.error("No data found for the given customer.");
                    continue;
                }
                let customer_account
                customer.message.accounts.forEach((data) => {

                    if (salesInvoice.message.company == data.company) {
                        customer_account = data.account;

                    }
                });
                // const customer_account = customer.message.accounts[0].account;
                const tax_category = customer.message.custom_tds_category;

                // Fetch Tax Withholding Category details
                const taxCategory = await frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Tax Withholding Category",
                        name: tax_category,
                    },
                });

                if (!taxCategory.message || !taxCategory.message.rates) {
                    frappe.msgprint("Tax Withholding Category rates not found.");
                    continue;
                }

                const account_list = taxCategory.message.accounts;
                const rates = taxCategory.message.rates;  // Ensure rates is fetched here
                const companyAccountData = account_list.find((account) => account.company === company_name);

                if (!companyAccountData) {
                    frappe.throw("Please set an account for this company.");
                    continue;
                }

                const company_account = companyAccountData.account;

                const currentDate = new Date();
                console.log(currentDate);
                try {
                    // Call a Frappe server-side method to fetch the fiscal year
                    const response = await frappe.call({
                        method: "frappe.client.get_value",
                        args: {
                            doctype: "Fiscal Year",
                            filters: {
                                'year_start_date': ['<=', currentDate],
                                'year_end_date': ['>=', currentDate]
                            },
                            fieldname: ['name', 'year_start_date', 'year_end_date']
                        }
                    });

                    if (response && response.message) {
                        const fiscalYear = response.message;
                        const fiscalYearStart = new Date(fiscalYear.year_start_date);
                        const fiscalYearEnd = new Date(fiscalYear.year_end_date);


                        // Loop through the rates and check if they match the fiscal year's start and end dates
                        for (let rate of rates) {
                            const fromDate = new Date(rate.from_date);
                            const toDate = new Date(rate.to_date);

                            // Check if the from_date and to_date match the fiscal year's start and end dates
                            if (fromDate >= fiscalYearStart && toDate <= fiscalYearEnd) {
                                console.log(`For Fiscal Year ${fiscalYear.name}:`);
                                console.log(`Tax Withholding Rate: ${rate.tax_withholding_rate}`);

                                let tax_withholding_rate = rate.tax_withholding_rate;
                                let single_invoice_amount = rate.single_threshold;
                                console.log(total);


                                const taxWithholdingRate = rate.tax_withholding_rate;
                                const singleInvoiceAmount = rate.single_threshold;

                                if (total > singleInvoiceAmount) {
                                    const tcsAmount = ((total - singleInvoiceAmount) * taxWithholdingRate) / 100;
                                    // cutTds(frm, tcsAmount, customerAccount, companyAccount);
                                    console.log(customer_account);
                                    await cut_tds(
                                        total,
                                        tcsAmount,
                                        customer_account,
                                        company_account,
                                        company_name,
                                        customer_name,
                                        sales_invoice_id,
                                        outstanding_amount
                                    );
                                } else {
                                    frappe.msgprint("The invoice total is less than the deduction limit amount.");
                                }
                            }
                        }
                    } else {
                        console.log('Current Fiscal Year not found.');
                    }
                } catch (error) {
                    console.error('Error fetching Fiscal Year data:', error);
                }


            }
            else{
                applied_tds_list.push(salesInvoice.message.name)
            }
           
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }

    // if(applied_tds_list){
    //     frappe.msgprint(applied_tds_list)
    // }
}






async function cut_tds(
    total,
    tcsAmount,
    customer_account,
    company_account,
    company_name,
    customer_name,
    sales_invoice_id,
    outstanding_amount
) {
    console.log(total, customer_account, company_name, customer_name, sales_invoice_id, outstanding_amount);

    try {
        const response = await frappe.call({
            method: "amrapali.amrapali.override.api.tds.create_journal_entry",
            args: {
                sales_invoice: sales_invoice_id,
                customer_name: customer_name,
                tds_value: tcsAmount,
                company: company_name,
                customer_account: customer_account,
                company_account: company_account,
                outstanding_amount: outstanding_amount,
            },
        });

        const journal_entry = response.message.name;

        if (journal_entry) {
            await frappe.db.set_value("Sales Invoice", sales_invoice_id, {
                custom_tds_applied: 1,
                custom_jv: journal_entry,
            });
        }
    } catch (error) {
        console.error("Error creating journal entry:", error);
    }
}




