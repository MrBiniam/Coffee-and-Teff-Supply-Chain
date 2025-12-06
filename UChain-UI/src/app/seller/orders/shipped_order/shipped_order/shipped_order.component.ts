import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../order.model';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { OrderService } from 'src/app/buyer/orders/order.service';

@Component({
    selector: 'app-shipped_order',
    templateUrl: './shipped_order.component.html',
    styleUrls: ['./shipped_order.component.sass'],
    standalone: false
})
export class ShippedOrderComponent implements OnInit {
  orders: Order[] = []

  constructor(private orderService: OrderService,private router: Router, private tokenStorage: TokenStorageService, private snackBar: MatSnackBar,public dialog: MatDialog) { this.getOrder()}

  ngOnInit(): void {
  }
  getOrder(){
    const id = parseInt(this.tokenStorage.getId())
    this.orders = []
    this.orderService.getMyOrder().subscribe(
      data=>{
        console.log('Processing orders for seller shipped orders view');
        data.forEach((value)=>{
          if (!value) {
            console.log('Invalid order item');
            return;
          }
          
          const status = value.status ? value.status.toLowerCase() : '';
          
          // Check if the product array exists and has elements
          if (!value.product || !Array.isArray(value.product) || !value.product.length) {
            console.warn(`Order #${value.id} has no valid product information`);
            return;
          }
          
          // Include orders that are shipped, on route, or marked as delivered by driver but not confirmed by buyer
          if(value.driver!=null && value.product[0].seller==id && (status === 'shipped' || status === 'on_route' || status === 'driver_delivered')){
            console.log(`Adding order #${value.id} with status '${value.status}' to shipped orders list`);
            if(value.product[0].image){
              if(value.product[0].image.includes("127.0.0.1:8000")){
                value.product[0].image = value.product[0].image.substring(21);
              }
            } else {
              console.warn(`Order #${value.id} has missing or invalid product image`);
            }
            this.orders.push(value);
          }
        });
        console.log(`Total shipped orders found for seller: ${this.orders.length}`);
      }
      , error =>{
          console.log("Can't get Product", error);
      }
    );
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
    this.router.navigate([`/app/tracking/${id}`]);
  }
}