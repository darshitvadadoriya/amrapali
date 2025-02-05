from frappe.desk.query_report import run
import frappe
from amrapali.amrapali.override.api.api import get_report, get_docs_array_from_list, get_docs_and_customers, get_recipient_email, get_recipients_hashmap, sendmail
@frappe.whitelist()
def send_bulk_mail(list):
    # Convert the JSON string into a Python list
    list = frappe.parse_json(list)
    names = get_docs_array_from_list(list)
    
    # Get the customer and company data along with vaulting agent
    customer_company_data = get_docs_and_customers(names, 'Release Order', ['customer', 'company', 'custom_vaulting_agent', 'name', 'custom_reference_sales_invoice'])
    
    # Get company-wise dues
    company_dues = get_dues_company_customer_wise()
    
    # Get customer credit limits
    company_credit_limits = get_customer_credit_limit()
    
    # Initialize a list to store records where due exceeds credit limit
    exceeded_records = []

    # First check for exceeded records
    for record in customer_company_data:
        company = record.get('company')
        customer = record.get('customer')
        
        # Get the customer's total due for the company
        due = company_dues.get(company, {}).get(customer, 0)
        
        # Get the customer's credit limit for the company
        credit_limit = company_credit_limits.get(company, {}).get(customer, 0)
        
        # Compare due with credit limit
        if due > credit_limit:
            exceeded_records.append({
                "name": record.get('name'),
                "company": company,
                "customer": customer,
                "due": due,
                "credit_limit": credit_limit
            })

    # If there are exceeded records, msgprint and stop
    if exceeded_records:
        # Extract names of exceeded records
        exceeded_names = [record['name'] for record in exceeded_records]
        
        # Use frappe.msgprint to display the exceeded record names
        frappe.msgprint(
            title='Credit Limit Exceeded',
            msg=f"The following Release Orders have exceeded credit limits:\n{', '.join(exceeded_names)}",
            indicator='red'
        )
        
        # Return the full exceeded records details for potential further investigation
        return exceeded_records

    # If no exceeded records, get vaulting agent data
    vaulting_agents_data = get_vaulting_agent()
    
    # Send email for each record
    for record in customer_company_data:
        vaulting_agent = record.get('custom_vaulting_agent')
        if vaulting_agent:
            agent_email = (vaulting_agents_data.get(vaulting_agent)).get('email_id')
            
            if agent_email:
                subject = f"Credit Limit Status for Release Order - {record.get('name')}"
                
                html_message = f"""
                    <html>
                        <body>
                            <p>Please find attached the document.</p>
                            <p>If you have any questions or need assistance, feel free to reach out.</p>
                            <p>Thank you for your business.</p>
                        </body>
                    </html>
                """
                
                attachment_list = []
                # Attach Sales Invoice
                attachment = frappe.attach_print(
                    doctype='Sales Invoice',
                    name=record.get('custom_reference_sales_invoice'),
                    file_name=f"{record.get('custom_reference_sales_invoice')}.pdf",
                )
                attachment_list.append(attachment)
                
                # Attach Release Order
                attachment = frappe.attach_print(
                    doctype='Release Order',
                    name=record.get('name'),
                    file_name=f"{record.get('name')}.pdf",
                )
                attachment_list.append(attachment)
                
                # Send email with attachment
                sendmail(
                    reference_doctype='Release Order',
                    reference_name=record.get('name'),
                    recipients=[agent_email],
                    msg=html_message,
                    subject=record.get('name'),
                    attachments=attachment_list
                )
    
    return {"message": "Emails sent to respective vaulting agents", "status": "success"}

@frappe.whitelist()
def get_vaulting_agent():
    return get_recipients_hashmap(recipient_doctype='Vaulting Agent')


    

@frappe.whitelist()
def get_dues_company_customer_wise():
    # Get all companies
    companies = frappe.get_all("Company", pluck="name")

    # Initialize the hashmap
    company_dues = {}

    for company in companies:
        # Run the report for the current company
        report_data = run(
            report_name="Accounts Receivable",
            filters={"company": company}
        ).get("result", [])

        # Initialize customer-wise hashmap for the company
        company_dues[company] = {}

        # Process report data
        for item in report_data:
            if isinstance(item, dict):
                party = item.get("party")
                total_due = float(item.get("total_due", 0))

                # Aggregate dues per customer
                if party in company_dues[company]:
                    company_dues[company][party] += total_due
                else:
                    company_dues[company][party] = total_due

    return company_dues

@frappe.whitelist()
def get_customer_credit_limit():
    # Fetch all credit limits
    credit_limits = frappe.get_all(
        "Credit Limit",
        filters={"parenttype": "Customer"},
        fields=["company", "parent", "credit_limit"]
    )

    # Initialize hashmap
    company_credit_limits = {}

    # Process data
    for entry in credit_limits:
        company = entry.get("company")
        customer = entry.get("parent")
        credit_limit = entry.get("credit_limit", 0)

        # Ensure company exists in hashmap
        if company not in company_credit_limits:
            company_credit_limits[company] = {}

        # Store credit limit per customer under the company
        company_credit_limits[company][customer] = credit_limit

    return company_credit_limits