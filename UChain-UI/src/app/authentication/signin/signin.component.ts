import { AuthService } from './../../shared/security/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
  loginForm: UntypedFormGroup;
  submitted = false;
  error = '';
  hide = true;
  formBuilder: any;

  constructor(private router: Router, private authService: AuthService, private tokenStorage: TokenStorageService) { }

  ngOnInit() {
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      //this.roles = this.tokenStorage.getAuthorities();
    }
    window.sessionStorage.clear();
    this.loginForm = new UntypedFormGroup({
      username: new UntypedFormControl(),
      password: new UntypedFormControl()
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
        this.tokenStorage.saveAuthorities(data.user['is_buyer'] == true ? 'BUYER' : data.user['is_seller'] == true ? 'SELLER' : data.user['is_driver'] == true ? 'DRIVER' : 'USER');

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        const role = this.tokenStorage.getAuthorities();
        
        // Store login timestamp to help components know we just logged in
        const loginTime = new Date().getTime();
        localStorage.setItem('LAST_LOGIN_TIME', loginTime.toString());

        // Check if there's a pending payment verification
        const pendingVerification = sessionStorage.getItem('pending_verification');
        const pendingTxRef = sessionStorage.getItem('pending_tx_ref');
        const pendingProductId = sessionStorage.getItem('pending_product_id');
        const paymentReturnPending = sessionStorage.getItem('payment_return_pending');

        if (role === 'BUYER' && (pendingVerification === 'true' || paymentReturnPending === 'true')) {
          console.log('Detected pending payment verification after login. Redirecting to complete payment...');

          // Set local storage state
          localStorage.setItem('STATE', 'true');
          localStorage.setItem('ROLE', "BUYER");

          // Navigate back to the product with tx_ref to complete verification
          if (pendingTxRef && pendingProductId) {
            this.router.navigate(['/app/buyer/products/product', pendingProductId], {
              queryParams: { tx_ref: pendingTxRef }
            });
          } else if (pendingProductId) {
            this.router.navigate(['/app/buyer/products/product', pendingProductId]);
          } else {
            // If we don't have product ID, redirect to orders page
            this.router.navigate(['/app/buyer/orders/order']);
          }
        } else if (role === 'BUYER') {
          localStorage.setItem('STATE', 'true');
          localStorage.setItem('ROLE', "BUYER")
          // Signal chat component that we're coming from login
          this.router.navigate(['/app/buyer/dashboard/main'], { 
            state: { fromLogin: true, signedInTime: new Date().getTime() } 
          });
        } else if (role === 'SELLER') {
          localStorage.setItem('STATE', 'true');
          localStorage.setItem('ROLE', "SELLER")
          // Signal chat component that we're coming from login
          this.router.navigate(['/app/seller/dashboard'], { 
            state: { fromLogin: true, signedInTime: new Date().getTime() } 
          });
        } else if (role === 'DRIVER') {
          localStorage.setItem('STATE', 'true');
          localStorage.setItem('ROLE', "DRIVER")
          // Signal chat component that we're coming from login
          this.router.navigate(['/app/driver/dashboard'], { 
            state: { fromLogin: true, signedInTime: new Date().getTime() } 
          });
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
