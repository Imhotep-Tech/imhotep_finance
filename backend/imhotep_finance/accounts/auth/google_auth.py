#all of the auth related function
from django.shortcuts import redirect
from ..models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.conf import settings
from imhotep_finance.settings import SITE_DOMAIN, GOOGLE_OAUTH2_CLIENT_ID, GOOGLE_OAUTH2_CLIENT_SECRET, frontend_url
from decouple import config
from django.template.loader import render_to_string
from django.core.mail import send_mail

@api_view(['GET'])
@permission_classes([AllowAny])
def google_login_url(request):
    """Returns the Google OAuth2 login URL for frontend"""
    redirect_uri = config('GOOGLE_REDIRECT_URI', default=f'{SITE_DOMAIN}/api/auth/google/callback/')
    oauth2_url = (
        'https://accounts.google.com/o/oauth2/v2/auth?'
        f'client_id={GOOGLE_OAUTH2_CLIENT_ID}&'
        f'redirect_uri={redirect_uri}&'
        'response_type=code&'
        'scope=openid email profile&'
        'access_type=offline'
    )
    return Response({'auth_url': oauth2_url})

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Handle Google OAuth2 authentication with authorization code"""
    try:
        code = request.data.get('code')
        
        if not code:
            return Response(
                {'error': 'Authorization code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        redirect_uri = config('GOOGLE_REDIRECT_URI', default=f'{SITE_DOMAIN}/api/auth/google/callback/')
        
        # Exchange code for access token
        token_url = 'https://oauth2.googleapis.com/token'
        token_payload = {
            'client_id': GOOGLE_OAUTH2_CLIENT_ID,
            'client_secret': GOOGLE_OAUTH2_CLIENT_SECRET,
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }

        token_response = requests.post(token_url, data=token_payload)
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'Failed to exchange code for token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        token_data = token_response.json()

        # Get user info using access token
        userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
        headers = {'Authorization': f'Bearer {token_data["access_token"]}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        
        if userinfo_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user_info = userinfo_response.json()

        email = user_info['email']
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        # Check if user exists
        user = User.objects.filter(email=email).first()
        
        if user:
            # User exists, generate tokens and return
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            # User doesn't exist, create new user
            username = email.split('@')[0]
            
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                email_verify=True,
                is_active=True
            )

            # Send welcome email
            try:
                mail_subject = 'Welcome to Imhotep Finance!'
                message = render_to_string('welcome_email.html', {
                    'user': user,
                    'domain': SITE_DOMAIN.rstrip('/'),
                    'frontend_url': frontend_url,
                    'uid': user.pk,  # Not used for Google, but template expects it
                    'token': '',     # Not used for Google, but template expects it
                })
                send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [user.email], html_message=message)
            except Exception as email_error:
                print(f"Failed to send welcome email: {str(email_error)}")

            # Generate tokens and return
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'is_new_user': True
            })

    except Exception:
        return Response(
            {'error': f'An error occurred during Google authentication'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    """Handles the callback from Google OAuth2 - redirects to frontend with code"""
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        return redirect(f"{frontend_url}/login?error=google_auth_cancelled")
    
    if code:
        return redirect(f"{frontend_url}/auth/google/callback?code={code}")
    
    return redirect(f"{frontend_url}/login?error=google_auth_failed")