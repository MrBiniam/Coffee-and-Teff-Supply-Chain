from django.db import models
from django.utils import timezone
from .models import CustomUser, Order

class Notification(models.Model):
    """Model to store user notifications for various events"""
    
    NOTIFICATION_TYPES = [
        ('order_placed', 'Order Placed'),
        ('order_accepted', 'Order Accepted'),
        ('driver_assigned', 'Driver Assigned'),
        ('order_shipped', 'Order Shipped'),
        ('order_delivered', 'Order Delivered'),
        ('message_received', 'Message Received'),
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
