import { Component, OnInit } from '@angular/core';
import { Order } from '../../order.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../../dialog/form-dialog/form-dialog.component';
import { OrderService } from '../../../../buyer/orders/order.service';
import { UserService } from 'src/app/shared/security/user.service';
import { Rate } from 'src/app/shared/security/rate';
import { User } from 'src/app/shared/security/user';
import Swal from 'sweetalert2';
import { MessageService } from 'src/app/shared/security/message_service';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-order-profile',
  templateUrl: './accepted_order-profile.component.html',
  styleUrls: ['./accepted_order-profile.component.sass']
})
export class AcceptedOrderProfileComponent implements OnInit {
  order: Order = new Order()
  orderId: any
  rate: Rate[]
  stars: boolean[] = Array(5).fill(false);
  user: User = new User()
  driver: User = new User()
  constructor(private router: Router,private messageService: MessageService,private orderService: OrderService,private userService: UserService ,private route: ActivatedRoute,private snackBar: MatSnackBar,public dialog: MatDialog) {
    this.orderId=this.route.snapshot.paramMap.get('id');
    console.log(this.orderId)
    this.getOrder(this.orderId);
  }
  ngOnInit(): void {
  }
  getComments(id){
    this.userService.getOneUser(id).subscribe(
      data=>{
        this.rate =this.userService.getSellerComments(data.username)
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
  goToChat(username:string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Want Say Hello!",
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#00ff00',
      cancelButtonColor: '#0f0',
      confirmButtonText: 'Say Hello!'
    }).then(result => {
      if (result.value) {
        const data = {
          "receiver": username,
          "content": "Hello"
        }
        this.messageService.sendMessage(data).subscribe(
          data=>{
            Swal.fire('Sent!', 'You have sayed Hello to. ' + username, 'success');
            delay(2000)
            this.router.navigate([`/apps/chat`]);
          }
        )
      }
    });
  }
  getOrder(id){
    this.orderService.getOneOrder(id).subscribe(
      data=>{
          if(data.product[0].image.includes("127.0.0.1:8000")){
            data.product[0].image = data.product[0].image.substring(21)
          }
          this.order = data;
          console.log(this.order.product[0].image)
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