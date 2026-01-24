"""
Custom OAuth2 authorization view that handles authentication properly
with JWT-based login system.

For Swagger UI: We need to support session-based authentication for the OAuth2 flow
since Swagger opens the authorization in a popup/iframe.
"""
from django.contrib.auth.views import redirect_to_login
from django.shortcuts import redirect
from django.urls import reverse
from oauth2_provider.views import AuthorizationView
from oauth2_provider.models import Application
from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse
from urllib.parse import urlencode, quote
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login

User = get_user_model()


class CustomAuthorizationView(AuthorizationView):
    """
    Custom authorization view that handles JWT-based authentication
    by checking for JWT token in the request and creating a session.
    This allows Swagger UI to work properly with the OAuth2 flow.
    """
    
    def dispatch(self, request, *args, **kwargs):
        # Check if user is authenticated via session (for OAuth2 flow)
        if not request.user.is_authenticated:
            # Try to authenticate via JWT token from Authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    # Validate JWT token
                    validated_token = UntypedToken(token)
                    # Get user_id from the validated token
                    user_id = validated_token['user_id']
                    if user_id:
                        user = User.objects.get(id=user_id)
                        # Create a session for this user so OAuth2 flow works
                        django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                except (InvalidToken, TokenError, User.DoesNotExist, KeyError, Exception):
                    pass  # Token invalid, will redirect to login
            
            # If still not authenticated, redirect to frontend login
            if not request.user.is_authenticated:
                # Get the authorization parameters to preserve them
                client_id = request.GET.get('client_id')
                redirect_uri = request.GET.get('redirect_uri')
                response_type = request.GET.get('response_type')
                scope = request.GET.get('scope')
                state = request.GET.get('state')
                
                # Build the authorization URL to redirect back to after login
                auth_url = f"{settings.SITE_DOMAIN}/o/authorize/"
                params = {}
                if client_id:
                    params['client_id'] = client_id
                if redirect_uri:
                    params['redirect_uri'] = redirect_uri
                if response_type:
                    params['response_type'] = response_type
                if scope:
                    params['scope'] = scope
                if state:
                    params['state'] = state
                
                query_string = urlencode(params)
                next_url = f"{auth_url}?{query_string}" if query_string else auth_url
                
                # URL encode the next parameter for the frontend
                encoded_next = quote(next_url, safe='')
                
                # Redirect to frontend login with next parameter
                frontend_login_url = f"{settings.frontend_url}/login?next={encoded_next}"
                return HttpResponseRedirect(frontend_login_url)
        
        # User is authenticated (via session or JWT), proceed with normal authorization flow
        return super().dispatch(request, *args, **kwargs)
