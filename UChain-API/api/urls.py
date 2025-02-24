from django.urls import path
from . import views

# Defining url patterns
urlpatterns = [
    # Endpoints related to users
    path("buyer/register", views.BuyerCreateView.as_view(), name="buyer-create-view"),
    path("seller/register", views.SellerCreateView.as_view(), name="seller-create-view"),
    path("driver/register", views.DriverCreateView.as_view(), name="driver-create-view"),
    path("user/login", views.UserLoginView.as_view(), name="user-login-view"),
    path("user/<int:pk>", views.UserRetrieveView.as_view(), name="user-retrieve-view"),
    path("seller/<int:pk>", views.SellerRetrieveView.as_view(), name="seller-retrieve-view"),
    path("driver/<int:pk>", views.DriverRetrieveView.as_view(), name="driver-retrieve-view"),

    # Endpoints related to order
    path("order/create", views.OrderCreateView.as_view(), name="order-create-api-view"),

    # Endpoint related to messages
    path('send/', views.SendMessageAPIView.as_view(), name='send-message-api-view'),
    path('inbox/', views.InboxAPIView.as_view(), name='inbox-api-view'),
    path("message/<int:pk>/update", views.MessageUpdateView.as_view(), name="message-update-view"),
    path("message/<int:pk>/destroy", views.MessageDestroyView.as_view(), name="message-destroy-view"),

    #Endpoints related to payment
    path('pay/', views.Payment.as_view(), name='pay'),
    path('verify/', views.PaymentVerify.as_view(), name='verify'),

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
    path("product/<int:pk>/destroy", views.ProductDestroyView.as_view(), name="product-destroy-view")
]