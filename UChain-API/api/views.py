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
from chapa import Chapa
from datetime import datetime

# Replace 'your_secret_key' with your actual Chapa secret key
chapa = Chapa('CHASECK_TEST-YPSr0j8iNMFJg2a1SsN9exvQJq6CkoHM')
# View to create a buyer user
class BuyerCreateView(APIView):
    def post(self, request):
        user_serializer = CustomUserSerializer(data=request.data)
        if user_serializer.is_valid():
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
                return Response(buyer_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# View for Login a user
class UserLoginView(APIView):
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if username is None and password is None:
            return Response({"error": "Please provide both username and password"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        user_serializer = CustomUserSerializer(user)
        if not user:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        token, created = Token.objects.get_or_create(user=user)
        return Response({"status": "successful", "token": token.key, "user": user_serializer.data}, status=status.HTTP_201_CREATED)

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
class SellerCreateView(APIView):
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
class DriverCreateView(APIView):
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
        serializer.save(seller=self.request.user.sellerprofile)

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
        serializer.save(buyer=self.request.user.buyerprofile)

# view to send a message
class SendMessageAPIView(APIView):
    def post(self, request):
        request.data['sender'] = request.user
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            # Assuming sender is the current authenticated user
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class Payment(APIView):
    def post(self, request):
        # Get the current date and time
        now = datetime.now()
        # Format the date and time
        tx_ref = 'tx_uchainappsmartsupplychainmanagementpaytxref' + now.strftime("%Y%m%d%H%M%S")
        response = chapa.initialize(
            email=request.data['email'],
            amount=request.data['amount'],
            first_name=request.data['first_name'],
            last_name=request.data['last_name'],
            tx_ref=tx_ref,
            callback_url="https://yourcallback.url/here"
        )
        data = {'response': response, 'tx_ref': tx_ref}
        return Response(data, status=status.HTTP_201_CREATED)
    
class PaymentVerify(APIView):
    def post(self,request):
        verification_response = chapa.verify(request.data['tx_ref'])
        return Response(verification_response, ststaus=status.HTTP_200_OK)
    
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
        # Get all messages where the current user is the recipient
        messages = Message.objects.filter(receiver=request.user)
        serializer = MessageSerializer(messages, many=True)
        for message in messages:
            message.is_read = True
            message.save()
        return Response(serializer.data)

# view to send a rating to other user
class RatingSendAPIView(APIView):
    def post(self, request):
        request.data['sender'] = request.user
        serializer = RatingSerializer(data=request.data)
        if serializer.is_valid():
            # Assuming sender is the current authenticated user
            serializer.save()
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
            raise PermissionDenied("You must be authenticated to delete this rating.")

        # Check if the requesting user is the sender of the rating
        if instance.sender_id != request.user.id:
            raise PermissionDenied("You are not authorized to delete this rating.")

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)