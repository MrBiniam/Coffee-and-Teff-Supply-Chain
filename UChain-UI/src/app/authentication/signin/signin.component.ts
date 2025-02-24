import { AuthService } from './../../shared/security/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Role } from './../../shared/security/role';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { AuthLoginInfo } from 'src/app/shared/security/login-info';
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
})
export class SigninComponent implements OnInit {
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  private loginInfo: AuthLoginInfo;
  loginForm: FormGroup;
  submitted = false;
  error = '';
  hide = true;
  formBuilder: any;
  constructor(private router:Router,private authService: AuthService, private tokenStorage: TokenStorageService) { }
  ngOnInit() {
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      //this.roles = this.tokenStorage.getAuthorities();
    }
    window.sessionStorage.clear();
    this.loginForm = new FormGroup({
      username: new FormControl(),
      password: new FormControl()
   });
   
  }
  
  get f() {
    return this.loginForm.controls;
  }
  onSubmit() {
    console.log(this.loginForm.controls);
    console.log(this.f.username.value);
 
    this.loginInfo = new AuthLoginInfo(
      this.f.username.value,
      this.f.password.value);
    const formData = new FormData();
    formData.append('username', this.loginForm.get('username').value);
    formData.append('password', this.loginForm.get('password').value);

      this.authService.attemptAuth(formData).subscribe(
        data => {
          
          this.tokenStorage.saveToken(data.token);
          this.tokenStorage.saveUsername(data.user['username']);
          this.tokenStorage.saveProfileImage(data.user['profile_image']);
          this.tokenStorage.saveId(data.user['id'] as string);
          console.log(data.user);
          this.tokenStorage.saveAuthorities(data.user['is_buyer']==true?'BUYER':data.user['is_seller']==true?'SELLER':data.user['is_driver']==true?'DRIVER':'USER');
   
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          const role = this.tokenStorage.getAuthorities();
          if (role === 'BUYER') {
            localStorage.setItem('STATE', 'true');
            localStorage.setItem('ROLE', "BUYER")
            this.router.navigate(['/buyer/dashboard/main']);
          } else if (role === 'SELLER') {
            localStorage.setItem('STATE', 'true');
            localStorage.setItem('ROLE', "SELLER")
            this.router.navigate(['/seller/dashboard']);
          } else if (role === 'DRIVER') {
            localStorage.setItem('STATE', 'true');
            localStorage.setItem('ROLE', "DRIVER")
            this.router.navigate(['/driver/dashboard']);
          }
        },
        error => {
          console.log(error);
          this.errorMessage = error.error.message;
          this.isLoginFailed = true;
        }
      );
    }
  
  reloadPage() {
    window.location.reload();
  }
}

