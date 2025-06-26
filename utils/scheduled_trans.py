from sqlalchemy import text
from extensions import db
from utils.send_mail import smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail
from utils.recalculate_networth import recalculate_networth
import calendar

def add_scheduled_trans(user_id, now):
    """Process and add scheduled transactions for a user based on current date."""
    day = now.day #get current day
    month = now.month #get current month
    year = now.year #get current year
    
    # Calculate previous month for comparison
    if month == 1: #check if january
        prev_month = 12 #set to december
        prev_year = year - 1 #previous year
    else:
        prev_month = month - 1 #previous month
        prev_year = year #same year
    
    prev_month_date = now.replace(month=month-1) #create previous month date
    current_date = now.date() #get current date

    # Create a list of valid days for the rolling window
    valid_days_current = [] #initialize current month valid days
    valid_days_prev = [] #initialize previous month valid days

    # Add days from 1 to current day (this month)
    for d in range(1, day + 1): #iterate from 1 to current day
        valid_days_current.append(d) #add day to current month list
    
    # Add days from current day to 31 (previous month range)
    for d in range(day+1, 32): #iterate from next day to 31
        valid_days_prev.append(d) #add day to previous month list
    
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
    ).fetchall() #get active scheduled transactions that haven't been processed this month

    # Filter the results in Python to avoid database-specific SQL
    filtered_scheduled_trans = [] #initialize filtered transactions list
    valid_days = list(set(valid_days_current + valid_days_prev)) #combine and deduplicate valid days
    
    for trans in user_scheduled_trans: #iterate through scheduled transactions
        try:
            day_in_date = int(trans[1])  # date field #convert date field to integer
            if day_in_date in valid_days: #check if day is in valid range
                filtered_scheduled_trans.append(trans) #add to filtered list
        except (ValueError, TypeError):
            # Skip if date cannot be converted to int
            continue #skip invalid dates

    if filtered_scheduled_trans: #check if there are transactions to process
        for scheduled_trans in filtered_scheduled_trans: #iterate through filtered transactions
                currency = scheduled_trans[0] #get currency
                day_in_date = int(scheduled_trans[1]) #get scheduled day
                amount = float(scheduled_trans[2]) #get amount
                scheduled_trans_status = scheduled_trans[3] #get transaction status (deposit/withdraw)
                scheduled_trans_details = scheduled_trans[4] #get transaction details
                scheduled_trans_link = scheduled_trans[5] #get transaction link
                category = scheduled_trans[6] #get category
                scheduled_trans_key = scheduled_trans[7] #get transaction key

                # Determine which month to use and handle edge cases
                if day_in_date in valid_days_prev: #check if day belongs to previous month
                    # Use previous month
                    target_month = prev_month #set target month to previous
                    target_year = prev_year #set target year to previous
                    
                    # Handle day 31 and leap year cases for previous month
                    days_in_target_month = calendar.monthrange(target_year, target_month)[1] #get days in target month
                    
                    if day_in_date > days_in_target_month: #check if scheduled day doesn't exist in target month
                        # If the scheduled day doesn't exist in target month, use last day of that month
                        actual_day = days_in_target_month #use last day of month
                    else:
                        actual_day = day_in_date #use scheduled day
                    
                    date = now.replace(year=target_year, month=target_month, day=actual_day) #create target date
                    
                elif day_in_date in valid_days_current: #check if day belongs to current month
                    # Use current month
                    target_month = month #set target month to current
                    target_year = year #set target year to current
                    
                    # Handle day 31 and leap year cases for current month
                    days_in_target_month = calendar.monthrange(target_year, target_month)[1] #get days in target month
                    
                    if day_in_date > days_in_target_month: #check if scheduled day doesn't exist in target month
                        # If the scheduled day doesn't exist in target month, use last day of that month
                        actual_day = days_in_target_month #use last day of month
                    else:
                        actual_day = day_in_date #use scheduled day
                    
                    date = now.replace(year=target_year, month=target_month, day=actual_day) #create target date
                
                else:
                    # Fallback to current date if something goes wrong
                    date = now.replace(day=day_in_date if day_in_date <= calendar.monthrange(year, month)[1] else calendar.monthrange(year, month)[1]) #fallback date calculation

                try:
                    #     Get next transaction ID for this user
                    next_trans_id = db.session.execute(
                        text("SELECT COALESCE(MAX(trans_id), 0) + 1 FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0] #get next transaction id for user

                    # Get next global transaction key
                    next_trans_key = db.session.execute(
                        text("SELECT COALESCE(MAX(trans_key), 0) + 1 FROM trans")
                    ).fetchone()[0] #get next global transaction key

                    # Insert the transaction with calculated date
                    db.session.execute(
                            text("""
                            INSERT INTO trans
                            (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details, category, trans_details_link)
                            VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details, :category, :trans_details_link)
                            """), 
                            {"date": date, "trans_key":next_trans_key, "amount":amount, "currency":currency, "user_id":user_id, "trans_id":next_trans_id,
                                "trans_status":scheduled_trans_status,  "trans_details":scheduled_trans_details, "category":category, "trans_details_link":scheduled_trans_link}
                    ) #insert new transaction into database
                    db.session.commit() #commit transaction insertion

                    #get existing networth for user and currency
                    networth_db = db.session.execute(
                        text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                        {"user_id": user_id, "currency": currency}
                    ).fetchone()

                    if networth_db: #check if networth record exists
                        networth_id = networth_db[0] #get networth id
                        total = float(networth_db[1]) #get current total

                        if scheduled_trans_status == "deposit": #check if transaction is a deposit
                            new_total_calc = total + amount #add amount to total
                        elif scheduled_trans_status == "withdraw": #check if transaction is a withdrawal
                            new_total_calc = total - amount #subtract amount from total

                        # Update networth
                        new_total = recalculate_networth(user_id, new_total_calc, currency) #recalculate networth

                        #update networth in database
                        db.session.execute(
                            text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"),
                            {"total" :new_total, "networth_id": networth_id}
                        )
                        db.session.commit() #commit networth update
                    else:
                        # Create new networth entry if doesn't exist and it's a deposit
                        if scheduled_trans_status == "deposit": #only create new networth for deposits
                            #get next networth id
                            networth_id = db.session.execute(
                                text("SELECT COALESCE(MAX(networth_id), 0) + 1 FROM networth")
                            ).fetchone()[0]
                            
                            #insert new networth record
                            db.session.execute(
                                text("INSERT INTO networth (networth_id, user_id, currency, total) VALUES (:networth_id, :user_id, :currency, :total)"),
                                {"networth_id": networth_id, "user_id": user_id, "currency": currency, "total": amount}
                            )
                            db.session.commit() #commit networth creation

                    # Update last_time_added to current date (to mark it as processed for this month)
                    db.session.execute(
                        text("UPDATE scheduled_trans SET last_time_added = :last_time_added WHERE scheduled_trans_key = :scheduled_trans_key"),
                        {"last_time_added": date,"scheduled_trans_key": scheduled_trans_key}
                    ) #update last processing date
                    db.session.commit() #commit scheduled transaction update

                except Exception as e:
                    print(f"❌ Error processing scheduled transaction: {str(e)}") #print error message
                    db.session.rollback() #rollback database changes on error
                    continue #continue with next transaction