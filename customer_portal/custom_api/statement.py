import frappe
from frappe.utils import flt

@frappe.whitelist()
def get_customers_statement(from_date=None, to_date=None):
    # Check if `from_date` and `to_date` are provided
    if not from_date or not to_date:
        return {"error": "Both 'from_date' and 'to_date' are required."}

    # Get the currently logged-in user
    customer_email = frappe.session.user

    # Fetch customer record using the logged-in user's email
    customer = frappe.get_all('Customer', filters={'custom_link_user_email': customer_email}, fields=['name', 'customer_name'])
    
    # Check if a customer was found for the email
    if not customer:
        return {"error": "No customer found for the logged-in user."}
    
    customer_name = customer[0].name  # Get customer name for queries
    
    # Initialize variables
    sales_invoice_data = []
    total_paid_amount = 0
    grand_total_amount = 0
    running_balance = 0
    balance_brought_forward = 0

    # Calculate Balance Brought Forward
    previous_balance = frappe.db.sql("""
        SELECT 
            SUM(gle.debit - gle.credit) AS balance
        FROM 
            `tabGL Entry` gle
        WHERE 
            gle.party_type = 'Customer'
            AND gle.party = %s
            AND gle.posting_date < %s
            AND gle.docstatus = 1
    """, (customer_name, from_date), as_dict=True)
    
    if previous_balance and previous_balance[0].balance:
        balance_brought_forward = flt(previous_balance[0].balance)
    
    running_balance = balance_brought_forward

    # Step 1: Fetch Sales Invoices for the specified customer and date range, excluding canceled invoices
    invoices = frappe.db.sql("""
        SELECT 
            si.name AS invoice_name,
            si.posting_date,
            si.cost_center, 
            sii.item_code, 
            sii.qty, 
            sii.rate, 
            sii.amount
        FROM 
            `tabSales Invoice` si
        JOIN 
            `tabSales Invoice Item` sii ON sii.parent = si.name
        WHERE 
            si.customer = %s 
            AND si.posting_date BETWEEN %s AND %s 
            AND si.docstatus = 1
    """, (customer_name, from_date, to_date), as_dict=True)

    for invoice in invoices:
        total_amount = flt(invoice.amount)
        grand_total_amount += total_amount
        running_balance += total_amount
        
        sales_invoice_data.append({
            "invoice_name": invoice.invoice_name,
            "cost_center": invoice.cost_center,
            "posting_date": invoice.posting_date,
            "item_code": invoice.item_code,
            "qty": flt(invoice.qty),
            "rate": flt(invoice.rate),
            "amount": total_amount,
            "running_balance": running_balance
        })

    # Step 2: Fetch Payment Entries within the date range, excluding canceled payments
    payments = frappe.db.sql("""
        SELECT 
            pe.name AS payment_entry_name, 
            pe.posting_date,
            pe.cost_center, 
            pe.paid_amount
        FROM 
            `tabPayment Entry` pe
        WHERE 
            pe.party_type = 'Customer'
            AND pe.party = %s
            AND pe.posting_date BETWEEN %s AND %s
            AND pe.docstatus = 1
    """, (customer_name, from_date, to_date), as_dict=True)

    filtered_payments = []
    for payment in payments:
        payment_amount = flt(payment.paid_amount)
        total_paid_amount += payment_amount
        running_balance -= payment_amount
        
        filtered_payments.append({
            "payment_entry_name": payment.payment_entry_name,
            "cost_center": payment.cost_center,
            "posting_date": payment.posting_date,
            "paid_amount": payment_amount,
            "running_balance": running_balance
        })

    # Step 3: Fetch Journal Entry GL Entries for the customer, excluding canceled entries
    gl_entries = frappe.db.sql("""
        SELECT
            gle.name AS gl_entry_name,
            gle.posting_date,
            gle.cost_center,
            gle.debit,
            gle.voucher_no,
            gle.credit,
            gle.remarks
        FROM
            `tabGL Entry` gle
        WHERE
            gle.party_type = 'Customer'
            AND gle.party = %s
            AND gle.voucher_type = 'Journal Entry'
            AND gle.posting_date BETWEEN %s AND %s
            AND gle.docstatus = 1
    """, (customer_name, from_date, to_date), as_dict=True)

    filtered_gl_entries = []
    for gl_entry in gl_entries:
        debit = flt(gl_entry.debit)
        credit = flt(gl_entry.credit)
        running_balance += debit - credit
        total_paid_amount += credit
        
        filtered_gl_entries.append({
            "gl_entry_name": gl_entry.gl_entry_name,
            "posting_date": gl_entry.posting_date,
            "cost_center": gl_entry.cost_center,
            "voucher_no": gl_entry.voucher_no,
            "debit": debit,
            "credit": credit,
            "remarks": gl_entry.remarks,
            "running_balance": running_balance
        })

    # Calculate outstanding amount
    outstanding_amount = grand_total_amount - total_paid_amount

    return {
        "customer": customer_name,
        "balance_brought_forward": balance_brought_forward,
        "grand_total_amount": grand_total_amount,
        "total_paid_amount": total_paid_amount,
        "outstanding_amount": outstanding_amount,
        "sales_invoice_data": sales_invoice_data,
        "payments": filtered_payments,
        "gl_entries": filtered_gl_entries,
        "Customer_name": gl_entries
    }
