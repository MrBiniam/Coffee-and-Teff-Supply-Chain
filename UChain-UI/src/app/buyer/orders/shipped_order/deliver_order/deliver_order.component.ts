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
import { OrderService } from '../../order.service';

@Component({
  selector: 'app-deliver_order',
  templateUrl: './deliver_order.component.html',
  styleUrls: ['./deliver_order.component.sass'],
})
export class DeliverOrderComponent {
  dialogTitle: string;
  deliverForm: FormGroup;
  order: Order;
  username: string;
  constructor(
    public dialogRef: MatDialogRef<DeliverOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrderService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.order.product[0].name;
    this.order = data.order;
    this.deliverForm = this.createContactForm();
    this.getUser()
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
    return this.deliverForm = this.fb.group({
      receiver: [this.username],
      rating_value: ['',[Validators.required]],
      comment: ['',[Validators.required]],
      order: [this.order.id],
    });
  }
  getUser(){
    this.orderService.getOneUser(this.order.product[0].seller).subscribe(
      data=>{
        this.username = data.username;
      }
      , error =>{
          console.log("Can't get User")
      }
    );
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    const data ={
      "receiver": this.username,
      "rating_value": parseInt(this.deliverForm.value.rating_value),
      "comment": this.deliverForm.value.comment,
      "order": this.order.id
    }
      this.orderService.deliverOrder(data).subscribe(
        _=> {
          this.orderService.editOrder({"status": "Delivered"}, this.order.id).subscribe(
            _=>{
              this.showNotification(
                'snackbar-success',
                'Order Delivered Successfully...!!!',
                'bottom',
                'center'
              );
            } , _=>{
              this.showNotification(
                'snackbar-danger',
                'Ops! can not Deliver order. Try Again...!!!',
                'bottom',
                'center'
              );
            }
          );
          },
        _=> {
          this.showNotification(
            'snackbar-danger',
            'Ops! can not Deliver order. Try Again...!!!',
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
