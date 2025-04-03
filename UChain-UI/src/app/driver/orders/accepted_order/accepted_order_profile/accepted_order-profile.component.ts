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
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-order-profile',
  templateUrl: './accepted_order-profile.component.html',
  styleUrls: ['./accepted_order-profile.component.sass']
})
export class AcceptedOrderProfileComponent implements OnInit {
  order: Order = new Order();
  orderId: any;
  rate: Rate[] = [];
  stars: boolean[] = Array(5).fill(false);
  user: User = new User();
  buyer: User = new User();
  isLoading = true;
  
  constructor(
    private router: Router, 
    private messageService: MessageService,
    private orderService: OrderService,
    private userService: UserService, 
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log('Loading order ID:', this.orderId);
    this.getOrder(this.orderId);
  }
  
  ngOnInit(): void {
    // Initialization handled in constructor
  }
  
  getComments(id) {
    if (!id) {
      console.log('No seller ID provided for getting comments');
      return;
    }
    
    this.userService.getOneUser(id).subscribe(
      data => {
        if (data) {
          this.rate = this.userService.getSellerComments(data.username);
          this.user = data;
          this.processUserImage(this.user);
        }
      },
      error => {
        console.error('Error fetching user comments:', error);
      }
    );
  }
  
  getBuyer(id) {
    if (!id) {
      console.log('No buyer ID provided');
      return;
    }
    
    this.userService.getOneUser(id).subscribe(
      data => {
        if (data) {
          this.buyer = data;
          this.processUserImage(this.buyer);
        }
      },
      error => {
        console.error('Error fetching buyer details:', error);
      }
    );
  }
  
  // Helper method to process user image paths
  processUserImage(user: User) {
    if (user && user.profile_image) {
      // Extract just the filename if it's a full URL
      if (user.profile_image.includes('http') || user.profile_image.includes('media')) {
        // Extract the filename from the path
        const pathParts = user.profile_image.split('/');
        const fileName = pathParts[pathParts.length - 1];
        // Store just the filename for use in template
        user.imageFileName = fileName;
      } else {
        // If it's just a filename, use it directly
        user.imageFileName = user.profile_image;
      }
    } else if (user) {
      // If no image, use a default based on username or ID
      user.imageFileName = `${user.id || user.username}.jpg`;
    }
  }
  
  goToChat(username: string) {
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
        };
        this.messageService.sendMessage(data).subscribe(
          response => {
            Swal.fire('Sent!', 'You have said Hello to ' + username, 'success');
            setTimeout(() => {
              this.router.navigate(['/apps/chat'], { queryParams: { to: username } });
            }, 2000);
          },
          error => {
            console.error('Error sending message:', error);
            Swal.fire('Error!', 'Failed to send message', 'error');
          }
        );
      }
    });
  }
  
  getOrder(id) {
    this.isLoading = true;
    
    if (!id) {
      console.error('No order ID provided');
      this.isLoading = false;
      return;
    }
    
    this.orderService.getOneOrder(id).subscribe(
      data => {
        this.order = data;
        this.isLoading = false;
        
        // Process product images
        if (this.order && this.order.product && this.order.product.length > 0) {
          this.order.product.forEach(prod => {
            if (prod.image) {
              // Handle different image path scenarios
              if (typeof prod.image === 'string') {
                // Extract just the filename if it's a full URL
                if (prod.image.includes('http') || prod.image.includes('media')) {
                  // Extract the filename from the path
                  const pathParts = prod.image.split('/');
                  const fileName = pathParts[pathParts.length - 1];
                  // Store just the filename for use in template
                  prod.imageFileName = fileName;
                } else {
                  // If it's just a filename, use it directly
                  prod.imageFileName = prod.image;
                }
              }
            } else {
              // If no image, use a default based on product ID
              prod.imageFileName = `${prod.id}.jpg`;
            }
          });
          
          // Get seller and buyer details
          if (this.order.product[0].seller) {
            this.getComments(this.order.product[0].seller);
          }
          
          if (this.order.buyer) {
            this.getBuyer(this.order.buyer);
          }
        }
      },
      error => {
        console.error('Failed to get order details:', error);
        this.isLoading = false;
        this.showNotification(
          'snackbar-danger',
          'Error loading order details',
          'bottom',
          'center'
        );
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