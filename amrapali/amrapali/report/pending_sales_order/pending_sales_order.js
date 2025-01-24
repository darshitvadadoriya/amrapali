// Copyright (c) 2025, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Pending Sales Order"] = {
	"filters": [
		{
			fieldname: "name",
			label: "Sales Order",
			fieldtype: "Link",
			options:"Sales Order"
		},
		{
			fieldname: "company",
			label: "Company",
			fieldtype: "Link",
			options:"Company"
		},
		{
			fieldname: "warehouse",
			label: "Location",
			fieldtype: "Link",
			options:"Warehouse"
		},
		{
			fieldname: "customer",
			label: "Customer",
			fieldtype: "Link",
			options:"Customer"
		},
		{
			fieldname: "item_name",
			label: "Item",
			fieldtype: "Link",
			options:"Item"
		},
		{
            fieldname: "from_date",
            label: "From Value Date",
            fieldtype: "Date",
            default: "Today",
        },
        {
            fieldname: "to_date",
            label: "To Value Date",
            fieldtype: "Date",
            default: "Today",
        },
	]
};
