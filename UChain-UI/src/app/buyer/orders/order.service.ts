import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Order } from './order.model';
import { catchError, map, switchMap } from 'rxjs/operators';
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
    console.log(`Fetching user data from: ${getOneUserUrl} for buyer ID: ${id}`);
    return this.httpClient.get<User>(getOneUserUrl)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`Error fetching user with ID ${id}:`, error);
          return of(null);  // Return null on error
        })
      );
  }

  // Method to update order status (for seller/driver acceptance)
  updateOrderStatus(id: number, status: string, acceptedById: number) {
    // First, fetch the order details to ensure all required fields are included in the update request
    const getOrderUrl = environment.apiUrl + 'order/' + id;
    console.log(`Fetching order ${id} for status update to '${status}'`);
    
    return this.httpClient.get<Order>(getOrderUrl)
      .pipe(
        switchMap(order => {
          if (!order) {
            console.error('Order not found:', id);
            return of(null); // Return null if order not found
          }

          console.log('Original order data:', order);
          
          // IMPORTANT: Make first letter uppercase to match Django convention
          const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
          
          // Create a payload with the required fields from the original order
          const payload = {
            quantity: order.quantity,
            status: formattedStatus, // Use properly capitalized status
            accepted_by: acceptedById,
            seller_accepted: formattedStatus === 'Accepted' ? true : false
          };

          console.log('Updating order status with payload:', payload);

          // Use the correct API endpoint based on the URLs defined in Django backend
          const updateOrderUrl = environment.apiUrl + 'order/' + id + '/update';

          return this.httpClient.put(updateOrderUrl, payload)
            .pipe(
              map(response => {
                console.log('Order update successful! Response:', response);
                
                // Verify the response has the correct status
                if (response && response['status'] !== formattedStatus) {
                  console.warn(`Warning: Server returned status "${response['status']}" but we expected "${formattedStatus}"`);
                }
                
                return response;
              }),
              catchError((error: HttpErrorResponse) => {
                console.error('Error updating order status:', error);
                // If the primary endpoint fails, try alternative endpoints as fallbacks
                if (error.status === 404) {
                  console.log('Primary endpoint not found, trying alternatives...');
                  // Try the first alternative endpoint
                  return this.httpClient.put(environment.apiUrl + 'orders/' + id, payload)
                    .pipe(
                      map(response => {
                        console.log('Order update successful via alternative endpoint! Response:', response);
                        return response;
                      }),
                      catchError((innerError) => {
                        console.error('First alternative endpoint failed:', innerError);
                        // Try one more alternative format as last resort
                        return this.httpClient.put(environment.apiUrl + 'order/' + id, payload)
                          .pipe(
                            map(response => {
                              console.log('Order update successful via second alternative endpoint! Response:', response);
                              return response;
                            })
                          );
                      })
                    );
                }
                throw error;
              })
            );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching order for update:', error);
          return of(null); // Return null on error
        })
      );
  }
}
