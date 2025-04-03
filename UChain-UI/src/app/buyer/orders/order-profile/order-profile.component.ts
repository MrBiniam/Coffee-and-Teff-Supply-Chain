import { Component, OnInit } from '@angular/core';
import { Order } from '../order.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../dialog/form-dialog/form-dialog.component';
import { OrderService } from '../order.service';
import { UserService } from 'src/app/shared/security/user.service';
import { Rate } from 'src/app/shared/security/rate';
import { User } from 'src/app/shared/security/user';

@Component({
  selector: 'app-order-profile',
  templateUrl: './order-profile.component.html',
  styleUrls: ['./order-profile.component.sass']
})
export class OrderProfileComponent implements OnInit {
  order: Order = new Order();
  orderId: any;
  rate: Rate[];
  stars: boolean[] = Array(5).fill(false);
  user: User;
  backendUrl = 'http://127.0.0.1:8000';
  
  constructor(
    private orderService: OrderService,
    private userService: UserService, 
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log(this.orderId);
    this.getOrder(this.orderId);
  }
  
  ngOnInit(): void {
  }
  
  getComments(id) {
    this.userService.getOneUser(id).subscribe(
      data => {
        this.rate = this.userService.getSellerComments(data.username);
        this.user = data;
        
        // Fix the profile image path to point directly to the backend
        if (this.user && this.user.profile_image) {
          // Extract just the filename if it contains a path
          const imageName = this.user.profile_image.split('/').pop();
          this.user.profile_image = `/media/profile_images/${imageName}`;
        }
      },
      error => {
        console.error('Error fetching user data:', error);
      }
    );
  }
  
  getOrder(id) {
    this.orderService.getOneOrder(id).subscribe(
      data => {
        this.order = data;
        
        // Fix product image paths to point to the backend server
        if (this.order && this.order.product && this.order.product.length > 0) {
          this.order.product.forEach(prod => {
            if (prod.image) {
              // Extract just the filename if it contains a path
              const imageName = prod.image.split('/').pop();
              prod.image = `/media/Products_Pictures/${imageName}`;
            }
          });
        }
        
        if (this.order && this.order.product && this.order.product.length > 0) {
          this.getComments(this.order.product[0].seller);
        }
      },
      error => {
        console.log("Can't get Order");
      }
    );
  }
  
  // Add a method to navigate to the product profile
  viewProduct(productId) {
    if (productId) {
      this.router.navigate([`/buyer/products/product-profile/${productId}`]);
    }
  }
  
  editOrder(order) {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      data: {
        order: order,
      },
      width: '500px'
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed and result is success
        this.showNotification(
          'snackbar-success',
          'Order edited Successfully...!!!',
          'bottom',
          'center'
        );
        
        // Navigate back to orders list
        setTimeout(() => {
          this.router.navigate(['/buyer/orders/order']);
        }, 1000);
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