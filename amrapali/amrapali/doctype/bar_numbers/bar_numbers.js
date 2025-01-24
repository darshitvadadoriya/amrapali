// Copyright (c) 2024, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.ui.form.on("Bar Numbers", {
	// refresh(frm) {

	// },
    in_active(frm){
        if(frm.doc.in_active == 1){
            frm.set_value("status","Inactive")
        }

        if(frm.doc.in_active == 0){
            frm.set_value("status","Active")
        }
    }
});
