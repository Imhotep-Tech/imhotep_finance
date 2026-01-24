from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from oauth2_provider.models import Application
from .serializers import (
    OAuth2ApplicationCreateSerializer,
    OAuth2ApplicationResponseSerializer,
    OAuth2ApplicationListSerializer,
)
from .services import (
    create_oauth2_application,
    get_user_applications,
    get_application_by_id,
    delete_oauth2_application,
    regenerate_client_secret,
    add_swagger_redirect_uri,
)


class CreateOAuth2ApplicationApi(APIView):
    """
    API endpoint for creating a new OAuth2 application.
    Returns Client ID and Secret upon creation.
    Also handles GET to list applications (for URL routing compatibility).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Developer Portal'],
        description="Register a new OAuth2 application. Returns Client ID and Secret (secret shown only once).",
        request=OAuth2ApplicationCreateSerializer,
        responses={
            201: OAuth2ApplicationResponseSerializer,
            400: 'Validation error',
            500: 'Internal server error'
        },
        operation_id='create_oauth2_application'
    )
    def post(self, request):
        """Create a new OAuth2 application for the authenticated user"""
        serializer = OAuth2ApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            application, message = create_oauth2_application(
                user=request.user,
                name=serializer.validated_data['name'],
                client_type=serializer.validated_data.get('client_type', 'confidential'),
                authorization_grant_type=serializer.validated_data.get('authorization_grant_type', 'authorization-code'),
                redirect_uris=serializer.validated_data['redirect_uris'],
                skip_authorization=serializer.validated_data.get('skip_authorization', False)
            )

            if application is None:
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Return application with client_secret (shown only once)
            # Note: redirect_uris includes Swagger redirect URI automatically for testing
            return Response({
                'id': application.id,
                'name': application.name,
                'client_id': application.client_id,
                'client_secret': application.client_secret,  # Only shown on creation
                'client_type': application.client_type,
                'authorization_grant_type': application.authorization_grant_type,
                'redirect_uris': application.redirect_uris,
                'skip_authorization': application.skip_authorization,
                'created': application.created,
                'updated': application.updated,
                'user_id': application.user.id,
                'message': message,
                'note': 'Swagger redirect URI has been automatically added for API testing'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'An error occurred while creating the application: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['Developer Portal'],
        description="List all OAuth2 applications owned by the authenticated user.",
        responses={
            200: OAuth2ApplicationListSerializer(many=True),
        },
        operation_id='list_oauth2_applications'
    )
    def get(self, request):
        """List all OAuth2 applications for the authenticated user"""
        try:
            applications = get_user_applications(user=request.user)
            
            applications_data = []
            for app in applications:
                applications_data.append({
                    'id': app.id,
                    'name': app.name,
                    'client_id': app.client_id,
                    'client_type': app.client_type,
                    'authorization_grant_type': app.authorization_grant_type,
                    'redirect_uris': app.redirect_uris,
                    'skip_authorization': app.skip_authorization,
                    'created': app.created,
                    'updated': app.updated,
                })
            
            return Response(applications_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'An error occurred while retrieving applications: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetOAuth2ApplicationApi(APIView):
    """
    API endpoint for getting a specific OAuth2 application by ID.
    Also handles DELETE to delete applications (for URL routing compatibility).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Developer Portal'],
        description="Get details of a specific OAuth2 application (without client_secret).",
        responses={
            200: OAuth2ApplicationListSerializer,
            404: 'Application not found',
        },
        operation_id='get_oauth2_application'
    )
    def get(self, request, application_id):
        """Get a specific OAuth2 application"""
        try:
            application = get_application_by_id(user=request.user, application_id=application_id)
            
            if not application:
                return Response(
                    {'error': 'Application not found or you don\'t have permission to view it'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'id': application.id,
                'name': application.name,
                'client_id': application.client_id,
                'client_type': application.client_type,
                'authorization_grant_type': application.authorization_grant_type,
                'redirect_uris': application.redirect_uris,
                'skip_authorization': application.skip_authorization,
                'created': application.created,
                'updated': application.updated,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'An error occurred while retrieving the application: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['Developer Portal'],
        description="Delete an OAuth2 application. This action cannot be undone.",
        responses={
            200: {'description': 'Application deleted successfully'},
            404: 'Application not found',
            500: 'Internal server error'
        },
        operation_id='delete_oauth2_application'
    )
    def delete(self, request, application_id):
        """Delete an OAuth2 application"""
        try:
            success, message = delete_oauth2_application(
                user=request.user,
                application_id=application_id
            )
            
            if not success:
                return Response(
                    {'error': message},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(
                {'message': message},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': f'An error occurred while deleting the application: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegenerateClientSecretApi(APIView):
    """
    API endpoint for regenerating the client secret of an OAuth2 application.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Developer Portal'],
        description="Regenerate the client secret for an OAuth2 application. Returns the new secret.",
        responses={
            200: OAuth2ApplicationResponseSerializer,
            404: 'Application not found',
            500: 'Internal server error'
        },
        operation_id='regenerate_client_secret'
    )
    def post(self, request, application_id):
        """Regenerate client secret for an OAuth2 application"""
        try:
            application, message = regenerate_client_secret(
                user=request.user,
                application_id=application_id
            )
            
            if application is None:
                return Response(
                    {'error': message},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return application with new client_secret
            return Response({
                'id': application.id,
                'name': application.name,
                'client_id': application.client_id,
                'client_secret': application.client_secret,  # New secret shown
                'client_type': application.client_type,
                'authorization_grant_type': application.authorization_grant_type,
                'redirect_uris': application.redirect_uris,
                'skip_authorization': application.skip_authorization,
                'created': application.created,
                'updated': application.updated,
                'user_id': application.user.id,
                'message': message
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'An error occurred while regenerating the client secret: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AddSwaggerRedirectUriApi(APIView):
    """
    API endpoint for adding Swagger redirect URI to an existing OAuth2 application.
    Useful for enabling Swagger UI testing.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Developer Portal'],
        description="Add Swagger redirect URI to an existing OAuth2 application for testing via Swagger UI.",
        responses={
            200: {'description': 'Swagger redirect URI added successfully'},
            404: 'Application not found',
            500: 'Internal server error'
        },
        operation_id='add_swagger_redirect_uri'
    )
    def post(self, request, application_id):
        """Add Swagger redirect URI to an OAuth2 application"""
        try:
            application, message = add_swagger_redirect_uri(
                user=request.user,
                application_id=application_id
            )
            
            if application is None:
                return Response(
                    {'error': message},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'message': message,
                'redirect_uris': application.redirect_uris
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
