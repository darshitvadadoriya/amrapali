var single_threshold
var tax_withholding_rate
var tds_category = "TDSTDS Receivable - AD"
var customer_account
var company_account
var company_name
var customer_name
var sales_invoice_id
var outstanding_amount
var total
var rates


frappe.listview_settings['Sales Invoice'] = {
   refresh: function(listview) {
       listview.page.add_inner_button("Deduct TDS", function() {
           deduct_tds(listview);
       });;
   },
};











// function deduct_tds(listview) {
//     // Get selected records from the Sales Invoice list view
//     const selected_records = frappe.get_list_view("Sales Invoice").get_checked_items();

//     // Create a dialog to select TDS Category
//     let d = new frappe.ui.Dialog({
//         title: 'Enter details',
//         fields: [
//             {
//                 label: 'TDS Category',
//                 fieldname: 'tds_category',
//                 fieldtype: 'Link',
//                 options: "Tax Withholding Category",
//             },
//         ],
//         size: 'small',
//         primary_action_label: 'Submit',
//         primary_action: async function (values) {
//             console.log(values.tds_category);
//             const tds_category = values.tds_category;
//             d.hide();

//             try {
//                 // Fetch TDS details
//                 const response = await frappe.call({
//                     method: 'amrapali.amrapali.override.api.tds.get_tds_details',
//                     args: { tax_category_name: tds_category },
//                 });

//                 const tax_withholding_rate = response.message.tax_withholding_rate;

//                 // Call `tds_deduct` with the selected records and rate
//                 await tds_deduct(selected_records, tax_withholding_rate);
//             } catch (error) {
//                 console.error("Error fetching TDS details:", error);
//             }
//         },
//     });

//     d.show();
// }

// async function tds_deduct(selected_records, tax_withholding_rate) {
//     for (const data of selected_records) {
//         console.log(data);

//         if (!data.name) {
//             frappe.msgprint("Sales Invoice is missing in the selected row.");
//             continue;
//         }

//         const sales_invoice_id = data.name;

//         try {
//             // Fetch Sales Invoice details
//             const salesInvoice = await frappe.call({
//                 method: "frappe.client.get_value",
//                 args: {
//                     doctype: "Sales Invoice",
//                     filters: { name: sales_invoice_id },
//                     fieldname: ["customer", "company", "custom_tds_applied", "status", "total", "outstanding_amount"],
//                 },
//             });

//             if (
//                 salesInvoice.message &&
//                 salesInvoice.message.custom_tds_applied != 1 &&
//                 salesInvoice.message.status != "Cancelled"
//             ) {
//                 const {
//                     customer: customer_name,
//                     company: company_name,
//                     total,
//                     outstanding_amount,
//                 } = salesInvoice.message;

//                 const tds_value = (total * tax_withholding_rate) / 100;

//                 // Fetch Customer details
//                 const customer = await frappe.call({
//                     method: "frappe.client.get",
//                     args: {
//                         doctype: "Customer",
//                         name: customer_name,
//                     },
//                 });

//                 if (!customer.message) {
//                     console.error("No data found for the given customer.");
//                     continue;
//                 }

//                 const customer_account = customer.message.accounts[0].account;
//                 const tax_category = customer.message.custom_tds_category;

//                 // Fetch Tax Withholding Category details
//                 const taxCategory = await frappe.call({
//                     method: "frappe.client.get",
//                     args: {
//                         doctype: "Tax Withholding Category",
//                         name: tax_category,
//                     },
//                 });

//                 const account_list = taxCategory.message.accounts;

//                 const companyAccountData = account_list.find((account) => account.company === company_name);

//                 if (!companyAccountData) {
//                     frappe.throw("Please set an account for this company.");
//                     continue;
//                 }

//                 const company_account = companyAccountData.account;

              


//                  // Get the current date
//                  const currentDate = new Date();

//                  // Call a Frappe server-side method to fetch the fiscal year
//                  frappe.call({
//                      method: "frappe.client.get_value",
//                      args: {
//                          doctype: "Fiscal Year", 
//                          filters: {
//                              'year_start_date': ['<=', currentDate], 
//                              'year_end_date': ['>=', currentDate]
//                          },
//                          fieldname: ['name', 'year_start_date', 'year_end_date']
//                      },
//                      callback: function(response) {
//                          if (response && response.message) {
//                              const fiscalYear = response.message;
//                              const fiscalYearStart = new Date(fiscalYear.year_start_date);
//                              const fiscalYearEnd = new Date(fiscalYear.year_end_date);

//                              console.log(`Current Fiscal Year: ${fiscalYear.name}`);
//                              console.log(`Start Date: ${fiscalYearStart}`);
//                              console.log(`End Date: ${fiscalYearEnd}`);

                             
                             
