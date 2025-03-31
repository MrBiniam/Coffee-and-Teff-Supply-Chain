import { Role } from './role';

export class User {
   id: string;
   username: string;
   password: string;
   email: string;
   phone_number: string;
   is_buyer: boolean;
   is_seller: boolean;
   is_driver: boolean;
   address: string;
   registration_date: Date;
   payment_method: string;
   account_number: string;
   profile_image: string;
   buyer_profile: any;
   seller_profile: any;
   driver_profile: {
      license_number: string;
      car_model: string; 
      car_plate?: string; // Made optional to maintain compatibility with existing code
   };
   
   // Full name properties - these might not be directly in the API 
   // but we'll need them for our display
   name?: string;
   fullName?: string;
}
