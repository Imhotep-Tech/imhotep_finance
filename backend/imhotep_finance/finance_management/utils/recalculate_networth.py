from django.db.models import Sum, Q
from ..models import Transactions, NetWorth

def recalculate_networth(user):
    """Recalculate user's networth from all transactions."""
    try:
        if not user:
            return False, "User must be provided"

        # Get all unique currencies from user's transactions using Python set for true uniqueness
        currencies_queryset = Transactions.objects.filter(user=user).values_list('currency', flat=True)
        unique_currencies = list(set(currencies_queryset))  # Convert to set then back to list for true uniqueness

        print(f"Unique currencies: {unique_currencies}")
        
        if not unique_currencies:
            # Clear existing networth records if no transactions exist
            NetWorth.objects.filter(user=user).delete()
            return True, {
                "currencies_processed": 0,
                "networth_records_created": 0,
                "currency_totals": {}
            }
        
        # Clear existing networth records for this user
        NetWorth.objects.filter(user=user).delete()
        
        # Calculate totals for each currency
        currency_totals = {}
        created_count = 0
        
        for currency in unique_currencies:
            # Get all deposits for this currency (case insensitive)
            deposits = Transactions.objects.filter(
                user=user,
                currency=currency,
                trans_status__in=['Deposit', 'deposit']
            ).aggregate(total=Sum('amount'))['total'] or 0.0
            
            # Get all withdrawals for this currency (case insensitive)
            withdrawals = Transactions.objects.filter(
                user=user,
                currency=currency,
                trans_status__in=['Withdraw', 'withdraw']
            ).aggregate(total=Sum('amount'))['total'] or 0.0
            
            # Calculate net balance (deposits - withdrawals)
            net_balance = float(deposits) - float(withdrawals)
            currency_totals[currency] = net_balance
            
            # Create networth record for all currencies (even zero balances for tracking)
            NetWorth.objects.create(
                user=user,
                currency=currency,
                total=net_balance
            )
            created_count += 1
            
            print(f"Currency: {currency}, Deposits: {deposits}, Withdrawals: {withdrawals}, Net: {net_balance}")
        
        return True, {
            "currencies_processed": len(unique_currencies),
            "networth_records_created": created_count,
            "currency_totals": currency_totals
        }
        
    except Exception as e:
        print(f"Error in recalculate_networth: {str(e)}")
        return False, "Error occurred while recalculating networth"
