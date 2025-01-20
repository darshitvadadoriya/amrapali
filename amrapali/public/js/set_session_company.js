$(document).ready(function () {  
    var location

    let details = JSON.parse(localStorage.getItem('Details'));
    var company_name = details ? details.company : "No Company Found";
  
    if(company_name)
   {
    frappe.call({
        method:"frappe.client.get_list",
        args: {
            doctype: "Warehouse", 
            filters: { company: company_name }, 
            fields: ["name", "company"] 
        },
        callback:function(r){
            console.log(r.message[0].name);
            // frappe.msgprint(r)
            location = r.message[0].name
        }
    })
    
        // set session default company and location
        setTimeout(() => {
            frappe.call({
                method: 'frappe.core.doctype.session_default_settings.session_default_settings.set_session_default_values',
                args: {
                    default_values: { 
                        company: company_name,
                        warehouse:location
                     }
                },
            });
        }, 500);
   }
    
   
    });