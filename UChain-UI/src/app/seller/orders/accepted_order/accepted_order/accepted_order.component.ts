import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { OrderService } from '../../../../buyer/orders/order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-accepted_order',
  templateUrl: './accepted_order.component.html',
  styleUrls: ['./accepted_order.component.sass']
})
export class AcceptedOrderComponent implements OnInit {
  orders: Order[] = []

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    console.log('Current seller/user ID:', id);
    this.orders = []
    this.orderService.getMyOrder().subscribe(
      data=>{
        console.log('Accepted orders component - all data:', data)
        // Add debug info for all orders to check status values
        data.forEach((order, index) => {
          console.log(`Order ${index} - ID: ${order.id}, Status: "${order.status}", Product seller: ${order.product && order.product.length > 0 ? order.product[0].seller : 'N/A'}, Has driver: ${order.driver != null}`);
        });
        
        data.forEach((value)=>{
          // Check for orders that belong to this seller and have Accepted status
          // Don't require driver to be present (it might be null at accept time)
          if (value.product && value.product.length > 0 && 
              value.product[0].seller == id && 
              value.status) {
                
            // Log all order statuses for debugging
            console.log(`Order ${value.id} status check: "${value.status}" - accepted status? ${value.status === 'Accepted' || value.status.toLowerCase() === 'accepted'}`);
            
            // Allow both 'Accepted' and 'accepted' (case-insensitive)
            if (value.status === 'Accepted' || value.status.toLowerCase() === 'accepted') {
              console.log('Found accepted order:', value);
              
              if(value.product[0].image && value.product[0].image.includes("127.0.0.1:8000")){
                value.product[0].image = value.product[0].image.substring(21)
              }
              
              this.orders.push(value)
            }
          }
        });
        
        console.log('Total accepted orders found:', this.orders.length);
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
  orderDetail(id) {
    this.router.navigate([`/seller/orders/accepted_order_profile/${id}`]);
  }
}
