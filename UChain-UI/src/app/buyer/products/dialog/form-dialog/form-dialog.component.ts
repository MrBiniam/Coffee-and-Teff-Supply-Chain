import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
} from '@angular/forms';
import { Product } from '../../product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from 'src/app/seller/products/product.service';
import { PayComponent } from '../pay/pay.component';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.sass'],
})
export class FormDialogComponent {
  dialogTitle: string;
  orderForm: UntypedFormGroup;
  product: Product;
  maxQuantity: number = 100; // Default max quantity if parsing fails
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public productService: ProductService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private tokenStorageService: TokenStorageService
  ) {
    // Set the defaults
    this.dialogTitle = data.product.name;
    this.product = data.product;
    
    // Extract the numeric part from the quantity (e.g., "100KG" -> 100)
    if (this.product.quantity && typeof this.product.quantity === 'string') {
      const match = this.product.quantity.match(/^(\d+)/);
      if (match && match[1]) {
        this.maxQuantity = parseInt(match[1]);
      }
    }
    
    this.orderForm = this.createContactForm();
  }
  formControl = new UntypedFormControl('', [
    Validators.required
  ]);
  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : '';
  }
  createContactForm(): UntypedFormGroup {
    return this.orderForm = this.fb.group({
      quantity: [
        1, // Default to 1 as the initial value
        [
          Validators.required,
          Validators.min(1),
          Validators.max(this.maxQuantity),
          Validators.pattern('^[0-9]*$') // Only allow numbers
        ]
      ],
    });
  }
  submit() {
    // emppty stuff
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
    // Get the product price (it's already a number, no need to parse)
    const productPrice = this.product.price || 0;
    const orderQuantity = parseInt(this.orderForm.value.quantity) || 1;
    
    // Validate that the quantity is within allowed range
    if (orderQuantity < 1 || orderQuantity > this.maxQuantity) {
      this.showNotification(
        'snackbar-danger',
        `Order quantity must be between 1 and ${this.maxQuantity}`,
        'bottom',
        'center'
      );
      return;
    }
    
    const totalPrice = isNaN(productPrice) ? 0 : orderQuantity * productPrice;

    const dialogRef = this.dialog.open(PayComponent, {
      data: {
        ProductId: this.product.id,
        name: this.product.name,
        price: totalPrice.toString() // Convert to string to match expected type
      },
    });
    this.tokenStorageService.savePId(this.product.id.toString());
    this.tokenStorageService.saveQuantity(orderQuantity.toString());
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
