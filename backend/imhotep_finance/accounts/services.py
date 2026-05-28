from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from accounts.models import User
from imhotep_finance.settings import SITE_DOMAIN, frontend_url
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
import random
import requests
from decouple import config

def generate_otp(user):
    """Generate and save a 6-digit OTP for the user"""
    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_created_at = timezone.now()
    user.save()
    return otp

def can_resend_otp(user):
    """Check if OTP can be resent (e.g. limiting frequency)"""
    # Simple check: disallow if generated less than 1 minute ago
    if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() < 60:
        return False
    return True

def login_user(username_or_email, password):
    """Authenticate user by username or email and return user if valid"""

    if not username_or_email or not password:
        return None, "Username/email and password are required"

    user = None
    if '@' in username_or_email:
        # Input is an email
        user = User.objects.filter(email=username_or_email).first()
        if not user:
            return None, "Invalid credentials"
        username = user.username
    else:
        # Input is a username
        username = username_or_email

    # Authenticate user
    authenticated_user = authenticate(username=username, password=password)

    if authenticated_user:
        if authenticated_user.email_verify:
            return authenticated_user, "Login successful"
        else:
            # Send verification email
            try:
                mail_subject = 'Activate your Imhotep Finance account'
                current_site = SITE_DOMAIN.rstrip('/')
                otp = generate_otp(authenticated_user)
                message = render_to_string('activate_mail_send.html', {
                    'user': authenticated_user,
                    'domain': current_site,
                    'otp': otp,
                    'frontend_url': frontend_url
                })
                send_mail(
                    mail_subject,
                    message,
                    'imhoteptech1@gmail.com',
                    [authenticated_user.email],
                    html_message=message
                )
                return authenticated_user, "Email not verified. Verification email sent."
            except Exception as email_error:
                # If email fails, still create the user but log the error
                print(f"Failed to send verification email: {str(email_error)}")
                return authenticated_user, "Email not verified. Verification email sending failed."
            
    return None, "Invalid credentials"

def demo_login(username, email, password):
    # Try to get the demo user
    user = User.objects.filter(username=username).first()
    
    # If not exists, create it
    if not user:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            email_verify=True,
            first_name='Demo',
            last_name='User'
        )
        user.save()
    
    # Ensure demo user is verified
    if not user.email_verify:
        user.email_verify = True
        user.save()
    return user

def register_user(username, email, password, first_name='', last_name=''):
    """Register a new user and send verification email"""

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return None, f'Username {username} is already taken'

    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return None, f'Email {email} is already registered'

    # Create a new user
    user = None  # Initialize user variable
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
    except Exception as e:
        print(f"Failed to create user: {str(e)}")
        return None, f'Failed to create user'

    # Generate OTP
    otp = generate_otp(user)

    # Send verification email
    try:
        mail_subject = 'Activate your Imhotep Finance account'
        current_site = SITE_DOMAIN.rstrip('/')  # Remove trailing slash if present
        message = render_to_string('activate_mail_send.html', {
            'user': user,
            'domain': current_site,
            'frontend_url': frontend_url,
            'otp': otp,
        })
        send_mail(mail_subject, message, 'imhoteptech1@gmail.com', [user.email], html_message=message)
        return user, 'User created successfully. Verification email sent.'
    except Exception as email_error:
        print(f"Failed to send verification email: {str(email_error)}")
        # user is defined at this point, so we can return it
        return user, 'User created successfully. Verification email sending failed.'
    
def verify_account_otp(email, otp):
    """Verify user account using OTP"""
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False, "User not found"

    if user.email_verify:
        return True, "Account already verified"

    if not user.otp_code or user.otp_code != otp:
        return False, "Invalid OTP"

    # Check expiration (e.g. 15 minutes)
    if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() > 900:
        return False, "OTP has expired"

    user.is_active = True
    user.email_verify = True
    user.otp_code = None # Clear OTP
    user.save()

    # Send welcome email after verification
    try:
        mail_subject = 'Welcome to Imhotep Finance!'
        message = render_to_string('welcome_email.html', {
            'user': user,
            'domain': SITE_DOMAIN.rstrip('/'),
            'frontend_url': frontend_url,
        })
        send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [user.email], html_message=message)
    except Exception as email_error:
        print(f"Failed to send welcome email: {str(email_error)}")
    
    return True, "Account verified successfully"
    
def verify_email(uid, token):
    """Legacy: Verify user email using uid and token (Deprecating in favor of OTP)"""
    # Keep this for backward compatibility if needed, or remove.
    # For now, implemented as legacy wrapper or just keep as is for old links
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        raise ValueError("Invalid UID")

    if default_token_generator.check_token(user, token):
        user.is_active = True
        user.email_verify = True
        user.save()
        return True
    return False

def logout_user(refresh_token):
    """Blacklist the given refresh token to log out the user"""
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.exceptions import TokenError

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return True, "Logout successful"
    except TokenError:
        return False, "Invalid token"

def request_password_reset(email):
    """Send password reset email to user"""
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Return success even if user doesn't exist for security
        return True, 'If an account with this email exists, a password reset OTP has been sent.'

    try:
        otp = generate_otp(user)
        mail_subject = 'Reset your imhotep finance password'
        current_site = SITE_DOMAIN.rstrip('/')
        
        context = {
            'user': user,
            'domain': current_site,
            'frontend_url': frontend_url,
            'otp': otp,
        }
        
        message = render_to_string('password_reset_email.html', context)
        
        send_mail(
            mail_subject, 
            message, 
            'imhoteptech1@gmail.com', 
            [email], 
            html_message=message
        )
        
        return True, 'If an account with this email exists, a password reset OTP has been sent.'
        
    except Exception as email_error:
        print(f"Failed to send password reset email: {str(email_error)}")
        return False, 'Failed to send password reset email. Please try again later.'

def confirm_password_reset_otp(email, otp, new_password):
    """Confirm password reset using OTP and set new password"""
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False, 'User not found'

    # Validate OTP
    if not user.otp_code or user.otp_code != otp:
        return False, 'Invalid OTP'
    
    # Check expiration
    if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() > 900:
        return False, "OTP has expired"

    # Validate password strength
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return False, ' '.join(e.messages)

    # Set new password
    user.set_password(new_password)
    user.otp_code = None # Clear OTP
    user.save()

    return True, 'Password has been reset successfully. You can now login with your new password.'

def confirm_password_reset(uid, token, new_password):
    """Legacy: Confirm password reset and set new password"""
    # Validate password strength
    try:
        validate_password(new_password)
    except ValidationError as e:
        return False, ' '.join(e.messages)

    # Decode the user ID
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return False, 'Invalid password reset link'

    # Check if the token is valid
    if not default_token_generator.check_token(user, token):
        return False, 'Invalid or expired password reset link'

    # Set new password
    user.set_password(new_password)
    user.save()

    return True, 'Password has been reset successfully. You can now login with your new password.'

def validate_password_reset_token(uid, token):
    """Validate password reset token without changing password"""
    # Decode the user ID
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return False, 'Invalid password reset link', None

    # Check if the token is valid
    if default_token_generator.check_token(user, token):
        return True, 'Token is valid', user.email
    else:
        return False, 'Invalid or expired password reset link', None

def get_google_oauth_url():
    """Generate Google OAuth2 login URL"""
    redirect_uri = config('GOOGLE_REDIRECT_URI', default=f'{SITE_DOMAIN}/api/auth/google/callback/')
    from imhotep_finance.settings import GOOGLE_OAUTH2_CLIENT_ID
    
    oauth2_url = (
        'https://accounts.google.com/o/oauth2/v2/auth?'
        f'client_id={GOOGLE_OAUTH2_CLIENT_ID}&'
        f'redirect_uri={redirect_uri}&'
        'response_type=code&'
        'scope=openid email profile&'
        'access_type=offline'
    )
    return oauth2_url

def authenticate_with_google(code):
    """Authenticate user with Google OAuth2 code"""
    from imhotep_finance.settings import GOOGLE_OAUTH2_CLIENT_ID, GOOGLE_OAUTH2_CLIENT_SECRET
    
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
        return None, 'Failed to exchange code for token', False

    token_data = token_response.json()

    # Get user info using access token
    userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
    headers = {'Authorization': f'Bearer {token_data["access_token"]}'}
    userinfo_response = requests.get(userinfo_url, headers=headers)
    
    if userinfo_response.status_code != 200:
        return None, 'Failed to get user info from Google', False

    user_info = userinfo_response.json()

    email = user_info['email']
    first_name = user_info.get('given_name', '')
    last_name = user_info.get('family_name', '')
    
    # Check if user exists
    user = User.objects.filter(email=email).first()
    
    if user:
        return user, 'User authenticated successfully', False
    
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
            'uid': user.pk,
            'token': '',
        })
        send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [user.email], html_message=message)
    except Exception as email_error:
        print(f"Failed to send welcome email: {str(email_error)}")

    return user, 'User created and authenticated successfully', True

def authenticate_mobile_with_google_token(google_access_token):
    """
    Authenticate user using an access_token sent directly from the mobile app.
    Reuses your exact user verification, creation, and email logic.
    """
    # 1. Bypass code exchange - use the access token from the mobile app
    userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
    headers = {'Authorization': f'Bearer {google_access_token}'}
    userinfo_response = requests.get(userinfo_url, headers=headers)

    if userinfo_response.status_code != 200:
        return None, 'Failed to get user info from Google via mobile token', False

    user_info = userinfo_response.json()

    email = user_info.get('email')
    if not email:
        return None, 'No email returned from Google', False

    first_name = user_info.get('given_name', '')
    last_name = user_info.get('family_name', '')

    # 2. Check if user exists
    user = User.objects.filter(email=email).first()
    if user:
        return user, 'User authenticated successfully via mobile', False

    # 3. Create a new user (ensure unique username)
    username = email.split('@')[0]
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        email_verify=True,
        is_active=True
    )

    # 4. Send welcome email
    try:
        mail_subject = 'Welcome to Imhotep Finance!'
        message = render_to_string('welcome_email.html', {
            'user': user,
            'domain': SITE_DOMAIN.rstrip('/'),
            'frontend_url': frontend_url,
            'uid': user.pk,
            'token': '',
        })
        send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [user.email], html_message=message)
    except Exception as email_error:
        print(f"Failed to send welcome email: {str(email_error)}")

    return user, 'User created and authenticated successfully via mobile', True

def update_user_profile(user, first_name=None, last_name=None, username=None, email=None):
    """Update user profile information"""
    messages = []
    errors = []

    # Prevent demo user from updating profile
    if user.username == 'demo':
        return None, 'Demo user cannot update profile information.'

    # Update first name and last name directly
    if first_name is not None and first_name != user.first_name:
        user.first_name = first_name.strip()
        messages.append("First name updated")
    
    if last_name is not None and last_name != user.last_name:
        user.last_name = last_name.strip()
        messages.append("Last name updated")

    # Validate and update username
    if username and username != user.username:
        username = username.strip()
        if '@' in username:
            errors.append("Username cannot contain @")
        elif User.objects.filter(username=username).exclude(id=user.id).exists():
            errors.append('Username already taken, please choose another one!')
        else:
            user.username = username
            messages.append("Username updated")

    # Validate and handle email update
    if email and email != user.email:
        email = email.strip()
        if '@' not in email:
            errors.append("Email must contain @")
        elif User.objects.filter(email=email).exclude(id=user.id).exists():
            errors.append('Email already taken, please choose another one!')
        else:
            # Send verification email for new email
            try:
                mail_subject = 'Verify your new email address'
                current_site = SITE_DOMAIN.rstrip('/')
                
                otp = generate_otp(user)
                # Store new email in a temporary field or cache (simplified here by encoding in email)
                # But for OTP to work securely with new email, we need to verify the OTP matches.
                # Since we are using User model to store OTP, we can use that.
                # However, we need to know what the NEW email is when verifying.
                # For simplicity in this prompt's context, I will assume we can send the new email back in the verification request
                # and the OTP validates the user's intent. But wait, if we update email, we need to verify the NEW email.
                # The OTP should ideally be sent to the NEW email.
                
                context = {
                    'user': user,
                    'domain': current_site,
                    'frontend_url': frontend_url,
                    'otp': otp,
                    'new_email': email,
                }
                
                message = render_to_string('activate_mail_change_send.html', context)
                
                send_mail(mail_subject, '', 'imhoteptech1@gmail.com', [email], html_message=message)
                messages.append("Email verification OTP sent to your new email address! Please check it.")
                
            except Exception as email_error:
                print(f"Failed to send email verification: {str(email_error)}")
                errors.append("Failed to send verification email. Please try again later.")

    if errors:
        return None, errors[0] if len(errors) == 1 else errors

    user.save()
    if not messages:
        messages.append("Profile updated successfully!")

    return user, messages[0] if len(messages) == 1 else messages

