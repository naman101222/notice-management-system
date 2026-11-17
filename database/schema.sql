
-- CAMPUS NOTICE MANAGEMENT SYSTEM
-- DATABASE SCHEMA

CREATE DATABASE IF NOT EXISTS campus_notice_db;
USE campus_notice_db;

-- 1. DEPARTMENT
CREATE TABLE DEPARTMENT (
    Dept_ID INT AUTO_INCREMENT PRIMARY KEY,
    Dept_Name VARCHAR(100) NOT NULL UNIQUE,
    Dept_Code VARCHAR(20) NOT NULL UNIQUE
);

-- 2. CATEGORY
CREATE TABLE CATEGORY (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);

-- 3. USER
CREATE TABLE `USER` (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Full_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'HOD', 'Faculty', 'Student', 'Society')
        NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT_PROFILE
CREATE TABLE STUDENT_PROFILE (
    Student_ID INT PRIMARY KEY,
    Roll_Number VARCHAR(30) NOT NULL UNIQUE,
    Dept_ID INT NOT NULL,
    Semester INT NOT NULL,
    Batch_Year YEAR,

    FOREIGN KEY (Student_ID)
        REFERENCES `USER`(User_ID),

    FOREIGN KEY (Dept_ID)
        REFERENCES DEPARTMENT(Dept_ID),

    CHECK (Semester BETWEEN 1 AND 8)
);

-- 5. FACULTY_PROFILE
CREATE TABLE FACULTY_PROFILE (
    Faculty_ID INT PRIMARY KEY,
    Employee_Code VARCHAR(30) UNIQUE,
    Dept_ID INT NOT NULL,
    Designation VARCHAR(100),

    FOREIGN KEY (Faculty_ID)
        REFERENCES `USER`(User_ID),

    FOREIGN KEY (Dept_ID)
        REFERENCES DEPARTMENT(Dept_ID)
);

-- 6. NOTICE
CREATE TABLE NOTICE (
    Notice_ID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    Body_Content TEXT NOT NULL,

    Priority ENUM('Low', 'Medium', 'High', 'Urgent')
        DEFAULT 'Medium',

    Status ENUM('Draft', 'Pending', 'Published', 'Rejected')
        DEFAULT 'Draft',

    Publish_Date DATETIME,
    Expiry_Date DATETIME,

    Created_By INT NOT NULL,
    Category_ID INT NOT NULL,

    Approved_By INT,
    Approved_At DATETIME,
    Rejection_Reason VARCHAR(500),

    FOREIGN KEY (Created_By)
        REFERENCES `USER`(User_ID),

    FOREIGN KEY (Category_ID)
        REFERENCES CATEGORY(Category_ID),

    FOREIGN KEY (Approved_By)
        REFERENCES `USER`(User_ID),

    CHECK (
        Expiry_Date IS NULL
        OR Publish_Date IS NULL
        OR Expiry_Date > Publish_Date
    )
);

-- 7. NOTICE_ATTACHMENT
CREATE TABLE NOTICE_ATTACHMENT (
    Attachment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Notice_ID INT NOT NULL,
    File_Path VARCHAR(500) NOT NULL,
    File_Type VARCHAR(50),

    FOREIGN KEY (Notice_ID)
        REFERENCES NOTICE(Notice_ID)
        ON DELETE CASCADE
);

-- 8. NOTICE_TARGET
CREATE TABLE NOTICE_TARGET (
    Target_ID INT AUTO_INCREMENT PRIMARY KEY,
    Notice_ID INT NOT NULL,
    Dept_ID INT NULL,
    Target_Semester INT NULL,

    FOREIGN KEY (Notice_ID)
        REFERENCES NOTICE(Notice_ID)
        ON DELETE CASCADE,

    FOREIGN KEY (Dept_ID)
        REFERENCES DEPARTMENT(Dept_ID),

    CHECK (
        Target_Semester IS NULL
        OR Target_Semester BETWEEN 1 AND 8
    )
);

-- 9. BOOKMARK
CREATE TABLE BOOKMARK (
    User_ID INT NOT NULL,
    Notice_ID INT NOT NULL,
    Saved_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (User_ID, Notice_ID),

    FOREIGN KEY (User_ID)
        REFERENCES `USER`(User_ID)
        ON DELETE CASCADE,

    FOREIGN KEY (Notice_ID)
        REFERENCES NOTICE(Notice_ID)
        ON DELETE CASCADE
);
