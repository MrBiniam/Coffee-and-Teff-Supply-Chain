import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  Validators,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { Product } from '../../product.model';
import { ProductService } from '../../product.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.sass'],
})
export class FormDialogComponent {
  dialogTitle: string;
  productForm: FormGroup;
  product: Product;
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.product.name;
    this.product = data.product;
    this.productForm = this.createContactForm();
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
    return this.productForm = this.fb.group({
      name: [this.product.name, [Validators.required]],
      description: [this.product.description, [Validators.required]],
      price: [this.product.price, [Validators.required]],
      quantity: [this.product.quantity, [Validators.required]],
      image: [null],  
      product_type: [this.product.product_type, [Validators.required]],
      
    });
  }
  submit() {
    // emppty stuff
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
    const formData = new FormData();
    formData.append('name', this.productForm.get('name').value);
    formData.append('description', this.productForm.get('description').value);
    formData.append('price', this.productForm.get('price').value);
    formData.append('quantity', this.productForm.get('quantity').value);
    formData.append('product_type', this.productForm.get('product_type').value);
    
    // Check if a new image was selected
    const imageControl = this.productForm.get('image');
    if (imageControl && imageControl.value && imageControl.value._files && imageControl.value._files[0]) {
      formData.append('image', imageControl.value._files[0]);
    } else {
      // If no new image was selected, don't modify the existing image
      console.log('No new image selected, keeping existing image');
    }
 
    // Create updated product object
    const updatedProduct = {
      ...this.data.product,
      name: this.productForm.get('name').value,
      description: this.productForm.get('description').value,
      price: this.productForm.get('price').value,
      quantity: this.productForm.get('quantity').value,
      product_type: this.productForm.get('product_type').value
    };

    this.productService.editProduct(formData, this.data.product.id).subscribe(
      response => {
        this.showNotification(
          'snackbar-success',
          'Product Updated Successfully!',
          'bottom',
          'center'
        );
        // Return the updated product instead of just 1
        this.dialogRef.close(updatedProduct);
      },
      error => {
        console.error('Error updating product:', error);
        this.showNotification(
          'snackbar-danger',
          'Cannot Update Product Information! Try Again.',
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
