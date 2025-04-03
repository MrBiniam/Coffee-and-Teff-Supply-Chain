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
import { Location } from '@angular/common';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Component({
  selector: 'app-order-profile',
  templateUrl: './accepted_order-profile.component.html',
  styleUrls: ['./accepted_order-profile.component.scss']
})
export class AcceptedOrderProfileComponent implements OnInit {
  order: Order = new Order();
  orderId: any;
  rate: Rate[] = [];
  stars: boolean[] = Array(5).fill(false);
  user: User = new User();
  driver: User = new User();
  buyer: User = new User();
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private orderService: OrderService,
    private userService: UserService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private location: Location,
    private tokenStorage: TokenStorageService
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    this.getOrder(this.orderId);
  }

  ngOnInit(): void {
    // Get current buyer details
    this.getCurrentBuyer();
  }

  // Get current buyer details
  getCurrentBuyer() {
    const userId = this.tokenStorage.getId();
    if (userId) {
      this.userService.getOneUser(userId).subscribe(
        data => {
          this.buyer = data;
          this.fixUserImagePath(this.buyer);
        },
        error => {
          console.error('Error fetching buyer details:', error);
        }
      );
    }
  }

  getComments(id) {
    if (!id) return;
    
    this.userService.getOneUser(id).subscribe(
      data => {
        this.rate = this.userService.getSellerComments(data.username);
        this.user = data;
        this.fixUserImagePath(this.user);
      },
      error => {
        console.error('Error fetching seller comments:', error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load seller details',
          'bottom',
          'center'
        );
      }
    );
  }

  getDriver(id) {
    if (!id) return;
    
    this.userService.getOneUser(id).subscribe(
      data => {
        this.driver = data;
        this.fixUserImagePath(this.driver);
      },
      error => {
        console.error('Error fetching driver details:', error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load driver details',
          'bottom',
          'center'
        );
      }
    );
  }

  // Helper method to fix image paths
  fixUserImagePath(user: User) {
    if (user && user.profile_image) {
      if (user.profile_image.includes("127.0.0.1:8000")) {
        user.profile_image = user.profile_image.substring(21);
      }
    }
  }

  goToChat(username: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Want to start a conversation?",
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#00ff00',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Say Hello!'
    }).then(result => {
      if (result.value) {
        const data = {
          "receiver": username,
          "content": "Hello! I would like to chat with you about my order."
        };
        
        // Show sending indicator
        Swal.fire({
          title: 'Sending message...',
          text: 'Please wait while we connect you to chat',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.messageService.sendMessage(data).subscribe(
          response => {
            Swal.fire('Sent!', 'You have said Hello to ' + username, 'success');
            
            // Force a data refresh in chat by setting a flag in localStorage
            localStorage.setItem('FORCE_CHAT_REFRESH', 'true');
            localStorage.setItem('CHAT_TARGET_USER', username);
            localStorage.setItem('CHAT_REFRESH_TIME', new Date().getTime().toString());
            
            // Navigate to chat with the username as a query parameter
            setTimeout(() => {
              this.router.navigate(['/apps/chat'], { 
                queryParams: { to: username },
                state: { forceRefresh: true }
              });
            }, 1000);
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
    this.orderService.getOneOrder(id).subscribe(
      data => {
        // Set order data first
        this.order = data;
        
        // Fix product image path if it exists
        if (this.order.product && this.order.product.length > 0) {
          if (this.order.product[0].image && this.order.product[0].image.includes("127.0.0.1:8000")) {
            this.order.product[0].image = this.order.product[0].image.substring(21);
          }
          
          // Get seller information if available
          if (this.order.product[0].seller) {
            this.getComments(this.order.product[0].seller);
          }
        }
        
        // Get driver information if available
        if (this.order.driver) {
          this.getDriver(this.order.driver);
        }
        
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        console.error('Error fetching order details:', error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load order details',
          'bottom',
          'center'
        );
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

  /**
   * Navigate back to the previous page
   */
  goBack(): void {
    this.location.back();
  }
}