import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/security/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  registerFormBuyer: FormGroup;
  registerFormSeller: FormGroup;
  registerFormDriver: FormGroup;
  submitted = false;
  hide = true;
  chide = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.registerFormBuyer = this.formBuilder.group({
      username: ['', [Validators.required, CustomValidators.onlyLetters()]],
      phone_number: ['', [Validators.required, CustomValidators.phoneNumber()]],
      address: ['', [Validators.required, CustomValidators.validAddress()]],
      payment_method: ['', Validators.required],
      account_number: ['', [Validators.required, CustomValidators.accountNumber()]],
      is_buyer: [true],
      password: ['', [Validators.required, CustomValidators.validPassword()]],
      cpassword: [''],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });

    this.registerFormSeller = this.formBuilder.group({
      username: ['', [Validators.required, CustomValidators.onlyLetters()]],
      phone_number: ['', [Validators.required, CustomValidators.phoneNumber()]],
      address: ['', [Validators.required, CustomValidators.validAddress()]],
      payment_method: ['', Validators.required],
      account_number: ['', [Validators.required, CustomValidators.accountNumber()]],
      is_seller: [true],
      password: ['', [Validators.required, CustomValidators.validPassword()]],
      cpassword: [''],
      tax_number: ['', [Validators.required, CustomValidators.taxOrLicenseNumber()]],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });

    this.registerFormDriver = this.formBuilder.group({
      username: ['', [Validators.required, CustomValidators.onlyLetters()]],
      phone_number: ['', [Validators.required, CustomValidators.phoneNumber()]],
      address: ['', [Validators.required, CustomValidators.validAddress()]],
      payment_method: ['', Validators.required],
      account_number: ['', [Validators.required, CustomValidators.accountNumber()]],
      is_driver: [true],
      password: ['', [Validators.required, CustomValidators.validPassword()]],
      cpassword: [''],
      license_number: ['', [Validators.required, CustomValidators.taxOrLicenseNumber()]],
      car_model: ['', [Validators.required, CustomValidators.carModel()]],
      termcondition: [false, [Validators.requiredTrue]],
      profile_image: ['', Validators.required],
    });
  }

  tabs = ['Buyer', 'Seller', 'Driver'];
  selected = new FormControl(0);

  addTab(selectAfterAdding: boolean) {
    this.tabs.push('New');
    if (selectAfterAdding) {
      this.selected.setValue(this.tabs.length - 1);
    }
  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }

  get f() {
    return this.registerFormBuyer.controls;
  }

  onSubmit(profile: string) {
    console.log(`Submitting ${profile} registration form`);
    
    const formData = new FormData();
    let registerForm;

    // Select the appropriate form based on the profile
    if (profile === 'buyer') {
      registerForm = this.registerFormBuyer;
    } else if (profile === 'seller') {
      registerForm = this.registerFormSeller;
    } else if (profile === 'driver') {
      registerForm = this.registerFormDriver;
    } else {
      console.error('Invalid profile type:', profile);
      return;
    }

    // Check if the form is valid
    if (!registerForm.valid) {
      console.error(`${profile} form is invalid`, registerForm.errors);
      this.showNotification(
        'snackbar-danger',
        'Please fill in all required fields',
        'bottom',
        'center'
      );
      return;
    }

    // Append common form fields
    Object.keys(registerForm.controls).forEach(key => {
      const control = registerForm.get(key);
      
      // Skip profile_image as it needs special handling
      if (key !== 'profile_image' && key !== 'cpassword' && key !== 'termcondition') {
        formData.append(key, control.value);
      }
    });

    // Handle profile image upload
    const profileImageControl = registerForm.get('profile_image');
    if (profileImageControl && profileImageControl.value) {
      let fileToUpload = null;
      
      // Handle different file input structures
      if (profileImageControl.value._files && profileImageControl.value._files.length > 0) {
        // ngx-mat-file-input format
        fileToUpload = profileImageControl.value._files[0];
      } else if (profileImageControl.value instanceof File) {
        // Direct File object
        fileToUpload = profileImageControl.value;
      } else if (typeof profileImageControl.value === 'object') {
        // Try to extract file from other possible formats
        fileToUpload = profileImageControl.value.files?.[0] || null;
      }
      
      if (fileToUpload) {
        formData.append('profile_image', fileToUpload, fileToUpload.name);
        console.log('Added profile image to form data:', fileToUpload.name);
      } else {
        console.warn('Could not extract profile image file from form control');
      }
    } else {
      console.warn('No profile image selected');
    }

    console.log(`Sending ${profile} registration data to server`);
    
    // Submit the form
    this.authService.signUp(formData, profile).subscribe(
      (data) => {
        console.log(`${profile} registration successful:`, data);
        this.showNotification(
          'snackbar-success',
          'Account Created Successfully...!!!',
          'bottom',
          'center'
        );
        this.router.navigate(['/authentication/signin']);
      },
      (error) => {
        console.error(`${profile} registration failed:`, error);
        let errorMessage = 'Cannot create account! Try Again...!!!';
        
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showNotification(
          'snackbar-danger',
          errorMessage,
          'bottom',
          'center'
        );
      }
    );
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
