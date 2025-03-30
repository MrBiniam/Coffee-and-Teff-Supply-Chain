from rest_framework import serializers
from .models import CustomUser, BuyerProfile, SellerProfile, DriverProfile, Product, Order, Message, Rating
from django.contrib.auth.hashers import make_password

# Base User Serializer to register a user
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', "password", 'email', 'phone_number', 'is_buyer', 'is_seller', 'is_driver', "address", "registration_date", "payment_method", "account_number", "profile_image"]
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_image': {'required': False}
        }

    # Perform password Hashing when saved to the database
    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data.get("password"))
        
        # Handle potential issues with profile_image
        if 'profile_image' in validated_data and validated_data['profile_image'] is None:
            validated_data.pop('profile_image')
        
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
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity', 'product_type', 'image', 'seller']
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
    driver = serializers.PrimaryKeyRelatedField(queryset=DriverProfile.objects.all(), required=False)
    buyer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = ["id", "quantity", "status", "order_date", "product", "driver", "buyer"]
        read_only_fields = ["buyer"]
    
    def create(self, validated_data): 
        products = self.initial_data['product']
        
        # Try to get buyer from the authenticated user
        try:
            validated_data["buyer"] = self.context['request'].user.buyerprofile
        except Exception as e:
            print(f"Error setting buyer from authenticated user: {str(e)}")
            # If buyer was explicitly provided in the request, try to use it
            if 'buyer' in self.initial_data:
                try:
                    buyer_id = self.initial_data['buyer']
                    from .models import BuyerProfile
                    validated_data["buyer"] = BuyerProfile.objects.get(pk=buyer_id)
                    print(f"Using buyer ID from request: {buyer_id}")
                except Exception as e:
                    print(f"Error using provided buyer ID: {str(e)}")
                    raise serializers.ValidationError(f"Cannot create order: no valid buyer profile found")
            else:
                raise serializers.ValidationError(f"Cannot create order: user has no buyer profile")
        
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
