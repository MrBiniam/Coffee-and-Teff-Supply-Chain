import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Order } from './order.model';
import { catchError } from 'rxjs/operators';
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
    return this.httpClient.get<Order[]>(getMyProductUrl)
      .pipe(
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
}
