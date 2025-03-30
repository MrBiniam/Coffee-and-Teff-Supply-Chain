import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';


@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];

  value1: any[] = [];
    

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService) { 
    this.getOrder();
  }

  ngOnInit(): void {
  }

  getOrder(){
    const id = parseInt(this.tokenStorage.getId());
    console.log('Seller ID:', id);
    console.log('Fetching all orders for seller view...');
    
    // Clear all existing orders
    this.orders = [];
    
    // For demo and testing purposes, get ALL orders directly
    this.orderService.getAllOrders().subscribe(
      data => {
        console.log('All orders received:', data);
        // Data is already sorted by newest first in the service
        
        if (data && data.length > 0) {

       
          data.forEach(value => {
            if(value.product[0].seller==id){
              this.value1.push(value);
            }
          })
        this.processOrders(this.value1);
         } 
        
        else {
          console.log('No orders found in the system.');
        }
      },
      error => {
        console.error('Error fetching all orders:', error);
      }
    );
  }
  
  // Helper method to process and filter orders
  private processOrders(data: any[]) {
    if (!data || !Array.isArray(data)) {
      console.log('No valid orders data to process');
      return;
    }

    // Orders are already sorted by newest first in the service
    const sellerId = parseInt(this.tokenStorage.getId());
    console.log('Processing orders for seller ID:', sellerId);
    
    // First clear any existing orders
    this.orders = [];
    
    // For demo and testing, show ALL pending orders to ALL sellers
    data.forEach(order => {
      // Show all pending orders that haven't been accepted by any seller yet
      if (order.status && order.status.toLowerCase() === 'pending') {
        // Fix image paths before displaying
        if (order.product && order.product.length > 0) {
          order.product.forEach(prod => {
            if (prod.image && typeof prod.image === 'string') {
              // Handle the image path properly
              if (prod.image.includes('127.0.0.1:8000')) {
                prod.image = prod.image.substring(prod.image.indexOf('/media'));
              } else if (!prod.image.startsWith('/')) {
                prod.image = '/media/Products_Pictures/' + prod.image;
              }
            }
          });
        }
        
        console.log('Adding order to seller pending list:', order);
        this.orders.push(order);
      }
    });
    
    console.log('Filtered seller pending orders:', this.orders);
  }

  orderDetail(id) {
    this.router.navigate([`/seller/orders/order-profile/${id}`]);
  }

  acceptOrder(id) {
    console.log('Seller accepting order:', id);
    // Add logic to accept the order here
    // You can make an API call to update the order status
    this.orderService.updateOrderStatus(parseInt(id), 'accepted', parseInt(this.tokenStorage.getId())).subscribe(
      response => {
        console.log('Order accepted successfully:', response);
        // Update the local list
        this.getOrder();
      },
      error => {
        console.error('Error accepting order:', error);
      }
    );
  }

  // Add a refresh method for the button
  refreshOrders() {
    console.log('Manually refreshing orders...');
    this.getOrder();
  }
}
