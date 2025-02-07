frappe.pages['balance-sheet-page-r'].on_page_load = function(wrapper) {
    console.log('Balance Sheet Page Loaded');
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Balance Sheet Page Report',
        single_column: true
    });

    // Create containers
    var filter_container = $('<div class="filter-section"></div>').appendTo(page.main);
    var report_container = $('<div class="report-section"></div>').appendTo(page.main);

    // Add filter type selector
    page.add_field({
        label: 'Filter Type',
        fieldtype: 'Select',
        fieldname: 'filter_type',
        options: [
            { value: 'fiscal_year', label: 'Fiscal Year' },
            { value: 'date_range', label: 'Date Range' }
        ],
        default: 'fiscal_year',
        parent: filter_container,
        change: function() {
            toggleFilterFields();
        }
    });

    // Add company field
    page.add_field({
        label: 'Company',
        fieldtype: 'Link',
        fieldname: 'company',
        options: 'Company',
        reqd: 1,
        parent: filter_container,
        change: function() {
            generate_report_on_change();
        }
    });

    // Add fiscal year field
    page.add_field({
        label: 'Fiscal Year',
        fieldtype: 'Link',
        fieldname: 'fiscal_year',
        options: 'Fiscal Year',
        reqd: 1,
        parent: filter_container,
        change: function() {
            fetch_fiscal_year_dates();
        }
    });

    // Add date range fields (Initially Hidden)
    page.add_field({
        label: 'From Date',
        fieldtype: 'Date',
        fieldname: 'from_date',
        reqd: 1,
        parent: filter_container,
        hidden: true,
        change: function() {
            generate_report_on_change();
        }
    });

    page.add_field({
        label: 'To Date',
        fieldtype: 'Date',
        fieldname: 'to_date',
        reqd: 1,
        parent: filter_container,
        hidden: true,
        change: function() {
            generate_report_on_change();
        }
    });

    // Add Accumulated Values Checkbox
    page.add_field({
        label: 'Accumulated Values',
        fieldtype: 'Check',
        fieldname: 'accumulated_values',
        default: 0,
        parent: filter_container,
        change: function() {
            generate_report_on_change();
        }
    });

    function toggleFilterFields() {
        const filterType = page.fields_dict.filter_type.get_value();
        const isFiscalYear = filterType === 'fiscal_year';

        // Toggle fields
        page.fields_dict.fiscal_year.toggle(isFiscalYear);
        page.fields_dict.from_date.toggle(!isFiscalYear);
        page.fields_dict.to_date.toggle(!isFiscalYear);

        // Clear values of hidden fields
        if (isFiscalYear) {
            page.fields_dict.from_date.set_value('');
            page.fields_dict.to_date.set_value('');
        } else {
            page.fields_dict.fiscal_year.set_value('');
        }

        generate_report_on_change();
    }

    function fetch_fiscal_year_dates() {
        const fiscal_year = page.fields_dict.fiscal_year.get_value();
        if (fiscal_year) {
            frappe.db.get_doc('Fiscal Year', fiscal_year).then(doc => {
                page.fields_dict.from_date.set_value(doc.year_start_date);
                page.fields_dict.to_date.set_value(doc.year_end_date);
                generate_report_on_change();
            });
        }
    }

    function generate_report_on_change() {
        const filterType = page.fields_dict.filter_type.get_value();
        let start_date, end_date;

        if (filterType === 'fiscal_year') {
            start_date = page.fields_dict.from_date.get_value();
            end_date = page.fields_dict.to_date.get_value();
        } else {
            start_date = page.fields_dict.from_date.get_value();
            end_date = page.fields_dict.to_date.get_value();
        }

        if (start_date && end_date) {
            generate_report(report_container, start_date, end_date);
        }
    }

    function generate_report(report_container, start_date, end_date) {
        let company = page.fields_dict.company.get_value();
        let accumulated_values = page.fields_dict.accumulated_values.get_value() ? 1 : 0;
        
        frappe.call({
            method: "frappe.desk.query_report.run",
            args: {
                "report_name": "Balance Sheet",
                filters: {
                    "company": company,
                    "filter_based_on": "Date Range",
                    "period_start_date": start_date,
                    "period_end_date": end_date,
                    "periodicity": "Monthly",
                    "cost_center": [],
                    "project": [],
                    "selected_view": "Report",
                    "accumulated_values": accumulated_values,  // Set based on checkbox value
                    "include_default_book_entries": 1
                }
            },
            callback: function (response) {
                var data = response.message;
                console.log("data.result", data.result);

                let { firstArray: assets, secondArray: liabilities, thirdArray: equity, fourthArray: totals } = filter_report(data.result);
                console.log('assets', assets);

                report_container.empty();
                var html = frappe.render_template("balance_sheet_page_r", {
                    'assets': assets,
                    'liabilities': liabilities,
                    'equity': equity,
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
        const secondArray = report.slice(indexes[0]+1, indexes[1]);
        const thirdArray = report.slice(indexes[1] + 1, indexes[2]);
        const fourthArray = report.slice(indexes[2]+1);

        console.log(firstArray, 'firstArray');
        console.log(secondArray, 'secondArray');
        console.log(thirdArray, 'thirdArray');
        console.log(fourthArray, 'fourthArray');

        return {
            firstArray,
            secondArray,
            thirdArray
        };
    }

    toggleFilterFields();
};
