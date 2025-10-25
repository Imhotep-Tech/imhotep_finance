from rest_framework import serializers

class AddTransactionSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    trans_details = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    trans_status = serializers.ChoiceField(choices=["deposit", "withdraw"])


class AddTransactionResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    networth = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    error = serializers.CharField(required=False)


class UpdateTransactionSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    trans_details = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    trans_status = serializers.ChoiceField(choices=["deposit", "withdraw"])


class UpdateTransactionResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    networth = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    error = serializers.CharField(required=False)


class TransactionItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    trans_status = serializers.CharField()
    category = serializers.CharField(allow_blank=True)
    trans_details = serializers.CharField(allow_blank=True)


class PaginationSerializer(serializers.Serializer):
    page = serializers.IntegerField()
    num_pages = serializers.IntegerField()
    per_page = serializers.IntegerField()
    total = serializers.IntegerField()


class TransactionListResponseSerializer(serializers.Serializer):
    transactions = TransactionItemSerializer(many=True)
    pagination = PaginationSerializer()
    date_range = serializers.DictField(child=serializers.CharField())
