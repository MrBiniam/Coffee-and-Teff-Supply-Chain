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
    // Also clear localStorage auth items
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ID_KEY);
    localStorage.removeItem(AUTHORITIES_KEY);
  }
 
  public saveToken(token: string) {
    // Save to both sessionStorage and localStorage for redundancy
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    // Also save to localStorage so it persists across redirects
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  }
 
  public getToken(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
      // If found in localStorage but not in sessionStorage, restore it to sessionStorage
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    }
    return token;
  }
 
  public saveUsername(username: string) {
    // Save to both sessionStorage and localStorage for redundancy
    window.sessionStorage.removeItem(USERNAME_KEY);
    window.sessionStorage.setItem(USERNAME_KEY, username);
    // Also save to localStorage
    localStorage.removeItem(USERNAME_KEY);
    localStorage.setItem(USERNAME_KEY, username);
  }
 
  public getUsername(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let username = sessionStorage.getItem(USERNAME_KEY);
    if (!username) {
      username = localStorage.getItem(USERNAME_KEY);
      // If found in localStorage but not in sessionStorage, restore it
      if (username) {
        sessionStorage.setItem(USERNAME_KEY, username);
      }
    }
    return username;
  }

  public saveProfileImage(imagePath: string) {
    window.sessionStorage.removeItem('PROFILE_KEY');
    window.sessionStorage.setItem('PROFILE_KEY', imagePath);
    // Also save to localStorage
    localStorage.removeItem('PROFILE_KEY');
    localStorage.setItem('PROFILE_KEY', imagePath);
  }

  public getProfileImage(): string {
    let imagePath = sessionStorage.getItem('PROFILE_KEY');
    if (!imagePath) {
      imagePath = localStorage.getItem('PROFILE_KEY');
      // If found in localStorage but not in sessionStorage, restore it
      if (imagePath) {
        sessionStorage.setItem('PROFILE_KEY', imagePath);
      }
    }
    if (!imagePath) {
      return null;
    }
    
    // Make sure we return a fully qualified URL for the image
    if (imagePath.startsWith('http')) {
      // Already a full URL, return as is
      return imagePath;
    } else if (imagePath.startsWith('/')) {
      // A path starting with /, add the backend URL
      return 'http://127.0.0.1:8000' + imagePath;
    } else {
      // Just a filename, add the full path
      return 'http://127.0.0.1:8000/media/profile_images/' + imagePath;
    }
  }

  public saveId(id: string) {
    window.sessionStorage.removeItem(ID_KEY);
    window.sessionStorage.setItem(ID_KEY, id);
    // Also save to localStorage
    localStorage.removeItem(ID_KEY);
    localStorage.setItem(ID_KEY, id);
  }
  
  public getId(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let id = sessionStorage.getItem(ID_KEY);
    if (!id) {
      id = localStorage.getItem(ID_KEY);
      // If found in localStorage but not in sessionStorage, restore it
      if (id) {
        sessionStorage.setItem(ID_KEY, id);
      }
    }
    return id;
  }
  
  public saveAuthorities(authorities: string) {
    window.sessionStorage.removeItem(AUTHORITIES_KEY);
    window.sessionStorage.setItem(AUTHORITIES_KEY, authorities);
    // Also save to localStorage
    localStorage.removeItem(AUTHORITIES_KEY);
    localStorage.setItem(AUTHORITIES_KEY, authorities);
  }
 
  public getAuthorities(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let authorities = sessionStorage.getItem(AUTHORITIES_KEY);
    if (!authorities) {
      authorities = localStorage.getItem(AUTHORITIES_KEY);
      // If found in localStorage but not in sessionStorage, restore it
      if (authorities) {
        sessionStorage.setItem(AUTHORITIES_KEY, authorities);
      }
    }
    return authorities;
  }

  public saveQuantity(quantity: string) {
    window.sessionStorage.removeItem('quan_key');
    window.sessionStorage.setItem('quan_key', quantity);
    // Also save to localStorage
    localStorage.removeItem('quan_key');
    localStorage.setItem('quan_key', quantity);
  }
  public getQuantity(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let quantity = sessionStorage.getItem('quan_key');
    if (!quantity) {
      quantity = localStorage.getItem('quan_key');
      // If found in localStorage but not in sessionStorage, restore it
      if (quantity) {
        sessionStorage.setItem('quan_key', quantity);
      }
    }
    return quantity;
  }
  public saveTxRef(tx_ref: string) {
    window.sessionStorage.removeItem('ref_key');
    window.sessionStorage.setItem('ref_key', tx_ref);
    // Also save to localStorage
    localStorage.removeItem('ref_key');
    localStorage.setItem('ref_key', tx_ref);
  }
  public getTxRef(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let tx_ref = sessionStorage.getItem('ref_key');
    if (!tx_ref) {
      tx_ref = localStorage.getItem('ref_key');
      // If found in localStorage but not in sessionStorage, restore it
      if (tx_ref) {
        sessionStorage.setItem('ref_key', tx_ref);
      }
    }
    return tx_ref;
  }
  public clearTxRef(): void {
    window.sessionStorage.removeItem('ref_key');
    localStorage.removeItem('ref_key');
  }

  public savePId(PId: string) {
    window.sessionStorage.removeItem('PId_key');
    window.sessionStorage.setItem('PId_key', PId);
    // Also save to localStorage
    localStorage.removeItem('PId_key');
    localStorage.setItem('PId_key', PId);
  }
  public getPId(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let PId = sessionStorage.getItem('PId_key');
    if (!PId) {
      PId = localStorage.getItem('PId_key');
      // If found in localStorage but not in sessionStorage, restore it
      if (PId) {
        sessionStorage.setItem('PId_key', PId);
      }
    }
    return PId;
  }
  
  // New methods for Chapa payment integration
  public saveEmail(email: string) {
    window.sessionStorage.removeItem('email_key');
    window.sessionStorage.setItem('email_key', email);
    // Also save to localStorage
    localStorage.removeItem('email_key');
    localStorage.setItem('email_key', email);
  }
  
  public getEmail(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let email = sessionStorage.getItem('email_key');
    if (!email) {
      email = localStorage.getItem('email_key');
      // If found in localStorage but not in sessionStorage, restore it
      if (email) {
        sessionStorage.setItem('email_key', email);
      }
    }
    return email || '';
  }
  
  public savePhoneNumber(phoneNumber: string) {
    window.sessionStorage.removeItem('phone_number_key');
    window.sessionStorage.setItem('phone_number_key', phoneNumber);
    // Also save to localStorage
    localStorage.removeItem('phone_number_key');
    localStorage.setItem('phone_number_key', phoneNumber);
  }
  
  public getPhoneNumber(): string {
    // First try to get from sessionStorage, then fallback to localStorage
    let phoneNumber = sessionStorage.getItem('phone_number_key');
    if (!phoneNumber) {
      phoneNumber = localStorage.getItem('phone_number_key');
      // If found in localStorage but not in sessionStorage, restore it
      if (phoneNumber) {
        sessionStorage.setItem('phone_number_key', phoneNumber);
      }
    }
    return phoneNumber || '';
  }
}