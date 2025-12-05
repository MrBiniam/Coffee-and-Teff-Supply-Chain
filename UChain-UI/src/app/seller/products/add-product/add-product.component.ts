import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProductService } from '../product.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';


@Component({
    selector: 'app-add-patient',
    templateUrl: './add-product.component.html',
    styleUrls: ['./add-product.component.sass'],
    standalone: false
})
export class AddProductComponent implements OnInit {
  productForm: UntypedFormGroup;
  formErrors = {};

  constructor(private http:HttpClient, private fb: UntypedFormBuilder, private router: Router, private productService: ProductService, private snackBar: MatSnackBar) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, CustomValidators.productTitle()]], // Only letters
      description: ['', [Validators.required, CustomValidators.productDescription()]], // Only letters, multiple sentences
      price: ['', [Validators.required, CustomValidators.positiveNumber()]], // Positive number
      quantity: ['', [Validators.required, CustomValidators.productQuantity()]], // Number followed by unit
      image: ['', [Validators.required]],
      product_type: ['', [Validators.required]],
      location: ['', [Validators.required, CustomValidators.productLocation()]] // Letters or combo of letters and numbers
    });
  }

  ngOnInit() {
    // Monitor form validation status
    this.productForm.valueChanges.subscribe(() => {
      this.checkFormValidity();
    });
    
    // Initial check
    this.checkFormValidity();
  }

  // Helper method to identify which fields are causing validation issues
  checkFormValidity() {
    this.formErrors = {};
    
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control && !control.valid) {
        this.formErrors[key] = true;
        console.log(`Field '${key}' validation failed:`, control.errors);
      }
    });
    
    console.log('Form valid:', this.productForm.valid);
    console.log('Form errors:', this.formErrors);
  }
  
  // Helper function to format quantity to uppercase
  formatQuantity(quantity: string): string {
    if (!quantity) return quantity;
    
    // Convert 'kg' part to uppercase, preserving the number and any spaces
    return quantity.replace(/kg$/i, 'KG');
  }

  onSubmit() {
    // Check form validity one last time
    this.checkFormValidity();

    // Validate the form before submission
    if (!this.productForm.valid) {
      this.showNotification(
        'snackbar-danger',
        'Please correct the form errors before submitting',
        'bottom',
        'center'
      );
      return;
    }

    const formData = new FormData();
    formData.append('name', this.productForm.get('name').value);
    formData.append('description', this.productForm.get('description').value);
    formData.append('price', this.productForm.get('price').value);
    
    // Format quantity to uppercase before submitting
    const quantityValue = this.formatQuantity(this.productForm.get('quantity').value);
    formData.append('quantity', quantityValue);
    
    formData.append('product_type', this.productForm.get('product_type').value);
    formData.append('location', this.productForm.get('location').value);
    
    // Handle file input safely
    const imageControl = this.productForm.get('image');
    if (imageControl.value && imageControl.value._files && imageControl.value._files.length > 0) {
      formData.append('image', imageControl.value._files[0]);
    } else {
      console.error('No image file selected');
      this.showNotification(
        'snackbar-danger',
        'Please select an image file',
        'bottom',
        'center'
      );
      return;
    }
   
    this.productService.addProduct(formData).subscribe(
      data => {
          this.showNotification(
            'snackbar-success',
            'Product Created Successfully...!!!',
            'bottom',
            'center'
          );
          this.router.navigate(['/app/seller/products/my-products']);
        },
      error => {
        console.log(error);
        this.showNotification(
          'snackbar-danger',
          'Can not create Product! Try Again...!!!',
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
