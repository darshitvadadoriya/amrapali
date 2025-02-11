frappe.ui.form.on('Purchase Receipt', {

    onload(frm){

        // remove unusual buttons
        remove_custom_buttons(frm)

        setTimeout(() => {
            frm.remove_custom_button('Quality Inspection(s)', 'Create');          
        }, 100);


         //    selected supplier wise filtered purchase indent record in link field 
       frm.set_query("custom_purchase_indent", function() {
            return {
                "filters": {
                        "supplier":frm.doc.supplier ,
                    }
            }
        })
    },
    refresh(frm){
        // remove unusual buttons
        remove_custom_buttons(frm)

            if (frm.is_new()) {
                $.each(frm.doc.items || [], function(index, row) {
                    row.rejected_warehouse = '';  
                });
    
                frm.refresh_field('items');
            }
    }
})



function remove_custom_buttons(frm){
    // remove custom buttons

    setTimeout(() => {
    
       frm.remove_custom_button('Landed Cost Voucher', 'Create');
       frm.remove_custom_button('Purchase Return', 'Create');
       frm.remove_custom_button('Make Stock Entry', 'Create');
       frm.remove_custom_button('Retention Stock Entry', 'Create');
       frm.remove_custom_button('Asset', 'View');
       frm.remove_custom_button('Asset Movement', 'View');
   }, 100);

}


