from django.urls import path
from .apis import (
    CreateOAuth2ApplicationApi,
    GetOAuth2ApplicationApi,
    RegenerateClientSecretApi,
    AddSwaggerRedirectUriApi,
)

urlpatterns = [
    # Combined view for create (POST) and list (GET) applications
    path('apps/', CreateOAuth2ApplicationApi.as_view(), name='create_oauth2_application'),
    path('apps/', CreateOAuth2ApplicationApi.as_view(), name='list_oauth2_applications'),
    # Combined view for get (GET) and delete (DELETE) application
    path('apps/<int:application_id>/', GetOAuth2ApplicationApi.as_view(), name='get_oauth2_application'),
    path('apps/<int:application_id>/', GetOAuth2ApplicationApi.as_view(), name='delete_oauth2_application'),
    path('apps/<int:application_id>/regenerate-secret/', RegenerateClientSecretApi.as_view(), name='regenerate_client_secret'),
    path('apps/<int:application_id>/add-swagger-uri/', AddSwaggerRedirectUriApi.as_view(), name='add_swagger_redirect_uri'),
]
