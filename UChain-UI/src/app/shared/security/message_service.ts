import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable} from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { User } from 'src/app/shared/security/user';
import { Rate } from './rate';
import { Message } from 'src/app/shared/security/message.model';

@Injectable()
export class MessageService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Message[]> = new BehaviorSubject<
    Message[]
  >([]);

  constructor(private httpClient: HttpClient, private tokenStorage: TokenStorageService) {}
  
  get data(): Message[] {
    return this.dataChange.value;
  }
  
  getDialogData(): any {
    return this.dialogData
  }
  
  getOneMessage(id): Observable<Message> {
    const getOneMessageUrl = environment.apiUrl + 'messages/' + id;
    return this.httpClient.get<Message>(getOneMessageUrl);
  }
  
  getMessages(): Observable<Message[]> {
    const messageUrl = environment.apiUrl + 'inbox/';
    return this.httpClient.get<Message[]>(messageUrl);
  }
  
  sendMessage(data): Observable<string> {
    const sendMessageUrl = environment.apiUrl + 'send/';
    return this.httpClient.post<string>(sendMessageUrl, data);
  }
}
