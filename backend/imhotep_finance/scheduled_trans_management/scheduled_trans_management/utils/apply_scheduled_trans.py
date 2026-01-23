import calendar
from datetime import date, timedelta
from django.db import transaction, models
from django.db.models import F
from ...models import ScheduledTransaction
from transaction_management.services import create_transaction

def apply_scheduled_transactions_fn(user):
	"""
	Apply scheduled transactions (salary, bills, etc.) for all months since
	last_time_added up until today. Ensures catch-up if user didn't open
	the app for months.
	"""
	now = date.today()
	applied_count = 0
	errors_list = []

	scheduled = ScheduledTransaction.objects.filter(user=user, status=True)

	try:
		with transaction.atomic():
			for sched in scheduled:
				if sched.amount is None or sched.amount <= 0:
					# Tests expect the exact short message
					errors_list.append("Invalid amount")
					continue

				if sched.scheduled_trans_status.lower() not in ["deposit", "withdraw"]:
					errors_list.append(f"Invalid status '{sched.scheduled_trans_status}'")
					continue
				
				#This part is vibe coded but it's working as expected
				
				# Determine the starting year/month:
				# - If last_time_added exists, start from the month after it.
				# - If no last_time_added, start from current month (but we'll skip if scheduled day is in the future).
				if sched.last_time_added:
					# last_time_added may be datetime or date
					last = sched.last_time_added.date() if hasattr(sched.last_time_added, "date") else sched.last_time_added
					year, month = last.year, last.month
					# move to next month after last_time_added
					if month == 12:
						year, month = year + 1, 1
					else:
						month += 1
				else:
					year, month = now.year, now.month

				# iterate months up to current month/year
				while (year, month) <= (now.year, now.month):
					days_in_month = calendar.monthrange(year, month)[1]
					actual_day = min(sched.date, days_in_month)
					trans_date = date(year, month, actual_day)

					# only apply if the scheduled day has passed (or is today)
					if trans_date > now:
						break

					# Use create_transaction to handle transaction creation and networth updates
					result, error = create_transaction(
						request=None,  # No request object needed for scheduled transactions
						user=user,
						date_param=trans_date,
						amount=sched.amount,
						currency=sched.currency,
						trans_details=sched.scheduled_trans_details,
						category=sched.category,
						trans_status=sched.scheduled_trans_status
					)

					# Handle errors from create_transaction
					if error:
						error_msg = error.get("message", "Unknown error")
						# Map specific error messages to match test expectations
						if "don't have enough" in error_msg.lower():
							errors_list.append("Insufficient funds")
						elif "networth" in error_msg.lower():
							errors_list.append("No NetWorth")
						else:
							errors_list.append(error_msg)
						break

					# Successfully created transaction
					applied_count += 1

					# update last_time_added to this applied date
					sched.last_time_added = trans_date
					sched.save(update_fields=["last_time_added"])

					# go to next month
					if month == 12:
						year, month = year + 1, 1
					else:
						month += 1

		return {
			"success": True,
			"applied_count": applied_count,
			"errors": errors_list,
		}

	except Exception as e:
		return {
			"success": False,
			"applied_count": 0,
			"errors": [f"Unexpected server error: {str(e)}"],
		}
