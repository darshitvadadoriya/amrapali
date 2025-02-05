frappe.ui.form.on('Purchase Receipt', {

    onload(frm){

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
            if (frm.is_new()) {
                $.each(frm.doc.items || [], function(index, row) {
                    row.rejected_warehouse = '';  
                });
    
                frm.refresh_field('items');
            }
    }
})



