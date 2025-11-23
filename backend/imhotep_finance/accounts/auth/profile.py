from django.shortcuts import redirect
from ..models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from imhotep_finance.settings import SITE_DOMAIN, frontend_url
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from drf_yasg.utils import swagger_auto_schema
from accounts.schemas.profile_schemas import (
    get_profile_response,
    update_profile_request,
    update_profile_response,
    change_password_request,
    change_password_response,
    verify_email_change_request,
    verify_email_change_response,
)

@swagger_auto_schema(
    method='get',
    operation_description='Get current user profile information.',
    responses={200: get_profile_response}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
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

@swagger_auto_schema(
    method='put',
    operation_description='Update current user profile information and send email verification if email changed.',
    request_body=update_profile_request,
    responses={200: update_profile_response, 400: 'Validation error'}
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile information"""
    try:
        user = request.user

        # Prevent demo user from updating profile
        if user.username == 'demo':
            return Response(
                {'error': 'Demo user cannot update profile information.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()

        messages = []
        errors = []

        # Update first name and last name directly
        if first_name != user.first_name:
            user.first_name = first_name
            messages.append("First name updated")
        
        if last_name != user.last_name:
            user.last_name = last_name
            messages.append("Last name updated")

        # Validate and update username
        if username and username != user.username:
            # Check if username contains '@'
            if '@' in username:
                errors.append("Username cannot contain @")
            else:
                # Check if username already exists
                if User.objects.filter(username=username).exclude(id=user.id).exists():
                    errors.append('Username already taken, please choose another one!')
                else:
                    user.username = username
                    messages.append("Username updated")

        # Validate and handle email update
        if email and email != user.email:
            # Check if email contains '@'
            if '@' not in email:
                errors.append("Email must contain @")
            else:
                # Check if email already exists
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    errors.append('Email already taken, please choose another one!')
                else:
                    # Send verification email for new email
                    try:
                        mail_subject = 'Verify your new email address'
                        current_site = SITE_DOMAIN.rstrip('/')
                        
                        # Create verification context
                        uid = urlsafe_base64_encode(force_bytes(user.pk))
                        token = default_token_generator.make_token(user)
                        new_email_encoded = urlsafe_base64_encode(force_bytes(email))
                        
                        context = {
                            'user': user,
                            'domain': current_site,
                            'frontend_url': frontend_url,
                            'uid': uid,
                            'token': token,
                            'new_email': email,
                            'new_email_encoded': new_email_encoded,
                            'verification_url': f'{frontend_url}/verify-email-change/{uid}/{token}/{new_email_encoded}'
                        }
                        
                        message = render_to_string('activate_mail_change_send.html', context)
                        
                        send_mail(
                            mail_subject, 
                            '', 
                            'imhoteptech1@gmail.com', 
                            [email], 
                            html_message=message
                        )
                        
                        messages.append("Email verification sent! Please check your new email to verify the change.")
                        
                    except Exception as email_error:
                        print(f"Failed to send email verification: {str(email_error)}")
                        errors.append("Failed to send verification email. Please try again later.")

        # Save user if there are no errors
        if not errors:
            user.save()
            if not messages:
                messages.append("Profile updated successfully!")

        if errors:
            return Response(
                {'error': errors[0] if len(errors) == 1 else errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'message': messages[0] if len(messages) == 1 else messages,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email_verify': user.email_verify,
            }
        })

    except Exception:
        return Response(
            {'error': f'An error occurred during profile update'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_description='Change password for current user.',
    request_body=change_password_request,
    responses={200: change_password_response, 400: 'Validation error'}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    try:
        user = request.user

        # Prevent demo user from changing password
        if user.username == 'demo':
            return Response(
                {'error': 'Demo user cannot change password.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([current_password, new_password, confirm_password]):
            return Response(
                {'error': 'All password fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': e.messages}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password changed successfully'}, 
            status=status.HTTP_200_OK
        )

    except Exception:
        return Response(
            {'error': f'An error occurred during password change'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='post',
    operation_description='Verify email change using uid/token and new email.',
    request_body=verify_email_change_request,
    responses={200: verify_email_change_response, 400: 'Invalid link'}
)
@api_view(['POST'])
@permission_classes([])
def verify_email_change(request):
    """Verify email change using token"""
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_email_encoded = request.data.get('new_email')  # This is actually the encoded email from URL
        
        if not all([uid, token, new_email_encoded]):
            return Response(
                {'error': 'Missing verification parameters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode the user ID and new email
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            new_email = force_str(urlsafe_base64_decode(new_email_encoded))
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid verification link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the token is valid
        if default_token_generator.check_token(user, token):
            # Check if the new email is already taken by another user
            if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response(
                    {'error': 'This email address is already in use by another account'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the user's email
            user.email = new_email
            user.email_verify = True
            user.save()
            
            return Response(
                {'message': 'Email updated successfully'}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Invalid or expired verification link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception:
        return Response(
            {'error': f'An error occurred during email verification'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )