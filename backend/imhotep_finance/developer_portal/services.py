from oauth2_provider.models import Application
from django.core.exceptions import ValidationError
from accounts.models import User
from typing import Tuple, Optional
from django.conf import settings


def create_oauth2_application(
    *,
    user: User,
    name: str,
    client_type: str = 'confidential',
    authorization_grant_type: str = 'authorization-code',
    redirect_uris: str,
    skip_authorization: bool = False
) -> Tuple[Optional[Application], str]:
    """
    Create a new OAuth2 application for a user.
    
    Returns:
        Tuple[Application, message]: The created application and success message, or (None, error_message)
    """
    if not user:
        return None, "User must be authenticated"
    
    if not name or not name.strip():
        return None, "Application name is required"
    
    if not redirect_uris or not redirect_uris.strip():
        return None, "At least one redirect URI is required"
    
    try:
        # Add Swagger redirect URI if not already included (for testing via Swagger UI)
        # Add both localhost and 127.0.0.1 variations to handle different access methods
        base_url = settings.SITE_DOMAIN
        # Also add 127.0.0.1 variant if using localhost, and vice versa
        swagger_redirect_uris = [
            f"{base_url}/swagger/oauth2-redirect.html"
        ]
        
        # Add alternative localhost/127.0.0.1 variant
        if 'localhost' in base_url:
            alt_url = base_url.replace('localhost', '127.0.0.1')
            swagger_redirect_uris.append(f"{alt_url}/swagger/oauth2-redirect.html")
        elif '127.0.0.1' in base_url:
            alt_url = base_url.replace('127.0.0.1', 'localhost')
            swagger_redirect_uris.append(f"{alt_url}/swagger/oauth2-redirect.html")
        
        redirect_uris_list = [uri.strip() for uri in redirect_uris.replace('\n', ' ').split() if uri.strip()]
        
        # Add Swagger redirect URIs if they're not already in the list
        for swagger_uri in swagger_redirect_uris:
            if swagger_uri not in redirect_uris_list:
                redirect_uris_list.append(swagger_uri)
        
        redirect_uris_final = '\n'.join(redirect_uris_list)
        
        # Create the OAuth2 application
        application = Application.objects.create(
            name=name,
            user=user,
            client_type=client_type,
            authorization_grant_type=authorization_grant_type,
            redirect_uris=redirect_uris_final,
            skip_authorization=skip_authorization,
        )
        
        return application, "Application created successfully"
    
    except ValidationError as e:
        return None, f"Validation error: {str(e)}"
    except Exception as e:
        return None, f"Failed to create application: {str(e)}"


def get_user_applications(*, user: User):
    """
    Get all OAuth2 applications for a user.
    
    Returns:
        QuerySet of Application objects
    """
    if not user:
        return Application.objects.none()
    
    return Application.objects.filter(user=user).order_by('-created')


def get_application_by_id(*, user: User, application_id: int) -> Optional[Application]:
    """
    Get a specific OAuth2 application by ID, ensuring it belongs to the user.
    
    Returns:
        Application object or None if not found or doesn't belong to user
    """
    if not user:
        return None
    
    try:
        return Application.objects.get(id=application_id, user=user)
    except Application.DoesNotExist:
        return None


def delete_oauth2_application(*, user: User, application_id: int) -> Tuple[bool, str]:
    """
    Delete an OAuth2 application.
    
    Returns:
        Tuple[bool, str]: (success, message)
    """
    application = get_application_by_id(user=user, application_id=application_id)
    
    if not application:
        return False, "Application not found or you don't have permission to delete it"
    
    try:
        application_name = application.name
        application.delete()
        return True, f"Application '{application_name}' deleted successfully"
    except Exception as e:
        return False, f"Failed to delete application: {str(e)}"


def add_swagger_redirect_uri(*, user: User, application_id: int) -> Tuple[Optional[Application], str]:
    """
    Add Swagger redirect URI to an existing OAuth2 application.
    
    Returns:
        Tuple[Application, message]: Updated application and message, or (None, error_message)
    """
    application = get_application_by_id(user=user, application_id=application_id)
    
    if not application:
        return None, "Application not found or you don't have permission to modify it"
    
    try:
        # Add Swagger redirect URI (both localhost and 127.0.0.1 variants)
        base_url = settings.SITE_DOMAIN
        swagger_redirect_uris = [
            f"{base_url}/swagger/oauth2-redirect.html"
        ]
        
        # Add alternative localhost/127.0.0.1 variant
        if 'localhost' in base_url:
            alt_url = base_url.replace('localhost', '127.0.0.1')
            swagger_redirect_uris.append(f"{alt_url}/swagger/oauth2-redirect.html")
        elif '127.0.0.1' in base_url:
            alt_url = base_url.replace('127.0.0.1', 'localhost')
            swagger_redirect_uris.append(f"{alt_url}/swagger/oauth2-redirect.html")
        
        redirect_uris_list = [uri.strip() for uri in application.redirect_uris.replace('\n', ' ').split() if uri.strip()]
        
        # Add Swagger redirect URIs if they're not already in the list
        added_any = False
        for swagger_uri in swagger_redirect_uris:
            if swagger_uri not in redirect_uris_list:
                redirect_uris_list.append(swagger_uri)
                added_any = True
        
        if added_any:
            application.redirect_uris = '\n'.join(redirect_uris_list)
            application.save()
            return application, "Swagger redirect URI added successfully"
        else:
            return application, "Swagger redirect URI already exists"
    except Exception as e:
        return None, f"Failed to add Swagger redirect URI: {str(e)}"


def regenerate_client_secret(*, user: User, application_id: int) -> Tuple[Optional[Application], str]:
    """
    Regenerate the client secret for an OAuth2 application.
    
    Returns:
        Tuple[Application, message]: Updated application and message, or (None, error_message)
    """
    application = get_application_by_id(user=user, application_id=application_id)
    
    if not application:
        return None, "Application not found or you don't have permission to modify it"
    
    try:
        # Regenerate client secret using Django's password generator
        from django.contrib.auth.hashers import make_password
        import secrets
        import string
        
        # Generate a random secret (similar to how django-oauth-toolkit does it)
        alphabet = string.ascii_letters + string.digits
        new_secret = ''.join(secrets.choice(alphabet) for _ in range(40))
        application.client_secret = new_secret
        application.save()
        return application, "Client secret regenerated successfully"
    except Exception as e:
        return None, f"Failed to regenerate client secret: {str(e)}"
