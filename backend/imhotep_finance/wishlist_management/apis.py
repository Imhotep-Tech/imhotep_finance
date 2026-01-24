from rest_framework.permissions import IsAuthenticated
from wishlist_management.services import (
    create_wish,
    delete_wish,
    update_wish,
    update_wish_status,
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from .serializers import (
    WishlistInputSerializer,
    GetWishlistResponseSerializer,
    GetWishlistInputSerializer
)
from .selectors import get_wishlist_for_user
from finance_management.utils.serializer import serialize_wishlist
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class WishCreateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Wishlist'],
        request=WishlistInputSerializer,
        responses={
            201: {'description': 'Wish created successfully'},
            400: 'Validation error',
            500: 'Internal server error'
        },
        operation_id='create_wish'
    )
    def post(self, request):
        serializer = WishlistInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Create the wish
            data = serializer.validated_data
            
            wish = create_wish(
                user=request.user,
                price=data['price'],
                currency=data['currency'],
                year=data['year'],
                wish_details=data.get('wish_details'),
                link=data.get('link'),
            )
            return Response(
                {"message": "Wish created successfully", "id": wish.id},
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating wish: {str(e)}")
            return Response(
                {'error': 'An error occurred while creating the wish'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class WishDeleteApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Wishlist'],
        responses={
            200: 'Wish deleted successfully',
            400: 'Bad request - Cannot delete wish',
            404: 'Wish not found',
            500: 'Internal server error',
        },
        operation_id='delete_wish'
    )
    def delete(self, request, wish_id):
        try:
            # Delete the wish
            delete_wish(
                user=request.user,
                wish_id=wish_id,
            )
            
            return Response({
                "success": True,
                "message": "Wish deleted successfully",
            }, status=status.HTTP_200_OK)
        
        except Http404:
            return Response(
                {"error": "Wish not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error deleting wish: {str(e)}")
            return Response(
                {'error': 'An error occurred while deleting the wish'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class WishUpdateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Wishlist'],
        request=WishlistInputSerializer,
        responses={
            200: 'Wish updated successfully',
            400: 'Bad request - Validation error',
            404: 'Wish not found',
            500: 'Internal server error',
        },
        operation_id='update_wish'
    )
    def post(self, request, wish_id):
        serializer = WishlistInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            data = serializer.validated_data
            
            # Update the wish
            wish = update_wish(
                user=request.user,
                wish_id=wish_id,
                price=data['price'],
                currency=data['currency'],
                year=data['year'],
                wish_details=data.get('wish_details'),
                link=data.get('link'),
            )
            
            return Response({
                "success": True,
                "message": "Wish updated successfully",
                "id": wish.id
            }, status=status.HTTP_200_OK)
        
        except Http404:
            return Response(
                {"error": "Wish not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating wish: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating the wish'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class GetWishlistApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Wishlist'],
        parameters=[GetWishlistInputSerializer],
        responses={200: GetWishlistResponseSerializer},
        operation_id='get_wishlist'
    )
    def get(self, request):
        """Return paginated transactions for the logged-in user, filtered by date range."""

        serializer = GetWishlistInputSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        filters = serializer.validated_data
        try:
            year = filters.get('year')

            # Get filtered wishlist
            wishlist_qs = get_wishlist_for_user(user=request.user, year=year)
            
            # Paginate results
            paginator = Paginator(wishlist_qs, 20)
            page_num = filters.get('page', 1)
            
            try:
                page_obj = paginator.page(page_num)
            except (PageNotAnInteger, EmptyPage):
                page_obj = paginator.page(1)
            
            # Serialize wishlist
            wishlist_list = [serialize_wishlist(w) for w in page_obj.object_list]
            
            response_data = {
                "wishlist": wishlist_list,
                "pagination": {
                    "page": page_obj.number,
                    "num_pages": paginator.num_pages,
                    "per_page": paginator.per_page,
                    "total": paginator.count,
                },
                "year": year
            }
            return Response(response_data, status=status.HTTP_200_OK)
    
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error getting wishlist: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving wishlist'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class UpdateWishlistStatusApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Wishlist'],
        responses={
            200: 'Wish status updated successfully',
            500: 'Internal server error',
        },
        operation_id='update_wish_status'
    )
    def post(self, request, wish_id):
        """Update the status of a wish."""
        try:
            user = request.user
            
            wish = update_wish_status(
                user=user,
                wish_id=wish_id
            )
            
            return Response({
                "success": True,
                "message": "Wish status updated successfully",
                "status": wish.status
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating wish status: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating wish status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )