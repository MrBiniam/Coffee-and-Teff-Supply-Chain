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
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {
  registerFormBuyer: UntypedFormGroup;
  id = this.tokenStorageService.getId();
  user: User = new User();
  showDeleteConfirmation = false;
  
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
    // Initialize form with empty values
    this.initForm();
    this.getUser();
  }

  ngOnInit(): void {
  }

  initForm() {
    this.registerFormBuyer = this.formBuilder.group({
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
      profile_image: ['']
    });
  }
  
  getUser() {
    this.userService.getOneUser(this.id).subscribe(
      data => {
        this.user = data;
        console.log('User data loaded:', this.user);
        
        // Update form values
        this.registerFormBuyer.patchValue({
          username: this.user.username,
          phone_number: this.user.phone_number || '',
          address: this.user.address || '',
          payment_method: this.user.payment_method || '',
          account_number: this.user.account_number || ''
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
    if (!this.registerFormBuyer.valid) {
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
      formData.append('phone_number', this.registerFormBuyer.get('phone_number').value);
      formData.append('address', this.registerFormBuyer.get('address').value);
      formData.append('payment_method', this.registerFormBuyer.get('payment_method').value);
      formData.append('account_number', this.registerFormBuyer.get('account_number').value);
      
      // Handle the file upload properly
      const profileImageControl = this.registerFormBuyer.get('profile_image');
      if (profileImageControl && profileImageControl.value) {
        const files = profileImageControl.value;
        if (files instanceof File) {
          formData.append('profile_image', files);
        } else if (files && files.files && files.files.length) {
          formData.append('profile_image', files.files[0]);
        }
      }

      this.userService.updateUser(this.id, formData).subscribe(
        data => {
          console.log('Update successful:', data);
          
          // Reload user data to reflect changes
          this.getUser();
          
          this.showNotification(
            'snackbar-success',
            'Account updated successfully!',
            'bottom',
            'center'
          );
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
          this.showDeleteConfirmation = true;
          
          // After a short delay, navigate to the login page
          setTimeout(() => {
            this.tokenStorageService.signOut();
            this.router.navigate(['/authentication/signin']);
          }, 5000);
        },
        error => {
          console.error('Delete error:', error);
          this.showNotification(
            'snackbar-danger',
            'Could not delete account. Please try again.',
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
      panelClass: colorName
    });
  }
}
