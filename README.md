# coplaner
<!-- ![Home page of coplaner](https://github.com/tunauygun/coplaner/blob/main/doc/img/schedulePage.png) -->

Welcome to Coplaner, an unofficial web application developed to assist Carleton University students in generating conflict-free timetables. As a Carleton University student myself, I understand the struggles of scheduling courses, which is why I created Coplaner. By simply providing a list of your courses, Coplaner will do its best to find all possible conflict-free timetables. It's my hope that Coplaner can save you time and frustration as you plan your terms. Thank you for using Coplaner, and I hope you find it useful!

![image](https://github.com/user-attachments/assets/050960b8-87d4-40c3-9b7c-40e736697c34)

## Built With
* [![JavaScript][JavaScript.com]][JavaScript-url]
* [![HTML][HTML.com]][HTML-url]
* [![Node.js][Node.js.com]][Node.js-url]
* [![Bootstrap][Bootstrap.com]][Bootstrap-url]
* [![Express.js][Express.js.com]][Express.js-url]
* [![EJS][EJS.com]][EJS-url]

## Getting Started

### Installation

### 1. Clone the Repository
```sh
git clone https://github.com/tunauygun/coplaner.git
cd coplaner
```

### 2. Install Dependencies
Run the following command to install required dependencies:
```sh
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory and add the necessary environment variables:
```ini
SESSION_SECRET=your_secret_key
DB_PASSWORD=your_db_password
MAILGUN_DOMAIN=yourdomain.mailgun.org
MAILGUN_KEY=your_mailgun_token
TOKEN=your_secret_token
PORT=3000
```

### 4. Start the Server
Run the application in development mode:
```sh
npm run start
```

### 6. Open in Browser
Once the server is running, open your browser and go to:
```
http://localhost:3000
```

## Disclaimer
Please note that the generated timetables are based on user-provided information and may not include all possible options. It is essential to review the generated timetables alongside the official university schedules for accuracy. I am not liable for any issues resulting from the use or reliance on Coplaner. Please keep in mind that Coplaner is a web application developed by a single individual, and it may have limitations or technical constraints. Your understanding and feedback are appreciated as I continually improve Coplaner's functionality. By using Coplaner, you agree to the above disclaimer and understand that the responsibility for course selections ultimately rests with you, the user.

## Database Update
Last Updated: May 27, 2024

The coplaner database is updated to ensure accurate course information. While efforts are made to keep the database current, please note that updates may not occur on a strict schedule. The last update was performed on May 27, 2024.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[product-screenshot]: images/screenshot.png
[JavaScript.com]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[HTML.com]: https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[HTML-url]: https://developer.mozilla.org/en-US/docs/Web/HTML
[Node.js.com]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white
[Node.js-url]: https://nodejs.org/
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[Express.js.com]: https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white
[Express.js-url]: https://expressjs.com/
[EJS.com]: https://img.shields.io/badge/EJS-8A2BE2?style=for-the-badge&logo=ejs&logoColor=white
[EJS-url]: https://ejs.co/
