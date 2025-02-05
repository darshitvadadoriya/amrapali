import frappe
from frappe.desk.query_report import run


@frappe.whitelist()
def get_balance_sheet_report():

    report = run(
        report_name='Balance Sheet',
        filters={
    
                "company":"AMRAPALI INDUSTRIES LIMITED-Ahmedabad",
                "filter_based_on":"Fiscal Year",
                "period_start_date":"2024-04-01",
                "period_end_date":"2025-03-31",
                "from_fiscal_year":"2024-2025",
                "to_fiscal_year":"2024-2025",
                "periodicity":"Yearly",
                "cost_center":[],
                "project":[],
                "selected_view":"Report",
                "accumulated_values":1,
                "include_default_book_entries":1
                 
                }
    )

    return report