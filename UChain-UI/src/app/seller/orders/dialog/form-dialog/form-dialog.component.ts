import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { Order } from '../../order.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from 'src/app/buyer/orders/order.service';


@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.sass'],
})
export class FormDialogComponent {
  dialogTitle: string;
  orderForm: FormGroup;
  order: Order;
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.order.product[0].name;
    this.order = data.order;
    this.orderForm = this.createContactForm();
  }
  formControl = new FormControl('', [
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
  createContactForm(): FormGroup {
    return this.orderForm = this.fb.group({
      quantity: [this.order.quantity, [Validators.required]],
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
      this.orderService.addOrder(data).subscribe(
        _=> {
            this.showNotification(
              'snackbar-success',
              'Order Submitted Successfully...!!!',
              'bottom',
              'center'
            );
          },
        _=> {
          this.showNotification(
            'snackbar-danger',
            'Ops! can not place order. Try Again...!!!',
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
