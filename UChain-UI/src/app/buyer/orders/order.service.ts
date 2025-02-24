import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { apiUrl } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { Order } from './order.model';
import { catchError } from 'rxjs/operators';
import { User } from 'src/app/shared/security/user';
@Injectable()
export class OrderService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Order[]> = new BehaviorSubject<
    Order[]
  >([]);
  constructor(private httpClient: HttpClient,  private tokenStorage: TokenStorageService) {}
  get data(): Order[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getMyOrder(){
    const getMyProductUrl = apiUrl+'orders';
    return this.httpClient.get<Order[]>(getMyProductUrl);
  }
  getOneOrder(id){
    const getOneProductUrl = apiUrl+'order/'+id;
    return this.httpClient.get<Order>(getOneProductUrl);
  }
  editOrder(data, id): Observable<string> {
    const addProductUrl = apiUrl+'order/'+id+'/update';
    return this.httpClient.put<string>(addProductUrl, data);
      }
  deleteOrder(id) {
    const deleteProductUrl = apiUrl+'order/'+id+'/destroy';
    return this.httpClient.delete(deleteProductUrl);
    }
  addOrder(data): Observable<string> {
    const addOrderUrl = apiUrl+'order/create';
    return this.httpClient.post<string>(addOrderUrl, data);
    }
  deliverOrder(data): Observable<string> {
    const deliverOrderUrl = apiUrl+'rate/';
    return this.httpClient.post<string>(deliverOrderUrl, data);
    }
  getOneUser(id){
    const getOneUserUrl = apiUrl+'user/'+id;
    return this.httpClient.get<User>(getOneUserUrl);
  }
}
