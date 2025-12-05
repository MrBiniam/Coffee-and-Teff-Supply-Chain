import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { OrderService } from '../../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ShipOrderComponent } from '../ship_order/ship_order.component';
import Swal from 'sweetalert2';
import { delay } from 'rxjs/operators';

@Component({
    selector: 'app-accepted_order',
    templateUrl: './accepted_order.component.html',
    styleUrls: ['./accepted_order.component.sass'],
    standalone: false
})
export class AcceptedOrderComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    console.log('Driver ID:', id);
    // Clear orders array to start fresh
    this.orders = []
    
    this.orderService.getMyOrder().subscribe(
      data => {
        console.log('All orders received in driver view:', data);
        
        // Check if we have valid data
        if (!Array.isArray(data)) {
          console.warn('Received non-array orders data:', data);
          return;
        }
        
        // Log debugging information
        const ordersWithDriver = data.filter(order => order && order.driver !== null);
        console.log('Orders with any driver assigned:', ordersWithDriver);
        
        const thisDriverOrders = data.filter(order => order && order.driver === id);
        console.log('Orders assigned to this driver:', thisDriverOrders);
        
        // Create array for processing active orders only
        let activeOrders = [];
        
        // Process each order
        data.forEach((value) => {
          if (!value) {
            console.warn('Encountered null/undefined order in data');
            return; // Skip this iteration
          }
          
          console.log(`Evaluating order #${value.id} - Status: ${value.status}, Driver ID: ${value.driver}`);
          
          // First, check if this order belongs to this driver
          if (value.driver !== null && value.driver === id) {
            
            // Handle potential image URL issues
            if (value.product && Array.isArray(value.product) && value.product.length > 0 && value.product[0] && value.product[0].image) {
              if (value.product[0].image.includes("127.0.0.1:8000")) {
                value.product[0].image = value.product[0].image.substring(21);
              }
              console.log(`Product image URL: ${value.product[0].image}`);
            } else {
              console.warn(`Order #${value.id} has missing or invalid product image`);
            }
            
            // Clean up quantity if it contains transaction IDs
            if (value.quantity && typeof value.quantity === 'string') {
              // Extract just the numeric part if it contains bracketed tx info
              if (value.quantity.includes('[')) {
                value.quantity = value.quantity.split('[')[0].trim();
              }
            }
            
            // Add a timestamp field if not present to help with sorting
            if (!value.acceptedTimestamp) {
              // Use any available date fields, with fallbacks
              if (value.accepted_date) {
                value.acceptedTimestamp = new Date(value.accepted_date).getTime();
              } else if (value.updated_at) {
                value.acceptedTimestamp = new Date(value.updated_at).getTime();
              } else if (value.order_date) {
                value.acceptedTimestamp = new Date(value.order_date).getTime();
              } else {
                // If no date is available, use a default old date for orders without timestamps
                value.acceptedTimestamp = 0;
              }
            }
            
            // We want orders with "Accepted" status OR "Pending" status with a driver assigned
            // Orders with "Shipped" status should only appear in the shipped orders list
            if (value.status.toLowerCase() === 'accepted' || (value.status.toLowerCase() === 'pending' && value.driver === id)) {
              console.log(`✓ Order #${value.id} is ${value.status.toUpperCase()} with driver assigned - adding to driver's accepted orders list`);
              activeOrders.push(value);
            } else {
              console.log(`✗ Order #${value.id} has status "${value.status}" - excluded from accepted list`);
            }
          } else {
            console.log(`✗ Order #${value.id} did NOT match driver criteria - excluded`);
          }
        });
        
        // Log final sorted count
        console.log(`Found ${activeOrders.length} active orders for driver ID ${id}`);
        
        // Custom sorting function that prioritizes timestamp fields
        const sortByTimestamp = (a, b) => {
          // First check if we have acceptedTimestamp fields
          if (a.acceptedTimestamp && b.acceptedTimestamp) {
            return b.acceptedTimestamp - a.acceptedTimestamp; // Newest first
          }
          
          // Next check for accepted_date
          if (a.accepted_date && b.accepted_date) {
            return new Date(b.accepted_date).getTime() - new Date(a.accepted_date).getTime();
          }
          
          // Next check for updated_at
          if (a.updated_at && b.updated_at) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          
          // Fall back to order_date
          if (a.order_date && b.order_date) {
            return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
          }
          
          // If no sortable dates are available, fallback to order ID (newer IDs are typically higher)
          return b.id - a.id;
        };
        
        // Assign sorted active orders
        // Important: Only include orders with valid product info
        this.orders = activeOrders
          .filter(order => order && order.product && Array.isArray(order.product) && order.product.length > 0)
          .sort(sortByTimestamp);
        
        console.log("Final active orders:", this.orders.length);
      },
      error => {
          console.error("Error getting orders for driver:", error);
          this.showNotification(
            'snackbar-danger',
            'Error loading orders. Please try again later.',
            'bottom',
            'center'
          );
      }
    );
  }
  cancelOrder(order: Order) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Want to cancelorder!",
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#55ffaa',
      cancelButtonColor: '#0fa',
      confirmButtonText: 'Say Hello!'
    }).then(result => {
      if (result.value) {
        this.orderService.editOrder({"driver": 0}, order.id).subscribe(
          data=>{
            Swal.fire('Done!', 'You have cancelled an Order.', 'success');
            delay(2000)
          }
          ,
          _=>{
            Swal.fire('Ops!', 'There is Some error try again.', 'error');
          }
        )
      }
    });
  }
  orderDetail(id) {
    this.router.navigate([`/app/driver/orders/accepted_order_profile/${id}`]);
  }
  shipOrder(order) {
    if (!order || !order.id) {
      this.snackBar.open('Order information is incomplete', 'Close', { duration: 3000 });
      return;
    }
    
    console.log("Processing ship request for order:", order);

    // Show an elegant confirmation dialog
    Swal.fire({
      title: 'Ready to Ship?',
      html: `
        <div style="margin-bottom: 15px;">
          <p style="font-size: 16px; margin-bottom: 10px;">You're about to ship:</p>
          <p style="font-weight: bold; font-size: 18px; color: #3f51b5; margin-bottom: 5px;">
            ${order.product[0]?.name || 'Product'} (${order.quantity} units)
          </p>
          <p style="font-size: 14px; color: #666;">
            This will update the buyer and seller, and move the order to your shipped orders list.
          </p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Confirm Shipment',
      cancelButtonText: 'Not Yet',
      backdrop: `rgba(0,0,123,0.4)`,
      allowOutsideClick: false
    }).then(result => {
      if (result.value) {
        const currentDate = new Date().toISOString();
        
        // Create a complete payload with all required fields from the original order
        // This prevents losing data when updating and avoids 400 Bad Request errors
        const completePayload = {
          // Keep original fields
          quantity: order.quantity,
          order_date: order.order_date,
          buyer: order.buyer,
          seller: order.seller,
          driver: order.driver,
          product: order.product ? order.product.map(p => p.id) : [],
          
          // Update these fields
          status: 'Shipped',
          shipped_date: currentDate,
          seller_accepted: true
        };
        
        console.log("Sending update with payload:", completePayload);
        
        this.orderService.editOrder(completePayload, order.id).subscribe(
          (res: any) => {
            console.log("Ship order response:", res);
            Swal.fire(
              'Shipped!',
              'The order has been marked as shipped.',
              'success'
            ).then(() => {
              // Navigate to shipped orders page after successful shipping
              setTimeout(() => {
                this.router.navigate(['/app/driver/orders/shipped_order']);
              }, 1000);
            });
            
            // Refresh the orders list after shipping
            this.getOrder();
          },
          (error: any) => {
            console.error("Error shipping order:", error);
            Swal.fire(
              'Error!',
              'Failed to ship order. Please try again.',
              'error'
            );
          }
        );
      }
    });
  }
  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
  
  getUserImageUrl(username: string, role: string): string {
    // Default to a single generic image to avoid 404 errors
    return 'assets/images/profile/usrbig.jpg';
  }
  
  handleImageError(event: any) {
    event.target.src = 'assets/images/profile/usrbig.jpg';
  }
}
