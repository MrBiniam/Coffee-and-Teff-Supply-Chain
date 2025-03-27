import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Product } from './product.model';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class ProductService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);
  private apiUrl = environment.apiUrl;
  
  constructor(private httpClient: HttpClient, private tokenStorage: TokenStorageService) { }
  get data(): Product[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getMyProduct() {
    const getMyProductUrl = this.apiUrl + 'products';
    return this.httpClient.get<Product[]>(getMyProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching products:', error);
          return of([]);  // Return empty array on error
        })
      );
  }
  getOneProduct(id) {
    const getOneProductUrl = this.apiUrl + 'product/' + id;
    return this.httpClient.get<Product>(getOneProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching product:', error);
          return of(null);  // Return null on error
        })
      );
  }
  addProduct(formData: FormData): Observable<any> {
    const addProductUrl = this.apiUrl + 'product/create';
    // Ensure seller ID is included in form data
    if (!formData.has('seller') && this.tokenStorage.getId()) {
      formData.append('seller', this.tokenStorage.getId());
    }
    return this.httpClient.post<any>(addProductUrl, formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error creating product:', error);
          return of({ error: 'Failed to create product' });
        })
      );
  }
  editProduct(formData: FormData, id): Observable<string> {
    const addProductUrl = this.apiUrl + 'product/' + id + '/update';
    return this.httpClient.put<string>(addProductUrl, formData);
  }
  deleteProduct(id) {
    const deleteProductUrl = this.apiUrl + 'product/' + id + '/destroy';
    return this.httpClient.delete(deleteProductUrl);
  }
  addOrder(data): Observable<string> {
    const addOrderUrl = this.apiUrl + 'order/create';
    return this.httpClient.post<string>(addOrderUrl, data);
  }
  pay(price, username, productId): Observable<any> {
    const verifyUrl = this.apiUrl + 'pay/';
    // Create a tx_ref that includes a timestamp to make it unique
    const tx_ref = "tx_uchainappsmartsupplychainmanagementpaytxref" + new Date().toISOString().replace(/[-:.TZ]/g, '');
    
    // Store the tx_ref and product_id in sessionStorage so they can be used for verification
    sessionStorage.setItem('tx_ref', tx_ref);
    sessionStorage.setItem('verifying_product_id', productId);
    localStorage.setItem('verifying_product_id', productId);
    this.tokenStorage.saveTxRef(tx_ref);
    
    // Modify to use switchMap for sequential operations
    return this.getOneProduct(productId).pipe(
      switchMap(product => {
        try {
          console.log('Storing product details for payment via pay():', product);
          localStorage.setItem('last_product_checkout', JSON.stringify({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            image: product.image,
            seller: product.seller
          }));
        } catch (e) {
          console.error('Error storing product details:', e);
        }
        
        // Base URL for the frontend application
        const frontendBaseUrl = window.location.origin; // e.g., http://localhost:4200
        
        // Fix URL parameters to avoid encoding issues - use semicolon instead of ampersand
        const callbackUrl = `${frontendBaseUrl}/#/buyer/payments/success?tx_ref=${tx_ref};product_id=${productId}`;
        const returnUrl = `${frontendBaseUrl}/#/buyer/payments/success?tx_ref=${tx_ref};product_id=${productId}`;
        
        // Now make the payment API call
        return this.httpClient.post<any>(verifyUrl, {
          "email": this.tokenStorage.getEmail() || "UChain@gmail.com",
          "amount": price,
          "first_name": username,
          "last_name": "",
          "tx_ref": tx_ref,
          "callback_url": callbackUrl,
          "return_url": returnUrl,
          "currency": "ETB",
          "product_id": productId,
          "product_name": "Coffee/Teff Product"
        });
      })
    );
  }
  
  checkout(product: Product, amount: string, quantity: string): Observable<any> {
    // Create a tx_ref that includes a timestamp to make it unique
    const tx_ref = "tx_uchainappsmartsupplychainmanagementpaytxref" + new Date().toISOString().replace(/[-:.TZ]/g, '');
    
    // Store the tx_ref, product_id, and quantity in sessionStorage/tokenStorage so they can be used for verification
    sessionStorage.setItem('tx_ref', tx_ref);
    sessionStorage.setItem('verifying_product_id', product.id?.toString() || '0');
    localStorage.setItem('verifying_product_id', product.id?.toString() || '0');
    
    // Store additional product info in case ID lookup fails
    try {
      localStorage.setItem('last_product_checkout', JSON.stringify({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        seller: product.seller
      }));
      console.log('Stored product details for payment:', product.id);
    } catch (e) {
      console.error('Error storing product details:', e);
    }
    
    this.tokenStorage.saveTxRef(tx_ref);
    this.tokenStorage.saveQuantity(quantity);
    
    // Base URL for the frontend application
    const frontendBaseUrl = window.location.origin; // e.g., http://localhost:4200
    
    // Create the callback URL and return URL for Chapa - point to our new payment success page
    const callbackUrl = `${frontendBaseUrl}/#/buyer/payments/success?tx_ref=${tx_ref}&product_id=${product.id}`;
    const returnUrl = `${frontendBaseUrl}/#/buyer/payments/success?tx_ref=${tx_ref}&product_id=${product.id}`;
    
    console.log('Initiating checkout for product:', product.id, 'Amount:', amount, 'Quantity:', quantity);
    
    // Ensure that product ID is properly stored both in sessionStorage and localStorage for redundancy
    sessionStorage.setItem('verifying_product_id', product.id?.toString() || '0');
    localStorage.setItem('verifying_product_id', product.id?.toString() || '0');
    
    return this.httpClient.post<any>(this.apiUrl + 'pay/', {
      "amount": amount,
      "currency": "ETB",
      "email": this.tokenStorage.getEmail() || "test@example.com",
      "first_name": this.tokenStorage.getUsername() || "John",
      "last_name": "Doe",
      "tx_ref": tx_ref,
      "callback_url": callbackUrl,
      "return_url": returnUrl,
      "product_id": product.id?.toString() || '0', // Convert to string to fix type error
      "product_name": product.name || "Coffee/Teff Product",
      "phone_number": this.tokenStorage.getPhoneNumber() || ""
    });
  }
  
  verify(tx_ref: string): Observable<any> {
    console.log('Verifying transaction with tx_ref:', tx_ref);
    
    // Use proper Content-Type header for form data
    // Create payload as JSON as the backend expects
    const payload = { tx_ref: tx_ref };
    
    const verifyUrl = this.apiUrl + 'verify/';
    
    return this.httpClient.post<any>(verifyUrl, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Payment verification error:', error);
        // Return a meaningful error object
        return of({ 
          status: 'error', 
          message: 'Payment verification failed', 
          error: error,
          tx_ref: tx_ref // Include tx_ref for debugging
        });
      })
    );
  }
}
