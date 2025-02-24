import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { Product } from '../../product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from 'src/app/seller/products/product.service';
import { PayComponent } from '../pay/pay.component';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.sass'],
})
export class FormDialogComponent {
  dialogTitle: string;
  orderForm: FormGroup;
  product: Product;
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private tokenStorageService: TokenStorageService
  ) {
    // Set the defaults
    this.dialogTitle = data.product.name;
    this.product = data.product;
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
      quantity: [this.product.quantity, [Validators.required ,Validators.pattern('[0-9]*')]],
    });
  }
  submit() {
    // emppty stuff
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
    //   const data = {
    //     "quantity": `${this.orderForm.value.quantity}`,
    //     "product": [
    //       {
    //         "id": this.product.id
    //       }
    //     ]
    //   }
    //   this.productService.addOrder(data).subscribe(
    //     _=> {
    //         this.showNotification(
    //           'snackbar-success',
    //           'Order Submitted Successfully...!!!',
    //           'bottom',
    //           'center'
    //         );
    //       },
    //     _=> {
    //       this.showNotification(
    //         'snackbar-danger',
    //         'Ops! can not place order. Try Again...!!!',
    //         'bottom',
    //         'center'
    //       );
    //     }
    //   );
    // }

    // showNotification(colorName, text, placementFrom, placementAlign) {
    //   this.snackBar.open(text, '', {
    //     duration: 2000,
    //     verticalPosition: placementFrom,
    //     horizontalPosition: placementAlign,
    //     panelClass: colorName,
    //   });
    // }

    const dialogRef = this.dialog.open(PayComponent, {
      data: {
        name: this.product.name,
        price: (+this.orderForm.value.quantity)*this.product.price
      },
    });
    this.tokenStorageService.savePId(this.product.id.toString())
    this.tokenStorageService.saveQuantity(this.orderForm.value.quantity)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside DataService
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
