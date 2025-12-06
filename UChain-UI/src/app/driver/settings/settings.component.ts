import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/security/auth.service';
import { TokenStorageService } from 'src/app/shared/security/token-storage.service';
import { User } from 'src/app/shared/security/user';
import { UserService } from 'src/app/shared/security/user.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.sass'],
    standalone: false
})
export class SettingsComponent implements OnInit {
  registerFormDriver: UntypedFormGroup;
  id = this.tokenStorageService.getId();
  user: User = new User();
  
  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private tokenStorageService: TokenStorageService,
    private dialog: MatDialog
  ) {
    // Initialize form with empty values first
    this.registerFormDriver = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      phone_number: ['', [
        Validators.required, 
        Validators.pattern(/^09\d{8}$/) // Must start with 09 followed by 8 digits
      ]],
      address: ['', [
        Validators.required, 
        Validators.minLength(5),
        Validators.pattern(/^[A-Za-z0-9\s\/]+$/) // Allow letters, numbers, spaces, and slashes
      ]],
      payment_method: ['', Validators.required],
      account_number: ['', [
        Validators.required, 
        Validators.pattern(/^\d{10,}$/) // Must contain at least 10 digits
      ]],
      profile_image: [''],
      license_number: [{value: '', disabled: true}],
      car_model: ['', Validators.pattern(/^[A-Za-z0-9\s]+$/)] // Allow letters, numbers, and spaces
    });
    
    this.getUser();
  }

  onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.registerFormDriver.get('profile_image')?.setValue(file);
  }

  ngOnInit(): void {
  }
  
  getUser() {
    this.userService.getOneUser(this.id).subscribe(
      data => {
        this.user = data;
        console.log('User data loaded:', this.user);
        
        // Update form with user data using patchValue instead of recreating the form
        this.registerFormDriver.patchValue({
          username: this.user.username,
          phone_number: this.user.phone_number || '',
          address: this.user.address || '',
          payment_method: this.user.payment_method || '',
          account_number: this.user.account_number || '',
          license_number: data.driver_profile && data.driver_profile.license_number ? data.driver_profile.license_number : '',
          car_model: data.driver_profile && data.driver_profile.car_model ? data.driver_profile.car_model : ''
        });
      },
      error => {
        console.error("Error getting user:", error);
        this.showNotification(
          'snackbar-danger',
          'Could not load user data. Please try again.',
          'bottom',
          'center'
        );
      }
    );
  }
  
  onSubmit() {
    if (!this.registerFormDriver.valid) {
      this.showNotification(
        'snackbar-warning',
        'Please complete all required fields correctly.',
        'bottom',
        'center'
      );
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add all form fields to formData
      formData.append('phone_number', this.registerFormDriver.get('phone_number').value);
      formData.append('address', this.registerFormDriver.get('address').value);
      formData.append('payment_method', this.registerFormDriver.get('payment_method').value);
      formData.append('account_number', this.registerFormDriver.get('account_number').value);
      
      // Pass the existing driver profile values for read-only fields
      if (this.user.driver_profile) {
        if (this.user.driver_profile.license_number) {
          formData.append('license_number', this.user.driver_profile.license_number);
        }
      }
      
      // Add car model to form data
      formData.append('car_model', this.registerFormDriver.get('car_model').value);
      
      // Handle file upload for native file input
      const profileImageControl = this.registerFormDriver.get('profile_image');
      const value = profileImageControl?.value;
      const file =
        value instanceof File
          ? value
          : value?.files?.[0]
            ? value.files[0]
            : null;
      if (file) {
        formData.append('profile_image', file, file.name);
      }

      // Log the formData contents for debugging (this is TypeScript compatible)
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      this.userService.updateUser(this.id, formData).subscribe(
        data => {
          console.log('Update successful:', data);
          
          this.showNotification(
            'snackbar-success',
            'Account updated successfully!',
            'bottom',
            'center'
          );

          // Reload user data to reflect changes
          this.getUser();
        },
        error => {
          console.error('Update error:', error);
          this.showNotification(
            'snackbar-danger',
            error.error && error.error.error ? error.error.error : 'Could not update account. Please try again.',
            'bottom',
            'center'
          );
        }
      );
    } catch (error) {
      console.error('Form submission error:', error);
      this.showNotification(
        'snackbar-danger',
        'An error occurred. Please try again.',
        'bottom',
        'center'
      );
    }
  }
  
  deleteAccount() {
    // Create a confirmation dialog
    const confirmDelete = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (confirmDelete) {
      this.userService.deleteUser(this.id).subscribe(
        () => {
          // Create a full-screen delete confirmation message
          const accountDeletedDiv = document.createElement('div');
          accountDeletedDiv.className = 'account-deleted-screen';
          accountDeletedDiv.innerHTML = `
            <div class="delete-content">
              <h1>UChain: Ethiopia's Coffee and Teff Supply Chain</h1>
              <img src="assets/images/logo.png" alt="UChain Logo" class="delete-logo">
              <h2>We are sorry to see you go</h2>
              <p>Your account has been successfully deleted.</p>
              <p>Thank you for being part of our community.</p>
              <button class="btn-continue" id="btnContinue">Continue</button>
            </div>
          `;
          
          // Add styles to the confirmation screen
          const style = document.createElement('style');
          style.textContent = `
            .account-deleted-screen {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #5C8D89, #74B49B);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-family: 'Roboto', sans-serif;
            }
            .delete-content {
              text-align: center;
              padding: 40px;
              max-width: 600px;
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            .delete-logo {
              width: 150px;
              margin: 20px auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 20px;
              color: #ffffff;
            }
            h2 {
              font-size: 32px;
              margin: 20px 0;
              color: #ffffff;
            }
            p {
              font-size: 18px;
              margin: 10px 0;
              color: #f0f0f0;
            }
            .btn-continue {
              background-color: #ffffff;
              color: #5C8D89;
              border: none;
              border-radius: 5px;
              padding: 12px 30px;
              font-size: 16px;
              margin-top: 30px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-weight: bold;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .btn-continue:hover {
              background-color: #f0f0f0;
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
          `;
          
          document.head.appendChild(style);
          document.body.appendChild(accountDeletedDiv);
          
          // Add event listener to continue button
          document.getElementById('btnContinue').addEventListener('click', () => {
            document.body.removeChild(accountDeletedDiv);
            
            // Clear token and navigate to login
            this.tokenStorageService.signOut();
            this.router.navigate(['/authentication/signin']);
          });
        },
        error => {
          console.error('Delete account error:', error);
          this.showNotification(
            'snackbar-danger',
            'Could not delete your account. Please try again.',
            'bottom',
            'center'
          );
        }
      );
    }
  }

  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }
}
