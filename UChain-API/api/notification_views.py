from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, CustomUser, Order
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for the current user only"""
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Return count of unread notifications"""
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"count": count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(recipient=request.user).update(is_read=True)
        return Response({"status": "success"})
        
class NotificationService:
    """Service for creating notifications"""
    
    @staticmethod
    def create_notification(recipient_id, notification_type, message, related_order_id=None, sender_name=None):
        """Create a new notification"""
        try:
            recipient = CustomUser.objects.get(id=recipient_id)
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type=notification_type,
                message=message,
                related_order_id=related_order_id,
                sender_name=sender_name
            )
            return notification
        except CustomUser.DoesNotExist:
            return None
    
    @staticmethod
    def create_order_notification(order_id, status):
        """Create notifications based on order status changes"""
        try:
            order = Order.objects.get(id=order_id)
            
            # Get the associated product (first one)
            product = order.product.first()
            if not product:
                return False
                
            if status.lower() == 'pending':
                # Notify seller when buyer places order
                seller_user = product.seller.user
                NotificationService.create_notification(
                    recipient_id=seller_user.id,
                    notification_type='order_placed',
                    message=f"{order.buyer.user.username} ordered {product.name}",
                    related_order_id=order.id,
                    sender_name=order.buyer.user.username
                )
                
            elif status.lower() == 'accepted':
                # Notify buyer when seller accepts order
                NotificationService.create_notification(
                    recipient_id=order.buyer.user.id,
                    notification_type='order_accepted',
                    message=f"Your order for {product.name} has been accepted",
                    related_order_id=order.id,
                    sender_name=product.seller.user.username
                )
                
                # If driver assigned, notify driver
                if order.driver:
                    NotificationService.create_notification(
                        recipient_id=order.driver.user.id,
                        notification_type='driver_assigned',
                        message=f"You've been assigned to deliver {product.name}",
                        related_order_id=order.id,
                        sender_name=product.seller.user.username
                    )
                    
            elif status.lower() in ['shipped', 'on_route']:
                # Notify buyer that order is shipped
                NotificationService.create_notification(
                    recipient_id=order.buyer.user.id,
                    notification_type='order_shipped',
                    message=f"Your order for {product.name} is on the way",
                    related_order_id=order.id,
                    sender_name=order.driver.user.username if order.driver else "System"
                )
                
                # Notify seller that order is shipped
                NotificationService.create_notification(
                    recipient_id=product.seller.user.id,
                    notification_type='order_shipped',
                    message=f"Your {product.name} order has been shipped",
                    related_order_id=order.id,
                    sender_name=order.driver.user.username if order.driver else "System"
                )
                
            elif status.lower() == 'delivered':
                # Notify buyer that order is delivered
                NotificationService.create_notification(
                    recipient_id=order.buyer.user.id,
                    notification_type='order_delivered',
                    message=f"Your order for {product.name} has been delivered",
                    related_order_id=order.id,
                    sender_name=order.driver.user.username if order.driver else "System"
                )
                
                # Notify seller that order is delivered
                NotificationService.create_notification(
                    recipient_id=product.seller.user.id,
                    notification_type='order_delivered',
                    message=f"The {product.name} order has been delivered",
                    related_order_id=order.id,
                    sender_name=order.driver.user.username if order.driver else "System"
                )
                
                # Send payment notification to seller
                NotificationService.create_notification(
                    recipient_id=product.seller.user.id,
                    notification_type='payment_received',
                    message=f"Your payment for {product.name} is also done",
                    related_order_id=order.id,
                    sender_name="System"
                )
                
                # Notify driver that order is delivered (if there is a driver)
                if order.driver:
                    NotificationService.create_notification(
                        recipient_id=order.driver.user.id,
                        notification_type='order_delivered',
                        message=f"You've successfully delivered {product.name}",
                        related_order_id=order.id,
                        sender_name="System"
                    )
                    
                    # Send payment notification to driver
                    NotificationService.create_notification(
                        recipient_id=order.driver.user.id,
                        notification_type='payment_received',
                        message=f"Your payment for delivering {product.name} is also done",
                        related_order_id=order.id,
                        sender_name="System"
                    )
                
            return True
            
        except Order.DoesNotExist:
            return False

    @staticmethod
    def create_new_product_notification(product):
        """Create notifications for all buyers when a new product is added"""
        try:
            # Get all users who are buyers
            buyers = CustomUser.objects.filter(is_buyer=True)
            
            product_type = product.product_type if hasattr(product, 'product_type') and product.product_type else "product"
            product_name = product.name if hasattr(product, 'name') and product.name else "Product"
            
            # Create a notification for each buyer
            for buyer in buyers:
                message = f"New {product_type} available: {product_name}"
                Notification.objects.create(
                    recipient=buyer,
                    notification_type='new_product',
                    message=message,
                    sender_name=product.seller.user.username if hasattr(product, 'seller') and product.seller else "A seller"
                )
            
            print(f"Created notifications for {len(buyers)} buyers about new product: {product_name}")
            return True
        except Exception as e:
            print(f"Error creating new product notifications: {str(e)}")
            return False
