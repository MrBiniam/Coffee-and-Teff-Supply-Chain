from django.contrib import admin
from .models import CustomUser, BuyerProfile, SellerProfile, DriverProfile, Product, Order
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(BuyerProfile)
admin.site.register(SellerProfile)
admin.site.register(DriverProfile)
admin.site.register(Product)
admin.site.register(Order)