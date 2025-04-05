from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import DeliveryRoute, Order, CustomUser
from .serializers import DeliveryRouteSerializer
import logging

logger = logging.getLogger(__name__)

class CreateRouteView(APIView):
    """
    API view to create or update a route for an order
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get data from request
            order_id = request.data.get('orderId')
            start_lat = request.data.get('startPoint', {}).get('latitude')
            start_lng = request.data.get('startPoint', {}).get('longitude')
            start_address = request.data.get('startPoint', {}).get('address')
            end_lat = request.data.get('endPoint', {}).get('latitude')
            end_lng = request.data.get('endPoint', {}).get('longitude')
            end_address = request.data.get('endPoint', {}).get('address')
            route_geometry = request.data.get('routeGeometry')
            distance = request.data.get('distance')
            estimated_time = request.data.get('estimatedTime')
            
            # Validate required fields
            if not all([order_id, start_lat, start_lng, end_lat, end_lng]):
                return Response(
                    {"error": "Order ID, start and end coordinates are required"},
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
            if str(order.driver.id) != str(request.user.id) and not request.user.is_staff:
                return Response(
                    {"error": "Only the assigned driver can set route information"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if a route already exists for this order
            try:
                route = DeliveryRoute.objects.get(order=order)
                # Update existing route
                route.start_latitude = start_lat
                route.start_longitude = start_lng
                route.start_address = start_address
                route.end_latitude = end_lat
                route.end_longitude = end_lng
                route.end_address = end_address
                route.route_geometry = route_geometry
                route.distance_km = distance
                route.estimated_time_min = estimated_time
            except DeliveryRoute.DoesNotExist:
                # Create new route
                route = DeliveryRoute(
                    order=order,
                    driver=request.user,
                    start_latitude=start_lat,
                    start_longitude=start_lng,
                    start_address=start_address,
                    end_latitude=end_lat,
                    end_longitude=end_lng,
                    end_address=end_address,
                    route_geometry=route_geometry,
                    distance_km=distance,
                    estimated_time_min=estimated_time
                )
            
            route.save()
            
            # Return serialized data
            serializer = DeliveryRouteSerializer(route)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error saving route: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetRouteView(APIView):
    """
    API view to get the route for an order
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            # Log the request for debugging
            logger.info(f"Getting route for order_id: {order_id}")
            
            # Get the order
            try:
                order = Order.objects.get(id=order_id)
                logger.info(f"Found order: {order.id}")
            except Order.DoesNotExist:
                logger.error(f"Order not found with ID: {order_id}")
                return Response(
                    {"error": "Order not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check authorization - allow all authenticated users to view route info
            # We could restrict this to only buyer, seller, or driver of the order
            
            # Get the route
            try:
                # Try to find the most recent route for this order
                route = DeliveryRoute.objects.filter(order=order).order_by('-created_at').first()
                if not route:
                    raise DeliveryRoute.DoesNotExist
                logger.info(f"Found route for order: {order.id}, route ID: {route.id}")
            except DeliveryRoute.DoesNotExist:
                logger.error(f"No route found for order: {order_id}")
                return Response(
                    {"error": "No route found for this order"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return serialized data
            serializer = DeliveryRouteSerializer(route)
            logger.info(f"Returning route data for order {order_id}")
            return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Error getting route: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SaveRouteView(APIView):
    """
    API view to save a route from the tracking component
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get data from request
            order_id = request.data.get('orderId')
            start_lat = request.data.get('startPoint', {}).get('latitude')
            start_lng = request.data.get('startPoint', {}).get('longitude')
            start_address = request.data.get('startPoint', {}).get('address')
            end_lat = request.data.get('endPoint', {}).get('latitude')
            end_lng = request.data.get('endPoint', {}).get('longitude')
            end_address = request.data.get('endPoint', {}).get('address')
            route_geometry = request.data.get('routeGeometry')
            distance = request.data.get('distance')
            estimated_time = request.data.get('estimatedTime')
            
            logger.info(f"Received route save request for order {order_id}")
            
            # Validate required fields
            if not order_id:
                return Response(
                    {"error": "Order ID is required"},
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
            
            # Create or update the route
            try:
                route, created = DeliveryRoute.objects.update_or_create(
                    order=order,
                    defaults={
                        'driver': request.user,
                        'start_latitude': start_lat if start_lat else 0,
                        'start_longitude': start_lng if start_lng else 0,
                        'start_address': start_address if start_address else '',
                        'end_latitude': end_lat if end_lat else 0,
                        'end_longitude': end_lng if end_lng else 0,
                        'end_address': end_address if end_address else '',
                        'route_geometry': route_geometry,
                        'distance_km': distance if distance else 0,
                        'estimated_time_min': estimated_time if estimated_time else 0
                    }
                )
                
                # Update order status to on_route
                if order.status != 'ON_ROUTE':
                    order.status = 'ON_ROUTE'
                    order.save()
                
                # Return serialized data
                serializer = DeliveryRouteSerializer(route)
                return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Error saving route details: {str(e)}")
                return Response(
                    {"error": f"Error saving route details: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error processing route save request: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
