import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { OrderService } from 'src/app/buyer/orders/order.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.sass'],
})
export class DeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private snackBar: MatSnackBar,
    private tokenStorage: TokenStorageService,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
  acceptOrder(): void {
    const driverId = this.tokenStorage.getId();
    this.orderService.editOrder({'driver': driverId},this.data.order.id).subscribe(
      _=>{
        this.showNotification(
          'snackbar-success',
          'Order Accepted Successfully...!!!',
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
