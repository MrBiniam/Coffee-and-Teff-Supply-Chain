import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { FormDialogComponent } from '../dialog/form-dialog/form-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-patients',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit {
  products: Product[]=[];
  apiBaseUrl = environment.apiUrl.replace('/api/', '');

  constructor(private productService: ProductService,private tokenStorageService: TokenStorageService, private router: Router, private snackBar: MatSnackBar,public dialog: MatDialog,) { }

  ngOnInit(): void {
    this.getProduct();
  }
  getProduct(){
    this.products = []; // Clear existing products before fetching
    const userId = this.tokenStorageService.getId();
    console.log("Current seller ID:", userId);
    
    if (!userId) {
      this.showNotification(
        'snackbar-warning',
        'User ID not found. Please log in again.',
        'bottom',
        'center'
      );
      return;
    }
    
    this.productService.getMyProduct().subscribe(
      data => {
        console.log("All products received:", data);
        data.forEach((value) => {
          // Convert both IDs to strings for comparison to avoid type mismatches
          const sellerId = value.seller?.toString();
          const currentUserId = userId?.toString();
          
          if (sellerId && currentUserId && sellerId === currentUserId) {
            // Fix image URL formatting
            if (value.image && typeof value.image === 'string') {
              // Handle relative URLs
              if (!value.image.startsWith('http') && !value.image.startsWith('/')) {
                value.image = '/' + value.image;
              }
              
              // Handle 127.0.0.1:8000 URLs
              if (value.image.includes('127.0.0.1:8000')) {
                const path = value.image.split('127.0.0.1:8000')[1];
                value.image = this.apiBaseUrl + path;
              }
              
              // Ensure the URL has a proper domain if it's a relative path
              if (value.image.startsWith('/') && !value.image.startsWith('//')) {
                value.image = this.apiBaseUrl + value.image;
              }
              
              console.log('Processed image URL:', value.image);
            } else {
              console.log('Image missing or not a string:', value.image);
              // Set a default image if none is provided
              value.image = 'assets/images/product-placeholder.png';
            }
            
            this.products.push(value);
          }
        });
        
        console.log("Filtered products for seller:", this.products);
        
        if (this.products.length === 0) {
          this.showNotification(
            'snackbar-info',
            'No products found. Add your first product!',
            'bottom',
            'center'
          );
        }
      },
      error => {
        console.error("Failed to get products:", error);
        this.showNotification(
          'snackbar-danger',
          'Failed to load products. Please try again later.',
          'bottom',
          'center'
        );
      }
    );
  }

  productDetail(id) {
    this.router.navigate([`/seller/products/product-profile/${id}`]);
  }
  editProduct(product) {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      data: {
        product: product,
      },
      width: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Immediately refresh the products list
        this.getProduct();
        // Show success notification
        this.showNotification(
          'snackbar-success',
          'Product Updated Successfully',
          'bottom',
          'center'
        );
      }
    });
  }

  deleteProduct(product) {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id).subscribe(
        () => {
          this.showNotification(
            'snackbar-success',
            'Product deleted successfully',
            'bottom',
            'center'
          );
          this.getProduct(); // Refresh the product list
        },
        error => {
          console.error('Error deleting product:', error);
          this.showNotification(
            'snackbar-danger',
            'Failed to delete product. Please try again.',
            'bottom',
            'center'
          );
        }
      );
    }
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
