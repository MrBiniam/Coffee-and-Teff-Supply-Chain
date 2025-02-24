import { Component, OnInit } from '@angular/core';
import { Product } from '../product.model';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { ProductService } from 'src/app/seller/products/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../dialog/form-dialog/form-dialog.component';
import { UserService } from 'src/app/shared/security/user.service';
import { Rate } from 'src/app/shared/security/rate';
import { User } from 'src/app/shared/security/user';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';

@Component({
  selector: 'app-patient-profile',
  templateUrl: './product-profile.component.html',
  styleUrls: ['./product-profile.component.sass']
})
export class ProductProfileComponent implements OnInit {
  product: Product = new Product();
  productId: any;
  rate: Rate[]
  stars: boolean[] = Array(5).fill(false);
  user: User
  tx_ref: string = this.tokenStorageService.getTxRef()
  constructor(private productService: ProductService, private userService: UserService,private route: ActivatedRoute,private snackBar: MatSnackBar,public dialog: MatDialog, private tokenStorageService: TokenStorageService,private router: Router) {
    if(this.route.snapshot.paramMap.get('id')=='0'){
      this.productId=this.tokenStorageService.getPId();
      this.verify(this.tx_ref)
    }  else{
      this.productId=this.route.snapshot.paramMap.get('id');
    }
    console.log(this.productId)
    this.getProduct(+this.productId);
  }
  ngOnInit(): void {
  }
  getComments(id){
    this.userService.getOneUser(id).subscribe(
      data=>{
        this.rate =this.userService.getSellerComments(data.username)
        data.profile_image= data.profile_image.substring(21)
        this.user = data
      }
    )
  }
  getProduct(id){
    this.productService.getOneProduct(id).subscribe(
      data=>{
        this.product = data;
        if(this.product.image.includes("127.0.0.1:8000")){
          this.product.image = this.product.image.substring(21)
        }
        this.getComments(data.seller)
      }
      , error =>{
          console.log("Can't get Product")
      }
    );
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
      }
    });
  }

  verify(tx_ref){
    const order = {
          "quantity": `${this.tokenStorageService.getQuantity()}`,
          "product": [
            {
              "id": this.productId
            }
          ]
        }
    this.productService.verify(tx_ref).subscribe(
      data=>{
        if(data.status=='success'){
          this.productService.addOrder(order).subscribe(
                _=> {
                    this.showNotification(
                      'snackbar-success',
                      'Payment Payed Successfully...!!!',
                      'center',
                      'center'
                    );
                    this.router.navigate([`/buyer/orders/order`]);
                  },
                _=> {
                  this.showNotification(
                    'snackbar-danger',
                    'Ops! There is a Problem. Try Again...!!!',
                    'center',
                    'center'
                  );
                }
              );
        }else{
          this.showNotification(
            'snackbar-danger',
            'Payment Unsuccessful please try again...!!!',
            'center',
            'center'
          );
        }
      }
    )
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