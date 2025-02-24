import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from 'src/app/seller/products/product.model';
import { ProductService } from 'src/app/seller/products/product.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.sass']
})
export class ProductComponent implements OnInit {
  products: Product[];

  constructor(private productService: ProductService,private router: Router) { this.getProduct()}

  ngOnInit(): void {
  }
  getProduct(){
    this.productService.getMyProduct().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.image.includes("127.0.0.1:8000")){
            value.image = value.image.substring(21)
          }
        })
        this.products = data;
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }
  productDetail(id) {
    this.router.navigate([`/buyer/products/product-profile/${id}`]);
  }


}
