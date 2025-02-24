import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProductService } from '../product.service';


@Component({
  selector: 'app-add-patient',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.sass'],
})
export class AddProductComponent {
  productForm: FormGroup;
  constructor(private http:HttpClient,private fb: FormBuilder, private router: Router, private productService: ProductService, private snackBar: MatSnackBar) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      quantity: ['', [Validators.required]],
      image: ['', [Validators.required]],
      product_type: ['', [Validators.required]],
      location: ['',[Validators.required]]
      
    });
  }

  onSubmit() {

    const formData = new FormData();
      formData.append('name', this.productForm.get('name').value);
      formData.append('description', this.productForm.get('description').value);
      formData.append('price', this.productForm.get('price').value);
      formData.append('quantity', this.productForm.get('quantity').value);
      formData.append('product_type', this.productForm.get('product_type').value);
      formData.append('location', this.productForm.get('location').value);
      formData.append('image', this.productForm.get('image').value._files[0]);
   
      this.productService.addProduct(formData).subscribe(
        data => {
            this.showNotification(
              'snackbar-success',
              'Product Created Successfully...!!!',
              'bottom',
              'center'
            );
            this.router.navigate(['/seller/products/my-products']);
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
