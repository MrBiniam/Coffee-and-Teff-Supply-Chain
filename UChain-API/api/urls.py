from django.urls import path, include
from . import views
from . import views_tracking
from django.conf import settings
from django.conf.urls.static import static

# Defining url patterns
urlpatterns = [
    path('', views.home, name='home'),  # Use the function-based view here
    # Endpoints related to users
    path("buyer/register", views.BuyerCreateView.as_view(), name="buyer-create-view"),
    path("seller/register", views.SellerCreateView.as_view(), name="seller-create-view"),
    path("driver/register", views.DriverCreateView.as_view(), name="driver-create-view"),
    path("user/login", views.UserLoginView.as_view(), name="user-login-view"),
    path("user/<int:pk>", views.UserRetrieveView.as_view(), name="user-retrieve-view"),
    path("user/update/<int:pk>", views.UserUpdateView.as_view(), name="user-update-view"),
    path("user/delete/<int:pk>", views.UserDeleteView.as_view(), name="user-delete-view"),
    path("seller/<int:pk>", views.SellerRetrieveView.as_view(), name="seller-retrieve-view"),
    path("driver/<int:pk>", views.DriverRetrieveView.as_view(), name="driver-retrieve-view"),
    path("user/drivers", views.DriversListView.as_view(), name="drivers-list-view"),

    # Endpoints related to order
    path("order/create", views.OrderCreateView.as_view(), name="order-create-api-view"),
    path("orders", views.OrderListView.as_view(), name="order-list-view"),
    path("order/<int:pk>", views.OrderRetrieveView.as_view(), name="order-retrieve-view"),
    path("order/<int:pk>/update", views.OrderUpdateView.as_view(), name="order-update-view"),
    path("order/<int:pk>/destroy", views.OrderDestroyView.as_view(), name="order-destroy-view"),

    # Endpoint related to messages
    path('send/', views.SendMessageAPIView.as_view(), name='send-message-api-view'),
    path('inbox/', views.InboxAPIView.as_view(), name='inbox-api-view'),
    path("message/<int:pk>/update", views.MessageUpdateView.as_view(), name="message-update-view"),
    path("message/<int:pk>/destroy", views.MessageDestroyView.as_view(), name="message-destroy-view"),

    # Endpoints related to payment
    path('pay/', views.Payment.as_view(), name='pay'),
    path('verify/', views.PaymentVerify.as_view(), name='verify'),
    path('payment/diagnostic', views.PaymentDiagnostic.as_view(), name='payment-diagnostic-view'),

    # Endpoint related to rating
    path('ratings/', views.RatingListView.as_view(), name='rating-list-view'),
    path('rate/', views.RatingSendAPIView.as_view(), name='send-rating-api-view'),
    path('rate/<int:pk>/update', views.RatingUpdateAPIView.as_view(), name='update-rating-api-view'),
    path('rate/<int:pk>/destroy', views.RatingDestroyAPIView.as_view(), name='destroy-rating-api-view'),

    # Endpoints related to product
    path("products", views.ProductListView.as_view(), name="product-list-create-view"),
    path("product/create", views.ProductCreateView.as_view(), name="product-create-view"),
    path("product/<int:pk>", views.ProductRetrieveView.as_view(), name="product-retrieve-view"),
    path("product/<int:pk>/update", views.ProductUpdateView.as_view(), name="product-update-view"),
    path("product/<int:pk>/destroy", views.ProductDestroyView.as_view(), name="product-destroy-view"),
    
    # Driver selection endpoint
    path("select-driver/", views.SelectDriverView.as_view(), name="select-driver-view"),
    path("driver-profile/<str:user_id>/", views.DriverProfileView.as_view(), name="driver-profile-view"),
    
    # Tracking endpoints
    path("api/tracking/update-location", views_tracking.UpdateTrackingLocationView.as_view(), name="update-tracking-location"),
    path("api/tracking/location/<str:order_id>", views_tracking.GetOrderLocationView.as_view(), name="get-order-location"),
    path("api/tracking/history/<str:order_id>", views_tracking.GetTrackingHistoryView.as_view(), name="get-tracking-history"),
    path("api/tracking/status/<str:order_id>", views_tracking.UpdateOrderStatusView.as_view(), name="update-order-status")
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
