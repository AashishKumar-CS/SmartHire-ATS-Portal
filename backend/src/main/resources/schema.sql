-- SmartHire Database Schema
CREATE DATABASE IF NOT EXISTS smarthire_db;
USE smarthire_db;

-- Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL,
    gender VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    domain VARCHAR(100),
    certifications TEXT,
    internship_status ENUM('Fresher','Internship','Job') DEFAULT 'Fresher',
    github_link VARCHAR(300),
    resume_path VARCHAR(500),
    profile_image VARCHAR(500),
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    ats_score DECIMAL(5,2) DEFAULT 0,
    mobile_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Education Details
CREATE TABLE IF NOT EXISTS education_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    level ENUM('10th','12th','Graduation','PostGraduation') NOT NULL,
    institution_name VARCHAR(300),
    board_university VARCHAR(200),
    year_of_passing INT,
    percentage_cgpa VARCHAR(20),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- Jobs Table (Admin Created)
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    required_skills TEXT,
    experience VARCHAR(100),
    salary VARCHAR(100),
    status ENUM('Open','Closed') DEFAULT 'Open',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin(id)
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    job_id INT,
    third_party_job_id INT,
    job_type ENUM('internal','external') DEFAULT 'internal',
    status ENUM('Applied','In Progress','Selected','Rejected') DEFAULT 'Applied',
    match_score DECIMAL(5,2) DEFAULT 0,
    skill_gap TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Third Party Jobs
CREATE TABLE IF NOT EXISTS third_party_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    description TEXT,
    required_skills TEXT,
    external_url VARCHAR(500),
    salary VARCHAR(100),
    location VARCHAR(200),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP Table
CREATE TABLE IF NOT EXISTS otp_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);

-- Insert default admin
INSERT IGNORE INTO admin (username, password, email, full_name)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8RIZe.QkS7A4PeY8e2', 'admin@smarthire.com', 'Super Admin');


-- Insert sample third-party jobs
INSERT IGNORE INTO third_party_jobs (title, company, description, required_skills, external_url, salary, location, source)
VALUES
('Java Backend Developer', 'TechCorp India', 'We need a skilled Java developer with Spring Boot expertise.', 'Java,Spring Boot,MySQL,REST APIs', 'https://linkedin.com/jobs/1', '8-12 LPA', 'Bangalore', 'LinkedIn'),
('React Frontend Developer', 'WebSolutions Pvt Ltd', 'Looking for a React.js developer with strong UI skills.', 'React,JavaScript,CSS,HTML', 'https://naukri.com/jobs/2', '6-10 LPA', 'Pune', 'Naukri'),
('Full Stack Developer', 'StartupHub', 'Full stack role with Node.js and React.', 'Node.js,React,MongoDB,Express', 'https://indeed.com/jobs/3', '10-15 LPA', 'Remote', 'Indeed'),
('Data Scientist', 'DataMinds Analytics', 'ML/AI focused data science role.', 'Python,Machine Learning,TensorFlow,SQL', 'https://glassdoor.com/jobs/4', '12-18 LPA', 'Hyderabad', 'Glassdoor'),
('DevOps Engineer', 'CloudNine Technologies', 'CI/CD and cloud infrastructure role.', 'AWS,Docker,Kubernetes,Jenkins', 'https://linkedin.com/jobs/5', '15-20 LPA', 'Mumbai', 'LinkedIn');
