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
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.sass'],
})
export class FormDialogComponent {
  dialogTitle: string;
  orderForm: UntypedFormGroup;
  order: Order;
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.order.product[0].name;
    this.order = data.order;
    this.orderForm = this.createContactForm();
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
    // Extract just the numeric part of the quantity (remove any transaction ID)
    let quantityValue = this.order.quantity;
    if (typeof quantityValue === 'string') {
      // If it contains a transaction ID in square brackets, extract only the number
      if (quantityValue.includes('[TX:')) {
        quantityValue = quantityValue.split('[')[0].trim();
      }
    }
    
    return this.orderForm = this.fb.group({
      quantity: [quantityValue, [Validators.required]],
    });
  }
  submit() {
    // emppty stuff
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
      const data = {
        "quantity": `${this.orderForm.value.quantity}`,
        "product": [
          {
            "id": this.order.product[0].id
          }
        ]
      }
      
      // Use editOrder instead of addOrder to update existing order
      this.orderService.editOrder(data, this.order.id).subscribe(
        response => {
            // Close the dialog with success result
            this.dialogRef.close(1);
            
            this.showNotification(
              'snackbar-success',
              'Order Updated Successfully!',
              'bottom',
              'center'
            );
            
            // Navigate back to the orders list after a short delay
            setTimeout(() => {
              window.location.href = '/#/app/buyer/orders/order';
            }, 2000);
          },
        error => {
          console.error('Failed to update order:', error);
          this.showNotification(
            'snackbar-danger',
            'Failed to update order. Please try again!',
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
