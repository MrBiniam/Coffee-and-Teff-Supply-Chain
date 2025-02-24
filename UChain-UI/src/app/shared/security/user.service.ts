import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { BehaviorSubject} from 'rxjs';
import { apiUrl } from 'src/environments/environment';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { User } from 'src/app/shared/security/user';
import { Rate } from './rate';
@Injectable()
export class UserService {
  // Temporarily stores data from dialogs
  dialogData: any;
  dataChange: BehaviorSubject<User[]> = new BehaviorSubject<
    User[]
  >([]);
  rate: Rate[] = [];
  totalRate: number = 0;
  counter: number = 0;
  constructor(private httpClient: HttpClient,  private tokenStorage: TokenStorageService) {}
  get data(): User[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData
  }
  getOneUser(id){
    const getOneUserUrl = apiUrl+'user/'+id
    return this.httpClient.get<User>(getOneUserUrl)
  }
  getUsers(){
    const userUrl = apiUrl + 'user/all'
    return this.httpClient.get<User[]>(userUrl)
  }
  updateUser(id,data:FormData){
    const updateUrl = apiUrl+'user/update/'+id
    return this.httpClient.put(updateUrl,data)
  }
  getRatings(){
    const getOneProductUrl = apiUrl+'ratings/'
    return this.httpClient.get<Rate[]>(getOneProductUrl)
  }
  getSellerRating(username: string): number{
    this.getRatings().subscribe(
      data=>{
        this.totalRate = 0
        this.counter = 0
        data.forEach(element => {
          if(element.receiver == username){
            this.totalRate+=+element.rating_value
            this.counter++
          }
        });
        this.totalRate/=this.counter
      },_=>{
        console.log('Cant get Ratings')
      }
    )
    return this.totalRate
  }
  getNumberOfRating(username: string): number{
    this.getRatings().subscribe(
      data=>{
        this.totalRate = 0;
        data.forEach(element => {
          if(element.receiver == username){
            this.totalRate++
          }
        });
      },_=>{
        console.log('Cant get Ratings')
      }
    )
    return this.totalRate
  }
  getSellerComments(username: string): Rate[] {
    this.rate = []
    this.getRatings().subscribe(
      data=>{
        data.forEach((element)=>{
          if(element.receiver==username){
            this.rate.push(element);
          }
        })
      }
    )
    return this.rate;
  }
}
