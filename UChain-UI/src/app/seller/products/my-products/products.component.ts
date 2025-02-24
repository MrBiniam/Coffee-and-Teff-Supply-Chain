import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Product } from '../product.model';
import { FormDialogComponent } from '../dialog/form-dialog/form-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Component({
  selector: 'app-patients',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit {
  products: Product[]=[];

  constructor(private productService: ProductService,private tokenStorageService: TokenStorageService, private router: Router, private snackBar: MatSnackBar,public dialog: MatDialog,) { this.getProduct()}

  ngOnInit(): void {
  }
  getProduct(){
    const userId =this.tokenStorageService.getId();
    this.productService.getMyProduct().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.seller==+userId){
            if(value.image.includes("127.0.0.1:8000")){
              value.image = value.image.substring(21)
            }
            this.products.push(value)
          }
        })
      }
      , error =>{
          console.log("Can't get Product")
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
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside DataService
        this.getProduct()
        this.showNotification(
          'snackbar-success',
          'Add Record Successfully...!!!',
          'bottom',
          'center'
        );
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
