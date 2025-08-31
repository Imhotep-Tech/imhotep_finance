import calendar
from datetime import date, timedelta
from django.db import transaction, models
from django.db.models import F
from ...models import ScheduledTransaction, Transactions, NetWorth
from django.core.exceptions import ObjectDoesNotExist

def apply_scheduled_transactions_fn(user):
	"""
	Apply scheduled transactions (salary, bills, etc.) for all months since
	last_time_added up until today. Ensures catch-up if user didn't open
	the app for months.
	"""
	now = date.today()
	applied_count = 0
	transactions_to_create = []
	networth_updates = {}
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

					# NetWorth check
					try:
						networth = NetWorth.objects.get(user=user, currency=sched.currency)
					except ObjectDoesNotExist:
						errors_list.append("No NetWorth")
						break

					if sched.scheduled_trans_status.lower() == "withdraw" and sched.amount > networth.total:
						# Tests expect this exact phrase
						errors_list.append("Insufficient funds")
						break

					# Queue transaction
					transactions_to_create.append(
						Transactions(
							user=user,
							date=trans_date,
							amount=sched.amount,
							currency=sched.currency,
							trans_status=sched.scheduled_trans_status,
							trans_details=sched.scheduled_trans_details,
							category=sched.category,
						)
					)

					# NetWorth update
					key = (user.id, sched.currency)
					if key not in networth_updates:
						networth_updates[key] = 0
					if sched.scheduled_trans_status.lower() == "deposit":
						networth_updates[key] += sched.amount
					else:
						networth_updates[key] -= sched.amount

					# update last_time_added to this applied date
					sched.last_time_added = trans_date
					sched.save(update_fields=["last_time_added"])

					# go to next month
					if month == 12:
						year, month = year + 1, 1
					else:
						month += 1

			# bulk create all transactions
			if transactions_to_create:
				applied_count = len(transactions_to_create)
				Transactions.objects.bulk_create(transactions_to_create)

			# update networth totals
			for (user_id, currency), delta in networth_updates.items():
				NetWorth.objects.filter(user_id=user_id, currency=currency).update(
					total=F("total") + delta
				)

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
