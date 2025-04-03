import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { OrderService } from '../../order.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DeliverOrderComponent } from '../deliver_order/deliver_order.component';
import { SimpleConfirmComponent } from '../../../../shared/simple-confirm/simple-confirm.component';

@Component({
  selector: 'app-shipped_order',
  templateUrl: './shipped_order.component.html',
  styleUrls: ['./shipped_order.component.sass']
})
export class ShippedOrderComponent implements OnInit {
  orders: Order[] = []

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    this.orders = []
    console.log('Fetching orders for buyer ID:', id)
    this.orderService.getMyOrder().subscribe(
      data=>{
        console.log('All orders returned:', data)
        data.forEach((value)=>{
          if (!value) {
            console.log('Invalid order item');
            return;
          }
          
          const status = value.status ? value.status.toLowerCase() : '';
          console.log('Checking order:', value.id, 'Status:', value.status, 'Driver:', value.driver, 'Buyer:', value.buyer)
          
          // Include both 'shipped' and 'on_route' statuses
          if(value.driver!=null && value.buyer==id && (status === 'shipped' || status === 'on_route')){
            console.log(`Adding order #${value.id} with status '${value.status}' to shipped orders list`);
            if(value.product && value.product[0] && value.product[0].image){
              if(value.product[0].image.includes("127.0.0.1:8000")){
                value.product[0].image = value.product[0].image.substring(21);
              }
            } else {
              console.warn(`Order #${value.id} has missing or invalid product image`);
            }
            this.orders.push(value);
          }
        });
        console.log('Final shipped orders list:', this.orders.length, 'orders')
      }
      , error =>{
          console.log("Can't get Product", error)
      }
    );
  }
  
  deliverOrder(order) {
    // Show confirmation dialog first
    const confirmDialogRef = this.dialog.open(SimpleConfirmComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delivery',
        message: 'Are you sure the product is delivered?',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      },
      disableClose: true // Prevents closing by clicking outside
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // User confirmed - proceed with delivery rating dialog
        this.openDeliveryRatingDialog(order);
      }
    });
  }
  
  openDeliveryRatingDialog(order) {
    const dialogRef = this.dialog.open(DeliverOrderComponent, {
      data: {
        order: order,
      },
      width: '500px'
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        this.getOrder();
        this.showNotification(
          'snackbar-success',
          'Order marked as delivered successfully!',
          'bottom',
          'center'
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
  
  orderDetail(id) {
    this.router.navigate([`/buyer/orders/shipped_order_profile/${id}`]);
  }
}
