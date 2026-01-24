from rest_framework import permissions
from oauth2_provider.contrib.rest_framework import TokenHasScope


class OAuth2TransactionWritePermission(permissions.BasePermission):
    """
    Custom permission to check if the OAuth2 token has the required scope
    for transaction write operations.
    """
    required_scopes = ['transactions:write']

    def has_permission(self, request, view):
        # Check if using OAuth2 authentication
        if hasattr(request, 'auth') and hasattr(request.auth, 'application'):
            # This is an OAuth2 token
            token = request.auth
            # Check if token has the required scope
            if hasattr(token, 'scope'):
                scopes = token.scope.split() if token.scope else []
                return 'transactions:write' in scopes or 'write' in scopes
        return False


class OAuth2TransactionReadPermission(permissions.BasePermission):
    """
    Custom permission to check if the OAuth2 token has the required scope
    for transaction read operations.
    """
    required_scopes = ['transactions:read']

    def has_permission(self, request, view):
        # Check if using OAuth2 authentication
        if hasattr(request, 'auth') and hasattr(request.auth, 'application'):
            # This is an OAuth2 token
            token = request.auth
            # Check if token has the required scope
            if hasattr(token, 'scope'):
                scopes = token.scope.split() if token.scope else []
                return 'transactions:read' in scopes or 'read' in scopes
        return False
