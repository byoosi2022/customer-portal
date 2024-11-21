import frappe
from frappe.utils import today, flt, add_months
from datetime import datetime
from frappe.utils.background_jobs import enqueue
from frappe import flags

def enqueue_penalty_update(doc=None, method=None):
    # Enqueue penalty update for overdue payment schedules
    enqueue(
        method=update_penalty_and_create_invoice,
        queue='short',
        timeout=300,
        job_name="Update Penalty and Create Invoice for Overdue Schedules"
    )

def update_penalty_and_create_invoice(doc=None, method=None,**kwargs):
    # Extract the optional `run_date` if provided
    run_date = kwargs.get("run_date", None)
    frappe.logger().info(f"Running penalty update job for run_date: {run_date}...")
    try:
        frappe.logger().info("Running overdue penalty update job...")
        today_date = datetime.today().date()
        sales_orders = frappe.get_all(
            'Sales Order',
            filters={'docstatus': 0, 'custom_penality_rate': ['>', 0]},
            fields=['name', 'customer', 'custom_penality_rate']
        )

        next_run_dates = set()  # To track unique next run dates

        for sales_order in sales_orders:
            so_doc = frappe.get_doc('Sales Order', sales_order['name'])
            penalty_rate = flt(so_doc.custom_penality_rate)

            if not penalty_rate:
                continue

            changes_made = False

            for row in so_doc.payment_schedule:
                if row.due_date and row.due_date < today_date and row.outstanding > 0:  # Overdue schedules with outstanding balance
                    existing_penalty_invoice = frappe.db.exists(
                        'Sales Invoice',
                        {
                            'custom_sales_order_id': so_doc.name,
                            'custom_is_penalty_invoice': 1,
                            'posting_date': row.due_date,
                            'docstatus': 1
                        }
                    )

                    if existing_penalty_invoice:
                        continue  # Skip if a penalty invoice already exists

                    # Calculate penalty
                    penalty_amount = (row.payment_amount or 0) * penalty_rate / 100
                    row.custom_penality_percent = penalty_rate
                    row.custom_penality_amount = penalty_amount
                    row.custom_payment_amount_penality = flt(row.payment_amount) + penalty_amount
                    
                    changes_made = True

                    create_penalty_sales_invoice(
                        so_doc.customer, so_doc.name, penalty_amount,
                        so_doc.company, so_doc.cost_center,
                        so_doc.location, so_doc.branch, row.due_date
                    )

                    # Schedule the next check for this row after one month
                    next_run_date = add_months(row.due_date, 1)
                    next_run_dates.add(next_run_date)

                else:
                    if row.custom_penality_percent != 0 or row.custom_penality_amount != 0:
                        changes_made = True
                    row.custom_penality_percent = 0
                    row.custom_penality_amount = 0
                    row.custom_payment_amount_penality = flt(row.payment_amount)

            if changes_made and not flags.in_recursion:
                flags.in_recursion = True
                so_doc.save()  # Save the document only if changes are made
                flags.in_recursion = False

        # Enqueue the next job for unique future dates
        for next_date in next_run_dates:
            enqueue_penalty_update_on_date(next_date)

    except Exception as e:
        frappe.logger().error(f"Error in penalty update: {e}")
        raise

def enqueue_penalty_update_on_date(run_date):
    """Enqueue the penalty update job to run on a specific date."""
    enqueue(
        method=update_penalty_and_create_invoice,
        queue='short',
        timeout=300,
        job_name=f"Penalty Update Job for {run_date}",
        at_datetime=run_date,  # Use `at_datetime` for scheduling
        run_date=str(run_date)  # Explicitly pass the `run_date` to the function
    )

def create_penalty_sales_invoice(customer, sales_order, penalty_amount, company, cost_center, location, branch, posting_date):
    try:
        si_doc = frappe.get_doc({
            'doctype': 'Sales Invoice',
            'customer': customer,
            'cost_center': cost_center,
            'company': company,
            'location': location,
            'branch': branch,
            'posting_date': posting_date,
            'due_date': today(),
            'items': [
                {
                    'item_code': 'Penalty Fee',
                    'description': f'Penalty for overdue payment on Sales Order {sales_order}',
                    'qty': 1,
                    'rate': penalty_amount,
                    'amount': penalty_amount,
                    'cost_center': cost_center,
                    'location': location,
                    'branch': branch,
                }
            ],
            'custom_sales_order_id': sales_order,
            'custom_is_penalty_invoice': 1
        })

        si_doc.set_posting_time = 1
        si_doc.insert(ignore_permissions=True)
        si_doc.submit()

        frappe.msgprint(f"Penalty Sales Invoice {si_doc.name} created for Sales Order {sales_order}")

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"Error in creating Sales Invoice for Sales Order {sales_order}: {str(e)}")
        frappe.throw(f"An error occurred while creating a Sales Invoice for Sales Order {sales_order}: {str(e)}. Please check the error log.")
