import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { BehaviorSubject, Observable} from 'rxjs';
import { apiUrl } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { User } from 'src/app/shared/security/user';
import { Rate } from './rate';
import { Message } from 'src/app/apps/chat/message';
@Injectable()
export class MessageService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<Message[]> = new BehaviorSubject<
    Message[]
  >([]);

  constructor(private httpClient: HttpClient,  private tokenStorage: TokenStorageService) {}
  get data(): Message[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getOneMessage(id){
    const getOneMessageUrl = apiUrl+'message/'+id
    return this.httpClient.get<Message>(getOneMessageUrl)
  }
  getMessages(){
    const messageUrl = apiUrl + 'message/all'
    return this.httpClient.get<Message[]>(messageUrl)
  }
  sendMessage(data): Observable<string> {
    const sendMessageUrl = apiUrl+'send/';
    return this.httpClient.post<string>(sendMessageUrl, data);
    }
}
