import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/shared/security/user';
import { UserService } from 'src/app/shared/security/user.service';
import { apiUrl } from 'src/environments/environment';
import { Message } from './message';
import { MessageService } from 'src/app/shared/security/message_service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer: PerfectScrollbarComponent;
  users: User[] = []
  messages: Message[] = []
  username: string = ''
  image:string=''
  sender: string = this.tokenStorageService.getUsername()
  content: string= ''
  hideRequiredControl = new FormControl(false)
  usernames: string[] = []
  constructor(private snackBar: MatSnackBar,private userService: UserService, private messageService: MessageService, private tokenStorageService: TokenStorageService) {
    this.getUsers()
  }
  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.scrollContainer.directiveRef.scrollToBottom();
  }
  intervalId: any;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.getMessages(this.username,this.image);
    }, 20000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  getUsers(){
    this.messageService.getMessages().subscribe(
      data=>{
        data.forEach((value)=>{
          if(value.sender==this.sender){
            if(!this.usernames.includes(value.receiver))
            this.usernames.push(value.receiver)
          }else if(value.receiver==this.sender){
            if(!this.usernames.includes(value.sender))
            this.usernames.push(value.sender)
          }
        })
        this.userService.getUsers().subscribe(
          data=>{
            data.forEach((value)=>{
              this.usernames.forEach((element)=>{
                if(value.username==element){
                  this.users.push(value)
                }
              })
              this.users = this.users.slice().reverse()
            })
          }
        )
      }
    )
  }

  sendMessages(username: string){
    const data ={
      "receiver": username,
      "content": this.content
    }
    this.messageService.sendMessage(data).subscribe(
      _=>{
          this.content=''
          this.getMessages(this.username, this.image)
      },
      _=>{
          console.log('Haha')
          this.showNotification(
            'snackbar-danger',
            'something went wrong...!!!',
            'bottom',
            'center'
          );
      }
    )
  }

  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }

  getMessages(username: string, image: string){
    if(username!=''){
      this.image = image
      this.username = username
      this.messages = []
      this.messageService.getMessages().subscribe(
        data=>{
          console.log(data)
          data.forEach((value)=>{
            if((value.sender==username && value.receiver == this.sender) || (value.sender==this.sender && value.receiver==username)){
              this.messages.push(value)
            }
          })
          this.messages=this.messages.slice().reverse()
        }
      )
      this.scrollToBottom()
      console.log(this.messages)
    }
  }


}
