import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from 'src/app/seller/products/product.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delete',
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.sass'],
})
export class PayComponent {
  username: string
  constructor(
    public dialogRef: MatDialogRef<PayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public productService: ProductService,
    private snackBar: MatSnackBar,
    private tokenStorageService: TokenStorageService,
    private router: Router,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
  pay(): void {
    this.username = this.tokenStorageService.getUsername()
    this.productService.pay(this.data.price,this.username).subscribe(
        data=>{
          if(data.response.status=='success'){
            this.tokenStorageService.saveTxRef(data.tx_ref)
            console.log(data.tx_ref)
            window.location.href=data.response.data.checkout_url
          }
        }
    //   _=>{
    //     this.showNotification(
    //       'snackbar-success',
    //       'Product Deleted Successfully...!!!',
    //       'bottom',
    //       'center'
    //     );
    //   },
    //   _=>{
    //     this.showNotification(
    //       'snackbar-danger',
    //       'Cant Delete it Try Agian...!!!',
    //       'bottom',
    //       'center'
    //     );

    //   }
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
