from .currencies import get_fav_currency, convert_to_fav_currency
from transaction_management.models import NetWorth

def get_networth(request):
    try:
        user = request.user
        user_netWorth = NetWorth.objects.filter(user=user).values('total', 'currency')
        
        if not user_netWorth.exists():
            return 0.0
        
        amounts_not_fav_currency = {}
        for item in user_netWorth:
            currency = item['currency']
            total = item['total'] or 0.0  # Handle None values
            amounts_not_fav_currency[currency] = amounts_not_fav_currency.get(currency, 0) + float(total)
        
        if not amounts_not_fav_currency:
            return 0.0
            
        total_favorite_currency, _ = convert_to_fav_currency(request, amounts_not_fav_currency)
        
        # Handle None return from convert_to_fav_currency
        if total_favorite_currency is None:
            return 0.0
            
        total_favorite_currency = round(float(total_favorite_currency), 2)
        return total_favorite_currency
    except Exception as e:
        print(f"Error in get_networth: {str(e)}")  # Log detailed error for debugging
        return 0.0

def get_netWorth_details(request):
    user = request.user
    networth_db = NetWorth.objects.filter(user=user)

    currency_dict = {}
    for i in networth_db:
        currency_dict[i.currency] = currency_dict.get(i.currency, 0) + i.total

    return currency_dict