from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from finance_management.utils.currencies import get_fav_currency, get_allowed_currencies
from datetime import datetime
from drf_spectacular.utils import extend_schema
from accounts.services import (
    login_user,
    demo_login,
    register_user,
    verify_email,
    logout_user,
    request_password_reset,
    confirm_password_reset,
    validate_password_reset_token,
    get_google_oauth_url,
    authenticate_with_google,
    update_user_profile,
    change_user_password,
    verify_email_change
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
    VerifyEmailChangeRequestSerializer
)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

@method_decorator(csrf_exempt, name='dispatch')
class UserViewApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserViewResponseSerializer},
        description="Get current authenticated user details."
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
        request=ChangeFavCurrencyRequestSerializer,
        responses={200: 'Change favorite currency successful', 400: 'Validation error'},
        description="Change user favorite currency."
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
        responses={200: 'Get favorite currency successful'},
        description="Get user favorite currency."
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
        responses={200: 'user last login updated successfully'},
        description="Update user last login time."
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

    @extend_schema(
        description="Authenticate using username or email and password.",
        request=LoginRequestSerializer,
        responses={200: LoginResponseSerializer, 400: 'Invalid credentials'}
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
                {'error': message}, 
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
        description="Login as a demo user (creates user if not exists).",
        responses={200: LoginResponseSerializer}
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
    
    @extend_schema(
        description="Register a new user.",
        request=RegisterRequestSerializer,
        responses={201: 'User created successfully', 400: 'Validation error'}
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
    
class VerifyEmailApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Verify user email using uid and token.",
        responses={200: 'Email verified successfully', 400: 'Invalid or expired token'}
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
        description="Logout by blacklisting the provided refresh token.",
        request={'application/json': {'type': 'object', 'properties': {'refresh': {'type': 'string'}}}},
        responses={200: {'description': 'Logout successful'}, 400: {'description': 'Invalid token'}}
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

    @extend_schema(
        description="Request a password reset email to be sent.",
        request=PasswordResetRequestSerializer,
        responses={200: {'description': 'Password reset email sent'}, 400: {'description': 'Invalid email'}}
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

class PasswordResetConfirmApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Confirm password reset with uid/token and new password.",
        request=PasswordResetConfirmSerializer,
        responses={200: {'description': 'Password reset successful'}, 400: {'description': 'Validation error'}}
    )
    def post(self, request):
        """Confirm password reset with new password"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        success, message = confirm_password_reset(uid, token, new_password)

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
        description="Validate password reset token without changing password.",
        request=PasswordResetValidateSerializer,
        responses={200: {'description': 'Token is valid'}, 400: {'description': 'Invalid token'}}
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

    @extend_schema(
        description="Get Google OAuth2 login URL for frontend.",
        responses={200: {'type': 'object', 'properties': {'auth_url': {'type': 'string'}}}}
    )
    def get(self, request):
        """Returns the Google OAuth2 login URL for frontend"""
        auth_url = get_google_oauth_url()
        return Response({'auth_url': auth_url})

class GoogleAuthApi(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Authenticate with Google OAuth2 authorization code.",
        request=GoogleAuthRequestSerializer,
        responses={200: GoogleAuthResponseSerializer, 400: {'description': 'Invalid code'}}
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

class GetProfileApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Get current user profile information.",
        responses={200: UserViewResponseSerializer}
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
        description="Update current user profile information.",
        request=UpdateProfileRequestSerializer,
        responses={200: UserViewResponseSerializer, 400: {'description': 'Validation error'}}
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
        description="Change password for current user.",
        request=ChangePasswordRequestSerializer,
        responses={200: {'description': 'Password changed successfully'}, 400: {'description': 'Validation error'}}
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
        description="Verify email change using uid/token and new email.",
        request=VerifyEmailChangeRequestSerializer,
        responses={200: {'description': 'Email updated successfully'}, 400: {'description': 'Invalid link'}}
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