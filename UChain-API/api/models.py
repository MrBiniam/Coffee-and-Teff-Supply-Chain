from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

# Base user model
class CustomUser(AbstractUser):
    # Add fields common to all user types
    phone_number = models.CharField(max_length=15)
    address = models.CharField(max_length=200)
    registration_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    is_buyer = models.BooleanField(default=False)
    is_seller = models.BooleanField(default=False)
    is_driver = models.BooleanField(default=False)


class BaseProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    class Meta:
        abstract = True  # Set abstract to True to prevent Django from creating a table for this model

# Profile for buyer inherited from Base User
class BuyerProfile(BaseProfile):
    pass

# Profile for seller inherited from Base User
class SellerProfile(BaseProfile):
    tax_number = models.CharField(max_length=100)

# Profile for driver inherited from Baser User
class DriverProfile(BaseProfile):
    license_number = models.CharField(max_length=100)
    car_model = models.CharField(max_length=100)

# Model for Product
class Product(models.Model):
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    quantity = models.CharField(max_length=100)
    image = models.ImageField(upload_to='Products_Pictures/', null=True, blank=True)
    product_type = models.CharField(max_length=200)

# Model for Order
class Order(models.Model):
    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE)
    driver = models.ForeignKey(DriverProfile, on_delete=models.SET_NULL, null=True, blank=True)
    
    PENDING = "Pending"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    DRIVER_DELIVERED = "Driver_Delivered"
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (SHIPPED, 'Shipped'),
        (DRIVER_DELIVERED, 'Delivered by Driver'),
        (DELIVERED, 'Delivered')
    ]
    quantity = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    order_date = models.DateTimeField(auto_now_add=True)
    product = models.ManyToManyField(Product)

# Model for Message
class Message(models.Model):
    sender = models.ForeignKey(CustomUser, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomUser, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender} to {self.reciever} - {self.timestamp}"

# Model for Rating
class Rating(models.Model):
    rating_value = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)])
    comment = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    sender = models.ForeignKey(CustomUser, related_name="sent_ratings",on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomUser, related_name="received_ratings", on_delete=models.CASCADE)
    order = models.ForeignKey(Order, related_name="ratings", on_delete=models.CASCADE)

    def __str__(self):
        return f"Rating {self.rating_value} from {self.sender.username} to {self.receiver.username}"

# Model for tracking order location
class TrackingLocation(models.Model):
    order = models.ForeignKey(Order, related_name='tracking_locations', on_delete=models.CASCADE)
    driver = models.ForeignKey(CustomUser, related_name='tracking_locations', on_delete=models.CASCADE)
    latitude = models.DecimalField(max_digits=9, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return f"Tracking for Order {self.order.id} at {self.timestamp}"
    
    class Meta:
        ordering = ['-timestamp']  # Most recent first

# Model to store route information for deliveries
class DeliveryRoute(models.Model):
    """Model to store route information for deliveries"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='routes')
    driver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='routes')
    
    # Starting point
    start_latitude = models.FloatField()
    start_longitude = models.FloatField()
    start_address = models.CharField(max_length=255, null=True, blank=True)
    
    # Destination point
    end_latitude = models.FloatField()
    end_longitude = models.FloatField()
    end_address = models.CharField(max_length=255, null=True, blank=True)
    
    # Route details
    route_geometry = models.JSONField(null=True, blank=True)  # Store the GeoJSON route
    distance_km = models.FloatField(null=True, blank=True)  # Distance in kilometers
    estimated_time_min = models.IntegerField(null=True, blank=True)  # Estimated time in minutes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Route for Order {self.order.id} by {self.driver.username}"


# Model for storing notifications
class Notification(models.Model):
    """Model to store user notifications for various events"""
    
    NOTIFICATION_TYPES = [
        ('order_placed', 'Order Placed'),
        ('order_accepted', 'Order Accepted'),
        ('driver_assigned', 'Driver Assigned'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
    ]
    
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.CharField(max_length=255)
    related_order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    sender_name = models.CharField(max_length=100, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.message}"