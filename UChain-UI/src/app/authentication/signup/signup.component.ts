import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/security/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    standalone: false
})
export class SignupComponent implements OnInit {
  registerFormBuyer: UntypedFormGroup;
  registerFormSeller: UntypedFormGroup;
  registerFormDriver: UntypedFormGroup;
  submitted = false;
  hide = true;
  chide = true;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Ensure forms exist before first template render to prevent null access
    this.initForms();
  }

  ngOnInit() {}

  private initForms() {
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
  selected = new UntypedFormControl(0);

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

  onProfileImageChange(event: Event, profile: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    let registerForm: UntypedFormGroup | null = null;
    if (profile === 'buyer') {
      registerForm = this.registerFormBuyer;
    } else if (profile === 'seller') {
      registerForm = this.registerFormSeller;
    } else if (profile === 'driver') {
      registerForm = this.registerFormDriver;
    }

    if (registerForm) {
      registerForm.get('profile_image')?.setValue(file);
    }
  }

  signUpProcess(formData: FormData, profile: string) {
    // Log the entire FormData contents for debugging
    console.log('FormData entries:');
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    // Make API call to register the user
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
        } else if (error.status) {
          errorMessage = `Server error (${error.status}): ${error.statusText || 'Unknown error'}`;
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

    // Log the form values for debugging
    console.log('Form values:', registerForm.value);

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
    const value = profileImageControl?.value;
    let fileToUpload: File | null = null;

    if (value instanceof File) {
      fileToUpload = value;
    } else if (value?.files?.[0]) {
      fileToUpload = value.files[0];
    }

    if (fileToUpload) {
      formData.append('profile_image', fileToUpload, fileToUpload.name);
      console.log('Added profile image to form data:', fileToUpload.name);
    } else {
      console.warn('No profile image selected or unable to extract file');
    }

    console.log(`Sending ${profile} registration data to server`);
    
    // Submit the form
    this.signUpProcess(formData, profile);
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
