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
    this.orders = []
    this.orderService.getMyOrder().subscribe(
      data=>{
        console.log('Buyer accepted orders - checking all orders:', data);
        const matchingOrders = [];
        data.forEach((value)=>{
          console.log(`Evaluating order #${value.id}: status=${value.status}, buyer=${value.buyer}, driver=${value.driver}`);
          if(value.buyer==id && value.status=='Accepted'){
            if(value.product[0].image.includes("127.0.0.1:8000")){
              value.product[0].image = value.product[0].image.substring(21)
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
            
            matchingOrders.push(value)
          }
        });
        
        // Custom sorting function that prioritizes timestamp fields
        this.orders = matchingOrders.sort((a, b) => {
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
        });
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
  orderDetail(id) {
    this.router.navigate([`/app/buyer/orders/accepted_order_profile/${id}`]);
  }
}
