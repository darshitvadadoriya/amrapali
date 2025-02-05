// Custom Script for Report
// Script Type: Report
// Report Name: Accounts Receivable

frappe.query_reports["Accounts Receivable"] = {
    ...frappe.query_reports["Accounts Receivable"],  // Preserve existing report configuration
    
    onload: function(report) {
        // Preserve any existing onload functionality
        let original_onload = frappe.query_reports["Accounts Receivable"].original_onload;
        if (original_onload) {
            original_onload(report);
        }

        // Add new custom button
        report.page.add_inner_button(__('Print Selected'), function() {
            let selected_rows = report.get_selected_rows();
            
            if (selected_rows.length === 0) {
                frappe.msgprint(__('Please select at least one row to print.'));
                return;
            }

            frappe.call({
                method: 'amrapali.amrapali.override.api.api.print_report',
                args: {
                    report: selected_rows
                },
                callback: function(r) {
                    // Open the generated PDF in a new window
                    if (!r.exc) {
                        window.open(
                            frappe.urllib.get_full_url(r.message)
                        );
                    }
                }
            });
        });
    }
};