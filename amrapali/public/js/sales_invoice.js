var single_threshold
var tax_withholding_rate
var tds_category
var customer_account
var company_account
var rates
var single_invoice_amount


// frappe.ui.form.on('Sales Invoice', {
//     onload: function(frm) {
//         if (frm.is_new() && frm.doc.__islocal) {
//             // fields set blank on duplicate form from another form
//             frm.set_value('custom_tds_applied', 0);
//             frm.set_value('custom_journal_entry', '');
//         }
//     },
// 	refresh(frm) {
//         if(frm.doc.custom_tds_applied != 1 && frm.doc.docstatus == "1")   
//         {
//             frm.add_custom_button("Deduct TDS",function(){

            

//                 var customer = frm.doc.customer

//                 frappe.call({
//                     method: "frappe.client.get",
//                     args: {
//                         doctype: "Customer",
//                         name: customer, 
//                     },
//                     callback: function (res) {
//                         console.log(res);
//                         if (res && res.message) {
//                             customer_account = res.message.accounts[0].account
//                             tax_category = res.message.custom_tds_category
//                             if(tax_category)
//                             {
//                                 frappe.call({
//                                     method: "frappe.client.get",
//                                     args: {
//                                         doctype: "Tax Withholding Category",
//                                         name: tax_category, // The unique name of the customer
//                                     },
//                                     callback: function (res) {
//                                         console.log(res);
//                                         var account_list = res.message.accounts
//                                         rates = res.message.rates
//                                         console.log(rates);
//                                         $.each(account_list,function(index,data){
//                                             if(frm.doc.company == data.company)
//                                             {
//                                                 company_account = data.account

//                                                 // Get the current date
//                          const currentDate = new Date();

//                          // Call a Frappe server-side method to fetch the fiscal year
//                          frappe.call({
//                              method: "frappe.client.get_value",
//                              args: {
//                                  doctype: "Fiscal Year", 
//                                  filters: {
//                                      'year_start_date': ['<=', currentDate], 
//                                      'year_end_date': ['>=', currentDate]
//                                  },
//                                  fieldname: ['name', 'year_start_date', 'year_end_date']
//                              },
//                              callback: function(response) {
//                                  if (response && response.message) {
//                                      const fiscalYear = response.message;
//                                      const fiscalYearStart = new Date(fiscalYear.year_start_date);
//                                      const fiscalYearEnd = new Date(fiscalYear.year_end_date);

//                                      console.log(`Current Fiscal Year: ${fiscalYear.name}`);
//                                      console.log(`Start Date: ${fiscalYearStart}`);
//                                      console.log(`End Date: ${fiscalYearEnd}`);

                                     
                                     
//                                      // Loop through rows and check if from_date and to_date match the fiscal year range
//                                      rates.forEach(rate => {
//                                          const fromDate = new Date(rate.from_date);
//                                          const toDate = new Date(rate.to_date);

//                                          // Check if the from_date and to_date match the fiscal year's start and end dates
//                                          if (fromDate >= fiscalYearStart && toDate <= fiscalYearEnd) {
//                                              console.log(`For Fiscal Year ${fiscalYear.name}:`);
//                                              console.log(`Tax Withholding Rate: ${rate.tax_withholding_rate}`);
//                                              tax_withholding_rate = rate.tax_withholding_rate
//                                              single_invoice_amount = rate.single_threshold

//                                              if(frm.doc.total > single_invoice_amount){
//                                                 cut_tds(frm,tax_withholding_rate,customer_account,company_account)
//                                              }
//                                              else{
//                                                 frappe.msgprint("The invoice total is less than the deduction limit amount.")
//                                              }
//                                          }
//                                      });
//                                  } else {
//                                      console.log('Current Fiscal Year not found.');
//                                  }
//                              }
//                         });
//                                             }
//                                             else{
//                                                 frappe.throw("please set account for this company")
//                                             }
//                                         })



//                                         // get financial year wise tds rate

                                                                

                                    
//                                     }
//                                 });
//                             }
//                             // setTimeout(() => {
//                             //     cur_dialog.set_value("tds_category",tax_category)
//                             // }, 500);
                            
//                             } else {
//                                 console.error("No data found for the given customer.");
//                             }
//                         },
//                     });
                    

                             
//             })
//         }
//     }
               

            
       
// })


// function cut_tds(frm,tax_withholding_rate,customer_account,company_account) {
//     let tds_value = (frm.doc.total * tax_withholding_rate) / 100;
   
