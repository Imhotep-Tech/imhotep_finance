from django.db.models import Sum, Q
from transaction_management.models import Transactions, NetWorth

def recalculate_networth(user):
    """Recalculate user's networth from all transactions."""
    try:
        if not user:
            return False, "User must be provided"

        # 1. First, cleanly update all transaction places to ensure consistent grouping
        all_transactions = Transactions.objects.filter(user=user)
        for trans in all_transactions:
            raw_place = trans.place
            actual_place = raw_place.strip().title() if raw_place and str(raw_place).strip() else 'General'
            if raw_place != actual_place:
                trans.place = actual_place
                trans.save(update_fields=['place'])

        # 2. Get all unique currency and place combinations from cleaned user's transactions
        combinations = list(Transactions.objects.filter(user=user).values_list('currency', 'place').distinct())

        print(f"Unique combinations: {combinations}")
        
        if not combinations:
            # Clear existing networth records if no transactions exist
            NetWorth.objects.filter(user=user).delete()
            return True, {
                "currencies_processed": 0,
                "networth_records_created": 0,
                "currency_totals": {}
            }
        
        # Clear existing networth records for this user
        NetWorth.objects.filter(user=user).delete()
        
        # Calculate totals for each currency & actual_place
        currency_totals = {}
        networth_balances = {}
        created_count = 0
        
        for currency, place in combinations:
            actual_place = place or 'General'
            
            # Get all deposits for this combination
            deposits = Transactions.objects.filter(
                user=user,
                currency=currency,
                place=place,
                trans_status__in=['Deposit', 'deposit']
            ).aggregate(total=Sum('amount'))['total'] or 0.0
            
            # Get all withdrawals for this combination
            withdrawals = Transactions.objects.filter(
                user=user,
                currency=currency,
                place=place,
                trans_status__in=['Withdraw', 'withdraw']
            ).aggregate(total=Sum('amount'))['total'] or 0.0
            
            # Calculate net balance (deposits - withdrawals)
            net_balance = float(deposits) - float(withdrawals)
            
            key = (currency, actual_place)
            networth_balances[key] = networth_balances.get(key, 0.0) + net_balance
            currency_totals[currency] = currency_totals.get(currency, 0.0) + net_balance
            
        for (currency, actual_place), net_balance in networth_balances.items():
            # Create networth record for all combinations (even zero balances for tracking)
            NetWorth.objects.create(
                user=user,
                currency=currency,
                place=actual_place,
                total=net_balance
            )
            created_count += 1
            
            print(f"Currency: {currency}, Place: {actual_place}, Net: {net_balance}")
        
        return True, {
            "currencies_processed": len(set(c[0] for c in combinations)),
            "networth_records_created": created_count,
            "currency_totals": currency_totals
        }
        
    except Exception as e:
        print(f"Error in recalculate_networth: {str(e)}")
        return False, "Error occurred while recalculating networth"
