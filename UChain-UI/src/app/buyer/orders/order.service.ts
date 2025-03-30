import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Order } from './order.model';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/shared/security/user';

@Injectable()
export class OrderService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>([]);
  constructor(private httpClient: HttpClient, private tokenStorage: TokenStorageService) { }
  get data(): Order[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getMyOrder() {
    const getMyProductUrl = environment.apiUrl + 'orders';
    console.log('Fetching orders from:', getMyProductUrl);
    return this.httpClient.get<Order[]>(getMyProductUrl)
      .pipe(
        map(orders => {
          console.log('Raw orders from API:', orders);
          // Sort orders by newest first (assuming higher IDs are newer)
          if (Array.isArray(orders)) {
            return [...orders].sort((a, b) => b.id - a.id);
          }
          return orders;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            console.error('Orders endpoint not found. Please check API configuration:', error);
          } else if (error.status === 500) {
            console.error('Server error when fetching orders. The server might be down or there might be an error in the API:', error);
          } else if (error.status === 401) {
            console.error('Unauthorized access to orders. Please check authentication:', error);
          } else {
            console.error('Error fetching orders:', error);
          }
          return of([]);  // Return empty array on error
        })
      );
  }

  // Method to get all orders (for demonstration purposes)
  getAllOrders() {
    console.log('Getting all orders for demonstration...');
    // Use the regular orders endpoint directly since 'all-orders' might not exist
    const ordersUrl = environment.apiUrl + 'orders';
    console.log('Fetching all orders from:', ordersUrl);
    
    // Don't use custom headers as they cause CORS issues
    return this.httpClient.get<Order[]>(ordersUrl)
      .pipe(
        map(orders => {
          console.log('Raw all orders from API:', orders);
          // Sort orders by newest first (assuming higher IDs are newer)
          if (Array.isArray(orders)) {
            return [...orders].sort((a, b) => b.id - a.id);
          }
          return orders;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching all orders:', error);
          return of([]); // Return empty array on error
        })
      );
  }

  getOneOrder(id) {
    const getOneProductUrl = environment.apiUrl + 'order/' + id;
    return this.httpClient.get<Order>(getOneProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  editOrder(data, id): Observable<string> {
    const addProductUrl = environment.apiUrl + 'order/' + id + '/update';
    return this.httpClient.put<string>(addProductUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error editing order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  deleteOrder(id) {
    const deleteProductUrl = environment.apiUrl + 'order/' + id + '/destroy';
    return this.httpClient.delete(deleteProductUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  addOrder(data): Observable<string> {
    const addOrderUrl = environment.apiUrl + 'order/create';
    return this.httpClient.post<string>(addOrderUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error adding order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  deliverOrder(data): Observable<string> {
    const deliverOrderUrl = environment.apiUrl + 'rate/';
    return this.httpClient.post<string>(deliverOrderUrl, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error delivering order:', error);
          return of(null);  // Return null on error
        })
      );
  }
  getOneUser(id) {
    const getOneUserUrl = environment.apiUrl + 'user/' + id;
    return this.httpClient.get<User>(getOneUserUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching user:', error);
          return of(null);  // Return null on error
        })
      );
  }

  // Method to update order status (for seller/driver acceptance)
  updateOrderStatus(id: number, status: string, acceptedById: number) {
    const updateOrderUrl = environment.apiUrl + 'update-order/' + id;
    
    // Create a payload with the new status and ID of the entity accepting the order
    const payload = {
      status: status,
      accepted_by: acceptedById,
      seller_accepted: status === 'accepted' ? true : false
    };
    
    console.log('Updating order status with payload:', payload);
    
    return this.httpClient.put(updateOrderUrl, payload)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error updating order status:', error);
          // If update-order endpoint doesn't exist, try the regular orders endpoint
          if (error.status === 404) {
            console.log('update-order endpoint not found, trying alternative...');
            return this.httpClient.put(environment.apiUrl + 'orders/' + id, payload);
          }
          throw error;
        })
      );
  }
}
