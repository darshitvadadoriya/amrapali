// Copyright (c) 2025, Sanskar Technolab and contributors
// For license information, please see license.txt

frappe.query_reports["Location Wise Delivery"] = {
	"filters": [
		{
			fieldname: "company",
			label: "Company",
			fieldtype: "Link",
			options:"Company"
		},
		{
			fieldname: "location",
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
			fieldname: "custom_vaulting_agent",
			label: "Vaulting Agent",
			fieldtype: "Link",
			options:"Vaulting Agent"
		},
		{
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date",
            default: "Today",
        },
        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date",
            default: "Today",
        },
	]
};
