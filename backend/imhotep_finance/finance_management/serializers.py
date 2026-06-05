from rest_framework import serializers


class NetworthResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="User ID")
    networth = serializers.FloatField(help_text="Total networth value")


class NetworthDetailsResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="User ID")
    networth_details = serializers.DictField(
        help_text="Networth details per currency"
    )


class CategoryRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['Deposit', 'Withdraw', 'ANY'],
        default='ANY',
        required=False,
        help_text="Filter categories by transaction status"
    )


class CategoryResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="User ID")
    category = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of frequently used category names"
    )

class PlaceRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['Deposit', 'Withdraw', 'ANY'],
        default='ANY',
        required=False,
        help_text="Filter places by transaction status"
    )

class PlaceResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="User ID")
    place = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of frequently used place names"
    )

class MoveMoneyRequestSerializer(serializers.Serializer):
    source_place = serializers.CharField(required=True, max_length=255, help_text="The source place name")
    target_place = serializers.CharField(required=True, max_length=255, help_text="The target place name")
    amount = serializers.FloatField(required=True, help_text="Amount to transfer")
    currency = serializers.CharField(required=True, max_length=4, help_text="Currency to transfer")

class ConvertCurrencyRequestSerializer(serializers.Serializer):
    place = serializers.CharField(required=True, max_length=255, help_text="The place name where conversion happens")
    source_currency = serializers.CharField(required=True, max_length=4, help_text="Currency to convert from")
    target_currency = serializers.CharField(required=True, max_length=4, help_text="Currency to convert to")
    amount = serializers.FloatField(required=True, help_text="Amount of source currency to convert")
    target_amount = serializers.FloatField(required=True, help_text="Amount of target currency to receive")

class DeleteNetworthRequestSerializer(serializers.Serializer):
    place = serializers.CharField(required=True, max_length=255, help_text="The place name of the net worth record")
    currency = serializers.CharField(required=True, max_length=4, help_text="The currency of the net worth record")