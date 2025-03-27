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
import { environment } from 'src/environments/environment';

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
  user: User = new User(); // Initialize user to avoid undefined errors
  tx_ref: string = this.tokenStorageService.getTxRef()
  apiUrl = environment.apiUrl; // Make apiUrl accessible in the template
  productImageUrl: string = ''; // Property to hold the fixed product image URL
  userImageUrl: string = ''; // Property to hold the fixed user image URL
  
  constructor(private productService: ProductService, private userService: UserService,private route: ActivatedRoute,private snackBar: MatSnackBar,public dialog: MatDialog, private tokenStorageService: TokenStorageService,private router: Router) {
  }
  
  ngOnInit(): void {
    // Check if there's a tx_ref in URL parameters FIRST - this happens after redirect from Chapa
    this.route.queryParams.subscribe(params => {
      const txRef = params['tx_ref'];
      
      // First check if auth data is present in URL (from Chapa redirect)
      const authToken = params['auth_token'];
      const userId = params['user_id'];
      const isAuthenticated = params['is_authenticated'];
      const userRole = params['user_role'];
      
      // If we have auth data in URL, restore the session immediately
      if (authToken && userId && isAuthenticated === 'true') {
        console.log('Found authentication data in URL, restoring session...');
        this.tokenStorageService.saveToken(authToken);
        this.tokenStorageService.saveId(userId);
        
        if (userRole) {
          this.tokenStorageService.saveAuthorities(userRole);
          // Also set localStorage values needed by other components
          localStorage.setItem('STATE', 'true');
          localStorage.setItem('ROLE', userRole);
          console.log(`Restored user role: ${userRole}`);
        }
        
        console.log('Authentication successfully restored from URL parameters');
      }
      
      // Only verify if tx_ref is in the URL query parameters (means we're coming from payment gateway)
      if (txRef) {
        console.log('Transaction reference found in URL:', txRef);

        // CRITICAL: Verify if user is authenticated, if not try to recover from session storage
        if (!this.tokenStorageService.getToken()) {
          console.log('Authentication token missing, attempting to recover session...');
          this.recoverSession();
        }
        
        // Enhanced debugging to see all available parameters
        console.log('All URL params:', this.route.snapshot.queryParams);
        console.log('All route params:', this.route.snapshot.params);
        
        // Extract parameters from the full URL (needed due to encoding issues)
        const fullUrl = window.location.href;
        console.log('Full URL:', fullUrl);
        
        let productIdFromUrl = null;
        
        // Try getting product_id from either parameters or directly from URL
        try {
          // Check URL for semicolon-delimited product_id
          if (fullUrl.includes('product_id=')) {
            const productIdMatch = fullUrl.match(/[?&;]product_id=([^&;]+)/);
            if (productIdMatch && productIdMatch[1]) {
              productIdFromUrl = productIdMatch[1];
              console.log('Product ID extracted from full URL:', productIdFromUrl);
            }
          }
          
          // If not found, try the usual parameter mechanisms
          if (!productIdFromUrl) {
            productIdFromUrl = this.route.snapshot.queryParams['product_id'] || 
                           this.route.snapshot.queryParams['amp;product_id'] || // Handle encoding issue
                           params['product_id'] || 
                           this.route.snapshot.params['id'] || 
                           params['id'];
          }
        } catch (e) {
          console.error('Error extracting product ID from URL:', e);
        }
                               
        if (productIdFromUrl && productIdFromUrl !== '0' && productIdFromUrl !== 'undefined') {
          this.productId = productIdFromUrl;
          console.log('Product ID from URL:', this.productId);
          // Get the product details first, then verify
          this.getProduct(this.productId);
          // Store product ID in case we need it later
          sessionStorage.setItem('verifying_product_id', this.productId);
        } else {
          // If no product ID in URL or it's '0', try to get from session storage
          this.productId = sessionStorage.getItem('verifying_product_id');
          console.log('Product ID from session storage:', this.productId);
          if (this.productId) {
            this.getProduct(this.productId);
          }
        }
        // Proceed with verification regardless of product ID
        this.verify(txRef);
      } else {
        console.log('No transaction reference in URL, skipping verification');
        // Standard product loading when not returning from payment
        this.route.params.subscribe(
          (routeParams) => {
            const productId = routeParams['id'];
            if (productId) {
              console.log('Fetching product with ID:', productId);
              this.productId = productId;
              this.getProduct(productId);
            }
          }
        );
      }
    });
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
  
  getComments(id){
    // Check if the seller ID is defined and valid
    if (!id) {
      console.error("Error: Seller ID is undefined");
      this.user = new User(); // Initialize with empty user to avoid template errors
      return;
    }
    
    this.userService.getOneUser(id).subscribe(
      data => {
        this.rate = this.userService.getSellerComments(data.username);
        
        // Fix image path using the helper method
        if (data.profile_image) {
          this.userImageUrl = this.fixImagePath(data.profile_image);
        }
        
        this.user = data;
      },
      error => {
        console.error("Error fetching user data:", error);
        this.user = new User(); // Initialize with empty user to avoid template errors
      }
    )
  }
  
  getProduct(id) {
    console.log('Fetching product with ID:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid product ID, trying to recover from localStorage...');
      this.tryRecoverProductFromStorage();
      return;
    }
    
    this.productService.getOneProduct(id).subscribe(
      data => {
        console.log('Product data received:', JSON.stringify(data));
        this.product = data;
        
        // Fix image path using the helper method
        if (this.product.image) {
          this.productImageUrl = this.fixImagePath(this.product.image);
        }
        
        // Check if seller ID exists before fetching seller details
        if (data && data.seller) {
          console.log('Seller ID found:', data.seller);
          this.getComments(data.seller);
        } else if (data && typeof data === 'object') {
          // Check if seller ID might be in a different format or nested property
          console.log('Looking for seller in object properties...');
          const possibleProperties = Object.keys(data);
          console.log('Available properties:', possibleProperties);
          
          // Try to find seller property in different formats
          for (const prop of possibleProperties) {
            if (prop.toLowerCase().includes('seller')) {
              console.log(`Found possible seller property: ${prop} with value:`, data[prop]);
              if (data[prop]) {
                this.getComments(data[prop]);
                return;
              }
            }
          }
          
          console.error('Error: Product has no seller ID');
          this.showNotification(
            'snackbar-warning',
            'Seller information is not available for this product',
            'bottom',
            'center'
          );
          this.user = new User(); // Initialize with empty user to avoid template errors
        } else {
          console.error('Error: Invalid product data format');
          this.product = new Product();
          this.user = new User();
        }
      },
      error => {
        console.error('Error fetching product:', error);
        
        // Try to recover product details from localStorage as fallback
        this.tryRecoverProductFromStorage();
      }
    );
  }
  
  private tryRecoverProductFromStorage() {
    console.log('Attempting to recover product details from localStorage...');
    try {
      const storedProductJson = localStorage.getItem('last_product_checkout');
      if (storedProductJson) {
        const storedProduct = JSON.parse(storedProductJson);
        console.log('Recovered product from localStorage:', storedProduct);
        
        // Create a Product object from the stored data
        this.product = new Product();
        this.product.id = storedProduct.id;
        this.product.name = storedProduct.name;
        this.product.description = storedProduct.description;
        this.product.price = storedProduct.price;
        this.product.image = storedProduct.image;
        this.product.seller = storedProduct.seller;
        
        // Update product ID for verification
        this.productId = this.product.id;
        
        // Fix image path using the helper method
        if (this.product.image) {
          this.productImageUrl = this.fixImagePath(this.product.image);
        }
        
        // Check if seller ID exists before fetching seller details
        if (this.product.seller) {
          this.getComments(this.product.seller);
        } else {
          this.user = new User(); // Initialize with empty user to avoid template errors
        }
        
        this.showNotification(
          'snackbar-info',
          'Product details recovered from your recent checkout',
          'bottom',
          'center'
        );
      } else {
        console.error('No stored product details found');
        this.product = new Product();
        this.user = new User();
        this.showNotification(
          'snackbar-danger',
          'Could not load product details. Please try again later.',
          'bottom',
          'center'
        );
      }
    } catch (e) {
      console.error('Error recovering product details:', e);
      this.product = new Product();
      this.user = new User();
      this.showNotification(
        'snackbar-danger',
        'Could not load product details. Please try again later.',
        'bottom',
        'center'
      );
    }
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

  verify(tx_ref) {
    if (!tx_ref) {
      console.warn('No transaction reference provided');
      return;
    }
    
    console.log('Verifying transaction:', tx_ref);
    
    // Use the stored productId or get from session storage if not available
    const productId = this.product?.id || this.productId || sessionStorage.getItem('verifying_product_id');
    if (productId) {
      console.log('Product ID for verification order:', productId);
    } else {
      console.warn('No product ID available for order creation');
    }
    
    const order = {
      "quantity": this.tokenStorageService.getQuantity() || "1",
      "product": [
        {
          "id": productId || "0" // Provide a fallback value to prevent null/undefined
        }
      ]
    };
    
    // Check if we have a token before proceeding
    if (!this.tokenStorageService.getToken()) {
      console.error('Cannot verify payment: No authentication token found');
      this.showNotification(
        'snackbar-danger',
        'Session expired. Please log in again to verify your payment.',
        'top',
        'center'
      );
      
      // Save verification data for after login
      sessionStorage.setItem('pending_verification', 'true');
      sessionStorage.setItem('pending_tx_ref', tx_ref);
      sessionStorage.setItem('pending_product_id', productId || '');
      
      // Redirect to login
      setTimeout(() => {
        this.router.navigate(['/buyer/products']);
      }, 2000);
      return;
    }
    
    this.productService.verify(tx_ref).subscribe({
      next: (data) => {
        console.log('Payment verification response:', data);
        
        // Always clear the tx_ref to prevent repeated verification attempts
        this.tokenStorageService.clearTxRef();
        sessionStorage.removeItem('tx_ref');
        sessionStorage.removeItem('pending_verification');
        sessionStorage.removeItem('pending_tx_ref');
        sessionStorage.removeItem('pending_product_id');
        sessionStorage.removeItem('payment_return_pending');
        sessionStorage.removeItem('payment_return_product_id');
        sessionStorage.removeItem('payment_return_tx_ref');
        
        // Only create order if we have a valid product ID
        if (productId) {
          this.productService.addOrder(order).subscribe({
            next: (response) => {
              console.log('Order created successfully:', response);
              
              this.showNotification(
                'snackbar-success',
                'Your order has been placed successfully!',
                'top',
                'center'
              );
              
              // Navigate to the orders page after a short delay
              setTimeout(() => {
                this.router.navigate(['/buyer/orders/order']);
              }, 1500);
            },
            error: (orderError) => {
              console.error('Failed to create order:', orderError);
              
              this.showNotification(
                'snackbar-danger',
                'We had trouble creating your order. Please contact support.',
                'top',
                'center'
              );
              
              // If order creation fails, redirect to products page
              setTimeout(() => {
                this.router.navigate(['/buyer/products']);
              }, 2000);
            }
          });
        } else {
          // No product ID available, just show success and redirect
          this.showNotification(
            'snackbar-warning',
            'Payment was successful, but we could not find your product details. Please check your orders or contact support.',
            'top',
            'center'
          );
          
          setTimeout(() => {
            this.router.navigate(['/buyer/orders/order']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Verification request failed with error:', error);
        
        // Even on verification error, we should try to create the order if we have a product ID
        this.showNotification(
          'snackbar-warning',
          'Payment verification could not be completed, but we\'ll try to process your order.',
          'top',
          'center'
        );
        
        if (productId) {
          this.productService.addOrder(order).subscribe({
            next: (response) => {
              console.log('Order created despite verification issues:', response);
              setTimeout(() => {
                this.router.navigate(['/buyer/orders/order']);
              }, 1500);
            },
            error: (orderError) => {
              console.error('Failed to create order after verification error:', orderError);
              setTimeout(() => {
                this.router.navigate(['/buyer/products']);
              }, 2000);
            }
          });
        } else {
          // No product ID available, redirect to products
          setTimeout(() => {
            this.router.navigate(['/buyer/products']);
          }, 2000);
        }
      }
    });
  }
  
  /**
   * Attempt to recover session from localStorage/sessionStorage
   * when returning from Chapa payment
   */
  private recoverSession(): void {
    console.log('Attempting to recover session from storage...');
    
    // First try to recover from localStorage (more persistent than sessionStorage)
    const tokenLocal = localStorage.getItem('AuthToken');
    const usernameLocal = localStorage.getItem('AuthUsername');
    const userIdLocal = localStorage.getItem('user_id');
    const authoritiesLocal = localStorage.getItem('AuthAuthorities');
    
    if (tokenLocal && usernameLocal) {
      console.log('Found credentials in localStorage, restoring session');
      this.tokenStorageService.saveToken(tokenLocal);
      this.tokenStorageService.saveUsername(usernameLocal);
      if (userIdLocal) {
        this.tokenStorageService.saveId(userIdLocal);
      }
      if (authoritiesLocal) {
        this.tokenStorageService.saveAuthorities(authoritiesLocal);
        // Also restore role in localStorage for the app's other components
        localStorage.setItem('STATE', 'true');
        localStorage.setItem('ROLE', authoritiesLocal);
      }
      
      console.log('Session successfully recovered from localStorage');
      return;
    }
    
    // Fallback to sessionStorage if localStorage doesn't have the data
    const token = sessionStorage.getItem('AuthToken');
    const username = sessionStorage.getItem('AuthUsername');
    const userId = sessionStorage.getItem('user_id');
    const authorities = sessionStorage.getItem('AuthAuthorities');
    
    if (token && username) {
      console.log('Found credentials in session storage, restoring session');
      this.tokenStorageService.saveToken(token);
      this.tokenStorageService.saveUsername(username);
      if (userId) {
        this.tokenStorageService.saveId(userId);
      }
      if (authorities) {
        this.tokenStorageService.saveAuthorities(authorities);
        // Also restore role in localStorage for the app's other components
        localStorage.setItem('STATE', 'true');
        localStorage.setItem('ROLE', authorities);
      }
      
      console.log('Session successfully recovered from sessionStorage');
      return;
    }
    
    console.warn('Could not recover session, user may need to log in again');
    // If we can't recover the session, we'll show a message to the user
    this.showNotification(
      'snackbar-warning',
      'Your session expired. Please complete your order after logging in again.',
      'top',
      'center'
    );
    
    // Store that we're in the middle of a payment flow so login page can redirect back
    sessionStorage.setItem('payment_return_pending', 'true');
    sessionStorage.setItem('pending_verification', 'true');
    sessionStorage.setItem('pending_product_id', this.productId || '');
    sessionStorage.setItem('pending_tx_ref', this.route.snapshot.queryParams['tx_ref'] || '');
    
    // Also store in localStorage in case sessionStorage gets cleared
    localStorage.setItem('payment_return_pending', 'true');
    localStorage.setItem('pending_verification', 'true');
    localStorage.setItem('pending_product_id', this.productId || '');
    localStorage.setItem('pending_tx_ref', this.route.snapshot.queryParams['tx_ref'] || '');
    
    // Give user time to read the message, then navigate to login
    setTimeout(() => {
      this.router.navigate(['/authentication/signin']);
    }, 2000);
  }

  private handleVerificationFailure(message: string, error?: any) {
    console.error(message, error);
    
    // Extract a more specific error message if available
    let errorMessage = 'We could not verify your payment. Please try again or contact support.';
    if (error && error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    
    this.showNotification(
      'snackbar-danger',
      errorMessage,
      'center',
      'center'
    );
    
    // Navigate back to the products page after a delay
    setTimeout(() => {
      this.router.navigate(['/buyer/products']);
    }, 2000);
  }
  
  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, "", {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }

  buy(productId, price) {
    const quantity = ((document.getElementById("quan") as HTMLInputElement).value);
    if(quantity){
      this.tokenStorageService.saveQuantity(quantity);
    } else {
      this.tokenStorageService.saveQuantity("1");
    }
    this.tokenStorageService.savePId(productId);
    
    // Log full details of payment attempt for debugging
    console.log('Payment initialization attempt - Product:', this.product);
    console.log('Payment details - ID:', productId, 'Price:', price, 'Quantity:', quantity || "1");
    
    // More explicit error handling for payment initialization
    try {
      this.productService.pay(price, this.tokenStorageService.getUsername(), productId)
        .subscribe({
          next: (res) => {
            console.log('Payment initialization response:', res);
            
            // Check if we have a valid checkout URL from Chapa
            if (res && res.response && res.response.checkout_url) {
              window.location.href = res.response.checkout_url;
            } else {
              console.error('Invalid response format from payment service:', res);
              this.showNotification(
                'snackbar-danger',
                'Could not initialize payment. Invalid response from payment service.',
                'top',
                'center'
              );
            }
          },
          error: (err) => {
            console.error('Payment initialization error:', err);
            
            // Extract more specific error message if available
            let errorMessage = 'Could not initialize payment. Please try again.';
            if (err.error && err.error.details) {
              errorMessage = `Payment error: ${err.error.details}`;
            }
            
            this.showNotification(
              'snackbar-danger',
              errorMessage,
              'top',
              'center'
            );
          }
        });
    } catch (error) {
      console.error('Exception during payment initialization:', error);
      this.showNotification(
        'snackbar-danger',
        'Technical error occurred during payment initialization. Please try again.',
        'top',
        'center'
      );
    }
  }

  checkout(price) {
    const quantity = ((document.getElementById("quan") as HTMLInputElement).value) || "1";
    this.tokenStorageService.saveQuantity(quantity);
    
    console.log('Checkout attempt - Product:', this.product);
    console.log('Checkout details - Price:', price, 'Quantity:', quantity);
    
    try {
      this.productService.checkout(this.product, price, quantity)
        .subscribe({
          next: (res) => {
            console.log('Checkout response:', res);
            
            // Check if we have a valid checkout URL
            if (res && res.response && res.response.checkout_url) {
              console.log('Redirecting to Chapa checkout URL:', res.response.checkout_url);
              window.location.href = res.response.checkout_url;
            } else {
              console.error('Invalid checkout response format:', res);
              this.showNotification(
                'snackbar-danger',
                'Could not process checkout. Invalid response from payment service.',
                'top',
                'center'
              );
            }
          },
          error: (err) => {
            console.error('Checkout error:', err);
            
            // Extract more specific error message if available
            let errorMessage = 'Could not initialize payment. Please try again.';
            if (err.error && err.error.details) {
              errorMessage = `Payment error: ${err.error.details}`;
            }
            
            this.showNotification(
              'snackbar-danger',
              errorMessage,
              'top',
              'center'
            );
          }
        });
    } catch (error) {
      console.error('Exception during checkout:', error);
      this.showNotification(
        'snackbar-danger',
        'Technical error occurred during checkout. Please try again.',
        'top',
        'center'
      );
    }
  }
}