import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-patient-profile',
  templateUrl: './product-profile.component.html',
  styleUrls: ['./product-profile.component.sass']
})
export class ProductProfileComponent implements OnInit {
  product: Product = new Product();
  productId: any;
  constructor(private productService: ProductService, private route: ActivatedRoute) {
    this.productId=this.route.snapshot.paramMap.get('id');
    console.log(this.productId)
    this.getProduct(this.productId);
  }
  ngOnInit(): void {
  }
  getProduct(id){
    this.productService.getOneProduct(id).subscribe(
      data=>{
        if(data.image.includes("127.0.0.1:8000")){
          data.image = data.image.substring(21)
        }
        this.product = data;
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
  }


}