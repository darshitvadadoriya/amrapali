import frappe
from amrapali.amrapali.override.api.release_order_mail import get_dues_company_customer_wise
from amrapali.amrapali.override.api.api import sendmail, get_recipients_hashmap

@frappe.whitelist()
def send_outstanding_mails():
    # Get the dues hashmap
    dues_hashmap = get_dues_company_customer_wise()
    
    # Get vaulting agents data
    customer_data = get_recipients_hashmap(recipient_doctype='Customer')
    
    # List to track sent emails and errors
    sent_emails = []
    error_emails = []

    # Iterate through each company
    for company, customer_dues in dues_hashmap.items():
        # Iterate through each customer in the company
        for customer, due in customer_dues.items():
            # Check if due is greater than 0
            if due > 0:
                    
                    # Prepare email content
                    subject = f"Outstanding Dues for {customer}"
                    html_message = f"""
                    <html>
                        <body>
                            <h2>Outstanding Dues Notification</h2>
                            <p>Dear Customer,</p>
                            <p>This is to inform you about the outstanding dues:</p>
                            <ul>
                                <li><strong>Company:</strong> {company}</li>
                                <li><strong>Customer:</strong> {customer}</li>
                                <li><strong>Outstanding Amount:</strong> ₹{due:,.2f}</li>
                            </ul>
                            <p>Please take necessary action to recover the outstanding amount.</p>
                            <p>Regards,<br>Amrapali Industries</p>
                        </body>
                    </html>
                    """
                    # Send email
                    frappe.enqueue(
                        method=frappe.sendmail,
                        queue='short',
                        timeout=300,
                        recipients=[(customer_data.get(customer)).get('email_id')],
                        subject=subject,
                        message=html_message
                    )

            
            

    # Log results
    frappe.logger().info(f"Sent Emails: {sent_emails}")
    if error_emails:
        frappe.logger().error(f"Email Errors: {error_emails}")

    # Return summary
    return {
        'sent_emails': sent_emails,
        'error_emails': error_emails
    }