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
    this.orderService.editOrder({'status': "Shipped"},this.data.order.id).subscribe(
      _=>{
        this.showNotification(
          'snackbar-success',
          'Order Shipped Successfully...!!!',
          'bottom',
          'center'
        );
      },
      _=>{
        this.showNotification(
          'snackbar-danger',
          'Cant! Try Agian...!!!',
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
