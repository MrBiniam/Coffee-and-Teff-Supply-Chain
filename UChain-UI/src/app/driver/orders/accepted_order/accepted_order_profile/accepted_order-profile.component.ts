import { Component, OnInit } from '@angular/core';
import { Order } from '../../order.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../../dialog/form-dialog/form-dialog.component';
import { OrderService } from '../../../../buyer/orders/order.service';
import { Rate } from 'src/app/shared/security/rate';
import { UserService } from 'src/app/shared/security/user.service';
import { User } from 'src/app/shared/security/user';
import Swal from 'sweetalert2';
import { delay } from 'rxjs/operators';
import { MessageService } from 'src/app/shared/security/message_service';

@Component({
  selector: 'app-order-profile',
  templateUrl: './accepted_order-profile.component.html',
  styleUrls: ['./accepted_order-profile.component.sass']
})
export class AcceptedOrderProfileComponent implements OnInit {
  order: Order = new Order();
  orderId: any;
  rate: Rate[]
  stars: boolean[] = Array(5).fill(false)
  user: User = new User()
  buyer: User = new User()
  constructor(private router:Router, private messageService: MessageService,private orderService: OrderService,private userService: UserService, private route: ActivatedRoute,private snackBar: MatSnackBar,public dialog: MatDialog) {
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
        this.user=data
        if(this.user.profile_image.includes("127.0.0.1:8000")){
          this.user.profile_image = this.user.profile_image.substring(21)}
      }
    )
  }
  
  getBuyer(id){
    this.userService.getOneUser(id).subscribe(
      data=>{
        this.buyer = data
        if(this.buyer.profile_image.includes("127.0.0.1:8000")){
          this.buyer.profile_image = this.buyer.profile_image.substring(21)}
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
          this.getComments(data.product[0].seller)
          this.getBuyer(data.buyer)
        }
      , error =>{
          console.log("Can't get Order")
      }
    );
  }
  editOrder(order) {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      data: {
        order: order,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside DataService
        this.showNotification(
          'snackbar-success',
          'Order edited Successfully...!!!',
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