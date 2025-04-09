import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from 'src/app/seller/products/product.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { environment } from 'src/environments/environment';
import { DriverService } from '../../drivers/driver.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  // Payment details
  txRef: string = '';
  productId: string = '';
  productName: string = '';
  userName: string = '';
  amount: string = '';
  isVerified: boolean = false;
  isVerifying: boolean = true;
  orderCreated: boolean = false;
  
  // UI state
  loadingMessage: string = 'Verifying your payment...';

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private tokenStorageService: TokenStorageService,
    private driverService: DriverService
  ) { }

  ngOnInit(): void {
    // Extract transaction reference and product ID from URL
    this.route.queryParams.subscribe(params => {
      // Extract parameters from the full URL (needed due to encoding issues)
      const fullUrl = window.location.href;
      console.log('Full URL:', fullUrl);
      
      // Try getting tx_ref from either parameters or directly from URL
      try {
        if (fullUrl.includes('tx_ref=')) {
          const txRefMatch = fullUrl.match(/[?&;]tx_ref=([^&;]+)/);
          if (txRefMatch && txRefMatch[1]) {
            this.txRef = txRefMatch[1];
            console.log('Transaction reference extracted from URL:', this.txRef);
          }
        }
        
        // Try getting product_id from either parameters or directly from URL
        if (fullUrl.includes('product_id=')) {
          const productIdMatch = fullUrl.match(/[?&;]product_id=([^&;]+)/);
          if (productIdMatch && productIdMatch[1]) {
            this.productId = productIdMatch[1];
            console.log('Product ID extracted from URL:', this.productId);
          }
        }
        
        // If we couldn't extract from URL, fall back to standard query params
        if (!this.txRef) {
          this.txRef = params['tx_ref'] || '';
        }
        
        if (!this.productId) {
          this.productId = params['product_id'] || params['ProductId'] || '';
        }
        
        // Check localStorage/sessionStorage as fallback
        if (!this.productId) {
          this.productId = localStorage.getItem('verifying_product_id') || 
                           sessionStorage.getItem('verifying_product_id') || '';
          console.log('Product ID from storage:', this.productId);
        }
        
        // Set user name
        this.userName = this.tokenStorageService.getUsername() || 'Valued Customer';
        
        // If we have tx_ref, verify the payment
        if (this.txRef) {
          this.verifyPayment();
        } else {
          this.isVerifying = false;
          this.showNotification(
            'snackbar-warning', 
            'No transaction reference found. Cannot verify payment.', 
            'top', 
            'center'
          );
        }
      } catch (e) {
        console.error('Error extracting parameters from URL:', e);
        this.isVerifying = false;
        this.showNotification(
          'snackbar-danger', 
          'Error processing payment details. Please contact support.', 
          'top', 
          'center'
        );
      }
    });
  }
  
  /**
   * Verify the payment with Chapa
   */
  verifyPayment() {
    this.isVerifying = true;
    this.loadingMessage = 'Verifying your payment...';
    
    this.productService.verify(this.txRef).subscribe({
      next: (data) => {
        console.log('Payment verification response:', data);
        
        // Check if verification was successful
        if (data && (data.status === 'success' || data.status === 'ok')) {
          this.isVerified = true;
          
          // Set payment as completed in the DriverService
          this.driverService.setPaymentCompleted();
          
          // Try to get product details if we have a product ID
          if (this.productId) {
            this.getProductDetails(this.productId);
          }
          
          // Create order
          this.createOrder();
        } else {
          this.isVerifying = false;
          this.showNotification(
            'snackbar-warning',
            'Payment could not be verified. Please contact support.',
            'top',
            'center'
          );
        }
      },
      error: (error) => {
        console.error('Payment verification error:', error);
        this.isVerifying = false;
        
        // Even if verification fails, try to create the order if we have a product ID
        if (this.productId) {
          this.showNotification(
            'snackbar-warning',
            'Payment verification issue, but we will process your order.',
            'top',
            'center'
          );
          this.createOrder();
        } else {
          this.showNotification(
            'snackbar-danger',
            'Payment verification failed. Please contact support.',
            'top',
            'center'
          );
        }
      }
    });
  }
  
  /**
   * Get product details from API
   */
  getProductDetails(productId: string) {
    this.productService.getOneProduct(productId).subscribe({
      next: (data) => {
        console.log('Product details:', data);
        if (data) {
          this.productName = data.name || 'Coffee/Teff Product';
          
          // Get the quantity from storage
          const quantity = parseInt(this.tokenStorageService.getQuantity() || '1', 10);
          
          // Calculate total amount based on quantity and price
          if (data.price) {
            const unitPrice = parseFloat(data.price);
            const totalAmount = unitPrice * quantity;
            this.amount = totalAmount.toFixed(2);
            console.log('Calculated total amount:', this.amount, 'for', quantity, 'items at', unitPrice, 'each');
          }
        }
      },
      error: (error) => {
        console.error('Error fetching product details:', error);
        
        // Try to get product info from localStorage as fallback
        try {
          const storedProductJson = localStorage.getItem('last_product_checkout');
          if (storedProductJson) {
            const storedProduct = JSON.parse(storedProductJson);
            console.log('Recovered product from localStorage:', storedProduct);
            this.productName = storedProduct.name || 'Coffee/Teff Product';
            
            // Get the quantity from storage
            const quantity = parseInt(this.tokenStorageService.getQuantity() || '1', 10);
            
            // Calculate total amount based on quantity and price from localStorage
            if (storedProduct.price) {
              const unitPrice = parseFloat(storedProduct.price);
              const totalAmount = unitPrice * quantity;
              this.amount = totalAmount.toFixed(2);
              console.log('Calculated total amount from localStorage:', this.amount, 'for', quantity, 'items at', unitPrice, 'each');
            }
          }
        } catch (e) {
          console.error('Error recovering product details from storage:', e);
          this.productName = 'Coffee/Teff Product';
        }
      }
    });
  }
  
  /**
   * Create an order for the purchased product
   */
  createOrder() {
    this.loadingMessage = 'Creating your order...';
    
    // Get the current user ID
    const buyerId = this.tokenStorageService.getId();
    
    const order = {
      "quantity": this.tokenStorageService.getQuantity() || "1",
      "product": [
        {
          "id": this.productId || "0" // Provide a fallback value to prevent null/undefined
        }
      ],
      "buyer": buyerId  // Explicitly include the buyer ID 
      // No driver field - will be assigned during driver selection step
    };
    
    console.log('Creating order with explicit buyer ID:', order);
    
    this.productService.addOrder(order).subscribe({
      next: (response) => {
        console.log('Order created successfully:', response);
        this.orderCreated = true;
        this.isVerifying = false;
        
        // Store the newly created order ID in localStorage
        try {
          // Parse the response if it's a string
          const orderData = typeof response === 'string' ? JSON.parse(response) : response;
          
          if (orderData && orderData.id) {
            console.log(`Storing newly created order ID ${orderData.id} in localStorage`);
            localStorage.setItem('current_order_id', orderData.id.toString());
          }
        } catch (e) {
          console.error('Error parsing order response:', e);
        }
        
        this.showNotification(
          'snackbar-success',
          'Your order has been placed successfully!',
          'top',
          'center'
        );
      },
      error: (orderError) => {
        console.error('Failed to create order:', orderError);
        this.isVerifying = false;
        
        this.showNotification(
          'snackbar-warning',
          'Order creation issue. Please check your orders page.',
          'top',
          'center'
        );
      }
    });
  }
  
  /**
   * Navigate to select driver page
   */
  goToSelectDriver() {
    // Set payment completed flag and redirect to driver selection page with success parameter
    localStorage.setItem('payment_completed', 'true');
    this.router.navigate(['/app/buyer/drivers/select-driver'], { queryParams: { payment: 'success' } });
  }
  
  /**
   * Navigate to products page
   */
  goToProducts() {
    this.router.navigate(['/app/buyer/products/product']);
  }
  
  /**
   * Show a notification message
   */
  showNotification(colorName: string, text: string, placementFrom: string, placementAlign: string) {
    this.snackBar.open(text, '', {
      duration: 3000,
      verticalPosition: placementFrom as any,
      horizontalPosition: placementAlign as any,
      panelClass: colorName,
    });
  }
}
