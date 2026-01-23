from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from finance_management.utils.currencies import get_allowed_currencies
from datetime import date
from django.utils import timezone  # Fixed import
from django.db import transaction
from wishlist_management.models import Wishlist
from transaction_management.services import create_transaction, delete_transaction

def create_wish(*,user, price, currency, year, wish_details, link):
    """Create a transaction and update networth."""

    #Just in case more security for inner calls
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if currency is None or price is None:
        raise ValidationError("You have to choose the currency and price!")

    if price <= 0:
        raise ValidationError("Price must be greater than zero")
    price = float(price)

    #if date not provided, use today
    if not year:
        year = timezone.now().year  # Fixed

    #Validate currency for inner calls
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")

    with transaction.atomic():
        #create Transaction
         wish = Wishlist.objects.create(
            user=user,
            price=price,
            currency=currency,
            year=year,
            wish_details=wish_details,
            link=link,
        )
                     
    return wish

def delete_wish(*, user, wish_id):
    """Delete a wish."""
    #Just in case more security for inner calls
    if not user:
        raise ValidationError("User must be authenticated!")

    #get wish data for deletion
    wish_db = get_object_or_404(Wishlist, user=user, id=wish_id)

    wish_status = wish_db.status  # renamed to avoid shadowing

    if wish_status:
        raise ValidationError("You must select a pending wish to delete it")

    try:
        wish_db.delete()
    except Exception as e:
        raise ValidationError(f'Error happened while deleting: {str(e)}')

    return

def update_wish(*, user, wish_id, price, currency, year, wish_details, link):
    """Update a wish."""
    #Just in case more security for inner calls
    if not user:
        raise ValidationError("User must be authenticated!")

    if currency is None or price is None:
        raise ValidationError("You have to choose the currency and price!")

    if price <= 0:
        raise ValidationError("Price must be greater than zero")
    price = float(price)

    #if date not provided, use current year
    if not year:
        year = timezone.now().year

    #Validate currency for inner calls
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")

    #get wish data for update
    wish = get_object_or_404(Wishlist, user=user, id=wish_id)

    wish_status = wish.status

    if wish_status:
        raise ValidationError("Wish Status Must Be pending to update it")

    try:
        wish.year = year
        wish.price = price
        wish.currency = currency
        wish.wish_details = wish_details
        wish.link = link
        wish.save()
    except Exception as e:
        raise ValidationError(f'Error happened while saving: {str(e)}')

    return wish

def update_wish_status(*, user, wish_id):
    """Update the status of a wish."""
    #Just in case more security for inner calls
    if not user:
        raise ValidationError("User must be authenticated!")

    #get wish data for update
    wish = get_object_or_404(Wishlist, user=user, id=wish_id)

    currency = wish.currency #get currency
    amount = wish.price #get amount
    wish_status = wish.status #get current status
    wish_details = wish.wish_details #get wish details
    current_date = date.today() #get current date

    with transaction.atomic():
        if not wish_status:
            # Wish is being marked as purchased - create transaction
            trans = create_transaction(
                user=user,
                amount=amount,
                currency=currency,
                trans_details=wish_details,
                category="Wishes",
                trans_status="Withdraw",
                transaction_date=current_date
            )

            if not trans:
                raise ValidationError("Error occurred while creating the transaction")
            
            wish.transaction = trans
            wish.status = True  # Mark as purchased
            wish.save()
            
        else:
            # Wish is being marked as not purchased - reverse the transaction
            if wish.transaction:
                new_total = delete_transaction(
                    user=user,
                    transaction_id=wish.transaction.id
                )
                
                wish.transaction = None
                wish.status = False  # Mark as not purchased
                wish.save()
            else:
                raise ValidationError("No transaction associated with this wish")
    
    return wish