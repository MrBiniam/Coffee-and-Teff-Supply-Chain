# Coffee and Teff Supply Chain

## Pre-requisites:
1. **Node.js & npm**:  
   Run `node -v` and `npm -v` to check if installed.  
   If missing, download from [nodejs.org](https://nodejs.org/).

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

## Running the Project:
### Front End (Angular):
1. Navigate to the front-end directory.
2. Install dependencies:  
   `npm install`
3. Start the server:  
   `npm start`  
   Access at: `http://localhost:4200`

### Back End (Django):
1. Navigate to the back-end directory.
2. Install necessary packages:  
   `pip install chapa`
   `pip install pillow`
   `pip install djangorestframework`
   `pip install django-cors-headers`
4. Prepare the database:  
   `python manage.py makemigrations`  
   `python manage.py migrate`
5. Start the server:  
   `python manage.py runserver`  
   Access at: `http://localhost:8000`

## Node Version (recommended): 14.21.3  
Check version:  
`node -v`

Happy Coding! 🎉  
Reach out if you encounter any issues. 😊
