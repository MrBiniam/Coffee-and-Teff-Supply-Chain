import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
 
import { JwtResponse } from './jwt-response';
import { AuthLoginInfo } from './login-info';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLogin = false;
  roleAs: string
  private loginUrl = 'http://127.0.0.1:8000/user/login ';
  
 
  constructor(private http: HttpClient) {
  }
 
  attemptAuth(formData: FormData): Observable<JwtResponse> {
    console.log(formData);
    return this.http.post<JwtResponse>(this.loginUrl, formData);
  }
 
  signUp(formData: FormData, profile: string): Observable<any> {
    console.log(`Signing up as ${profile}`, formData);
    const signupUrl = 'http://127.0.0.1:8000/'+profile+'/register';
    return this.http.post<any>(signupUrl, formData)
      .pipe(
        catchError(error => {
          console.error(`Error during ${profile} signup:`, error);
          return throwError(error);
        })
      );
  }
  getRole() {
    return localStorage.getItem('ROLE');
  }
  isLoggedIn() {
    const loggedIn = localStorage.getItem('STATE');
    if (loggedIn === 'true') {
      this.isLogin = true;
    } else {
      this.isLogin = false;
    }
    return this.isLogin;
  }
  getUserFullName() {
    return localStorage.getItem('FULLNAME');
  }
  getUserImg() {
    return localStorage.getItem('USERIMG');
  }
  logout() {
    this.isLogin = false;
    this.roleAs = '';
    localStorage.setItem('STATE', 'false');
    localStorage.setItem('ROLE', '');
    localStorage.setItem('FULLNAME', '');
    localStorage.setItem('USERIMG', '');
    return of({ success: this.isLogin, role: '' });
  }
}