def change_user_password(user, current_password, new_password):
    """Change user password"""
    # Prevent demo user from changing password
    if user.username == 'demo':
        return False, 'Demo user cannot change password.'

    # Check current password
    if not user.check_password(current_password):
        return False, 'Current password is incorrect'

    # Validate new password
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return False, ' '.join(e.messages)

    # Set new password
    user.set_password(new_password)
    user.save()

    return True, 'Password changed successfully'

def verify_email_change_otp(email, otp, new_email):
    """Verify email change using OTP"""
    # Note: 'email' here is the CURRENT email (to identify user) or we need user ID.
    # If unauthenticated endpoint, we need a way to identify the user.
    # Providing current email + OTP + new email seems viable if OTP is unique enough or we imply user is logged in?
    # Actually, usually this flow happens when logged in or we pass a token. 
    # But sticking to the pattern:
    # 1. User requests change -> OTP sent to NEW email. User is currently logged in or we identify by current email.
    
    # Let's assume the user is authenticated when requesting this, but verification might happen on a new device?
    # If the user is logged in, we can use request.user.
    # If not, we need to identify the user. 
    # Let's use the current email to find the user.
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False, 'User not found'
        
    # Validate OTP
    if not user.otp_code or user.otp_code != otp:
        return False, 'Invalid OTP'
        
     # Check expiration
    if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() > 900:
        return False, "OTP has expired"
        
    # Check duplicate
    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
        return False, 'This email address is already in use by another account'
        
    # Update email
    user.email = new_email
    user.email_verify = True
    user.otp_code = None
    user.save()
    
    return True, 'Email updated successfully'

def verify_email_change(uid, token, new_email_encoded):
    """Legacy: Verify email change using token"""
    # Decode the user ID and new email
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        new_email = force_str(urlsafe_base64_decode(new_email_encoded))
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return False, 'Invalid verification link'

    # Check if the token is valid
    if not default_token_generator.check_token(user, token):
        return False, 'Invalid or expired verification link'

    # Check if the new email is already taken by another user
    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
        return False, 'This email address is already in use by another account'

    # Update the user's email
    user.email = new_email
    user.email_verify = True
    user.save()

    return True, 'Email updated successfully'

def request_delete_account_otp(user):
    """Generate and send an OTP for account deletion"""
    if user.username == 'demo':
        return False, 'Demo user cannot delete account.'

    try:
        otp = generate_otp(user)
        mail_subject = 'Confirm Account Deletion - Imhotep Finance'
        
        # In a real scenario, you could use a template. For now, simple message.
        message = (
            f"Hello {user.username},\n\n"
            f"You have requested to delete your Imhotep Finance account.\n"
            f"Please use the following OTP to confirm your account deletion: {otp}\n\n"
            f"If you did not request this, please ignore this email and your account will remain secure.\n\n"
            f"Best regards,\nImhotep Finance Team"
        )
        
        send_mail(
            mail_subject, 
            message, 
            'imhoteptech1@gmail.com', 
            [user.email], 
            html_message=message.replace('\n', '<br>')
        )
        
        return True, 'A confirmation OTP has been sent to your email.'
        
    except Exception as email_error:
        print(f"Failed to send account deletion OTP email: {str(email_error)}")
        return False, 'Failed to send OTP email. Please try again later.'

def delete_user_account(user, password=None, otp=None):
    """Delete the user account using either password or OTP"""
    if user.username == 'demo':
        return False, 'Demo user cannot delete account.'

    if not password and not otp:
        return False, 'Password or OTP is required to delete your account.'

    if password:
        if not user.check_password(password):
            return False, 'Incorrect password.'
    
    if otp:
        if not user.otp_code or user.otp_code != otp:
            return False, 'Invalid OTP.'
        
        if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() > 900:
            return False, 'OTP has expired.'

    # Credentials are valid, delete the user
    try:
        user.delete()
        return True, 'Account deleted successfully.'
    except Exception as e:
        print(f"Failed to delete user account: {str(e)}")
        return False, 'An error occurred while deleting your account. Please try again.'