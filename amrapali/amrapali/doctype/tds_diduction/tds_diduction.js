// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("TDS Diduction", {
	tds_category:function(frm) {
        frappe.call({
            method:'amrapali.amrapali.doctype.tds_diduction.tds_diduction.get_tds_details',
            args:{
                tax_category_name:frm.doc.tds_category
            },
            callback:function(r){
                var response_data = r.message
                console.log(response_data.single_threshold);
                console.log(response_data.tax_withholding_rate);
                frm.set_value("tds_rate",response_data.tax_withholding_rate)
                frm.set_value("amount",response_data.single_threshold)
            }
        })
	},
    get_sales_invoice:function(frm){
        frappe.call({
            method:"amrapali.amrapali.doctype.tds_diduction.tds_diduction.get_sale_invoice",
            callback:function(r){
                console.log(r.message);
                var invoice_data = r.message
                $.each(invoice_data,function(i,data){
                    console.log(data.customer);
                    let row = frm.add_child('invoice_details', {
                        "sales_invoice": data.name,
                        "customer": data.customer,
                        "net_total": data.total,
                        "taxable_amount": data.grand_total,
                    });
                    
                })

                frm.refresh_field("invoice_details")
              

            }
        })
    },
    diduct_tds: function (frm) {
        let selected = cur_frm.get_selected(); // Get selected rows in the child table

        // Iterate through selected child table rows
        $.each(selected.invoice_details, function (index, data) {
            let row = locals["TDS Diduction Invoices"][data];
            let tds_value = (row.net_total * frm.doc.tds_rate) / 100; // Calculate TDS value

            // Fetch customer name from Sales Invoice
            if (row.sales_invoice && !row.journal_entry) {
                frappe.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Sales Invoice",
                        filters: { name: row.sales_invoice },
                        fieldname: ["customer","company"],
                    },
                    callback: function (res) {
                        if (res.message) {
                            console.log(res.message);
                            let customer_name = res.message.customer;
                            let company_name = res.message.company;

                            // Create a Journal Entry for TDS deduction
                            frappe.call({
                                method:"amrapali.amrapali.doctype.tds_diduction.tds_diduction.create_journal_entry",
                                args:{
                                    sales_invoice:row.sales_invoice,
                                    customer_name:customer_name,
                                    tds_value:tds_value,
                                    company:company_name
                                },
                                callback:function(r){
                                    console.log(r);
                                    console.log(r.message.name);
                                    // frappe.db.set_value("TDS Diduction Invoices",data,"journal_entry",r.message.name)

                                }
                            })

                            // frappe.call({
                            //     method: "frappe.client.insert",
                            //     args: {
                            //         doc: {
                            //             doctype: "Journal Entry",
                            //             multi_currency:1,
                            //             accounts: [
                            //                 {
                            //                     account: "TDS Payable - AD",
                            //                     party_type: "Customer",
                            //                     party: customer_name,
                            //                     // debit_in_account_currency: tds_value,
                            //                     debit_in_account_currency: tds_value,
                            //                     account_currency:"INR"
                            //                 },
                            //                 {
                            //                     account: "Debtors - AD",
                            //                     party_type: "Customer",
                            //                     party: customer_name,
                            //                     credit_in_account_currency: tds_value,
                            //                     account_currency:"INR"
                            //                 },
                            //             ],
                            //             custom_sales_invoice: row.sales_invoice,
                            //         },
                            //     },
                            //     callback: function (response) {
                            //         console.log("Journal Entry Created:", response);
                            //     },
                            // });
                        } else {
                            frappe.msgprint("Some invoices already diduct tds");
                        }
                    },
                });

                
            } else {

                frappe.msgprint("Sales Invoice is missing in the selected row.");
            }
            
        });
    },
})