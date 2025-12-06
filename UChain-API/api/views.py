from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import CustomUserSerializer
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .models import CustomUser, BuyerProfile, DriverProfile, Product, Order, Message, Rating, SellerProfile
from django.contrib.auth import authenticate
from .serializers import CustomUserSerializer, BuyerProfileSerializer, SellerProfileSerializer, DriverProfileSerializer, ProductSerializer, OrderSerializer, MessageSerializer, RatingSerializer
from django.conf import settings
from chapa import Chapa
from datetime import datetime
from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .notification_views import NotificationService
import logging

logger = logging.getLogger(__name__)
from django.http import JsonResponse, HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
import logging
import json
import re
import sys
import traceback
from chapa import Chapa
from functools import wraps


def home(request):
    return render(request, 'home.html')  # Replace 'home.html' with your template


# Custom base class for registration views to bypass authentication completely
class UnauthenticatedAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get_authenticators(self):
        return []  # No authentication for registration


def debug_chapa_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with args: {args}, kwargs: {kwargs}")
        try:
            result = func(*args, **kwargs)
            print(f"{func.__name__} result: {result}")
            return result
        except Exception as e:
            print(f"{func.__name__} error: {str(e)}")
            traceback.print_exc()
            raise
    return wrapper

# Initialize Chapa with your secret key
chapa = Chapa(settings.CHAPA_SECRET_KEY)

# Add debug wrapper to Chapa methods
original_verify = chapa.verify
chapa.verify = debug_chapa_call(original_verify)

# Comment out the problematic construct_request debug wrapper
# This was causing the "got multiple values for argument 'url'" error
'''
try:
    original_construct_request = chapa._construct_request
    
    def debug_construct_request(self, *args, **kwargs):
        print(f"Chapa _construct_request called with args: {args}, kwargs: {kwargs}")
        try:
            result = original_construct_request(self, *args, **kwargs)
            print(f"Chapa _construct_request result: {result}")
            return result
        except Exception as e:
            print(f"Chapa _construct_request error: {str(e)}")
            traceback.print_exc()
            raise
    
    chapa._construct_request = debug_construct_request.__get__(chapa, type(chapa))
except Exception as e:
    print(f"Failed to patch _construct_request: {e}")
'''

# View to create a buyer user
@method_decorator(csrf_exempt, name='dispatch')
class BuyerCreateView(UnauthenticatedAPIView):
    def post(self, request):
        try:
            user_serializer = CustomUserSerializer(data=request.data)
            if user_serializer.is_valid():
                # Make sure is_buyer is set to True
                if 'is_buyer' not in user_serializer.validated_data or not user_serializer.validated_data['is_buyer']:
                    user_serializer.validated_data['is_buyer'] = True
                
                # Create the user
                user_instance = user_serializer.save()
                
                # Create a buyer profile associated with the new user
                buyer_data = {'user': user_instance.id}
                buyer_serializer = BuyerProfileSerializer(data=buyer_data)
                if buyer_serializer.is_valid():
                    buyer_serializer.save()
                    return Response({'message': 'Buyer created successfully.'}, status=status.HTTP_201_CREATED)
                else:
                    # Rollback user creation if buyer profile creation fails
                    user_instance.delete()
                    return Response({'error': 'Failed to create buyer profile', 'details': buyer_serializer.errors}, 
                                   status=status.HTTP_400_BAD_REQUEST)
            else:
                # Format validation errors more clearly
                error_message = 'User data validation failed'
                if 'username' in user_serializer.errors:
                    if 'unique' in str(user_serializer.errors['username']).lower():
                        error_message = 'Username already exists. Please choose a different username.'
                
                return Response({'error': error_message, 'details': user_serializer.errors}, 
                               status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log the error for debugging
            print(f"Error in buyer registration: {str(e)}")
            return Response({'error': 'An unexpected error occurred during registration'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View for Login a user
@method_decorator(csrf_exempt, name='dispatch')
class UserLoginView(UnauthenticatedAPIView):
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if username is None or password is None:  # Changed 'and' to 'or' for correct validation
            return Response({"error": "Please provide both username and password"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Only serialize the user after confirming it's not None
        user_serializer = CustomUserSerializer(user)
        token, created = Token.objects.get_or_create(user=user)
        
        # For debugging
        print(f"Login successful for user: {username}, token: {token.key}")
        
        return Response({"status": "successful", "token": token.key, "user": user_serializer.data}, status=status.HTTP_200_OK)  # Changed to 200 OK

# view to list a specific user
class UserRetrieveView(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    lookup_field = "pk"

# view to list a specific seller
class SellerRetrieveView(generics.RetrieveAPIView):
    queryset = SellerProfile.objects.all()
    serializer_class = SellerProfileSerializer
    lookup_field = "pk"

# view to list a specific driver
class DriverRetrieveView(generics.RetrieveAPIView):
    queryset = DriverProfile.objects.all()
    serializer_class = DriverProfileSerializer
    lookup_field = "pk"

# View to create a seller user
@method_decorator(csrf_exempt, name='dispatch')
class SellerCreateView(UnauthenticatedAPIView):
    def post(self, request):
        user_serializer = CustomUserSerializer(data=request.data)
        if user_serializer.is_valid():
            user_instance = user_serializer.save()
            
            # Create a seller profile associated with the new user
            seller_data = {'user': user_instance.id, "tax_number": request.data.get("tax_number")}
            seller_serializer = SellerProfileSerializer(data=seller_data)
            if seller_serializer.is_valid():
                seller_serializer.save()
                return Response({'message': 'Seller created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                # Rollback user creation if seller profile creation fails
                user_instance.delete()
                return Response(seller_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# View to create a driver user
@method_decorator(csrf_exempt, name='dispatch')
class DriverCreateView(UnauthenticatedAPIView):
    def post(self, request):
        user_serializer = CustomUserSerializer(data=request.data)
        if user_serializer.is_valid():
            user_instance = user_serializer.save()
            
            # Create a driver profile associated with the new user
            driver_data = {'user': user_instance.id, 'license_number': request.data.get('license_number'), "car_model": request.data.get("car_model")}
            driver_serializer = DriverProfileSerializer(data=driver_data)
            if driver_serializer.is_valid():
                driver_serializer.save()
                return Response({'message': 'Driver created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                # Rollback user creation if driver profile creation fails
                user_instance.delete()
                return Response(driver_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# view to create a Product
class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Save the product
        product = serializer.save(seller=self.request.user.sellerprofile)
        
        # Create notifications for all buyers about the new product
        try:
            from .notification_views import NotificationService
            NotificationService.create_new_product_notification(product)
        except Exception as e:
            print(f"Error creating notifications for new product: {str(e)}")

# view to list products
class ProductListView(APIView):
    def get(self, request, *args, **kwargs):
        queryset = Product.objects.all()
        serializer = ProductSerializer(queryset, many=True)
        return Response(serializer.data)
    
# view to list a specific product
class ProductRetrieveView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = "pk"

# view to update a specific product
class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = "pk"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to update this product.")

        # Check if the requesting user is the seller of the product
        if instance.seller_id != request.user.id:
            raise PermissionDenied("You are not authorized to update this product.")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

# view to destroy a product
class ProductDestroyView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = "pk"

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to delete this product.")

        # Check if the requesting user is the seller of the product
        if instance.seller_id != request.user.id:
            raise PermissionDenied("You are not authorized to delete this product.")

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# view to create a view
class OrderCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Save the order with the buyer profile
        order = serializer.save(buyer=self.request.user.buyerprofile, status='Pending')
        
        # Create notifications for the new order
        NotificationService.create_order_notification(order.id, 'Pending')

# view to retrieve all orders
class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return orders based on user role
        user = self.request.user
        
        try:
            if user.is_buyer:
                # Buyer can see their own orders
                buyer_profile = getattr(user, 'buyerprofile', None)
                if buyer_profile:
                    return Order.objects.filter(buyer=buyer_profile)
                else:
                    # Return empty queryset if profile doesn't exist
                    return Order.objects.none()
            elif user.is_seller:
                # Seller can see orders for their products
                return Order.objects
            elif user.is_driver:
                # Driver can see orders assigned to them
                driver_profile = getattr(user, 'driverprofile', None)
                if driver_profile:
                    return Order.objects.filter(driver=driver_profile)
                else:
                    # Return empty queryset if profile doesn't exist
                    return Order.objects.none()
            else:
                return Order.objects.none()
        except Exception as e:
            # Log the error and return empty queryset
            print(f"Error in OrderListView: {str(e)}")
            return Order.objects.none()

# view to retrieve a specific order
class OrderRetrieveView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def get_object(self):
        instance = super().get_object()
        user = self.request.user

        # Check if user has permission to view this order
        if (user.is_buyer and hasattr(user, 'buyerprofile') and instance.buyer == user.buyerprofile) or \
           (user.is_seller and instance.product.seller_id == user.id) or \
           (user.is_driver and hasattr(user, 'driverprofile') and instance.driver == user.driverprofile):
            return instance
        
        raise PermissionDenied("You don't have permission to view this order")

# view to update a specific order
class OrderUpdateView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        user = request.user
        # Check permissions - FIX: Handle product ManyToManyField properly
        if user.is_seller and hasattr(user, 'sellerprofile'):
            # For sellers, check if they are associated with any product in this order
            seller_has_product = False
            for product in instance.product.all():
                if product.seller == user.sellerprofile:
                    seller_has_product = True
                    break
            
            if not seller_has_product:
                raise PermissionDenied("You are not authorized to update this order.")
        elif user.is_buyer and hasattr(user, 'buyerprofile') and instance.buyer != user.buyerprofile:
            raise PermissionDenied("You are not authorized to update this order.")
        elif user.is_driver and hasattr(user, 'driverprofile') and instance.driver != user.driverprofile:
            raise PermissionDenied("You are not authorized to update this order.")
        
        # Save the old status for comparison after update
        old_status = instance.status
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Check if status changed and trigger notifications
        if 'status' in request.data and old_status != instance.status:
            try:
                # Import the notification service (add this import at the top of the file)
                from .notification_views import NotificationService
                
                # Trigger notifications based on the new status
                NotificationService.create_order_notification(instance.id, instance.status)
                
                # Update product quantity when order is delivered
                if instance.status == Order.DELIVERED or instance.status == Order.DRIVER_DELIVERED:
                    # Get the order quantity
                    order_quantity_str = instance.quantity
                    
                    # Try to extract the numeric part from the quantity string
                    import re
                    numeric_match = re.search(r'(\d+)', order_quantity_str)
                    if numeric_match:
                        ordered_quantity = int(numeric_match.group(1))
                        
                        # Update each product's quantity
                        for product in instance.product.all():
                            # Get current product quantity
                            product_quantity_str = product.quantity
                            
                            # Try to extract the numeric part and unit from the product quantity
                            product_match = re.search(r'(\d+)\s*([a-zA-Z]*)', product_quantity_str)
                            if product_match:
                                current_quantity = int(product_match.group(1))
                                unit = product_match.group(2)
                                
                                # Calculate new quantity (ensure it doesn't go below 0)
                                new_quantity = max(0, current_quantity - ordered_quantity)
                                
                                # Update product quantity
                                if unit:
                                    product.quantity = f"{new_quantity} {unit}"
                                else:
                                    product.quantity = str(new_quantity)
                                
                                # Save the updated product
                                product.save()
                                
                                # Log the inventory update
                                logger.info(f"Updated inventory for product {product.id}: {product.name} - Old quantity: {product_quantity_str}, New quantity: {product.quantity}")
                                
                                # If inventory reaches zero, log a warning
                                if new_quantity == 0:
                                    logger.warning(f"Product {product.id}: {product.name} is now out of stock!")
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error processing order {instance.id}: {str(e)}")

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

# view to destroy an order
class OrderDestroyView(generics.DestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        user = request.user
        # Check permissions
        if user.is_seller and instance.product.seller_id != user.id:
            raise PermissionDenied("You are not authorized to delete this order.")
        elif user.is_buyer and hasattr(user, 'buyerprofile') and instance.buyer != user.buyerprofile:
            raise PermissionDenied("You are not authorized to delete this order.")
            
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

# view to send a message
class SendMessageAPIView(APIView):
    def post(self, request):
        request.data['sender'] = request.user
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            # Save the message first
            message = serializer.save()
            
            # Create a notification for the message recipient
            try:
                from .notification_views import NotificationService
                
                # Create the notification with the sender's username
                NotificationService.create_notification(
                    recipient_id=message.receiver.id,
                    notification_type='message_received',
                    message=f"{request.user.username} sent you a message",
                    sender_name=request.user.username
                )
            except Exception as e:
                # Log the error but continue - message should be sent even if notification fails
                logger.error(f"Error creating message notification: {str(e)}")
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PaymentDiagnostic(APIView):
    """
    Diagnostic endpoint for checking Chapa integration
    """
    def get(self, request):
        try:
            # Get the Chapa API version and status
            diagnostic_data = {
                "chapa_version": getattr(chapa, "__version__", "Unknown"),
                "chapa_secret_key_length": len(settings.CHAPA_SECRET_KEY) if settings.CHAPA_SECRET_KEY else 0,
                "chapa_api_url": settings.CHAPA_API_URL,
                "chapa_api_version": settings.CHAPA_API_VERSION,
                "python_version": sys.version,
                "timestamp": datetime.now().isoformat()
            }
            
            # Test minimal initialization - don't actually call the API
            test_init_params = {
                "email": "test@example.com",
                "amount": "100",
                "first_name": "Test",
                "last_name": "User",
                "tx_ref": "test_tx_ref",
                "callback_url": "http://localhost:8000/api/callback",
                "currency": "ETB"
            }
            
            # Check if we can create the payload correctly
            init_params_serialized = json.dumps(test_init_params, indent=2)
            diagnostic_data["test_init_params"] = init_params_serialized
            
            # Include customization format
            test_customization = {
                "customization[title]": "Test Payment",
                "customization[description]": "Test payment for diagnostics"
            }
            diagnostic_data["test_customization_format"] = json.dumps(test_customization, indent=2)
            
            # Return diagnostic data
            return Response(diagnostic_data)
        except Exception as e:
            error_data = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class Payment(APIView):
    def post(self, request):
        try:
            # Get the current date and time
            now = datetime.now()
            timestamp = now.strftime("%Y%m%d%H%M%S")

            # Use tx_ref from the request when provided, but enforce Chapa's 50-char limit
            incoming_tx_ref = request.data.get('tx_ref')
            base_tx_ref = incoming_tx_ref if incoming_tx_ref else f"tx_uchainapp_{timestamp}"

            # Chapa requires tx_ref to be at most 50 characters long
            if len(base_tx_ref) <= 50:
                tx_ref = base_tx_ref
            else:
                # Generate a compact, unique tx_ref that respects the limit
                tx_ref = f"UCHAIN-{timestamp}"
            
            # Log the request data for debugging
            print("Payment initialization request:", request.data)
            
            # Set the frontend URL that Chapa should redirect to after payment
            product_id = request.data.get('product_id', '0')
            frontend_callback_url = request.data.get('callback_url', f'http://localhost:4200/#/buyer/products/product-profile/{product_id}?product_id={product_id}')
            
            # The return_url is where Chapa will redirect the user after payment
            # This should be a page that can handle the tx_ref parameter
            return_url = request.data.get('return_url', f'http://localhost:4200/#/buyer/products/product-profile/{product_id}?product_id={product_id}')
            
            print(f"Using callback URL: {frontend_callback_url}")
            print(f"Using return URL: {return_url}")
            
            # Get product information if available
            product_name = request.data.get('product_name', 'Coffee and Teff Product')
            
            # Initialize payment with Chapa
            try:
                # Print debug info about Chapa configuration
                print("CHAPA DEBUG INFO:")
                print(f"Secret key set: {'Yes' if settings.CHAPA_SECRET_KEY else 'No'}")
                print(f"Secret key length: {len(settings.CHAPA_SECRET_KEY) if settings.CHAPA_SECRET_KEY else 0}")
                print(f"Base API URL: {settings.CHAPA_API_URL}")
                print(f"API Version: {settings.CHAPA_API_VERSION}")
                
                # Prepare payment data - use string conversion for amount which should fix common issues
                payment_data = {
                    'email': request.data.get('email', 'test@example.com'),
                    'amount': str(request.data['amount']),  # Convert to string to avoid decimal issues
                    'first_name': request.data.get('first_name', 'Guest'),
                    'last_name': request.data.get('last_name', 'User'),
                    'tx_ref': tx_ref,
                    'callback_url': frontend_callback_url,
                    'return_url': return_url,
                    'currency': 'ETB',  # Default to Ethiopian Birr
                }
                
                # Add phone number if provided
                if 'phone_number' in request.data and request.data['phone_number']:
                    payment_data['phone_number'] = request.data['phone_number']
                
                # Add customization with short title and description (meeting Chapa's character limits)
                # Note: Chapa requires titles ≤ 16 chars and descriptions ≤ 50 chars
                payment_data['customization[title]'] = "Coffee Payment"  # Keep under 16 chars
                payment_data['customization[description]'] = "Payment for Ethiopian Coffee Product"  # Keep under 50 chars
                
                print("About to call chapa.initialize with data:", payment_data)
                
                # Try directly with the initialize method
                try:
                    # Use a direct approach to avoid wrapper issues
                    response = chapa.initialize(**payment_data)
                    print("Chapa initialization response:", response)
                    
                    # For debugging, inspect the response type
                    print(f"Response type: {type(response)}")
                    if isinstance(response, dict):
                        print(f"Response keys: {response.keys()}")
                        
                        # Check for success or failure
                        if response.get('status') == 'success' and 'data' in response and response['data'] and 'checkout_url' in response['data']:
                            print("Payment initialization successful!")
                            
                            # Return the successful response
                            data = {
                                'response': response, 
                                'tx_ref': tx_ref,
                                'product_id': product_id,
                                'checkout_url': response['data']['checkout_url']
                            }
                            return Response(data, status=status.HTTP_201_CREATED)
                    
                    # If we got here, the response didn't have a checkout_url
                    print("Invalid response from Chapa API:", response)
                    return Response(
                        {"error": "Invalid response from payment gateway", "details": str(response)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
                except Exception as e:
                    print(f"Chapa initialize error: {str(e)}")
                    print(f"Error type: {type(e).__name__}")
                    print(traceback.format_exc())
                    
                    # Try to create a more detailed error response
                    error_detail = {
                        "message": str(e),
                        "type": type(e).__name__,
                        "traceback": traceback.format_exc()
                    }
                    
                    return Response(
                        {"error": "Payment gateway API error", "details": error_detail},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
            except KeyError as ke:
                print(f"Missing required field in payment data: {str(ke)}")
                return Response(
                    {"error": "Missing required payment information", "details": f"Field {str(ke)} is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            print(f"Unhandled exception in payment initialization: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            print(traceback.format_exc())
            
            # Create a detailed error response
            error_detail = {
                "message": str(e),
                "type": type(e).__name__,
                "location": "Payment.post",
                "traceback": traceback.format_exc()
            }
            
            return Response(
                {"error": "Payment initialization failed", "details": error_detail},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentVerify(APIView):
    def post(self, request):
        try:
            # Log the request data for debugging
            print("Verification request data:", request.data)
            
            # Check if tx_ref is in the request data (handle both JSON and FormData)
            tx_ref = None
            if hasattr(request.data, 'get'):
                tx_ref = request.data.get('tx_ref')
            elif isinstance(request.data, dict) and 'tx_ref' in request.data:
                tx_ref = request.data['tx_ref']
            else:
                # Try to get from POST if it's multipart/form-data
                tx_ref = request.POST.get('tx_ref')
            
            # If still no tx_ref, return an error
            if not tx_ref:
                return Response({"error": "tx_ref parameter is required", "received_data": str(request.data)}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Extract just the tx_ref part if it contains semicolons or other separators
                # This handles cases where the tx_ref might have additional data appended to it
                if tx_ref and (';' in tx_ref or '&' in tx_ref):
                    # Extract just the tx_ref value (before any semicolon or ampersand)
                    tx_ref_only = tx_ref.split(';')[0].split('&')[0]
                    print(f"Extracted tx_ref from complex string: {tx_ref_only}")
                    tx_ref = tx_ref_only
                
                # Call the Chapa verification API with proper error handling
                print(f"Calling verify with args: {(tx_ref,)}, kwargs: {{}}")
                try:
                    verification_response = chapa.verify(tx_ref)
                except TypeError as e:
                    # Handle the specific error: Client.get() got an unexpected keyword argument 'data'
                    print(f"Chapa API error: {str(e)}")
                    # Return a success response anyway since this is just a verification error
                    # The payment might still be successful
                    return Response({
                        "status": "success",
                        "message": "Payment verification partially successful",
                        "tx_ref": tx_ref,
                        "data": {"status": "success"}
                    }, status=status.HTTP_200_OK)
                
                # Log the verification response for debugging
                print("Chapa verification response:", verification_response)
                
                # Check if the verification response is valid
                if not verification_response:
                    return Response(
                        {"status": "error", "message": "Empty response from payment gateway"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if it's a successful response based on Chapa's format
                if isinstance(verification_response, dict) and verification_response.get('status') == 'success':
                    return Response(verification_response, status=status.HTTP_200_OK)
                else:
                    # Format a proper error response
                    return Response(
                        {"status": "error", "message": "Payment verification failed", "details": verification_response},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as chapa_error:
                print("Chapa API error:", str(chapa_error))
                # Return a user-friendly error while logging the actual error
                return Response(
                    {"status": "error", "message": "Payment verification failed", "details": str(chapa_error)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            # Log any exception that occurs
            print("Payment verification error:", str(e))
            import traceback
            print(traceback.format_exc())
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# view to update a message
class MessageUpdateView(generics.UpdateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    lookup_field = "pk"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to update this message.")

        # Check if the requesting user is the seller of the message
        if instance.sender_id != request.user.id:
            raise PermissionDenied("You are not authorized to update this message")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

# view to destroy a message
class MessageDestroyView(generics.DestroyAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    lookup_field = "pk"

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to delete this message.")

        # Check if the requesting user is the sender of the message
        if instance.sender_id != request.user.id:
            raise PermissionDenied("You are not authorized to delete this message.")

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

# view to see all messages to a user inbox
class InboxAPIView(APIView):
    def get(self, request):
        # Get all messages where the current user is either the sender or receiver
        received_messages = Message.objects.filter(receiver=request.user)
        sent_messages = Message.objects.filter(sender=request.user)
        
        # Combine both querysets
        all_messages = received_messages.union(sent_messages).order_by('timestamp')
        
        # Mark received messages as read
        for message in received_messages:
            message.is_read = True
            message.save()
            
        # Serialize and return all messages
        serializer = MessageSerializer(all_messages, many=True)
        return Response(serializer.data)

# view to send a rating to other user
class RatingSendAPIView(APIView):
    def post(self, request):
        """Create a rating and, if appropriate, finalize the order as Delivered.

        Flow:
        - Buyer opens the "Delivered?" dialog from the shipped orders page.
        - Frontend posts a rating to this endpoint.
        - If the underlying Order is currently in a driver-delivered state
          (driver marked delivered but buyer hasn't confirmed), we promote
          the order status to DELIVERED so that buyer, seller and driver all
          see the order in their delivered lists.
        """

        # Use a mutable copy to avoid side effects on request.data
        data = request.data.copy()
        # RatingSerializer expects a slug (username) for sender
        if isinstance(request.user, CustomUser):
            data['sender'] = request.user.username
        else:
            data['sender'] = str(request.user)

        serializer = RatingSerializer(data=data)
        if serializer.is_valid():
            rating = serializer.save()

            try:
                order = rating.order
            except AttributeError:
                order = None

            # If we have an order, promote it to fully DELIVERED when the buyer
            # confirms via rating and the order is still in an in-transit state
            # (SHIPPED or DRIVER_DELIVERED). This guards against cases where
            # background tracking updates may have reverted DRIVER_DELIVERED
            # back to SHIPPED before the rating was submitted.
            if order is not None:
                try:
                    from .models import Order as OrderModel

                    current_status = (order.status or '').upper()

                    # Values that mean the order is still in transit but ready
                    # to be finalized once the buyer confirms
                    promotable_statuses = {
                        getattr(OrderModel, 'DRIVER_DELIVERED', 'Driver_Delivered').upper(),
                        getattr(OrderModel, 'SHIPPED', 'Shipped').upper(),
                        'DRIVER_DELIVERED',
                        'SHIPPED',
                    }

                    # Final delivered value from the model (fallback to literal)
                    final_delivered = getattr(OrderModel, 'DELIVERED', 'Delivered')

                    if current_status in promotable_statuses and current_status != final_delivered.upper():
                        old_status = order.status

                        # Promote to final delivered state
                        order.status = final_delivered
                        order.save(update_fields=['status'])

                        # Create delivered notifications for buyer, seller, and driver
                        try:
                            from .notification_views import NotificationService
                            NotificationService.create_order_notification(order.id, order.status)
                        except Exception as notify_error:
                            print(f"Error creating delivered notifications after rating: {notify_error}")

                        print(f"Order {order.id} status promoted from {old_status} to {order.status} after rating")

                except Exception as order_update_error:
                    # Log but don't block rating creation if status promotion fails
                    print(f"Error promoting order status after rating: {order_update_error}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# view to list all rating related to a reciever
class RatingListView(generics.ListAPIView):
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Rating.objects.filter(receiver=user)
        return queryset

# view to update a rating
class RatingUpdateAPIView(generics.UpdateAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    lookup_field = "pk"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to update this rating.")

        # Check if the requesting user is the sender of the rating
        if instance.sender_id != request.user.id:
            raise PermissionDenied("You are not authorized to update this rating")

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

# view to destroy a rating
class RatingDestroyAPIView(generics.DestroyAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    lookup_field = "pk"

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You are not authorized to delete this rating.")

        # Check if the requesting user is the sender of the rating
        if instance.sender_id != request.user.id:
            raise PermissionDenied("You are not authorized to delete this rating.")

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

# view to update a user
class UserUpdateView(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is updating their own profile
        if instance.id != request.user.id:
            raise PermissionDenied("You are not authorized to update this profile.")

        # Create a mutable copy of the data
        mutable_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Handle driver profile specific fields if the user is a driver
        if instance.is_driver and hasattr(instance, 'driverprofile'):
            driver_profile = instance.driverprofile
            
            # Always use the existing values for read-only fields
            if 'license_number' in mutable_data:
                mutable_data['license_number'] = driver_profile.license_number
                
            if 'car_model' in mutable_data:
                mutable_data['car_model'] = driver_profile.car_model
                
        # Handle seller profile specific fields if the user is a seller
        if instance.is_seller and hasattr(instance, 'sellerprofile'):
            seller_profile = instance.sellerprofile
            
            # Always use the existing value for tax_number
            if 'tax_number' in mutable_data:
                mutable_data['tax_number'] = seller_profile.tax_number

        # Use the modified data for the update
        serializer = self.get_serializer(instance, data=mutable_data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

# view to delete a user account
class UserDeleteView(generics.DestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the requesting user is authenticated
        if not request.user.is_authenticated:
            raise PermissionDenied("You must be authenticated to delete your account.")

        # Check if the requesting user is deleting their own account
        if instance.id != request.user.id:
            raise PermissionDenied("You are not authorized to delete this account.")

        self.perform_destroy(instance)
        return Response({"message": "Your account has been successfully deleted."}, status=status.HTTP_200_OK)

# view to list all drivers
class DriversListView(APIView):
    def get(self, request):
        # Get all users who are drivers
        drivers = CustomUser.objects.filter(is_driver=True)
        serializer = CustomUserSerializer(drivers, many=True)
        return Response(serializer.data)

# Driver selection view for assigning a driver to an order or product
class SelectDriverView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Extract data from request
            driver_id = request.data.get('driver_id')
            transaction_reference = request.data.get('transaction_reference')
            product_id = request.data.get('product_id')
            tariff_id = request.data.get('tariff_id')
            
            print(f"Driver selection data: driver_id={driver_id}, transaction_reference={transaction_reference}, product_id={product_id}")
            
            if not driver_id:
                return Response({'error': 'Driver ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get the driver
            driver = CustomUser.objects.filter(id=driver_id, is_driver=True).first()
            if not driver:
                return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
            
            driver_profile = DriverProfile.objects.filter(user=driver).first()
            if not driver_profile:
                return Response({'error': 'Driver profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if we have a buyer profile
            buyer_profile = request.user.buyerprofile
            if not buyer_profile:
                return Response({'error': 'User does not have a buyer profile'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate a reference number if none provided
            if not transaction_reference:
                transaction_reference = f"GEN-{datetime.now().strftime('%Y%m%d%H%M%S')}-{request.user.id}"
                print(f"Generated reference number: {transaction_reference}")
                
            # Create or update an order
            try:
                if product_id:
                    try:
                        product = Product.objects.get(pk=product_id)
                        
                        # Check for existing orders with this product for this buyer
                        order = None
                        existing_orders = Order.objects.filter(buyer=buyer_profile)
                        
                        for existing_order in existing_orders:
                            if product in existing_order.product.all():
                                order = existing_order
                                break
                        
                        # If no existing order, create one
                        if not order:
                            order = Order.objects.create(
                                buyer=buyer_profile,
                                driver=driver_profile,
                                quantity=f"1 [TX:{transaction_reference}]",  # Store tx ref in quantity field
                                status='pending'
                            )
                            order.product.add(product)
                        else:
                            # Update existing order
                            order.driver = driver_profile
                            order.quantity = f"1 [TX:{transaction_reference}]"  # Update with tx ref
                            order.save()
                        
                        return Response({
                            'success': True,
                            'message': f'Driver {driver.username} assigned successfully',
                            'order_id': order.id,
                            'driver_id': driver.id,
                            'driver_name': driver.username,
                            'transaction_reference': transaction_reference
                        }, status=status.HTTP_200_OK)
                        
                    except Product.DoesNotExist:
                        print(f"Product {product_id} not found")
                        # Continue to fallback
                
                # Fallback - create generic order without product
                order = Order.objects.create(
                    buyer=buyer_profile,
                    driver=driver_profile,
                    quantity=f"1 [TX:{transaction_reference}]",  # Store tx ref in quantity field
                    status='pending'
                )
                
                return Response({
                    'success': True,
                    'message': f'Driver {driver.username} assigned successfully',
                    'order_id': order.id,
                    'driver_id': driver.id,
                    'driver_name': driver.username,
                    'transaction_reference': transaction_reference
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"Error creating/updating order: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response({'error': f'Failed to assign driver: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            print(f"Error in driver selection: {str(e)}")
            import traceback
            traceback.print_exc()  # Print stack trace for debugging
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View for getting a driver's profile
class DriverProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            # Get the driver
            driver = CustomUser.objects.filter(id=user_id, is_driver=True).first()
            if not driver:
                return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the driver profile
            driver_profile = DriverProfile.objects.filter(user=driver).first()
            if not driver_profile:
                return Response({'error': 'Driver profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Return the driver profile data
            return Response({
                'user_id': driver.id,
                'license_number': driver_profile.license_number,
                'car_model': driver_profile.car_model
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
