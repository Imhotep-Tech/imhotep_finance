from django.contrib import messages
from django.contrib.auth.views import PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from imhotep_finance.settings import SITE_DOMAIN, frontend_url
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from ..models import User
from drf_yasg.utils import swagger_auto_schema
from accounts.schemas.auth_schemas import (
    password_reset_request_request,
    password_reset_confirm_request,
    password_reset_validate_request,
    password_reset_generic_response,
)

class CustomPasswordResetView(PasswordResetView):
    template_name = 'password_reset.html'
    form_class = PasswordResetForm
    email_template_name = 'password_reset_email.html'
    html_email_template_name = 'password_reset_email.html'
    
    def form_invalid(self, form):
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, error)
        return super().form_invalid(form)

    def get_extra_email_context(self):
        context = {}
        context['domain'] = SITE_DOMAIN.replace('http://', '').replace('https://', '')
        context['site_name'] = 'imhotep_finance'
        context['protocol'] = 'https' if 'https://' in SITE_DOMAIN else 'http'
        return context

    def form_valid(self, form):
        """
        Override form_valid to handle email sending ourselves rather than 
        letting Django's built-in functionality handle it.
        """
        # Get user email
        email = form.cleaned_data["email"]
        # Get associated users
        active_users = form.get_users(email)
        
        for user in active_users:
            # Generate token and context
            context = {
                'email': email,
                'domain': SITE_DOMAIN.replace('http://', '').replace('https://', ''),
                'site_name': 'imhotep finance',
                'protocol': 'https' if 'https://' in SITE_DOMAIN else 'http',
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'user': user,
                'token': self.token_generator.make_token(user),
                'frontend_url': frontend_url,
            }
            
            # Render email
            subject = "Reset your imhotep finance password"
            email_message = render_to_string(self.email_template_name, context)
            html_email = render_to_string(self.html_email_template_name, context)
            
            # Send email
            send_mail(
                subject,
                email_message,
                self.from_email or 'imhoteptech1@gmail.com',
                [user.email],
                html_message=html_email,
            )
            
        # Return success response
        return super().form_valid(form)
    
class CustomPasswordResetDoneView(PasswordResetDoneView):
    template_name = 'password_reset_done.html'

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'password_reset_confirm.html'
    form_class = SetPasswordForm

    def form_invalid(self, form):
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, error)
        return super().form_invalid(form)

class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = 'password_reset_complete.html'

@swagger_auto_schema(
    method='post',
    operation_description='Request a password reset email to be sent.',
    request_body=password_reset_request_request,
    responses={200: password_reset_generic_response, 400: 'Invalid email'}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    API endpoint to request a password reset email
    """
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists with this email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist for security
            return Response(
                {'message': 'If an account with this email exists, a password reset link has been sent.'}, 
                status=status.HTTP_200_OK
            )
        
        # Generate password reset email
        try:
            mail_subject = 'Reset your imhotep finance password'
            current_site = SITE_DOMAIN.rstrip('/')
            
            # For API-based frontend, we'll send a different template
            context = {
                'user': user,
                'domain': current_site,
                'frontend_url': frontend_url,  # Your React app URL
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            }
            
            message = render_to_string('password_reset_email.html', context)
            
            send_mail(
                mail_subject, 
                message, 
                'imhoteptech1@gmail.com', 
                [email], 
                html_message=message
            )
            
        except Exception as email_error:
            print(f"Failed to send password reset email: {str(email_error)}")
            return Response(
                {'error': 'Failed to send password reset email. Please try again later.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {'message': 'If an account with this email exists, a password reset link has been sent.'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception:
        return Response(
            {'error': f'An error occurred during password reset request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_description='Confirm password reset with uid/token and new password.',
    request_body=password_reset_confirm_request,
    responses={200: password_reset_generic_response, 400: 'Validation error'}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    API endpoint to confirm password reset with new password
    """
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([uid, token, new_password, confirm_password]):
            return Response(
                {'error': 'All fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response(
                {'error': e.messages}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode the user ID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid password reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the token is valid
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired password reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password has been reset successfully. You can now login with your new password.'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception:
        return Response(
            {'error': f'An error occurred during password reset'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_description='Validate password reset token without changing password.',
    request_body=password_reset_validate_request,
    responses={200: password_reset_generic_response, 400: 'Invalid token'}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_validate(request):
    """
    API endpoint to validate password reset token without changing password
    """
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        if not uid or not token:
            return Response(
                {'error': 'Missing validation parameters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode the user ID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'valid': False, 'error': 'Invalid password reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the token is valid
        if default_token_generator.check_token(user, token):
            return Response(
                {'valid': True, 'email': user.email}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'valid': False, 'error': 'Invalid or expired password reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception:
        return Response(
            {'valid': False, 'error': f'An error occurred during validation'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

