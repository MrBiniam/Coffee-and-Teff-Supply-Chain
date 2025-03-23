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
    
    // Log the complete data object being passed to the pay method
    console.log('Payment data:', {
      price: this.data.price,
      username: this.username,
      productId: this.data.productId
    });
    
    this.productService.pay(this.data.price,this.username,this.data.productId).subscribe(
        data => {
          // Log the complete response for debugging
          console.log('Full payment response:', data);
          
          // Check if the response has the expected structure
          if (data && data.response && data.response.status == 'success') {
            // Store transaction reference
            if (data.tx_ref) {
              this.tokenStorageService.saveTxRef(data.tx_ref);
              console.log('Payment initialized with tx_ref:', data.tx_ref);
            }
            
            // Show notification before redirecting
            this.showNotification(
              'snackbar-info',
              'Redirecting to payment gateway...',
              'top',
              'center'
            );
            
            // Handle different response structures to find checkout_url
            let checkoutUrl = null;
            
            if (data.response.data && data.response.data.checkout_url) {
              checkoutUrl = data.response.data.checkout_url;
            } else if (data.response.checkout_url) {
              checkoutUrl = data.response.checkout_url;
            } else if (data.checkout_url) {
              checkoutUrl = data.checkout_url;
            }
            
            if (checkoutUrl) {
              console.log('Redirecting to checkout URL:', checkoutUrl);
              
              // Short delay to ensure the notification is seen
              setTimeout(() => {
                // Redirect to Chapa payment page
                window.location.href = checkoutUrl;
              }, 1000);
            } else {
              console.error('No checkout URL found in the response');
              this.showNotification(
                'snackbar-danger',
                'Payment gateway URL not found. Please contact support.',
                'bottom',
                'center'
              );
            }
          } else {
            // Handle payment initialization failure
            this.showNotification(
              'snackbar-danger',
              'Could not initialize payment. Please try again.',
              'bottom',
              'center'
            );
          }
        },
        error => {
          console.error('Payment initialization error:', error);
          this.showNotification(
            'snackbar-danger',
            'Payment service error. Please try again later.',
            'bottom',
            'center'
          );
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
