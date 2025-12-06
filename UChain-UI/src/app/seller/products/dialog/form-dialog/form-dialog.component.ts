import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
} from '@angular/forms';
import { Product } from '../../product.model';
import { ProductService } from '../../product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

@Component({
    selector: 'app-form-dialog',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.sass'],
    standalone: false
})
export class FormDialogComponent {
  dialogTitle: string;
  productForm: UntypedFormGroup;
  product: Product;
  selectedImageName = '';
  @ViewChild('imageInput') imageInput: ElementRef<HTMLInputElement>;
  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public productService: ProductService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Set the defaults
    this.dialogTitle = data.product.name;
    this.product = data.product;
    this.selectedImageName = this.product.image ? this.product.image.split('/').pop() : '';
    
    // Format the quantity to uppercase if it exists
    if (this.product.quantity) {
      this.product.quantity = this.formatQuantity(this.product.quantity);
    }
    
    this.productForm = this.createContactForm();
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
    // Determine if image should be required based on whether product already has an image
    const imageValidators = this.product.image ? [] : [Validators.required];
    
    return this.productForm = this.fb.group({
      name: [this.product.name, [Validators.required]],
      description: [this.product.description, [Validators.required]],
      price: [this.product.price, [Validators.required, CustomValidators.positiveNumber()]],
      quantity: [this.product.quantity, [Validators.required, CustomValidators.productQuantity()]],
      image: [null, imageValidators],  
      product_type: [this.product.product_type, [Validators.required]]
    });
  }
  submit() {
    // emppty stuff
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  
  // Helper function to format quantity to uppercase
  formatQuantity(quantity: string): string {
    if (!quantity) return quantity;
    
    // Convert 'kg' part to uppercase, preserving the number and any spaces
    return quantity.replace(/kg$/i, 'KG');
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    this.productForm.get('image')?.setValue(file);
    this.selectedImageName = file.name;
  }
  triggerImageInput() {
    this.imageInput?.nativeElement.click();
  }
  onSubmit() {
    // Format quantity to uppercase
    const quantityValue = this.formatQuantity(this.productForm.get('quantity').value);
    
    const formData = new FormData();
    formData.append('name', this.productForm.get('name').value);
    formData.append('description', this.productForm.get('description').value);
    formData.append('price', this.productForm.get('price').value);
    formData.append('quantity', quantityValue);
    formData.append('product_type', this.productForm.get('product_type').value);
    
    // Check if a new image was selected (native file input)
    const imageControl = this.productForm.get('image');
    const value = imageControl?.value;
    const file =
      value instanceof File
        ? value
        : value?.files?.[0]
          ? value.files[0]
          : null;
    if (file) {
      formData.append('image', file, file.name);
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
      quantity: quantityValue,
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
