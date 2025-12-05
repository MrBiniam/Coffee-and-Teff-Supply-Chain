import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-seller-product-profile',
    templateUrl: './product-profile.component.html',
    styleUrls: ['./product-profile.component.sass'],
    standalone: false
})
export class SellerProductProfileComponent implements OnInit {
  product: Product = new Product();
  productId: any;
  apiUrl = environment.apiUrl; // Make apiUrl accessible in the template
  productImageUrl: string = ''; // Property to hold the fixed image URL
  
  constructor(private productService: ProductService, private route: ActivatedRoute) {
    this.productId = this.route.snapshot.paramMap.get('id');
    console.log(this.productId);
    this.getProduct(this.productId);
  }
  
  ngOnInit(): void {
  }
  
  // Helper method to fix image URL paths
  private fixImagePath(imagePath: string): string {
    if (!imagePath) return '';
    
    // If it's already a full URL, keep it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, clean up the path by removing any starting slashes
    imagePath = imagePath.replace(/^\/+/, '');
    
    // Only add media/ prefix if not already there
    if (!imagePath.startsWith('media/')) {
      imagePath = 'media/' + imagePath;
    }
    
    // Combine with API URL and clean up any double slashes
    let fullUrl = environment.apiUrl + imagePath;
    return fullUrl.replace(/([^:])\/+/g, '$1/'); 
  }
  
  getProduct(id){
    this.productService.getOneProduct(id).subscribe(
      data => {
        this.product = data;
        
        // Fix image path using the helper method
        if (this.product.image) {
          this.productImageUrl = this.fixImagePath(this.product.image);
        }
      },
      error => {
          console.log("Can't get Product", error);
      }
    );
  }
}