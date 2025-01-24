frappe.ui.form.on("Delivery Note", {
    refresh(frm){
       setTimeout(() => {
        frm.remove_custom_button('Shipment', 'Create');
        frm.remove_custom_button('Installation Note', 'Create');
        frm.remove_custom_button('Delivery Trip', 'Create');
        frm.remove_custom_button('Sales Invoice', 'Create');
       
       }, 100);

       frm.add_custom_button('Release Order',function(){
        frappe.get_doc("Release Order",frm.doc)
    }, 'Create');
    },
	customer(frm) {
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Customer',
                name: frm.doc.customer,
            },
            callback: (res) => {

                authorized_persons = res.message.custom_authorized_person

                frm.set_value('custom_authorized_person', authorized_persons)
                
            }
        })


        // set filter for packing list
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Packing List',
                filters:{customer:frm.doc.customer},
            },
            callback: (res) => {
                console.log(res);
                let data = res.message
                let packing_list = data.map(item => item.name);
                frm.set_query("custom_pack_list",function(){
                
                    console.log(packing_list);
                    return{
                        filters:{
                            name:["in",packing_list],
                            inout_ward:"Out Ward",
                        }
                    }
                })
                
            }
        })
	},
});



