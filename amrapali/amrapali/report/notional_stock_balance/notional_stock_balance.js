// Copyright (c) 2024, Sanskar Technolab and contributors
//  For license information, please see license.txt

frappe.query_reports["Notional Stock Balance"] = {
	"filters": [
		{
			fieldname: "location",
			label: "Location",
			fieldtype: "Link",
			options:"Warehouse"
		},
		{
			fieldname: "item",
			label: "Item",
			fieldtype: "Link",
			options:"Item"
		},
		{
			fieldname: "parent",
			label: "Purchase Indent",
			fieldtype: "Link",
			options:"Purchase Indent"
		},
		
	]
};
