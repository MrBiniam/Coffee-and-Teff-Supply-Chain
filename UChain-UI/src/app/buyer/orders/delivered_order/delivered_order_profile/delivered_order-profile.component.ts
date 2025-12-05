import { Component, OnInit } from '@angular/core';
import { Order } from '../../order.model';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { OrderService } from 'src/app/buyer/orders/order.service';
import { UserService } from 'src/app/shared/security/user.service';
import { Rate } from 'src/app/shared/security/rate';
import { number } from 'ngx-custom-validators/src/app/number/validator';
import { User } from 'src/app/shared/security/user';

@Component({
    selector: 'app-delivered_order-profile',
    templateUrl: './delivered_order-profile.component.html',
    styleUrls: ['./delivered_order-profile.component.sass'],
    standalone: false
})
export class DeliveredOrderProfileComponent implements OnInit {
  order: Order = new Order();
  orderId: any;
  rate: Rate[];
  stars: boolean[] = Array(5).fill(false);
  user: User = new User()
  driver: User = new User()
  constructor(private orderService: OrderService,private userService: UserService ,private route: ActivatedRoute,private snackBar: MatSnackBar,public dialog: MatDialog) {
    this.orderId=this.route.snapshot.paramMap.get('id');
    console.log(this.orderId)
    this.getOrder(this.orderId);
  }
  ngOnInit(): void {
  }
  getComments(id){
    this.userService.getOneUser(id).subscribe(
      data=>{
        this.rate =this.userService.getSellerComments(data.username);
        this.user = data
        if(this.user.profile_image.includes("127.0.0.1:8000")){
          this.user.profile_image = this.user.profile_image.substring(21)}
      }
    )
  }
  getDriver(id){
    this.userService.getOneUser(id).subscribe(
      data=>{
        this.driver = data
        if(this.driver.profile_image.includes("127.0.0.1:8000")){
          this.driver.profile_image = this.driver.profile_image.substring(21)}
      },
      _=>{
        console.log("error here")
      }
    )
  }
  getOrder(id){
    this.orderService.getOneOrder(id).subscribe(
      data=>{
          if(data.product[0].image.includes("127.0.0.1:8000")){
            data.product[0].image = data.product[0].image.substring(21)
          }
          this.order = data;
          this.getComments(data.product[0].seller)
          this.getDriver(data.driver)
        }
      , error =>{
          console.log("Can't get Order")
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
}