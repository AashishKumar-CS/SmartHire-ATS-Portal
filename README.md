# ⚡ SmartHire — AI Resume Screening & ATS Scoring Portal

A full-stack recruitment platform with AI-powered resume analysis, ATS scoring, job matching, and candidate ranking.

---

## 🏗 Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React.js 18, React Router v6, Axios |
| Backend   | Java 17, Spring Boot 3.2, Spring JDBC |
| Database  | MySQL 8.x |
| AI Engine | OpenAI GPT-3.5-turbo API |
| Security  | JWT, BCrypt |
| PDF Parse | Apache PDFBox 3.x |
| Email     | Spring Mail (Gmail SMTP) |

---

## 📁 Project Structure

```
smarthire/
├── backend/                          ← Spring Boot project
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/smarthire/
│       │   ├── SmartHireApplication.java
│       │   ├── config/SecurityConfig.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── CandidateController.java
│       │   │   ├── JobController.java
│       │   │   └── AdminController.java
│       │   ├── dao/
│       │   │   ├── CandidateDAO.java
│       │   │   ├── JobDAO.java
│       │   │   ├── ApplicationDAO.java
│       │   │   ├── AdminDAO.java
│       │   │   └── OtpDAO.java
│       │   ├── model/
│       │   │   ├── Candidate.java
│       │   │   ├── EducationDetail.java
│       │   │   ├── Job.java
│       │   │   ├── Application.java
│       │   │   ├── Admin.java
│       │   │   └── ThirdPartyJob.java
│       │   ├── service/
│       │   │   ├── AIService.java       ← OpenAI integration
│       │   │   ├── CandidateService.java
│       │   │   ├── JobService.java
│       │   │   └── EmailService.java
│       │   └── util/JwtUtil.java
│       └── resources/
│           ├── application.properties
│           └── schema.sql
│
└── frontend/                          ← React.js project
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/AuthContext.js
        ├── services/api.js
        └── pages/
            ├── LandingPage.js
            ├── CandidateLogin.js
            ├── AdminLogin.js
            ├── RegisterWizard.js
            ├── CandidateDashboard.js
            └── AdminDashboard.js
```

---

## ⚙️ STEP-BY-STEP SETUP GUIDE

### STEP 1 — MySQL Database Setup

1. Install MySQL 8.x and start the service
2. Open MySQL Workbench or terminal
3. Run the schema script:

```sql
mysql -u root -p < backend/src/main/resources/schema.sql
```

Or paste the SQL directly in MySQL Workbench.

**Default admin credentials inserted:**
- Username: `admin`
- Password: `admin123`

---

### STEP 2 — Backend Setup (Eclipse or IntelliJ)

#### Option A — Eclipse
1. Open Eclipse → `File → Import → Existing Maven Projects`
2. Browse to the `smarthire/backend` folder → Finish
3. Wait for Maven to download dependencies
4. Open `src/main/resources/application.properties`
5. Update these values:

```properties
# Your MySQL password
spring.datasource.password=YOUR_MYSQL_PASSWORD

# Your OpenAI API key (get from https://platform.openai.com)
openai.api.key=sk-YOUR_OPENAI_KEY_HERE

# Your Gmail (for email notifications — optional)
spring.mail.username=your-gmail@gmail.com
spring.mail.password=your-app-password
```

6. Right-click `SmartHireApplication.java` → `Run As → Java Application`
7. Backend starts on: **http://localhost:8080**

#### Option B — Terminal (Maven)
```bash
cd smarthire/backend
mvn spring-boot:run
```

---

### STEP 3 — Frontend Setup (React)

```bash
cd smarthire/frontend
npm install
npm start
```

Frontend starts on: **http://localhost:3000**

---

### STEP 4 — First Run

1. Open **http://localhost:3000**
2. Click **"Get Started"** to register a candidate
3. Fill the 5-step registration wizard
4. Use the OTP shown in the **server console** (simulated SMS)
5. After registration, note the **auto-generated username & password**
6. Login as candidate at `/login/candidate`
7. Upload a PDF resume to get your **AI-powered ATS Score**
8. Browse and apply to jobs

**Admin Portal:**
- URL: http://localhost:3000/login/admin
- Username: `admin`
- Password: `admin123`

---

## 🔑 API Reference

### Auth Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/candidate/login` | Candidate login → JWT |
| POST | `/api/auth/admin/login` | Admin login → JWT |
| GET | `/api/auth/validate` | Validate JWT token |

### Candidate Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/candidate/send-otp` | Send OTP to mobile |
| POST | `/api/candidate/verify-otp` | Verify OTP |
| POST | `/api/candidate/register` | Register new candidate |
| GET | `/api/candidate/profile/{id}` | Get profile |
| PUT | `/api/candidate/profile/{id}` | Update profile |
| POST | `/api/candidate/upload-resume/{id}` | Upload PDF resume + get ATS score |
| POST | `/api/candidate/upload-profile-image/{id}` | Upload profile photo |

### Job Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/jobs/internal` | List open internal jobs |
| GET | `/api/jobs/external` | List third-party jobs |
| POST | `/api/jobs/apply` | Apply to a job |
| GET | `/api/jobs/applications/candidate/{id}` | Candidate's applications |
| GET | `/api/jobs/applications/job/{id}` | Job applicants (ranked) |
| PUT | `/api/jobs/applications/{id}/status` | Update application status |

