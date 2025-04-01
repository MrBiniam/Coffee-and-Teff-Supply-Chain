import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { OrderService } from '../order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';


@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService) { }

  ngOnInit(): void {
    this.getOrder();
  }
  
  getOrder() {
    // Clear previous orders before fetching new ones
    this.orders = [];
    
    const id = parseInt(this.tokenStorage.getId());
    console.log('Fetching orders for buyer ID:', id);
    
    this.orderService.getMyOrder().subscribe(
      data => {
        console.log('All orders received:', data);
        
        // Ensure orders are sorted with newest first (highest ID first)
        // This provides a double-check in case the service sorting doesn't work
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        console.log('Orders sorted by newest first (highest ID):', sortedData);
        
        sortedData.forEach((value) => {
          console.log('Evaluating order:', value);
          console.log('Order status:', value.status, 'Buyer ID:', value.buyer, 'Current user ID:', id);
          
          // We only want to show PENDING orders in this view
          // Accepted orders will show in the "Accepted Orders" view
          const orderStatus = value.status ? value.status.toLowerCase() : '';
          const isPending = orderStatus === 'pending';
          
          // Check if this is the current user's order
          let isUsersOrder = false;
          if (value.buyer === id) {
            isUsersOrder = true;
          }
          
          if (isPending && isUsersOrder) {
            console.log('Order MATCHED criteria - adding to pending orders list');
            // Fix image paths
            if (value.product && value.product.length > 0) {
              value.product.forEach(prod => {
                if (prod.image && typeof prod.image === 'string') {
                  // Remove double slashes if present
                  if (prod.image.startsWith('//')) {
                    prod.image = prod.image.substring(1);
                  } else if (prod.image.includes('127.0.0.1:8000')) {
                    prod.image = prod.image.substring(21);
                  } else if (!prod.image.startsWith('http') && !prod.image.startsWith('/')) {
                    prod.image = '/' + prod.image;
                  }
                }
              });
            }
            
            this.orders.push(value);
          }
        });
        
        console.log('Filtered pending orders:', this.orders);
      },
      error => {
        console.error('Failed to get orders:', error);
      }
    );
  }
  
  orderDetail(id) {
    this.router.navigate([`/buyer/orders/order-profile/${id}`]);
  }

  viewProduct(productId) {
    console.log('Navigating to product profile:', productId);
    this.router.navigate([`/buyer/products/product-profile/${productId}`]);
  }
}
