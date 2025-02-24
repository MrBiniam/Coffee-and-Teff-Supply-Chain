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
        data.forEach((value)=>{
          if(value.driver!=null && value.driver==id && value.status=='Pending'){
            if(value.product[0].image.includes("127.0.0.1:8000")){
              value.product[0].image =value.product[0].image.substring(21)
            }
            this.orders.push(value)
            }
          }
        );
      }
      , error =>{
          console.log("Can't get Product")
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
    this.router.navigate([`/driver/orders/accepted_order_profile/${id}`]);
  }
  shipOrder(order) {
    const dialogRef = this.dialog.open(ShipOrderComponent, {
      data: {
        order: order,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        this.getOrder();
        // For add we're just pushing a new row inside DataService
        this.showNotification(
          'snackbar-success',
          'Order Accepted Successfully...!!!',
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
}
