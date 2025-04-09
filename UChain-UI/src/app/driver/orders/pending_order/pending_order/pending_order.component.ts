import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { OrderService } from '../../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pending_order',
  templateUrl: './pending_order.component.html',
  styleUrls: ['./pending_order.component.sass']
})
export class PendingOrderComponent implements OnInit {
  orders: Order[] = [];
  loading = false;

  constructor(
    private orderService: OrderService,
    private router: Router, 
    private tokenStorage: TokenStorageService, 
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getAvailableOrders();
  }
  
  getAvailableOrders() {
    this.loading = true;
    // Clear orders array to start fresh
    this.orders = [];
    
    // Get the current driver's ID
    const driverId = parseInt(this.tokenStorage.getId());
    console.log('Current driver ID:', driverId);
    
    this.orderService.getMyOrder().subscribe(
      data => {
        console.log('All orders received in driver view (available orders):', data);
        
        // Check if we have valid data
        if (!Array.isArray(data)) {
          console.warn('Received non-array orders data:', data);
          this.loading = false;
          return;
        }
        
        // Sort orders with the newest first (highest ID)
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        
        // Process each order
        sortedData.forEach((value) => {
          if (!value) {
            console.warn('Encountered null/undefined order in data');
            return; // Skip this iteration
          }
          
          console.log(`Evaluating order #${value.id} - Status: ${value.status}, Driver ID: ${value.driver}`);
          
          // We only want orders with "Pending" status that are assigned to THIS driver
          const orderStatus = value.status ? value.status.toLowerCase() : '';
          const isPending = orderStatus === 'pending';
          const isAssignedToThisDriver = value.driver === driverId;
          
          if (isPending && isAssignedToThisDriver) {
            console.log(`✓ Order #${value.id} is PENDING and assigned to driver ${driverId} - adding to driver's pending orders list`);
            
            // Fix image paths
            if (value.product && Array.isArray(value.product) && value.product.length > 0) {
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
            
            // Clean up quantity if it contains transaction IDs
            if (value.quantity && typeof value.quantity === 'string') {
              // Extract just the numeric part if it contains bracketed tx info
              if (value.quantity.includes('[')) {
                value.quantity = value.quantity.split('[')[0].trim();
              }
            }
            
            this.orders.push(value);
          }
        });
        
        console.log('Filtered available orders for driver:', this.orders);
        this.loading = false;
      },
      error => {
        console.error('Failed to get orders:', error);
        this.loading = false;
      }
    );
  }
  
  orderDetail(id) {
    this.router.navigate([`/app/driver/orders/order-profile/${id}`]);
  }

  viewProduct(productId) {
    console.log('Navigating to product profile:', productId);
    this.router.navigate([`/app/driver/products/product-profile/${productId}`]);
  }
}
