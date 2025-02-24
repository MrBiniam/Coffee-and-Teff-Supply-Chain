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
    image = models.ImageField(upload_to='Products/', null=True, blank=True)
    product_type = models.CharField(max_length=200)

# Model for Order
class Order(models.Model):
    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE)
    driver = models.ForeignKey(DriverProfile, on_delete=models.SET_NULL, null=True, blank=True)
    PENDING = "Pending"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (SHIPPED, 'Shipped'),
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