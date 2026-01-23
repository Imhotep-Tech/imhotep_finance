from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies


class WishlistInputSerializer(serializers.Serializer):
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text="Wish price (must be greater than 0)"
    )
    currency = serializers.ChoiceField(
        choices=[(c, c) for c in get_allowed_currencies()],
        required=True,
        help_text="Currency code (e.g., USD, EUR)"
    )
    year = serializers.IntegerField(
        required=True,
        help_text="Year for the wish"
    )
    wish_details = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Wish description"
    )
    link = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Link to product/item"
    )
    
    def validate_price(self, value):
        """Ensure price is positive."""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero")
        return value


class GetWishlistInputSerializer(serializers.Serializer):
    year = serializers.IntegerField(
        required=False,
        help_text="Year to filter wishlist"
    )
    page = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        help_text="Page number for pagination"
    )


class WishlistOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    transaction_id = serializers.IntegerField(allow_null=True)
    transaction_date = serializers.DateField(allow_null=True)
    year = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.BooleanField()
    link = serializers.CharField(allow_null=True)
    wish_details = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()


class GetWishlistResponseSerializer(serializers.Serializer):
    wishlist = WishlistOutputSerializer(many=True)
    pagination = serializers.DictField()
    year = serializers.IntegerField()