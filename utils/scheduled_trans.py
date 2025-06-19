from sqlalchemy import text
from extensions import db
from utils.send_mail import smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail
from utils.recalculate_networth import recalculate_networth
import calendar

def add_scheduled_trans(user_id, now):
    day = now.day
    month = now.month
    year = now.year
    
    # Calculate previous month for comparison
    if month == 1:
        prev_month = 12
        prev_year = year - 1
    else:
        prev_month = month - 1
        prev_year = year
    
    prev_month_date = now.replace(month=month-1)
    current_date = now.date()

    # Create a list of valid days for the rolling window
    valid_days_current = []
    valid_days_prev = []

    # Add days from 1 to current day (this month)
    for d in range(1, day + 1):
        valid_days_current.append(d)
    
    # Add days from current day to 31 (previous month range)
    for d in range(day+1, 32):
        valid_days_prev.append(d)
    
    # Use a simpler approach: get all scheduled transactions and filter in Python
    # This avoids database-specific CAST operations
    user_scheduled_trans = db.session.execute(
        text('''
            SELECT currency, date, amount, scheduled_trans_status, scheduled_trans_details, scheduled_trans_link, category, scheduled_trans_key
            FROM scheduled_trans
            WHERE user_id = :user_id 
            AND status = :status
            AND (last_time_added IS NULL OR last_time_added < :prev_month_date)
             '''),

        {"user_id": user_id, "status": True, "prev_month_date": prev_month_date}
    ).fetchall()

    # Filter the results in Python to avoid database-specific SQL
    filtered_scheduled_trans = []
    valid_days = list(set(valid_days_current + valid_days_prev))
    
    for trans in user_scheduled_trans:
        try:
            day_in_date = int(trans[1])  # date field
            if day_in_date in valid_days:
                filtered_scheduled_trans.append(trans)
        except (ValueError, TypeError):
            # Skip if date cannot be converted to int
            continue

    if filtered_scheduled_trans:
        for scheduled_trans in filtered_scheduled_trans:
                currency = scheduled_trans[0]
                day_in_date = int(scheduled_trans[1])
                amount = float(scheduled_trans[2])
                scheduled_trans_status = scheduled_trans[3]
                scheduled_trans_details = scheduled_trans[4]
                scheduled_trans_link = scheduled_trans[5]
                category = scheduled_trans[6]
                scheduled_trans_key = scheduled_trans[7]

                # Determine which month to use and handle edge cases
                if day_in_date in valid_days_prev:
                    # Use previous month
                    target_month = prev_month
                    target_year = prev_year
                    
                    # Handle day 31 and leap year cases for previous month
                    days_in_target_month = calendar.monthrange(target_year, target_month)[1]
                    
                    if day_in_date > days_in_target_month:
                        # If the scheduled day doesn't exist in target month, use last day of that month
                        actual_day = days_in_target_month
                    else:
                        actual_day = day_in_date
                    
                    date = now.replace(year=target_year, month=target_month, day=actual_day)
                    
                elif day_in_date in valid_days_current:
                    # Use current month
                    target_month = month
                    target_year = year
                    
                    # Handle day 31 and leap year cases for current month
                    days_in_target_month = calendar.monthrange(target_year, target_month)[1]
                    
                    if day_in_date > days_in_target_month:
                        # If the scheduled day doesn't exist in target month, use last day of that month
                        actual_day = days_in_target_month
                    else:
                        actual_day = day_in_date
                    
                    date = now.replace(year=target_year, month=target_month, day=actual_day)
                
                else:
                    # Fallback to current date if something goes wrong
                    date = now.replace(day=day_in_date if day_in_date <= calendar.monthrange(year, month)[1] else calendar.monthrange(year, month)[1])

                try:
                    #     Get next transaction ID for this user
                    next_trans_id = db.session.execute(
                        text("SELECT COALESCE(MAX(trans_id), 0) + 1 FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]

                    # Get next global transaction key
                    next_trans_key = db.session.execute(
                        text("SELECT COALESCE(MAX(trans_key), 0) + 1 FROM trans")
                    ).fetchone()[0]

                    # Insert the transaction with calculated date
                    db.session.execute(
                            text("""
                            INSERT INTO trans
                            (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details, category, trans_details_link)
                            VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details, :category, :trans_details_link)
                            """), 
                            {"date": date, "trans_key":next_trans_key, "amount":amount, "currency":currency, "user_id":user_id, "trans_id":next_trans_id,
                                "trans_status":scheduled_trans_status,  "trans_details":scheduled_trans_details, "category":category, "trans_details_link":scheduled_trans_link}
                    )
                    db.session.commit()

                    networth_db = db.session.execute(
                        text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                        {"user_id": user_id, "currency": currency}
                    ).fetchone()

                    if networth_db:
                        networth_id = networth_db[0]
                        total = float(networth_db[1])

                        if scheduled_trans_status == "deposit":
                            new_total_calc = total + amount
                        elif scheduled_trans_status == "withdraw":
                            new_total_calc = total - amount

                        # Update networth
                        new_total = recalculate_networth(user_id, new_total_calc, currency)

                        db.session.execute(
                            text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"),
                            {"total" :new_total, "networth_id": networth_id}
                        )
                        db.session.commit()
                    else:
                        # Create new networth entry if doesn't exist and it's a deposit
                        if scheduled_trans_status == "deposit":
                            networth_id = db.session.execute(
                                text("SELECT COALESCE(MAX(networth_id), 0) + 1 FROM networth")
                            ).fetchone()[0]
                            
                            db.session.execute(
                                text("INSERT INTO networth (networth_id, user_id, currency, total) VALUES (:networth_id, :user_id, :currency, :total)"),
                                {"networth_id": networth_id, "user_id": user_id, "currency": currency, "total": amount}
                            )
                            db.session.commit()

                    # Update last_time_added to current date (to mark it as processed for this month)
                    db.session.execute(
                        text("UPDATE scheduled_trans SET last_time_added = :last_time_added WHERE scheduled_trans_key = :scheduled_trans_key"),
                        {"last_time_added": date,"scheduled_trans_key": scheduled_trans_key}
                    )
                    db.session.commit()

                except Exception as e:
                    print(f"❌ Error processing scheduled transaction: {str(e)}")
                    db.session.rollback()
                    continue