//                              // Loop through rows and check if from_date and to_date match the fiscal year range
//                              rates.forEach(rate => {
//                                  const fromDate = new Date(rate.from_date);
//                                  const toDate = new Date(rate.to_date);

//                                  // Check if the from_date and to_date match the fiscal year's start and end dates
//                                  if (fromDate >= fiscalYearStart && toDate <= fiscalYearEnd) {
//                                      console.log(`For Fiscal Year ${fiscalYear.name}:`);
//                                      console.log(`Tax Withholding Rate: ${rate.tax_withholding_rate}`);
//                                      tax_withholding_rate = rate.tax_withholding_rate
//                                      single_invoice_amount = rate.single_threshold

//                                      if(frm.doc.total > single_invoice_amount){
//                                           // Call the cut_tds function
//                                             await cut_tds(
//                                                 total,
//                                                 tax_withholding_rate,
//                                                 customer_account,
//                                                 company_account,
//                                                 company_name,
//                                                 customer_name,
//                                                 sales_invoice_id,
//                                                 outstanding_amount
//                                             );
//                                      }
//                                      else{
//                                         frappe.msgprint("The invoice total is less than the deduction limit amount.")
//                                      }
//                                  }
//                              });
//                          } else {
//                              console.log('Current Fiscal Year not found.');
//                          }
//                      },
//                      error: function(error) {
//                          console.error('Error fetching Fiscal Year data:', error);
//                      }
//                  });
//             }
//         } catch (error) {
//             console.error("An error occurred:", error);
//         }
//     }
// }

// async function cut_tds(
//     total,
//     tax_withholding_rate,
//     customer_account,
//     company_account,
//     company_name,
//     customer_name,
//     sales_invoice_id,
//     outstanding_amount
// ) {
//     console.log(total, tax_withholding_rate, customer_account, company_name, customer_name, sales_invoice_id, outstanding_amount);

//     const tds_value = (total * tax_withholding_rate) / 100;
//     console.log(tds_value);

//     try {
//         const response = await frappe.call({
//             method: "amrapali.amrapali.override.api.tds.create_journal_entry",
//             args: {
//                 sales_invoice: sales_invoice_id,
//                 customer_name: customer_name,
//                 tds_value: tds_value,
//                 company: company_name,
//                 customer_account: customer_account,
//                 company_account: company_account,
//                 outstanding_amount: outstanding_amount,
//             },
//         });

//         const journal_entry = response.message.name;

//         if (journal_entry) {
//             await frappe.db.set_value("Sales Invoice", sales_invoice_id, {
//                 custom_tds_applied: 1,
//                 custom_journal_entry: journal_entry,
//             });
//         }
//     } catch (error) {
//         console.error("Error creating journal entry:", error);
//     }
// }








async function deduct_tds(listview) {
   
    const selected_records = listview.get_checked_items();
   
     // Freeze the screen with a custom message
     frappe.dom.freeze("Processing TDS deduction. Please wait...");

     await tds_deduct(selected_records);
 
     // Unfreeze the screen
     frappe.dom.unfreeze()

     // Show success alert and refresh list view after completion
     frappe.show_alert({ message: "TDS deduction completed successfully!", indicator: "green" });

     // Refresh the list view after 3 seconds
     setTimeout(() => {
         window.location.reload()
     }, 3000);
}


async function tds_deduct(selected_records) {
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
                    filters: { name: sales_invoice_id },
                    fieldname: ["customer", "company", "custom_tds_applied", "status", "total", "outstanding_amount"],
                },
            });

            if (
                salesInvoice.message &&
                salesInvoice.message.custom_tds_applied != 1 &&
                salesInvoice.message.status != "Cancelled"
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

                const customer_account = customer.message.accounts[0].account;
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
                        if (total > single_invoice_amount) {
                            // Call the cut_tds function asynchronously
                            await cut_tds(
                                total,
                                tax_withholding_rate,
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
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
}






async function cut_tds(
    total,
    tax_withholding_rate,
    customer_account,
    company_account,
    company_name,
    customer_name,
    sales_invoice_id,
    outstanding_amount
) {
    console.log(total, tax_withholding_rate, customer_account, company_name, customer_name, sales_invoice_id, outstanding_amount);

    const tds_value = (total * tax_withholding_rate) / 100;
    console.log(tds_value);

    try {
        const response = await frappe.call({
            method: "amrapali.amrapali.override.api.tds.create_journal_entry",
            args: {
                sales_invoice: sales_invoice_id,
                customer_name: customer_name,
                tds_value: tds_value,
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
                custom_journal_entry: journal_entry,
            });
        }
    } catch (error) {
        console.error("Error creating journal entry:", error);
    }
}





