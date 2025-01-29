$(document).ready(function (event) {

    // show only session default details
    frappe.defaults.get_default('company');




    var companyNames
    var id
    var default_location

    frappe.call({
        method: "amrapali.api.get_company_list",
        callback: function (response) {
            console.log(response);
            var companies = response.message
            companyNames = companies.map(company => company.name);
            console.log(companyNames);



            var role;
            let dialog = new frappe.ui.Dialog({
                title: 'Select Company',
                fields: [
                    {
                        label: 'Company',
                        fieldname: 'company_name',
                        fieldtype: 'Select',
                        id: "company",
                        options: companyNames,
                        default: frappe.defaults.get_default('company')
                    }
                ],
                size: 'small',
                primary_action_label: 'Submit',
                primary_action(values) {
                    var company_nm = $("[data-fieldname='company_name']")[1]
                    if (company_nm.value != "") {
                        var companynm = values["company_name"]
                        frappe.call({
                            method: "amrapali.api.manage_user_permission",
                            args: {
                                company: companynm,
                                user: frappe.session.user
                            }
                        });



                        dialog.hide();

                     
                        sessionStorage.setItem("id", "login");

                        frappe.call({
                            method: "amrapali.api.get_location",
                            args: {
                                company:companynm
                            },
                            callback: function(response) {
                                if (response.message) {
                                    // Process the warehouse data here
                                    console.log(response.message[0].name);
                                    default_location = response.message[0].name
                                    
                                   
                                }
                            }
                        });

                       setTimeout(() => {
                            frappe.call({
                                method: 'frappe.core.doctype.session_default_settings.session_default_settings.set_session_default_values',
                                args: {
                                    default_values: { company: companynm,warehouse:default_location }
                                },
                            });
                            // reload page after set the company
                            frappe.ui.toolbar.clear_cache()
                       }, 150);
                        




                    }
                    else {
                        company_nm.style.border = "1px solid red"
                    }
                }
            });





            id = sessionStorage.getItem('id')
    
            // check role and show company setup
            frappe.call({
                method: "amrapali.api.roles",
                args: {
                    "email": frappe.session.user,
                },
            }).then(records => {
                role = records.message

               if (id === "company" && !role.includes("Admin") && frappe.session.user !== "Administrator") {
                dialog.show();
            }
                
                
            })



            console.log(id);
            // set current company value in navbar
            if (id == "login") {
                //   for set current company name
                let details = frappe.defaults.get_default('company');
                var company_nm = details ? details : "";
                var companyDiv = $('<div/>', {
                    text: company_nm,
                    class: 'custom-company-div',
                    id: "change_company"
                });

                companyDiv.css({
                    'borderRadius': '5px',
                    'border': '1px solid #ddd',
                    'backgroundColor': '#f9f9f9',
                    'width': 'auto',
                    'height': 'auto',
                    'display': 'inline-flex',
                    'alignItems': 'center',
                    'justifyContent': 'center',
                    'fontWeight': '600',
                    'padding': '3px 4px',
                    'cursor': 'pointer'
                });

                $('.input-group.search-bar.text-muted').before(companyDiv);
            }


            $("#change_company").click(function () {
                dialog.show();
            })

        }
    });

})
