### Admin Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/jobs/admin/create` | Create job posting |
| PUT | `/api/jobs/admin/update/{id}` | Update job |
| PUT | `/api/jobs/admin/close/{id}` | Close job |
| GET | `/api/admin/candidates` | All candidates |
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| PUT | `/api/admin/applications/{id}/select` | Select candidate |
| PUT | `/api/admin/applications/{id}/reject` | Reject candidate |

---

## 📬 Sample API Requests (Postman)

### Register Candidate
```json
POST http://localhost:8080/api/candidate/register
Content-Type: application/json

{
  "fullName": "Rahul Sharma",
  "email": "rahul@example.com",
  "mobile": "9876543210",
  "gender": "Male",
  "address": "123 Main St, Mumbai",
  "dateOfBirth": "1999-05-15",
  "domain": "Full Stack Development",
  "internshipStatus": "Fresher",
  "certifications": "AWS Cloud Practitioner",
  "githubLink": "https://github.com/rahulsharma",
  "mobileVerified": true,
  "skills": ["Java", "Spring Boot", "React", "MySQL"],
  "educationDetails": [
    { "level": "10th", "institutionName": "DPS School", "boardUniversity": "CBSE", "yearOfPassing": 2015, "percentageCgpa": "92%" },
    { "level": "12th", "institutionName": "DPS School", "boardUniversity": "CBSE", "yearOfPassing": 2017, "percentageCgpa": "88%" },
    { "level": "Graduation", "institutionName": "Mumbai University", "boardUniversity": "Mumbai University", "yearOfPassing": 2021, "percentageCgpa": "8.5 CGPA" }
  ]
}
```

### Candidate Login
```json
POST http://localhost:8080/api/auth/candidate/login
Content-Type: application/json

{ "username": "rahulsharma1234", "password": "SH@56789" }
```

### Create Job (Admin)
```json
POST http://localhost:8080/api/jobs/admin/create
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Senior Java Developer",
  "description": "Looking for an experienced Java developer with Spring Boot expertise.",
  "requiredSkills": "Java, Spring Boot, MySQL, Docker, REST APIs",
  "experience": "3-5 years",
  "salary": "12-18 LPA",
  "status": "Open",
  "createdBy": 1
}
```

---

## 🤖 AI Features Explained

### ATS Score (0–100)
When a candidate uploads a PDF resume:
1. PDFBox extracts all text
2. Text is sent to OpenAI GPT-3.5-turbo
3. AI analyses: keyword density, structure, skills, experience
4. Returns score + strengths + weaknesses + suggestions

### Job Match Score (0–100)
When a candidate applies to a job:
1. Candidate's skills are collected
2. Job's required skills are fetched
3. AI compares and calculates percentage match
4. Returns matched skills + missing skills

### Fallback Mode (No API Key)
If OpenAI key is not configured:
- ATS score uses rule-based text analysis
- Match score uses keyword string matching
- All features still work, just less accurate

---

## 🔐 Security Notes

- Passwords are BCrypt-hashed (cost factor 10)
- JWT tokens expire in 24 hours
- CORS is configured for localhost:3000
- All file uploads validate MIME type
- SQL injection prevented via JDBC PreparedStatements

---

## 📧 Email & SMS Simulation

The system simulates:
- **SMS (OTP)**: Printed to server console as `📱 [SMS SIMULATION] OTP for 9876543210 : 123456`
- **Email (Credentials)**: Logged as `📧 [EMAIL SIMULATION] To: email@example.com`
- **Email (Selection/Rejection)**: Logged to console

To enable real emails:
1. Create a Gmail App Password at https://myaccount.google.com/apppasswords
2. Update `spring.mail.username` and `spring.mail.password` in `application.properties`

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Connection refused port 8080` | Make sure Spring Boot backend is running |
| `Access denied for MySQL` | Update password in application.properties |
| `CORS error in browser` | Backend must be running on port 8080 |
| `401 Unauthorized` | Token expired — log in again |
| `PDF upload fails` | File must be PDF, under 5MB |
| `OTP not working` | Check server console for OTP value |
| `OpenAI 401 error` | Invalid or missing API key |
| `npm install fails` | Use Node.js v18 or higher |
| `Maven build fails` | Use Java 17+; run `mvn clean install` |

---

## 🧪 Test Data

After running schema.sql, these third-party jobs are pre-loaded:
- Java Backend Developer (LinkedIn)
- React Frontend Developer (Naukri)
- Full Stack Developer (Indeed)
- Data Scientist (Glassdoor)
- DevOps Engineer (LinkedIn)

---

## 📌 Important Notes

1. **OpenAI API Key** — Get yours at https://platform.openai.com/api-keys
   - Without it, fallback scoring still works
   - With it, you get detailed AI-powered analysis

2. **Admin Password** — The BCrypt hash in schema.sql corresponds to `admin123`
   - To change: generate new hash using `BCryptPasswordEncoder().encode("newpass")`

3. **File Storage** — Uploads go to `./uploads/` relative to where Spring Boot runs
   - In production, use cloud storage (S3, GCS)

4. **Production Readiness** — For production:
   - Set `openai.api.key` in environment variables
   - Use HTTPS
   - Configure proper email credentials
   - Use a cloud file storage service
   - Remove the OTP from the API response (dev-only feature)
