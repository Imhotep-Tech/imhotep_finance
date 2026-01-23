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
