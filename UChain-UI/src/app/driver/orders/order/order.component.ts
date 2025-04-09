import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../order.model';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DeleteComponent } from '../dialog/delete/delete.component';
import { OrderService } from 'src/app/buyer/orders/order.service';


@Component({
  selector: 'app-product',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.sass']
})
export class OrderComponent implements OnInit {
  orders: Order[] = []

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  
  getOrder(){
    const id = parseInt(this.tokenStorage.getId());
    console.log('Driver ID:', id);
    this.orders = [];
    
    // First try to get orders assigned to this driver
    this.orderService.getMyOrder().subscribe(
      data => {
        console.log('All orders received:', data);
        // Orders already sorted by newest first in the service
        
        // First, check for orders where driver is null (available to be accepted)
        if (data && Array.isArray(data)) {
          data.forEach((value) => {
            // Driver should only see orders that have been accepted by a seller but not yet by a driver
            if (value.seller_accepted === true && value.driver === null) {
              // Fix image paths
              if (value.product && value.product.length > 0 && value.product[0].image) {
                if (value.product[0].image.includes("127.0.0.1:8000")) {
                  value.product[0].image = value.product[0].image.substring(value.product[0].image.indexOf('/media'));
                }
              }
              this.orders.push(value);
            }
          });
        }
        
        // If no orders are found for this driver, fallback to getting all orders for demo purposes
        if (this.orders.length === 0) {
          console.log('No orders available for driver. Fetching all orders for demo...');
          this.orderService.getAllOrders().subscribe(
            allOrders => {
              // Orders already sorted by newest first in the service
              
              if (allOrders && Array.isArray(allOrders)) {
                allOrders.forEach((value) => {
                  // Driver should only see orders that have been accepted by a seller but not yet by a driver
                  if (value.seller_accepted === true && value.driver === null) {
                    // Fix image paths
                    if (value.product && value.product.length > 0 && value.product[0].image) {
                      if (value.product[0].image.includes("127.0.0.1:8000")) {
                        value.product[0].image = value.product[0].image.substring(value.product[0].image.indexOf('/media'));
                      }
                    }
                    this.orders.push(value);
                  }
                });
              }
            },
            error => {
              console.error('Error fetching all orders:', error);
            }
          );
        }
      },
      error => {
        console.error('Error fetching orders for driver:', error);
      }
    );
  }
  
  acceptOrder(order) {
    console.log('Driver accepting order:', order.id);
    
    // Update order to assign this driver
    this.orderService.updateOrderStatus(parseInt(order.id), 'in_transit', parseInt(this.tokenStorage.getId())).subscribe(
      response => {
        console.log('Order accepted by driver:', response);
        this.snackBar.open('Order accepted successfully', 'Close', {
          duration: 3000,
        });
        // Refresh the orders list
        this.getOrder();
      },
      error => {
        console.error('Error accepting order by driver:', error);
        this.snackBar.open('Failed to accept order', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  
  orderDetail(id) {
    this.router.navigate([`/app/driver/orders/order-profile/${id}`]);
  }
}
