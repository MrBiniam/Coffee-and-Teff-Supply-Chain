# Coffee and Teff Supply Chain Management System (UChain)

A blockchain-inspired platform for transparent and efficient supply chain management of Ethiopian Coffee and Teff, featuring integrated payment processing via Chapa.

## Features

- User authentication and role-based access (Farmer, Buyer, Distributor)
- Product listing and management
- Secure payment processing via Chapa payment gateway
- Order tracking and management
- Responsive UI across all devices
- Transaction history and verification

## Pre-requisites:
1. **Node.js & npm**:  
   Run `node -v` and `npm -v` to check if installed.  
   If missing, download from [nodejs.org](https://nodejs.org/).
   **Recommended Node Version: 14.21.3**

2. **Angular CLI**:  
   Run `ng version` to check if installed.  
   If missing, run:  
   `npm install -g @angular/cli`.

3. **Python**:  
   Run `python --version` to check if installed.  
   If missing, download from [python.org](https://www.python.org/).

4. **Django**:  
   Run `python -m django --version` to check if installed.  
   If missing, run:  
   `pip install django`.

5. **MySQL**:  
   Run `mysql --version` to check if installed.  
   If missing, download from [MySQL](https://dev.mysql.com/downloads/).

6. **MySQL Connector**:  
   Run `pip show mysqlclient` to check if installed.  
   If missing, run:  
   `pip install mysqlclient`.  
   If errors occur, use:  
   `pip install pymysql`.

7. **Git**:  
   Run `git --version` to check if installed.  
   If missing, download from [git-scm.com](https://git-scm.com/).

8. **VS Code**:  
   Run `code --version` to check if installed.  
   If missing, download from [Visual Studio Code](https://code.visualstudio.com/).

## Project Structure

- **UChain-API**: Django REST Framework backend
- **UChain-UI**: Angular frontend

## Running the Project:

### Front End (Angular):
1. Navigate to the front-end directory:
   ```
   cd UChain-UI
   ```
2. Install dependencies:  
   ```
   npm install
   ```
3. Start the server:  
   ```
   npm start
   ```  
   Access at: `http://localhost:4200`

### Back End (Django):
1. Navigate to the back-end directory:
   ```
   cd UChain-API
   ```
2. Install necessary packages:  
   ```
   pip install chapa
   pip install pillow
   pip install djangorestframework
   pip install django-cors-headers
   ```
3. Prepare the database:  
   ```
   python manage.py makemigrations  
   python manage.py migrate
   ```
4. Start the server:  
   ```
   python manage.py runserver
   ```  
   Access at: `http://localhost:8000`

## Payment Processing

The system uses Chapa payment gateway for processing payments. When a buyer purchases a product:

1. The system initiates a payment request to Chapa
2. The buyer is redirected to Chapa's secure payment page
3. Upon successful payment, the buyer is redirected back to the application
4. The system verifies the transaction using Chapa's API
5. Transaction details are stored and displayed on the payment success page

## Recent Updates

- Enhanced payment success page with improved UI and responsiveness
- Fixed payment flow issues with redirect handling
- Added proper calculation of total amount based on quantity ordered
- Improved UChain branding visibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Happy Coding! 
Reach out if you encounter any issues. 
