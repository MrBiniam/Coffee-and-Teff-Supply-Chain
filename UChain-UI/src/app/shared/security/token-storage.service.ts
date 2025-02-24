import { Injectable } from '@angular/core';
 
const TOKEN_KEY = 'AuthToken';
const USERNAME_KEY = 'AuthUsername';
const ID_KEY = 'user_id';
const AUTHORITIES_KEY = 'AuthAuthorities';
 
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private roles: Array<string> = [];
  constructor() { }
 
  signOut() {
    window.sessionStorage.clear();
  }
 
  public saveToken(token: string) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
 
  public getToken(): string {
    return sessionStorage.getItem(TOKEN_KEY);
  }
 
  public saveUsername(username: string) {
    window.sessionStorage.removeItem(USERNAME_KEY);
    window.sessionStorage.setItem(USERNAME_KEY, username);
  }
 
  public getUsername(): string {
    return sessionStorage.getItem(USERNAME_KEY);
  }
  public saveProfileImage(username: string) {
    window.sessionStorage.removeItem('PROFILE_KEY');
    window.sessionStorage.setItem('PROFILE_KEY', username);
  }
 
  public getProfileImage(): string {
    return sessionStorage.getItem('PROFILE_KEY');
  }
  public saveId(username: string) {
    window.sessionStorage.removeItem(ID_KEY);
    window.sessionStorage.setItem(ID_KEY, username);
  }
  public getId(): string {
    return sessionStorage.getItem(ID_KEY);
  }
  public saveAuthorities(authorities: string) {
    window.sessionStorage.removeItem(AUTHORITIES_KEY);
    window.sessionStorage.setItem(AUTHORITIES_KEY, authorities);
  }
 
  public getAuthorities(): string { 
    if (sessionStorage.getItem(TOKEN_KEY)) {
      return sessionStorage.getItem(AUTHORITIES_KEY)
    }
  }

  public saveQuantity(quantity: string) {
    window.sessionStorage.removeItem('quan_key');
    window.sessionStorage.setItem('quan_key', quantity);
  }
  public getQuantity(): string {
    return sessionStorage.getItem('quan_key');
  }
  public saveTxRef(tx_ref: string) {
    window.sessionStorage.removeItem('ref_key');
    window.sessionStorage.setItem('ref_key', tx_ref);
  }
  public getTxRef(): string {
    return sessionStorage.getItem('ref_key');
  }

  public savePId(PId: string) {
    window.sessionStorage.removeItem('PId_key');
    window.sessionStorage.setItem('PId_key', PId);
  }
  public getPId(): string {
    return sessionStorage.getItem('PId_key');
  }
}