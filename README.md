# ───────────────────────────────────────────────────────────────────────────────
# Coffee and Teff Supply Chain
# ───────────────────────────────────────────────────────────────────────────────
# Welcome to the Coffee and Teff Supply Chain project! 🚀
# Follow the instructions below to run both the **front end** and **back end**.

# ───────────────────────────────────────────────────────────────────────────────
# Pre-requisites:
# ───────────────────────────────────────────────────────────────────────────────

# 1. Node.js and npm
#    ├─ Check if Node.js is installed:
node -v
npm -v
#    ├─ If not installed, [Download Node.js](https://nodejs.org/)

# 2. Angular CLI
#    ├─ Check if Angular CLI is installed:
ng version
#    ├─ If not installed, run the following command:
npm install -g @angular/cli

# 3. Python
#    ├─ Check if Python is installed:
python --version
#    ├─ If not installed, [Download Python](https://www.python.org/)
#    ├─ Ensure to check the "Add Python to PATH" option during installation.

# 4. Django
#    ├─ Check if Django is installed:
python -m django --version
#    ├─ If not installed, run:
pip install django

# 5. MySQL Server
#    ├─ Check if MySQL is installed:
mysql --version
#    ├─ If not installed, [Download MySQL](https://dev.mysql.com/downloads/)

# 6. MySQL Python Connector
#    ├─ Check if MySQL client is installed:
pip show mysqlclient
#    ├─ If not installed, run:
pip install mysqlclient
#    ├─ If issues, run:
pip install pymysql

# 7. Git
#    ├─ Check if Git is installed:
git --version
#    ├─ If not installed, [Download Git](https://git-scm.com/)

# 8. Visual Studio Code
#    ├─ Check if VS Code is installed:
code --version
#    ├─ If not installed, [Download VS Code](https://code.visualstudio.com/)

# ───────────────────────────────────────────────────────────────────────────────
# Running the Project:
# ───────────────────────────────────────────────────────────────────────────────

# Front End (Angular)
# ├─ Navigate to the front-end directory.
# ├─ Install dependencies:
npm install
# ├─ Start the Angular server:
npm start
#    ├─ Front-end will be available at: http://localhost:4200

# Back End (Django)
# ├─ Navigate to the back-end directory.
# ├─ Install necessary Python packages:
pip install chapa
pip install pillow
# ├─ Prepare the database:
python manage.py makemigrations
python manage.py migrate
# ├─ Start the Django server:
python manage.py runserver
#    ├─ Back-end will be available at: http://localhost:8000

# ───────────────────────────────────────────────────────────────────────────────
# Additional Information:
# ───────────────────────────────────────────────────────────────────────────────

# Node Version (recommended): 14.21.3
# ├─ To check your Node version:
node -v

# ───────────────────────────────────────────────────────────────────────────────
# Happy Coding! 🎉
# ───────────────────────────────────────────────────────────────────────────────
# Feel free to reach out if you encounter any issues. 😊
