from rest_framework import serializers


class AddWishSerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    wish_details = serializers.CharField(required=False, allow_blank=True)
    link = serializers.CharField(required=False, allow_blank=True)


class AddWishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error = serializers.CharField(required=False)


class UpdateWishSerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    wish_details = serializers.CharField(required=False, allow_blank=True)
    link = serializers.CharField(required=False, allow_blank=True)


class UpdateWishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error = serializers.CharField(required=False)


class UpdateWishStatusResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    wish_status = serializers.BooleanField()
    networth = serializers.DecimalField(max_digits=12, decimal_places=2)


class DeleteWishResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    networth = serializers.DecimalField(max_digits=12, decimal_places=2)


class WishlistItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    year = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    wish_details = serializers.CharField(allow_blank=True)
    link = serializers.CharField(allow_blank=True)
    status = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class PaginationSerializer(serializers.Serializer):
    page = serializers.IntegerField()
    num_pages = serializers.IntegerField()
    per_page = serializers.IntegerField()
    total = serializers.IntegerField()


class WishlistListResponseSerializer(serializers.Serializer):
    wishlist = WishlistItemSerializer(many=True)
    pagination = PaginationSerializer()
    year = serializers.IntegerField()


