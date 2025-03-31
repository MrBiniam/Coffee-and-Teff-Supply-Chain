import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { OrderService } from 'src/app/buyer/orders/order.service';

@Component({
  selector: 'app-ship_order',
  templateUrl: './ship_order.component.html',
  styleUrls: ['./ship_order.component.sass'],
})
export class ShipOrderComponent {
  constructor(
    public dialogRef: MatDialogRef<ShipOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private snackBar: MatSnackBar,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
  shipOrder(): void {
    // Get current date for order update
    const currentDate = new Date().toISOString();
    
    // Create a complete payload with all required fields
    const updateData = {
      quantity: this.data.order.quantity, // Required field from the order
      status: "Shipped",  // Update status to Shipped
      shipped_date: currentDate, // Add shipping timestamp
      order_date: this.data.order.order_date // Preserve the existing order date
    };
    
    console.log('Sending ship order update with payload:', updateData);
    
    this.orderService.editOrder(updateData, this.data.order.id).subscribe(
      response => {
        console.log('Order successfully marked as shipped:', response);
        this.showNotification(
          'snackbar-success',
          'Order Shipped Successfully...!!!',
          'bottom',
          'center'
        );
        this.dialogRef.close(1); // Close with success code
      },
      error => {
        console.error('Error shipping order:', error);
        this.showNotification(
          'snackbar-danger',
          'Cannot ship order. Please try again.',
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
}
