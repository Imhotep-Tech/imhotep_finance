from rest_framework.permissions import IsAuthenticated
from target_management.services import create_target_for_user, calculate_score
from target_management.selectors import (
    get_latest_target_for_user,
    get_all_targets_for_user
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from target_management.serializers import (
    TargetCreateSerializer,
    TargetResponseSerializer,
    GetScoreResponseSerializer,
    TargetHistoryResponseSerializer
)
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from finance_management.utils.serializer import serialize_target
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


@method_decorator(csrf_exempt, name='dispatch')
class TargetManagementApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=TargetCreateSerializer,
        responses={200: 'Done', 400: 'Bad Request'},
        description="Create or update target for authenticated user."
    )
    def post(self, request):
        """Create or update target for authenticated user."""
        serializer = TargetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            target_value = serializer.validated_data['target']
            target_obj = create_target_for_user(
                user=request.user,
                target_value=float(target_value)
            )
            
            return Response(
                {"message": "Target Added Successfully"},
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating target: {str(e)}")
            return Response(
                {'error': 'An error occurred while creating the target'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
@method_decorator(csrf_exempt, name='dispatch')  
class GetTargetApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: TargetResponseSerializer, 404: 'Not Found'},
        description="Get latest target for authenticated user."
    )
    def get(self, request):
        """Get latest target for authenticated user."""
        try:
            from target_management.selectors import get_latest_target_for_user
            target = get_latest_target_for_user(user=request.user)
            
            if not target:
                return Response(
                    {'error': 'Target not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'id': target.id,
                'user_id': target.user.id,
                'target': target.target,
                'month': target.month,
                'year': target.year,
                'score': target.score,
                'created_at': target.created_at.isoformat() if target.created_at else None
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error getting target: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving the target'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class GetScoreApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: GetScoreResponseSerializer, 404: 'Not Found'},
        description="Get current month score relative to target."
    )
    def get(self, request):
        """Get current month score relative to target."""
        try:
            from target_management.selectors import get_latest_target_for_user
            target = get_latest_target_for_user(user=request.user)
            
            if not target:
                return Response(
                    {'error': 'Target not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            target_obj, score_txt, score = calculate_score(
                user=request.user,
                target_obj=target
            )

            return Response({
                "score": score,
                "target": target_obj.target,
                "month": target_obj.month,
                "year": target_obj.year,
                "score_txt": score_txt
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error calculating score: {str(e)}")
            return Response(
                {'error': 'An error occurred while calculating the score'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
@method_decorator(csrf_exempt, name='dispatch')
class GetScoreHistoryApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: TargetHistoryResponseSerializer},
        description="Get paginated target history for authenticated user."
    )
    def get(self, request):
        """Get paginated target history for authenticated user."""
        try:
            targets = get_all_targets_for_user(user=request.user)
            
            # Paginate results
            paginator = Paginator(targets, 20)
            page_num = request.GET.get('page', 1)
            
            try:
                page_obj = paginator.page(page_num)
            except (PageNotAnInteger, EmptyPage):
                page_obj = paginator.page(1)

            target_list = [serialize_target(t) for t in page_obj.object_list]

            response_data = {
                "targets": target_list,
                "pagination": {
                    "page": page_obj.number,
                    "num_pages": paginator.num_pages,
                    "per_page": paginator.per_page,
                    "total": paginator.count,
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error getting target history: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving target history'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )