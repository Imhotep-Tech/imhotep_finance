from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from finance_management.utils.currencies import get_fav_currency, get_allowed_currencies
from datetime import datetime
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from accounts.services import (
    authenticate_mobile_with_google_token,
    login_user,
    demo_login,
    register_user,
    verify_email,
    verify_account_otp,
    verify_email_change,
    verify_email_change_otp,
    logout_user,
    request_password_reset,
    confirm_password_reset,
    confirm_password_reset_otp,
    validate_password_reset_token,
    get_google_oauth_url,
    authenticate_with_google,
    update_user_profile,
    change_user_password,
    verify_email_change,
    request_delete_account_otp,
    delete_user_account
)
from accounts.serializers import (
    ChangeFavCurrencyRequestSerializer,
    UserViewResponseSerializer,
    LoginRequestSerializer,
    LoginResponseSerializer,
    RegisterRequestSerializer,
    VerifyEmailRequestSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetValidateSerializer,
    GoogleAuthRequestSerializer,
    GoogleAuthResponseSerializer,
    UpdateProfileRequestSerializer,
    ChangePasswordRequestSerializer,
    VerifyEmailChangeRequestSerializer,
    VerifyEmailChangeOTPRequestSerializer,
    VerifyAccountOTPRequestSerializer,
    PasswordResetConfirmOTPSerializer,
    RequestDeleteAccountOTPSerializer,
    DeleteAccountConfirmSerializer
)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.contrib.auth import get_user_model, login as django_login
from urllib.parse import unquote

User = get_user_model()

from imhotep_finance.throttles import (
    LoginRateThrottle,
    RegistrationRateThrottle,
    PasswordResetRateThrottle,
    AuthenticationRateThrottle
)

@method_decorator(csrf_exempt, name='dispatch')
class UserViewApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        responses={200: UserViewResponseSerializer},
        description="Get current authenticated user details.",
        operation_id='get_user_data'
    )
    def get(self, request):
        """Get current authenticated user details."""
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email_verify': getattr(user, 'email_verify', False),
        })

class ChangeFavCurrencyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        request=ChangeFavCurrencyRequestSerializer,
        responses={200: 'Change favorite currency successful', 400: 'Validation error'},
        description="Change user favorite currency.",
        operation_id='change_favorite_currency'
    )
    def post(self, request):
        """Change Users Favorite currency"""
        serializer = ChangeFavCurrencyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = request.user
            user.favorite_currency = serializer.validated_data['fav_currency']
            user.save()
        except Exception:
                return Response(
                    {'error': f'Failed to save transaction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response({
                "success": True
            }, status=status.HTTP_200_OK)

class GetFavCurrencyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        responses={200: 'Get favorite currency successful'},
        description="Get user favorite currency.",
        operation_id='get_favorite_currency'
    )
    def get(self, request):
        """Get current authenticated user favorite_currency"""
        user = request.user
        return Response({
            'id': user.id,
            'favorite_currency': get_fav_currency(user)
        })

class UpdateUserLastLoginApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        responses={200: 'user last login updated successfully'},
        description="Update user last login time.",
        operation_id='update_last_login'
    )
    def post(self, request):
        """Update current authenticated user's last login time"""
        user = request.user
        user.last_login = datetime.now()
        user.save()
        return Response({
            'id': user.id,
            'last_login': user.last_login
        })

class LoginApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description="Authenticate using username or email and password.",
        request=LoginRequestSerializer,
        responses={200: LoginResponseSerializer, 400: 'Invalid credentials', 401: 'Unauthorized', 429: 'Rate limit exceeded'},
        operation_id='login'
    )
    def post(self, request):
        """Login user and return tokens"""
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username_or_email = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user, message = login_user(username_or_email, password)
        if user is None:
            return Response(
                {'error': message}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if user and message != 'Login successful':
            return Response(
                {
                    'error': message, 
                    'email': user.email,
                    'code': 'email_not_verified'
                }, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
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
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'An error occurred during login. Please try again.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DemoLoginApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        description="Login as a demo user (creates user if not exists).",
        responses={200: LoginResponseSerializer},
        operation_id='demo_login'
    )
    def post(self, request):
        """Login as demo user, create if not exists"""
        try:
            username = 'demo'
            email = 'demo@imhotep.tech'
            password = 'demo_password_123!'

            user = demo_login(username, email, password)

            # Generate tokens
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

        except Exception as e:
            print(f"Demo login error: {str(e)}")
            return Response(
                {'error': 'An error occurred during demo login.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RegisterApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationRateThrottle]
    
    @extend_schema(
        tags=['Authentication'],
        description="Register a new user.",
        request=RegisterRequestSerializer,
        responses={201: 'User created successfully', 400: 'Validation error', 429: 'Rate limit exceeded'},
        operation_id='register'
    )
    def post(self, request):
        """Register a new user and send verification email"""
        serializer = RegisterRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')

        user, message = register_user(username, email, password, first_name, last_name)
        if user is None:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if "Verification email sending failed" in message:
            mail_status = "Verification email sending failed"
        else:
            mail_status = "Verification email sent"

        return Response(
            {'message': f'User created successfully. {mail_status}.'}, 
            status=status.HTTP_201_CREATED
        )

class VerifyAccountOTPApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description="Verify user account using OTP.",
        request=VerifyAccountOTPRequestSerializer,
        responses={200: 'Account verified successfully', 400: 'Invalid OTP or User not found'},
        operation_id='verify_account_otp'
    )
    def post(self, request):
        """Verify user account using OTP"""
        serializer = VerifyAccountOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        success, message = verify_account_otp(email, otp)
        
        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
class VerifyEmailApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        description="Verify user email using uid and token from query parameters.",
        parameters=[
            OpenApiParameter(
                name='uid',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Base64 encoded user ID'
            ),
            OpenApiParameter(
                name='token',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Email verification token'
            ),
        ],
        responses={200: 'Email verified successfully', 400: 'Invalid or expired token'},
        operation_id='verify_email'
    )
    def get(self, request):
        """Verify user email using uid and token"""
        verify_email_request_serializer = VerifyEmailRequestSerializer(data=request.GET)
        verify_email_request_serializer.is_valid(raise_exception=True)

        uid = verify_email_request_serializer.validated_data['uid']
        token = verify_email_request_serializer.validated_data['token']

        response = verify_email(uid, token)
        if response:
            return Response(
                {'message': 'Email verified successfully'}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Invalid or expired verification link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class LogoutApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Authentication'],
        description="Logout by blacklisting the provided refresh token.",
        request={'application/json': {'type': 'object', 'properties': {'refresh': {'type': 'string'}}}},
        responses={200: {'description': 'Logout successful'}, 400: {'description': 'Invalid token'}},
        operation_id='logout'
    )
    def post(self, request):
        """Logout view that blacklists the refresh token"""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                success, message = logout_user(refresh_token)
                if success:
                    return Response(
                        {'message': message}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Refresh token is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except TokenError:
            return Response(
                {'error': 'Invalid refresh token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'An error occurred during logout'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PasswordResetRequestApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description="Request a password reset email to be sent.",
        request=PasswordResetRequestSerializer,
        responses={200: {'description': 'Password reset email sent'}, 400: {'description': 'Invalid email'}, 429: 'Rate limit exceeded'},
        operation_id='password_reset_request'
    )
    def post(self, request):
        """Request a password reset email"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        success, message = request_password_reset(email)

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PasswordResetConfirmOTPApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        description="Confirm password reset with OTP and new password.",
        request=PasswordResetConfirmOTPSerializer,
        responses={200: {'description': 'Password reset successful'}, 400: {'description': 'Validation error'}},
        operation_id='password_reset_confirm_otp'
    )
    def post(self, request):
        """Confirm password reset with OTP and new password"""
        serializer = PasswordResetConfirmOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        success, message = confirm_password_reset_otp(email, otp, new_password)

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetValidateApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        description="Validate password reset token without changing password.",
        request=PasswordResetValidateSerializer,
        responses={200: {'description': 'Token is valid'}, 400: {'description': 'Invalid token'}},
        operation_id='password_reset_validate'
    )
    def post(self, request):
        """Validate password reset token"""
        serializer = PasswordResetValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']

        valid, message, email = validate_password_reset_token(uid, token)

        if valid:
            return Response(
                {'valid': True, 'email': email}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'valid': False, 'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class GoogleLoginUrlApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description="Get Google OAuth2 login URL for frontend.",
        responses={200: {'type': 'object', 'properties': {'auth_url': {'type': 'string'}}}, 429: 'Rate limit exceeded'},
        operation_id='get_google_login_url'
    )
    def get(self, request):
        """Returns the Google OAuth2 login URL for frontend"""
        auth_url = get_google_oauth_url()
        return Response({'auth_url': auth_url})

class GoogleAuthApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description="Authenticate with Google OAuth2 authorization code.",
        request=GoogleAuthRequestSerializer,
        responses={200: GoogleAuthResponseSerializer, 400: {'description': 'Invalid code'}, 429: 'Rate limit exceeded'},
        operation_id='google_authenticate'
    )
    def post(self, request):
        """Handle Google OAuth2 authentication with authorization code"""
        serializer = GoogleAuthRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']
        user, message, is_new_user = authenticate_with_google(code)

        if user is None:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }

        if is_new_user:
            response_data['is_new_user'] = True

        return Response(response_data, status=status.HTTP_200_OK)

class GoogleMobileLoginApi(APIView):
    """
    Unified Google login endpoint that accepts either:
    - `code` (web Authorization Code flow)
    - `access_token` (mobile native sign-in token from @react-native-google-signin/google-signin)
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        description=(
            "Authenticate with Google. Mobile clients send `access_token` (from native Google Sign-In). "
            "Web clients send `code` (authorization code). Returns SimpleJWT access + refresh tokens."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'access_token': {'type': 'string', 'description': 'Google access token from native mobile sign-in'},
                    'code': {'type': 'string', 'description': 'Google authorization code from web OAuth flow'},
                },
            }
        },
        responses={
            200: GoogleAuthResponseSerializer,
            400: {'description': 'Neither code nor access_token provided'},
            401: {'description': 'Google authentication failed'},
            429: 'Rate limit exceeded',
        },
        operation_id='google_mobile_authenticate'
    )

    def post(self, request):
        code = request.data.get('code')
        mobile_access_token = request.data.get('access_token')

        if code:
            # Web Authorization Code flow
            user, message, is_new = authenticate_with_google(code)
        elif mobile_access_token:
            # Mobile native flow — token is used directly against whitelisted googleapis.com endpoint
            user, message, is_new = authenticate_mobile_with_google_token(mobile_access_token)
        else:
            return Response(
                {'error': 'Either code or access_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user:
            return Response({'error': message}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate SimpleJWT tokens for the mobile session
        refresh = RefreshToken.for_user(user)
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': message,
            'is_new_user': is_new,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

class GetProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        description="Get current user profile information.",
        responses={200: UserViewResponseSerializer},
        operation_id='get_profile'
    )
    def get(self, request):
        """Get current user profile information"""
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email_verify': user.email_verify,
            'date_joined': user.date_joined,
        })

class UpdateProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        description="Update current user profile information.",
        request=UpdateProfileRequestSerializer,
        responses={200: UserViewResponseSerializer, 400: {'description': 'Validation error'}},
        operation_id='update_profile'
    )
    def put(self, request):
        """Update user profile information"""
        serializer = UpdateProfileRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, message = update_user_profile(
            request.user,
            first_name=serializer.validated_data.get('first_name'),
            last_name=serializer.validated_data.get('last_name'),
            username=serializer.validated_data.get('username'),
            email=serializer.validated_data.get('email')
        )

        if user is None:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'message': message,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email_verify': user.email_verify,
            }
        }, status=status.HTTP_200_OK)

class ChangePasswordApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        description="Change password for current user.",
        request=ChangePasswordRequestSerializer,
        responses={200: {'description': 'Password changed successfully'}, 400: {'description': 'Validation error'}},
        operation_id='change_password'
    )
    def post(self, request):
        """Change user password"""
        serializer = ChangePasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = change_user_password(
            request.user,
            serializer.validated_data['current_password'],
            serializer.validated_data['new_password']
        )

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class VerifyEmailChangeApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['User Profile'],
        description="Verify email change using uid/token and new email.",
        request=VerifyEmailChangeRequestSerializer,
        responses={200: {'description': 'Email updated successfully'}, 400: {'description': 'Invalid link'}},
        operation_id='verify_email_change'
    )
    def post(self, request):
        """Verify email change using token"""
        serializer = VerifyEmailChangeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = verify_email_change(
            serializer.validated_data['uid'],
            serializer.validated_data['token'],
            serializer.validated_data['new_email']
        )

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class VerifyEmailChangeOTPApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['User Profile'],
        description="Verify email change using OTP.",
        request=VerifyEmailChangeOTPRequestSerializer,
        responses={200: {'description': 'Email updated successfully'}, 400: {'description': 'Invalid OTP'}},
        operation_id='verify_email_change_otp'
    )
    def post(self, request):
        """Verify email change using OTP"""
        serializer = VerifyEmailChangeOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = verify_email_change_otp(
            serializer.validated_data['email'],
            serializer.validated_data['otp'],
            serializer.validated_data['new_email']
        )

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class OAuthSessionBridgeApi(APIView):
    """
    Bridge endpoint that creates a Django session from a JWT token.
    
    This is needed for the OAuth2 flow because:
    1. Frontend uses JWT tokens stored in localStorage
    2. OAuth2 authorization endpoint requires session-based authentication
    3. When redirecting from frontend to backend, we can't send Authorization headers
    
    Flow:
    1. Frontend logs in user, gets JWT token
    2. Frontend redirects to this endpoint with token and next URL
    3. This endpoint validates JWT, creates Django session
    4. Redirects to OAuth2 authorization page with session cookie set
    """
    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        description="Create a Django session from a JWT token and redirect to a URL. Used for OAuth2 authorization flow.",
        parameters=[
            OpenApiParameter(
                name='token',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='JWT access token'
            ),
            OpenApiParameter(
                name='next',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='URL to redirect to after creating session (URL encoded)'
            ),
        ],
        responses={
            302: {'description': 'Redirect to next URL with session cookie'},
            400: {'description': 'Missing or invalid parameters'},
            401: {'description': 'Invalid or expired token'}
        },
        operation_id='oauth_session_bridge'
    )
    def get(self, request):
        """
        Create a Django session from JWT token and redirect to the next URL.
        This enables OAuth2 authorization flow when frontend uses JWT auth.
        """
        token = request.GET.get('token')
        next_url = request.GET.get('next')
        
        if not token:
            return HttpResponseBadRequest('Missing token parameter')
        
        if not next_url:
            return HttpResponseBadRequest('Missing next parameter')
        
        # Decode the next URL (it may be URL encoded)
        next_url = unquote(next_url)
        
        # Validate that next_url is pointing to our OAuth2 authorization endpoint
        # This prevents open redirect vulnerabilities
        from django.conf import settings
        allowed_prefixes = [
            '/o/authorize',
            f'{settings.SITE_DOMAIN}/o/authorize',
        ]
        
        is_valid_redirect = any(next_url.startswith(prefix) for prefix in allowed_prefixes)
        if not is_valid_redirect:
            return HttpResponseBadRequest('Invalid redirect URL. Must be an OAuth2 authorization URL.')
        
        try:
            # Validate the JWT token
            validated_token = UntypedToken(token)
            
            # Get user_id from the validated token
            user_id = validated_token.get('user_id')
            if not user_id:
                return Response(
                    {'error': 'Invalid token: no user_id'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Get the user
            user = User.objects.get(id=user_id)
            
            # Create a Django session for this user
            django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            # Redirect to the OAuth2 authorization URL
            # The session cookie will be set automatically by Django
            return HttpResponseRedirect(next_url)
            
        except (InvalidToken, TokenError) as e:
            return Response(
                {'error': f'Invalid or expired token: {str(e)}'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RequestDeleteAccountOTPApi(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthenticationRateThrottle]

    @extend_schema(
        tags=['User Profile'],
        description="Request an OTP to confirm account deletion.",
        request=RequestDeleteAccountOTPSerializer,
        responses={200: {'description': 'OTP sent successfully'}, 400: {'description': 'Error sending OTP'}},
        operation_id='request_delete_account_otp'
    )
    def post(self, request):
        """Request OTP for account deletion"""
        serializer = RequestDeleteAccountOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message = request_delete_account_otp(request.user)

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class DeleteAccountApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['User Profile'],
        description="Confirm and execute account deletion using OTP or Password.",
        request=DeleteAccountConfirmSerializer,
        responses={200: {'description': 'Account deleted successfully'}, 400: {'description': 'Validation error'}},
        operation_id='delete_account_confirm'
    )
    def post(self, request):
        """Confirm account deletion"""
        serializer = DeleteAccountConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp = serializer.validated_data.get('otp')
        password = serializer.validated_data.get('password')

        success, message = delete_user_account(request.user, password=password, otp=otp)

        if success:
            return Response(
                {'message': message}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': message}, 
                status=status.HTTP_400_BAD_REQUEST
            )