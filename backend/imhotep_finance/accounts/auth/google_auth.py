from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from imhotep_finance.settings import frontend_url
from drf_yasg.utils import swagger_auto_schema

@swagger_auto_schema(
    method='get',
    operation_description='Handle Google OAuth2 callback and redirect to frontend.',
    responses={302: 'Redirect to frontend with code or error'}
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