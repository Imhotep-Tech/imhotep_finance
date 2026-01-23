from rest_framework import serializers


class TargetCreateSerializer(serializers.Serializer):
    target = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text="Target amount for the current month (must be positive)"
    )
    
    def validate_target(self, value):
        """Ensure target is positive."""
        if value <= 0:
            raise serializers.ValidationError("Target must be greater than zero")
        return value
    
    class Meta:
        examples = {
            'application/json': {
                'target': 1000.00
            }
        }


class TargetResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="Unique target ID")
    user_id = serializers.IntegerField(help_text="User ID")
    target = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Target amount"
    )
    month = serializers.IntegerField(help_text="Month (1-12)")
    year = serializers.IntegerField(help_text="Year")
    score = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Current score: (Deposits - Target) - Withdrawals"
    )
    created_at = serializers.DateTimeField(help_text="Creation timestamp")
    
    class Meta:
        examples = {
            'application/json': {
                'id': 1,
                'user_id': 1,
                'target': 1000.00,
                'month': 1,
                'year': 2024,
                'score': -200.00,
                'created_at': '2024-01-01T12:00:00Z'
            }
        }


class GetScoreResponseSerializer(serializers.Serializer):
    score = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Score difference: (Deposits - Target) - Withdrawals. Positive = above target, Negative = below target"
    )
    target = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Target amount"
    )
    month = serializers.IntegerField(help_text="Month (1-12)")
    year = serializers.IntegerField(help_text="Year")
    score_txt = serializers.CharField(
        help_text="Human-readable score status: 'Above target', 'Below target', or 'On target'"
    )
    
    class Meta:
        examples = {
            'application/json': {
                'score': 150.00,
                'target': 1000.00,
                'month': 1,
                'year': 2024,
                'score_txt': 'Above target'
            }
        }


class TargetHistoryResponseSerializer(serializers.Serializer):
    targets = TargetResponseSerializer(many=True)
    pagination = serializers.DictField(
        help_text="Pagination information including page, num_pages, per_page, total"
    )
    
    class Meta:
        examples = {
            'application/json': {
                'targets': [
                    {
                        'id': 1,
                        'user_id': 1,
                        'target': 1000,
                        'month': 1,
                        'year': 2024,
                        'score': 150,
                        'created_at': '2024-01-01T12:00:00Z'
                    }
                ],
                'pagination': {
                    'page': 1,
                    'num_pages': 1,
                    'per_page': 20,
                    'total': 1
                }
            }
        }
