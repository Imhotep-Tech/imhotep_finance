from django.db.models import Sum
from ..models import Transactions, NetWorth

def recalculate_networth(user):
    """Recalculate user's networth from all transactions."""
    try:
        if not user:
            return False, "User must be provided"
        
        # Clear existing networth records for this user
        NetWorth.objects.filter(user=user).delete()
        
        # Get all transactions grouped by currency
        currency_totals = {}
        
        # Get all user transactions
        transactions = Transactions.objects.filter(user=user)
        
        for transaction in transactions:
            currency = transaction.currency
            amount = float(transaction.amount)
            
            if currency not in currency_totals:
                currency_totals[currency] = 0.0
            
            if transaction.trans_status.lower() == "deposit":
                currency_totals[currency] += amount
            elif transaction.trans_status.lower() == "withdraw":
                currency_totals[currency] -= amount
        
        # Create new networth records for each currency with non-zero balance
        created_count = 0
        for currency, total in currency_totals.items():
            if total != 0:  # Only create records for non-zero balances
                NetWorth.objects.create(
                    user=user,
                    currency=currency,
                    total=total
                )
                created_count += 1
        
        return True, {
            "currencies_processed": len(currency_totals),
            "networth_records_created": created_count,
            "currency_totals": currency_totals
        }
        
    except Exception as e:
        print(f"Error in recalculate_networth: {str(e)}")
        return False, "Error occurred while recalculating networth"
