from .currencies import get_fav_currency, convert_to_fav_currency
from ..models import NetWorth

def get_networth(request):
    user = request.user
    networth_db = NetWorth.objects.filter(user=user)

    currency_dict = {}
    for i in networth_db:
        currency_dict[i.currency] = currency_dict.get(i.currency, 0) + i.total

    total_favorite_currency, favorite_currency = convert_to_fav_currency(request, currency_dict)
    # Format to 2 decimal places
    total_favorite_currency = round(float(total_favorite_currency), 2)
    return total_favorite_currency

def get_netWorth_details(request):
    user = request.user
    networth_db = NetWorth.objects.filter(user=user)

    currency_dict = {}
    for i in networth_db:
        currency_dict[i.currency] = currency_dict.get(i.currency, 0) + i.total

    return currency_dict