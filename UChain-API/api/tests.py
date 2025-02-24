from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from io import BytesIO
from .models import Buyer, Seller, Driver
from .serializers import BuyerSerializer, SellerSerializer, DriverSerializer
from datetime import datetime
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile
import base64
import os
class BuyerCreateRetrieveUpdateDestroyViewTest(APITestCase):
    def setUp(self):

        self.buyer = Buyer.objects.create(username="testuser", password="testpassword", full_name="Test User", phone_number="1234567890", address="123 Test St", payment_method="Credit Card", profile_image=SimpleUploadedFile("test_image1.jpg", open("media/buyers/profile_images/27401789449_97c3fa3d99_c.jpg", "rb").read(), content_type="image/jpeg"))


        self.seller = Seller.objects.create(username="sample_user", password="sample_password", full_name="Sample Seller", phone_number="1234567890", address="123 Sample St", registration_date=datetime.now(), account_number="123456789", rating_value=4.5, tax_number="ABC123456", profile_image=SimpleUploadedFile("test_image2.jpg", open("media/buyers/profile_images/27401789449_97c3fa3d99_c.jpg", "rb").read(), content_type="image/jpeg"))


        self.driver = Driver.objects.create(username="sample_user", password="sample_password", full_name="Sample Seller", phone_number="1234567890", address="123 Sample St", registration_date=datetime.now(), account_number="123456789", rating_value=4.5, license_number="ABC123456", car_model="Toyota Camry", profile_image=SimpleUploadedFile("test_image3.jpg", open("media/buyers/profile_images/27401789449_97c3fa3d99_c.jpg", "rb").read(), content_type="image/jpeg"))


    def test_create_buyer(self):
        sample = {
            "username": "testuser",
            "password": "testpassword",
            "full_name": "Test User",
            "phone_number": "1234567890",
            "address": "123 Test St",
            "payment_method": "Credit Card"
        }
        sample["profile_image"] = SimpleUploadedFile("test_image.jpg", open("media/buyers/profile_images/27401789449_97c3fa3d99_c.jpg", "rb").read(), content_type="image/jpeg")
        url = reverse("buyer-create-view")
        response = self.client.post(url, sample, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Buyer.objects.count(), 2)

    def test_retrieve_buyer(self):
        buyer = Buyer.objects.create(username="testuser", password="testpassword", full_name="Test User", phone_number="1234567890", address="123 Test St", payment_method="Credit Card")
        url = reverse("buyer-update-destroy-view", kwargs={"pk": buyer.pk})
        response = self.client.get(url)
        serializer = BuyerSerializer(instance=buyer)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    # Write test for buyer
    def test_update_buyer(self):
        url = reverse("buyer-update-destroy-view", args=[self.buyer.userId])
        updated_data = {
            "username": "updateduser",
            "full_name": "Updated User",
            "password": "newpassword",  # Include required fields
            "phone_number": "1234567890",
            "address": "123 Test St",
            "payment_method": "Credit Card",
        }
        response = self.client.put(url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.buyer.refresh_from_db()
        self.assertEqual(self.buyer.username, "updateduser")
        self.assertEqual(self.buyer.full_name, "Updated User")

    def test_delete_buyer(self):
        url = reverse("buyer-update-destroy-view", args=[self.buyer.userId])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Buyer.objects.count(), 0)

    # Write test for seller
    def test_create_seller(self):
        sample = {
        "username": "sample_user",
        "password": "sample_password",
        "full_name": "Sample Seller",
        "phone_number": "1234567890",
        "address": "123 Sample St",
        "registration_date": datetime.now(),
        "account_number": "123456789",
        "rating_value": 4.5,
        "tax_number": "ABC123456",
        }

        url = reverse("seller-create-view")
        response = self.client.post(url, sample)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Seller.objects.count(), 2)
    def test_retrieve_seller(self):
        seller = Seller.objects.create(username="sample_user", password="sample_password", full_name="Sample Seller", phone_number="1234567890", address="123 Sample St", registration_date=datetime.now(), account_number="123456789", rating_value=4.5, tax_number="ABC123456")
        url = reverse("seller-update-destroy-view", kwargs={"pk": seller.pk})
        response = self.client.get(url)
        serializer = SellerSerializer(instance=seller)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_update_seller(self):
        url = reverse("seller-update-destroy-view", args=[self.seller.userId])
        updated_data = {
            "username": "Mulugeta",
            "password": "sample_password",
            "full_name": "Mulugeta Hailegnaw",
            "phone_number": "1234567890",
            "address": "123 Sample St",
            "registration_date": datetime.now(),
            "account_number": "123456789",
            "rating_value": 4.5,
            "tax_number": "ABC123456",
        }
        response = self.client.put(url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.username, "Mulugeta")
        self.assertEqual(self.seller.full_name, "Mulugeta Hailegnaw")

    def test_delete_seller(self):
        url = reverse("seller-update-destroy-view", args=[self.seller.userId])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Seller.objects.count(), 0)
    
    # Write test for Driver
    def test_create_driver(self):
        sample = {
            "username": "john_doe",
            "password": "password123",
            "full_name": "John Doe",
            "phone_number": "1234567890",
            "address": "123 Main Street, City, Country",
            "registration_date": "2022-03-30T12:00:00Z",  # Example registration date in ISO 8601 format
            "account_number": "ABC123456789",
            "rating_value": "4.75",
            "license_number": "DL1234567890",
            "car_model": "Toyota Corolla"
        }
        url = reverse("driver-create-view")
        response = self.client.post(url, sample)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Driver.objects.count(), 2)

    def test_retrieve_driver(self):
        driver = Driver.objects.create(username="sample_user", password="sample_password", full_name="Sample Seller", phone_number="1234567890", address="123 Sample St", registration_date=datetime.now(), account_number="123456789", rating_value=4.5, license_number="ABC123456", car_model="Toyota Camry")
        url = reverse("driver-update-destroy-view", kwargs={"pk": driver.pk})
        response = self.client.get(url)
        serializer = DriverSerializer(instance=driver)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, serializer.data)

    def test_update_driver(self):
        url = reverse("driver-update-destroy-view", args=[self.driver.userId])
        updated_data = {
            "username": "Mulugeta",
            "password": "sample_password",
            "full_name": "Mula Haile",
            "phone_number": "1234567890",
            "address": "123 Sample St",
            "account_number": "123456789",
            "rating_value": 4.5,
            "license_number": "ABC123456",
            "car_model": "Toyota Camry"
        }
        response = self.client.put(url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.username, "Mulugeta")
        self.assertEqual(self.driver.full_name, "Mula Haile")

    def test_delete_driver(self):
        url = reverse("driver-update-destroy-view", args=[self.driver.userId])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Driver.objects.count(), 0)