from ..models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from imhotep_finance.settings import SITE_DOMAIN, frontend_url

#the register route
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        password2 = request.data.get('password2')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        # Check if all required fields are provided
        if not all([username, email, password, password2]):
            return Response(
                {'error': 'All fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username contains '@'
        if '@' in username:
            return Response(
                {'error': 'Username cannot contain @ in it'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if email contains '@'
        if '@' not in email:
            return Response(
                {'error': 'Email must contain @ in it'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if passwords match
        if password != password2:
            return Response(
                {'error': 'Passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        try:
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Username already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as db_error:
            return Response(
                {'error': 'Database connection error. Please ensure migrations are run and database is accessible.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Check if email already exists
        try:
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Email already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as db_error:
            return Response(
                {'error': 'Database connection error. Please ensure migrations are run and database is accessible.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create a new user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                email_verify=False,
                first_name=first_name,
                last_name=last_name
            )
            user.save()
        except Exception as create_error:
            return Response(
                {'error': f'Failed to create user: {str(create_error)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Send verification email
        try:
            mail_subject = 'Activate your Imhotep Finance account'
            current_site = SITE_DOMAIN.rstrip('/')  # Remove trailing slash if present
            message = render_to_string('activate_mail_send.html', {
                'user': user,
                'domain': current_site,
                'frontend_url': frontend_url,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            })
            send_mail(mail_subject, message, 'imhoteptech1@gmail.com', [email], html_message=message)
        except Exception as email_error:
            # If email fails, still create the user but log the error
            print(f"Failed to send verification email: {str(email_error)}")

        return Response(
            {'message': 'User created successfully. Please check your email to verify your account.'}, 
            status=status.HTTP_201_CREATED
        )
            
    except Exception as e:
        return Response(
            {'error': f'An error occurred during registration: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#the verify email API route
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        if not uid or not token:
            return Response(
                {'error': 'Missing verification parameters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode the user ID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid verification link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the token is valid
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.email_verify = True
            user.save()

            # Send welcome email after verification
            try:
                mail_subject = 'Welcome to Imhotep Finance!'
                message = render_to_string('welcome_email.html', {
                    'user': user,
                    'domain': SITE_DOMAIN.rstrip('/'),
                    'frontend_url': frontend_url,
                    'uid': user.pk,  # Not needed here, but template expects it
                    'token': '',     # Not needed here, but template expects it
                })
                send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [user.email], html_message=message)
            except Exception as email_error:
                print(f"Failed to send welcome email: {str(email_error)}")
            
            return Response(
                {'message': 'Email verified successfully'}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Invalid or expired verification link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': f'An error occurred during verification: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )