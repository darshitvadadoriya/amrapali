import frappe
from datetime import datetime
from amrapali.amrapali.override.api.release_order_mail import get_dues_company_customer_wise
from amrapali.amrapali.override.api.api import sendmail, get_recipients_hashmap

@frappe.whitelist()
def send_outstanding_mails():
    # Get the dues hashmap
    dues_hashmap = get_dues_company_customer_wise()

    # Get vaulting agents data
    customer_data = get_recipients_hashmap(recipient_doctype="Customer")
    
    # Get today's date in the format yyyy-mm-dd
    today_date = datetime.today().strftime('%Y-%m-%d')
    
    # Fetch already sent emails for today
    sent_today = frappe.get_all(
        'Outstanding Email Log',
        filters={'date': today_date},
        fields=['company', 'customer']
    )
    
    # Create a hashmap to track customer-company pairs that were already emailed today
    sent_pairs = {(entry['company'], entry['customer']) for entry in sent_today}

    # Lists to track sent emails and errors
    sent_emails = []
    error_emails = []

    # Iterate through each company
    for company, customer_dues in dues_hashmap.items():
        for customer, due in customer_dues.items():
            if due > 0:
                # Skip if email already sent to this customer-company pair today
                if (company, customer) in sent_pairs:
                    continue

                # Get recipient email
                recipient_info = customer_data.get(customer)
                if not recipient_info or not recipient_info.get("email_id"):
                    error_emails.append({
                        "company": company,
                        "customer": customer,
                        "due": due,
                        "error": "No email ID found"
                    })
                    continue
                
                recipient_email = recipient_info.get("email_id")

                # Prepare email content
                subject = f"Outstanding Dues for {customer}"
                html_message = f"""
                <html>
                    <body>
                        <p>Dear {customer},</p>
                        <p>This is to inform you about the outstanding dues:</p>
                        <ul>
                            <li><strong>Company:</strong> {company}</li>
                            <li><strong>Outstanding Amount:</strong> ₹{due:,.2f}</li>
                        </ul>
                        <p>Please take necessary action to clear the outstanding amount.</p>
                        <p>Regards,<br>Amrapali Industries</p>
                    </body>
                </html>
                """
                
                try:
                    # Send email
                    frappe.enqueue(
                        method=frappe.sendmail,
                        queue="short",
                        timeout=300,
                        recipients=[recipient_email],
                        subject=subject,
                        message=html_message
                    )
                    
                    # Log the sent email in the Outstanding Email Log
                    log_entry = frappe.get_doc({
                        'doctype': 'Outstanding Email Log',
                        'company': company,
                        'customer': customer,
                        'date': today_date
                    })
                    log_entry.insert()
                    frappe.db.commit()  # Explicitly commit the transaction

                    # Add to sent email list for tracking
                    sent_emails.append({"company": company, "customer": customer, "due": due})
                
                except Exception as e:
                    frappe.logger().error(f"Error sending email or inserting log for {company} - {customer}: {str(e)}")
                    error_emails.append({
                        "company": company,
                        "customer": customer,
                        "due": due,
                        "error": str(e)
                    })

    # Log results
    frappe.logger().info(f"Sent Emails: {sent_emails}")
    if error_emails:
        frappe.logger().error(f"Email Errors: {error_emails}")

    # Redirect back to the current page
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = '/app'

    # Return summary
    return {"sent_emails": sent_emails, "error_emails": error_emails}
