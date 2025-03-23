import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from 'src/app/seller/products/product.model';
import { ProductService } from 'src/app/seller/products/product.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.sass']
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  apiUrl = environment.apiUrl; // Make apiUrl accessible in the template

  constructor(private productService: ProductService, private router: Router) { }

  ngOnInit(): void {
    this.getProduct();
  }

  getProduct() {
    this.productService.getMyProduct().subscribe(
      data => {
        this.products = data;

        // Fix image paths for all products
        this.products.forEach(product => {
          if (product.image) {
            // Remove any duplicate slashes or incorrect path prefixes
            if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
              // If it's a full URL, keep it as is
              product.image = product.image;
            } else {
              // Otherwise, clean up the path by removing any starting slashes
              product.image = product.image.replace(/^\/+/, '');
              // Only add media/ prefix if not already there
              if (!product.image.startsWith('media/')) {
                product.image = 'media/' + product.image;
              }
            }
          }
        });
      },
      error => {
        console.log("Can't get Product", error);
      }
    );
  }

  productDetail(id) {
    this.router.navigate([`/buyer/products/product-profile/${id}`]);
  }

  // Helper method to get the properly formatted image URL
  getImageUrl(product: Product): string {
    if (!product || !product.image) return '';
    
    // If it's already a full URL, keep it as is
    if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
      return product.image;
    }
    
    // Otherwise, clean up the path by removing any starting slashes
    let imagePath = product.image.replace(/^\/+/, '');
    
    // Only add media/ prefix if not already there
    if (!imagePath.startsWith('media/')) {
      imagePath = 'media/' + imagePath;
    }
    
    // Combine with API URL and clean up any double slashes
    let fullUrl = environment.apiUrl + imagePath;
    return fullUrl.replace(/([^:])\/+/g, '$1/');
  }
}