//     frappe.call({
//         method:"amrapali.amrapali.override.api.tds.create_journal_entry",
//         args:{
//             sales_invoice:frm.doc.name,
//             customer_name:frm.doc.customer,
//             tds_value:tds_value,
//             company:frm.doc.company,
//             customer_account:customer_account,
//             company_account:company_account,
//             outstanding_amount:frm.doc.outstanding_amount
//         },
//         callback:function(r){
//             var journal_entry = r.message.name
//             if(journal_entry){
//                 frappe.db.set_value("Sales Invoice",frm.doc.name,{"custom_tds_applied":1,"custom_journal_entry":journal_entry})
//             }
            
//         }
//     })
// }




frappe.ui.form.on('Sales Invoice', {
    onload: function(frm) {
        if (frm.is_new() && frm.doc.__islocal) {
            // Fields set to blank on duplicate form from another form
            frm.set_value('custom_tds_applied', 0);
            frm.set_value('custom_journal_entry', '');
        }
    },
    refresh(frm) {
        if (frm.doc.custom_tds_applied != 1 && frm.doc.docstatus == "1") {
            frm.add_custom_button("Deduct TDS", function() {
                frappe.dom.freeze("Processing TDS deduction...");

                let customer = frm.doc.customer;

                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Customer",
                        name: customer,
                    },
                    callback: function(res) {
                        if (res && res.message) {
                            let customer_account = res.message.accounts[0]?.account;
                            let tax_category = res.message.custom_tds_category;

                            if (tax_category) {
                                frappe.call({
                                    method: "frappe.client.get",
                                    args: {
                                        doctype: "Tax Withholding Category",
                                        name: tax_category,
                                    },
                                    callback: function(res) {
                                        if (res && res.message) {
                                            let account_list = res.message.accounts;
                                            let rates = res.message.rates;

                                            let company_account;
                                            $.each(account_list, function(index, data) {
                                                if (frm.doc.company === data.company) {
                                                    company_account = data.account;

                                                    // Get the current date
                                                    const currentDate = new Date();

                                                    frappe.call({
                                                        method: "frappe.client.get_value",
                                                        args: {
                                                            doctype: "Fiscal Year",
                                                            filters: {
                                                                'year_start_date': ['<=', currentDate],
                                                                'year_end_date': ['>=', currentDate],
                                                            },
                                                            fieldname: ['name', 'year_start_date', 'year_end_date'],
                                                        },
                                                        callback: function(response) {
                                                            if (response && response.message) {
                                                                const fiscalYear = response.message;
                                                                const fiscalYearStart = new Date(fiscalYear.year_start_date);
                                                                const fiscalYearEnd = new Date(fiscalYear.year_end_date);

                                                                // Loop through rows and check if from_date and to_date match the fiscal year range
                                                                rates.forEach(rate => {
                                                                    const fromDate = new Date(rate.from_date);
                                                                    const toDate = new Date(rate.to_date);

                                                                    if (fromDate >= fiscalYearStart && toDate <= fiscalYearEnd) {
                                                                        let tax_withholding_rate = rate.tax_withholding_rate;
                                                                        let single_invoice_amount = rate.single_threshold;

                                                                        if (frm.doc.total > single_invoice_amount) {
                                                                            cut_tds(frm, tax_withholding_rate, customer_account, company_account);
                                                                        } else {
                                                                            frappe.msgprint("The invoice total is less than the deduction limit amount.");
                                                                            frappe.ui.form.unfreeze();
                                                                        }
                                                                    }
                                                                });
                                                            } else {
                                                                console.error("Current Fiscal Year not found.");
                                                                frappe.ui.form.unfreeze();
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    frappe.throw("Please set account for this company");
                                                    frappe.ui.form.unfreeze();
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                frappe.msgprint("No TDS category found for the customer.");
                                frappe.ui.form.unfreeze();
                            }
                        }
                    },
                    error: function() {
                        frappe.ui.form.unfreeze();
                    }
                });

        

            });
        }
    }
});

function cut_tds(frm, tax_withholding_rate, customer_account, company_account) {
    let tds_value = (frm.doc.total * tax_withholding_rate) / 100;

    frappe.call({
        method: "amrapali.amrapali.override.api.tds.create_journal_entry",
        args: {
            sales_invoice: frm.doc.name,
            customer_name: frm.doc.customer,
            tds_value: tds_value,
            company: frm.doc.company,
            customer_account: customer_account,
            company_account: company_account,
            outstanding_amount: frm.doc.outstanding_amount,
        },
        callback: function(r) {
            if (r && r.message) {
                let journal_entry = r.message.name;
                if (journal_entry) {
                    frappe.db.set_value("Sales Invoice", frm.doc.name, {
                        "custom_tds_applied": 1,
                        "custom_journal_entry": journal_entry,
                    });
                }
            }
            frappe.dom.unfreeze();
            frappe.show_alert({ message: "TDS deduction completed successfully!", indicator: "green" });
        },
        error: function() {
            frappe.dom.unfreeze()
        }
    });
}
