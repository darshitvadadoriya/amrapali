var custom_duty = 0

frappe.ui.form.on('Purchase Order', {

    refresh(frm){

    },
    before_save(frm){
        // let total_sum = 0;
        // frm.doc.items.forEach(row => {
        //     total_sum += row.duty;
        // });
        // console.log(total_sum);
        // if(total_sum != 0){
        //     frm.add_child("On Item Quantity",{
        //         account_head:"Customs Duty Expense - AD",
                
        //     })
        // }
    }

})


frappe.ui.form.on('Purchase Order Item', {
    duty(frm, cdt, cdn){
        console.log("Custom duty========================");
       
        var row = locals[cdt][cdn];
        custom_duty+= row.duty

        console.log(custom_duty);   
    },
  
    
})