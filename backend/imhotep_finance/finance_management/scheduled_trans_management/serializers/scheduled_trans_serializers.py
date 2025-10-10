from rest_framework import serializers


class AddScheduledTransSerializer(serializers.Serializer):
    day_of_month = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    scheduled_trans_details = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    scheduled_trans_status = serializers.ChoiceField(choices=["deposit", "withdraw", "Deposit", "Withdraw"])


class SimpleSuccessResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error = serializers.CharField(required=False)


class ScheduledTransItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    category = serializers.CharField(allow_blank=True)
    scheduled_trans_details = serializers.CharField(allow_blank=True)
    scheduled_trans_status = serializers.CharField()


class PaginationSerializer(serializers.Serializer):
    page = serializers.IntegerField()
    num_pages = serializers.IntegerField()
    per_page = serializers.IntegerField()
    total = serializers.IntegerField()


class ScheduledTransListResponseSerializer(serializers.Serializer):
    scheduled_transactions = ScheduledTransItemSerializer(many=True)
    pagination = PaginationSerializer()


