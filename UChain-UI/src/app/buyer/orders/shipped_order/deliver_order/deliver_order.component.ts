import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
} from '@angular/forms';
import { Order } from '../../order.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../order.service';

@Component({
    selector: 'app-deliver_order',
    templateUrl: './deliver_order.component.html',
    styleUrls: ['./deliver_order.component.sass'],
    standalone: false
})
export class DeliverOrderComponent {
  dialogTitle: string;
  dialogSubTitle: string;
  deliverForm: UntypedFormGroup;
  order: Order;
  username: string;
  ratingTarget: string; // 'seller' or 'driver'
  
  constructor(
    public dialogRef: MatDialogRef<DeliverOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.order.product[0].name;
    this.order = data.order;
    this.ratingTarget = data.ratingTarget || 'seller'; // Default to seller if not specified
    
    // Set appropriate title based on who is being rated
    if (this.ratingTarget === 'driver') {
      this.dialogSubTitle = 'Rate the Driver';
    } else {
      this.dialogSubTitle = 'Rate the Seller';
    }
    
    this.deliverForm = this.createContactForm();
    this.getUserToRate();
  }
  
  formControl = new UntypedFormControl('', [
    Validators.required,
    // Validators.email,
  ]);
  
  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }
  
  createContactForm(): UntypedFormGroup {
    return this.deliverForm = this.fb.group({
      receiver: [this.username],
      rating_value: ['',[Validators.required]],
      comment: ['',[Validators.required]],
      order: [this.order.id],
    });
  }
  
  getUserToRate(){
    // Determine which user to load based on rating target
    if (this.ratingTarget === 'driver') {
      this.orderService.getOneUser(this.order.driver).subscribe(
        data => {
          this.username = data.username;
          this.deliverForm.patchValue({
            receiver: this.username
          });
        },
        error => {
          console.log("Can't get Driver information");
        }
      );
    } else {
      // Default to rating the seller
      this.orderService.getOneUser(this.order.product[0].seller).subscribe(
        data => {
          this.username = data.username;
          this.deliverForm.patchValue({
            receiver: this.username
          });
        },
        error => {
          console.log("Can't get Seller information");
        }
      );
    }
  }
  
  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    const data = {
      "receiver": this.username,
      "rating_value": parseInt(this.deliverForm.value.rating_value),
      "comment": this.deliverForm.value.comment,
      "order": this.order.id
    }
    
    // Different logic when submitting from delivered orders page vs shipped orders page
    if (this.data.fromDeliveredPage) {
      // Just submit rating without changing order status
      this.orderService.deliverOrder(data).subscribe(
        _ => {
          this.showNotification(
            'snackbar-success',
            `${this.ratingTarget === 'driver' ? 'Driver' : 'Seller'} Rating Submitted Successfully!`,
            'bottom',
            'center'
          );
          this.dialogRef.close(1);
        },
        _ => {
          this.showNotification(
            'snackbar-danger',
            'Could not submit rating. Please try again.',
            'bottom',
            'center'
          );
        }
      );
    } else {
      // From shipped orders page - also change order status to Delivered
      this.orderService.deliverOrder(data).subscribe(
        _ => {
          // Use the robust approach to update order status
          this.orderService.getMyOrder().subscribe(
            (allOrders) => {
              // Find the order we want to update
              const orderToUpdate = allOrders.find(order => order.id === this.order.id);
              
              if (orderToUpdate) {
                // Get current date for order update
                const currentDate = new Date().toISOString();
                
                // Create a complete payload with all required fields
                const updateData = {
                  quantity: orderToUpdate.quantity, // Required field
                  status: 'Delivered', // Fixed capitalization to match filtering logic
                  order_date: currentDate,
                  delivered_date: currentDate // Add delivery timestamp
                };
                
                // Update order with complete payload
                this.orderService.editOrder(updateData, this.order.id).subscribe(
                  _ => {
                    this.showNotification(
                      'snackbar-success',
                      'Order Confirmed as Delivered Successfully!',
                      'bottom',
                      'center'
                    );
                    // Close the dialog and notify parent component
                    this.dialogRef.close(1);
                    
                    // Add a delay to show the success notification before redirecting
                    setTimeout(() => {
                      // Redirect to delivered orders page instead of just reloading
                      window.location.href = '/#/app/buyer/orders/delivered_order';
                    }, 2000);
                  },
                  _ => {
                    this.showNotification(
                      'snackbar-danger',
                      'Ops! cannot mark order as delivered. Try Again...!!!',
                      'bottom',
                      'center'
                    );
                  }
                );
              } else {
                this.showNotification(
                  'snackbar-danger',
                  'Order not found in the list. Please try again.',
                  'bottom',
                  'center'
                );
              }
            },
            _ => {
              this.showNotification(
                'snackbar-danger',
                'Could not retrieve order details. Please try again.',
                'bottom',
                'center'
              );
            }
          );
        },
        _ => {
          this.showNotification(
            'snackbar-danger',
            'Ops! can not submit rating. Try Again...!!!',
            'bottom',
            'center'
          );
        }
      );
    }
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
