from rest_framework import serializers
from oauth2_provider.models import Application


class OAuth2ApplicationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a new OAuth2 application.
    """
    name = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Application name (e.g., 'My Todo App')"
    )
    client_type = serializers.ChoiceField(
        choices=[
            ('confidential', 'Confidential'),
            ('public', 'Public'),
        ],
        default='confidential',
        help_text="Client type: 'confidential' for server-side apps, 'public' for client-side apps"
    )
    authorization_grant_type = serializers.ChoiceField(
        choices=[
            ('authorization-code', 'Authorization code'),
            ('implicit', 'Implicit'),
            ('password', 'Resource owner password-based'),
            ('client-credentials', 'Client credentials'),
        ],
        default='authorization-code',
        help_text="OAuth2 grant type. Use 'authorization-code' for standard OAuth2 flow."
    )
    redirect_uris = serializers.CharField(
        required=True,
        help_text="Allowed redirect URIs, one per line or space-separated"
    )
    skip_authorization = serializers.BooleanField(
        default=False,
        help_text="If True, skip the authorization step for this application"
    )

    def validate_redirect_uris(self, value):
        """Validate redirect URIs format."""
        if not value or not value.strip():
            raise serializers.ValidationError("At least one redirect URI is required")
        
        # Split by newlines or spaces
        uris = [uri.strip() for uri in value.replace('\n', ' ').split() if uri.strip()]
        
        if not uris:
            raise serializers.ValidationError("At least one valid redirect URI is required")
        
        # Basic URL validation
        for uri in uris:
            if not (uri.startswith('http://') or uri.startswith('https://')):
                raise serializers.ValidationError(
                    f"Invalid redirect URI: {uri}. Must start with http:// or https://"
                )
        
        return '\n'.join(uris)


class OAuth2ApplicationResponseSerializer(serializers.Serializer):
    """
    Serializer for OAuth2 application response.
    """
    id = serializers.IntegerField(help_text="Application ID")
    name = serializers.CharField(help_text="Application name")
    client_id = serializers.CharField(help_text="OAuth2 Client ID")
    client_secret = serializers.CharField(help_text="OAuth2 Client Secret (shown only once)")
    client_type = serializers.CharField(help_text="Client type")
    authorization_grant_type = serializers.CharField(help_text="Authorization grant type")
    redirect_uris = serializers.CharField(help_text="Allowed redirect URIs")
    skip_authorization = serializers.BooleanField(help_text="Skip authorization flag")
    created = serializers.DateTimeField(help_text="Creation timestamp")
    updated = serializers.DateTimeField(help_text="Last update timestamp")
    user_id = serializers.IntegerField(help_text="Owner user ID")


class OAuth2ApplicationListSerializer(serializers.Serializer):
    """
    Serializer for listing OAuth2 applications (without client_secret).
    """
    id = serializers.IntegerField(help_text="Application ID")
    name = serializers.CharField(help_text="Application name")
    client_id = serializers.CharField(help_text="OAuth2 Client ID")
    client_type = serializers.CharField(help_text="Client type")
    authorization_grant_type = serializers.CharField(help_text="Authorization grant type")
    redirect_uris = serializers.CharField(help_text="Allowed redirect URIs")
    skip_authorization = serializers.BooleanField(help_text="Skip authorization flag")
    created = serializers.DateTimeField(help_text="Creation timestamp")
    updated = serializers.DateTimeField(help_text="Last update timestamp")
