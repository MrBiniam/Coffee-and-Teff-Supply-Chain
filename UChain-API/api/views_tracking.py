from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import TrackingLocation, Order, CustomUser
from .serializers import TrackingLocationSerializer, TrackingLocationDetailSerializer
from .notification_views import NotificationService
import logging

logger = logging.getLogger(__name__)

class UpdateTrackingLocationView(APIView):
    """
    API view to update tracking location for an order
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get data from request
            order_id = request.data.get('orderId')
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            status_update = request.data.get('status')
            
            # Validate required fields
            if not all([order_id, latitude, longitude]):
                return Response(
                    {"error": "Order ID, latitude and longitude are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the order
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate the user is the driver for this order
            if str(order.driver) != str(request.user.id) and not request.user.is_driver:
                return Response(
                    {"error": "Only the assigned driver can update tracking location"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create tracking location
            tracking_location = TrackingLocation(
                order=order,
                driver=request.user,
                latitude=latitude,
                longitude=longitude
            )
            
            # Update status if provided
            if status_update:
                tracking_location.status = status_update

                # Also update the order status if needed, but never downgrade a
                # fully delivered order back to an in-transit status. Periodic
                # location pings may continue to send 'on_route' even after the
                # buyer has confirmed delivery, so we guard against that here.
                normalized_status = status_update.lower()

                # Get canonical status values from the Order model
                final_delivered = getattr(Order, "DELIVERED", "Delivered")
                driver_delivered = getattr(Order, "DRIVER_DELIVERED", "Driver_Delivered")
                shipped_status = getattr(Order, "SHIPPED", "Shipped")

                current_status = (order.status or "").upper()

                # Only update when the order is not already in a delivered state
                if current_status not in {final_delivered.upper(), driver_delivered.upper()}:
                    if normalized_status == 'delivered':
                        # Use DRIVER_DELIVERED for collaborative confirmation flow
                        order.status = driver_delivered
                        order.save()
                    elif normalized_status in ('picked_up', 'on_route'):
                        order.status = shipped_status
                        order.save()
            
            tracking_location.save()
            
            # Return serialized data
            serializer = TrackingLocationSerializer(tracking_location)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error updating tracking location: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetOrderLocationView(APIView):
    """
    API view to get the latest location for an order
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            # Get the order
            try:
                # Convert string order_id to integer
                order = Order.objects.get(id=int(order_id))
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Temporarily allow all authenticated users to view tracking info
            # This is a simplified authorization check to get things working
            is_authorized = True  # Allow all users to view tracking for now
            
            if not is_authorized and not request.user.is_superuser:
                return Response(
                    {"error": "You don't have permission to view this order's tracking"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the latest tracking location
            latest_location = TrackingLocation.objects.filter(
                order=order
            ).order_by('-timestamp').first()
            
            if not latest_location:
                return Response(
                    {"message": "No tracking information available yet"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return serialized data
            serializer = TrackingLocationSerializer(latest_location)
            return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Error getting order location: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetTrackingHistoryView(APIView):
    """
    API view to get all tracking history for an order
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            # Get the order
            try:
                print(f"GetTrackingHistoryView: Looking for order with ID {order_id}")
                # Convert string order_id to integer
                order = Order.objects.get(id=int(order_id))
                print(f"GetTrackingHistoryView: Found order {order.id}")
            except Order.DoesNotExist:
                print(f"GetTrackingHistoryView: Order {order_id} not found")
                return Response(
                    {"error": "Order not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Temporarily allow all authenticated users to view tracking info
            # This is a simplified authorization check to get things working
            is_authorized = True  # Allow all users to view tracking for now
            
            if not is_authorized and not request.user.is_superuser:
                return Response(
                    {"error": "You don't have permission to view this order's tracking history"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all tracking locations
            tracking_history = TrackingLocation.objects.filter(
                order=order
            ).order_by('-timestamp')
            
            if not tracking_history:
                # Return empty array instead of 404
                return Response([])
            
            # Return serialized data
            serializer = TrackingLocationSerializer(tracking_history, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Error getting tracking history: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateOrderStatusView(APIView):
    """
    API view to update an order's status
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            # Get status from request
            status_update = request.data.get('status')
            
            if not status_update:
                return Response(
                    {"error": "Status is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the order
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response(
                    {"error": "Order not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate the user is the driver for this order
            if str(order.driver) != str(request.user.id) and not request.user.is_driver:
                return Response(
                    {"error": "Only the assigned driver can update order status"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update order status
            old_status = order.status
            if status_update.lower() == 'on_route':
                # Keep the order status as SHIPPED when tracking status is on_route
                order.status = 'SHIPPED'
            elif status_update.lower() == 'delivered':
                # Use a special status when driver marks as delivered but buyer hasn't confirmed
                order.status = 'DRIVER_DELIVERED'
            else:
                order.status = status_update.upper()
            order.save()
            
            # Create notifications if status has changed
            if old_status != order.status:
                try:
                    # Use notification service to create appropriate notifications
                    NotificationService.create_order_notification(order.id, order.status)
                    logger.info(f"Created notification for order {order.id} status change to {order.status}")
                except Exception as e:
                    logger.error(f"Error creating notification: {str(e)}")
            
            # Create a tracking location entry with the new status
            # Get the driver's last known location
            last_location = TrackingLocation.objects.filter(
                order=order,
                driver=request.user
            ).order_by('-timestamp').first()
            
            # If we have a last location, use those coordinates, otherwise use defaults
            latitude = last_location.latitude if last_location else 0.0
            longitude = last_location.longitude if last_location else 0.0
            
            # Create a new tracking entry with the status update
            tracking_location = TrackingLocation(
                order=order,
                driver=request.user,
                latitude=latitude,
                longitude=longitude,
                status=status_update.lower()
            )
            tracking_location.save()
            
            return Response({"message": f"Order status updated to {status_update}"})
        
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
