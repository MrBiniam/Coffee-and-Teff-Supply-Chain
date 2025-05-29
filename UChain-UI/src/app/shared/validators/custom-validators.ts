import { AbstractControl, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that username contains only letters (A-Z, a-z)
   */
  static onlyLetters(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null; // Don't validate empty values to allow required validator to trigger
      }
      
      // Updated to allow alphanumeric characters but must start with a letter
      const valid = /^[A-Za-z][A-Za-z0-9]*$/.test(control.value);
      return valid ? null : { 'onlyLetters': { value: control.value } };
    };
  }

  /**
   * Validates phone number starts with "09" followed by exactly 8 digits
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = /^09\d{8}$/.test(control.value);
      return valid ? null : { 'phoneNumber': { value: control.value } };
    };
  }

  /**
   * Validates password is a combination of letters and numbers with minimum length 5
   */
  static validPassword(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      // Check if password has at least one letter, one number, and is at least 5 characters
      const valid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/.test(control.value);
      return valid ? null : { 'validPassword': { value: control.value } };
    };
  }

  /**
   * Validates that address can contain letters, numbers and slashes
   */
  static validAddress(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      // Allow letters, numbers, spaces, and slashes
      const valid = /^[A-Za-z0-9\s\/]+$/.test(control.value);
      return valid ? null : { 'validAddress': { value: control.value } };
    };
  }

  /**
   * Validates account number is 10 or more digits
   */
  static accountNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      // Updated to allow between 10 and 13 digits
      const valid = /^\d{10,13}$/.test(control.value);
      return valid ? null : { 'accountNumber': { value: control.value } };
    };
  }

  /**
   * Validates that Tax Number or License Number starts with "00" followed by 8 digits
   */
  static taxOrLicenseNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = /^00\d{8}$/.test(control.value);
      return valid ? null : { 'taxOrLicenseNumber': { value: control.value } };
    };
  }

  /**
   * Validates car model can be a combination of letters and numbers
   */
  static carModel(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = /^[A-Za-z0-9\s]+$/.test(control.value);
      return valid ? null : { 'carModel': { value: control.value } };
    };
  }

  /**
   * Validates product title contains only letters
   */
  static productTitle(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { 'productTitle': { value: control.value } };
    };
  }

  /**
   * Validates product location can be letters or combination of letters and numbers
   */
  static productLocation(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = /^[A-Za-z0-9\s]+$/.test(control.value);
      return valid ? null : { 'productLocation': { value: control.value } };
    };
  }

  /**
   * Validates product description has a reasonable length and contains only letters
   * with flexible punctuation (very permissive)
   */
  static productDescription(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      // Very permissive check - only validate the description isn't too short 
      // and doesn't contain numbers
      const hasNoNumbers = !/\d/.test(control.value);
      const hasReasonableLength = control.value.length >= 10;
      
      if (!hasNoNumbers) {
        return { 'productDescriptionOnlyLetters': { value: control.value } };
      }
      
      if (!hasReasonableLength) {
        return { 'productDescriptionTooShort': { value: control.value } };
      }
      
      return null;
    };
  }

  /**
   * Validates quantity format must be a number followed by 'kg' (case-insensitive)
   * Valid formats: 100KG, 250 kg, 1 Kg
   * Invalid formats: 100, 100L, 500 grams, etc.
   */
  static productQuantity(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      
      // Check if the value matches the pattern: number + optional spaces + 'kg' (case insensitive)
      const valid = /^\d+\s*kg$/i.test(control.value);
      return valid ? null : { 'productQuantity': { value: control.value } };
    };
  }

  /**
   * Validates price is a positive number
   */
  static positiveNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }
      
      const value = Number(control.value);
      const isPositiveNumber = !isNaN(value) && value > 0;
      return isPositiveNumber ? null : { 'positiveNumber': { value: control.value } };
    };
  }
}
