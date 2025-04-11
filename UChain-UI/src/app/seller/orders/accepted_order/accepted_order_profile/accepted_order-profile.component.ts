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
import { delay } from 'rxjs/operators';
import { MessageService } from 'src/app/shared/security/message_service';
import { Location } from '@angular/common';


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
  buyer: User = new User();
  driver: User = new User();
  isLoading: boolean = true;
  seller: any;
  buyerDetails: any;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private orderService: OrderService,
    private userService: UserService, 
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private location: Location
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log(this.orderId);
    this.getOrder(this.orderId);
  }
  
  ngOnInit(): void {
    // Initial setup if needed
  }
  
  getComments(id) {
    if (!id) return;
    
    this.userService.getOneUser(id).subscribe(
      data => {
        this.rate = this.userService.getSellerComments(data.username);
      },
      error => {
        console.error('Error fetching seller comments:', error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load seller comments',
          'bottom',
          'center'
        );
      }
    );
  }
  
  getBuyer(id) {
    if (!id) return;
    
    this.userService.getOneUser(id).subscribe(
      data => {
        this.buyer = this.fixUserImagePath(data);
      },
      error => {
        console.error('Error fetching buyer details:', error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load buyer details',
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
        this.driver = this.fixUserImagePath(data);
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
  
  fixUserImagePath(user) {
    if (user && user.profile_image) {
      // Ensure the image path is correctly formatted for display
      if (user.profile_image.includes('/')) {
        // Path already contains slashes, use the last segment
        user.profile_image = user.profile_image.split('/').pop();
      }
    }
    return user;
  }
  
  getOrder(id) {
    if (!id) return;
    
    this.isLoading = true;
    this.orderService.getOneOrder(id).subscribe(
      data => {
        this.isLoading = false;
        this.order = data;
        
        // Get additional user details
        if (this.order && this.order.buyer) {
          this.getBuyer(this.order.buyer);
        }
        if (this.order && this.order.driver) {
          this.getDriver(this.order.driver);
        }
      },
      error => {
        // Don't show a notification for 500 errors as the fallback mechanism will handle it
        console.error('Error fetching order:', error);
        
        // Only if the order isn't found through the fallback, then we'll show the loading
        // indicator as false after a brief delay, allowing the fallback to try first
        setTimeout(() => {
          if (!this.order || !this.order.id) {
            this.isLoading = false;
            // Only show the error notification if we still don't have an order after fallback
            this.showNotification(
              'snackbar-danger',
              'Failed to load order details. Please try again later.',
              'bottom',
              'center'
            );
          }
        }, 1000);
      }
    );
  }
  
  // Method to suggest valid order IDs to the user
  suggestValidOrderIds() {
    this.orderService.getAllOrdersForSuggestion().subscribe(
      (orders) => {
        if (orders && orders.length > 0) {
          // Sort orders by ID (descending) and take the first 5
          const recentOrderIds = orders
            .sort((a, b) => b.id - a.id)
            .slice(0, 5)
            .map(order => order.id);
            
          console.log('Valid recent order IDs:', recentOrderIds);
          
          if (recentOrderIds.length > 0) {
            const message = `Try these valid order IDs instead: ${recentOrderIds.join(', ')}`;
            this.showNotification(
              'snackbar-info',
              message,
              'bottom',
              'center'
            );
          }
        }
      },
      (error) => {
        console.error('Error fetching all orders for suggestions:', error);
      }
    );
  }
  
  goToChat(username: string) {
    // Navigate directly to chat without sending a hello message first
    // This avoids the 500 error when the backend is not responding properly
    this.router.navigate(['/app/apps/chat'], { 
      queryParams: { to: username }
    });
    
    // Show a toast notification instead of a modal
    this.snackBar.open('Opening chat with ' + username, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
  
  // Method to navigate to the chat page and say hello
  goToChatPage(username?: string) {
    if (!username) {
      this.router.navigate(['/app/apps/chat']);
      return;
    }
    
    // Show confirmation dialog with nicer styling
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
          "content": "Hello! I would like to chat with you about your order."
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
              this.router.navigate(['/app/apps/chat'], { 
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
  
  // Method to retry fetching the order
  retryFetchOrder() {
    this.getOrder(this.orderId);
  }
}