from rest_framework import serializers
from .models import CustomUser, BuyerProfile, SellerProfile, DriverProfile, Product, Order, Message, Rating
from django.contrib.auth.hashers import make_password

# Base User Serializer to register a user
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', "password", 'email', 'phone_number', 'is_buyer', 'is_seller', 'is_driver', "address", "registration_date", "payment_method", "account_number", "profile_image"]

    # Perform password Hashing when saved to the database
    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data.get("password"))
        return super().create(validated_data)

# Serializer for Buyer Profile
class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ['user']  # Include fields from BuyerProfile

# Serializer for Seller Profile
class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['user', "tax_number"]  # Include fields from SellerProfile

# Serializer for Driver Profile
class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = ['user', 'license_number', "car_model"]  # Include fields from DriverProfile

# Serializer for Product
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity',"product_type", 'image']
        read_only_fields = ['seller']  # Exclude 'seller' from writable fields

    def create(self, validated_data):
        # Getting authenticated user's profile
        seller_profile = self.context['request'].user.sellerprofile
        validated_data['seller'] = seller_profile
        return super().create(validated_data)
    
# serializer for Order
class OrderSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    quantity = serializers.CharField()
    status = serializers.CharField(required=False)
    order_date = serializers.DateTimeField(required=False)
    product = ProductSerializer(read_only=True, many=True)
    driver = serializers.PrimaryKeyRelatedField(queryset=DriverProfile.objects.all(), required=True)

    class Meta:
        model = Order
        fields = ["id", "quantity", "status", "order_date", "product", "driver"]
        read_only_fields = ["buyer"]
    
    def create(self, validated_data): 
        products = self.initial_data['product']
        validated_data["buyer"] = self.context['request'].user.buyerprofile
        productInstances = []
        
        for product in products:
            productInstances.append(Product.objects.get(pk = product['id']))
        order = Order.objects.create(**validated_data)
        order.product.set(productInstances)
        return order

# Serializer for Message
class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(many=False, slug_field='username', queryset=CustomUser.objects.all())
    receiver = serializers.SlugRelatedField(many=False, slug_field='username', queryset=CustomUser.objects.all())

    class Meta:
        model = Message
        fields = ["id",'sender', 'receiver', 'content', 'timestamp',"is_read"]

# serializer for Rating
class RatingSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(many=False, slug_field='username', queryset=CustomUser.objects.all())
    receiver = serializers.SlugRelatedField(many=False, slug_field='username', queryset=CustomUser.objects.all())
    order = serializers.PrimaryKeyRelatedField(many=False, queryset=Order.objects.all())
    class Meta:
        model = Rating
        fields = ["id",'sender', 'receiver', 'rating_value', 'timestamp',"comment", "order"]
