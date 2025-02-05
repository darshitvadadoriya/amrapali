frappe.pages['balance-sheet-page-r'].on_page_load = function(wrapper) {
    console.log('Balance Sheet Page Loaded');
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Balance Sheet Page Report',
        single_column: true
    });

    // Create a container for filters
    var filter_container = $('<div class="filter-section"></div>').appendTo(page.main);
    var report_container = $('<div class="report-section"></div>').appendTo(page.main);

    // Add fields to filter container
    page.add_field({
        label: 'Company',
        fieldtype: 'Link',
        fieldname: 'company',
        options: 'Company',
        reqd: 1,
        parent: filter_container,
        change: function() {
            // Fetch all fiscal years instead of filtering by company
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Fiscal Year",
                    fields: ["name", "year_start_date", "year_end_date"],
                    order_by: "year_start_date desc"
                },
                callback: function(r) {
                    if (r.message) {
                        let fiscal_year_field = page.fields_dict.fiscal_year;
                        fiscal_year_field.df.options = r.message.map(fy => fy.name).join('\n');
                        fiscal_year_field.refresh();

                        // Set default to most recent fiscal year
                        if (r.message.length > 0) {
                            fiscal_year_field.set_value(r.message[0].name);
                            generate_report_on_change();
                        }
                    }
                }
            });
        }
    });

    page.add_field({
        label: 'Fiscal Year',
        fieldtype: 'Select',
        fieldname: 'fiscal_year',
        options: [], // Will be populated dynamically
        reqd: 1,
        parent: filter_container,
        change: generate_report_on_change
    });

    page.add_field({
        label: 'Periodicity',
        fieldtype: 'Select',
        fieldname: 'periodicity',
        options: [
            'Yearly',
            'Half Yearly',
            'Quarterly',
            'Monthly'
        ],
        default: 'Yearly',
        reqd: 1,
        parent: filter_container,
        change: generate_report_on_change
    });

    function generate_report_on_change() {
        let company = page.fields_dict.company.get_value();
        let fiscal_year = page.fields_dict.fiscal_year.get_value();
        let periodicity = page.fields_dict.periodicity.get_value();

        if (!company || !fiscal_year) return;

        // Get fiscal year dates
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Fiscal Year",
                name: fiscal_year,
                fields: ["year_start_date", "year_end_date"]
            },
            callback: function(r) {
                if (r.message) {
                    generate_report(page, report_container, 
                        r.message.year_start_date, 
                        r.message.year_end_date
                    );
                }
            }
        });
    }

    function generate_report(page, report_container, start_date, end_date) {
        let company = page.fields_dict.company.get_value();
        let periodicity = page.fields_dict.periodicity.get_value();

        frappe.call({
            method: "frappe.desk.query_report.run",
            args: {
                "report_name": "Balance Sheet",
                filters: {
                    "company": company,
                    "filter_based_on": "Date Range",
                    "period_start_date": start_date,
                    "period_end_date": end_date,
                    "periodicity": periodicity,
                    "cost_center": [],
                    "project": [],
                    "selected_view": "Report",
                    "accumulated_values": 1,
                    "include_default_book_entries": 1
                }
            },
            callback: function (response) {
                var data = response.message;
                console.log("data.result", data.result);

                let { firstArray: assets, secondArray: liabilities, thirdArray: totals } = filter_report(data.result);
                console.log('assets', assets);

                // Clear previous report content
                report_container.empty();

                // Render template in report container
                var html = frappe.render_template("balance_sheet_page_r", {
                    'assets': assets,
                    'liabilities': liabilities,
                    'totals': totals
                });
                
                report_container.html(html);
            }
        });
    }

    function filter_report(report) {
        let indexes = [];
        
        for (let i = 0; i < report.length; i++) {
            if (!report[i].account) {
                indexes.push(i);
            }
        }
        
        const firstArray = report.slice(0, indexes[0]);
        const secondArray = report.slice(indexes[0], indexes[1]);
        const thirdArray = report.slice(indexes[1]);
        
        return {
            firstArray,
            secondArray,
            thirdArray
        };
    }
};