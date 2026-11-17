
USE campus_notice_db;

-- 1. DEPARTMENTS


INSERT INTO DEPARTMENT (Dept_Name, Dept_Code)
VALUES
('Computer Science and Engineering', 'CSE'),
('Mathematics and Computing', 'MNC'),
('Electronics and Communication Engineering', 'ECE'),
('Information Technology', 'IT'),
('Robotics and Artificial Intelligence', 'RAI');



-- 2. CATEGORIES

INSERT INTO CATEGORY (Category_Name, Description)
VALUES
('Academic', 'Academic announcements and updates'),
('Exams', 'Examination schedules and circulars'),
('Placements', 'Placement opportunities and updates'),
('Events', 'College events and activities');



-- =========================================
-- 3. USER ACCOUNTS
-- =========================================

INSERT INTO `USER`
(User_ID, Full_Name, Email, Password_Hash, Role)
VALUES

-- ADMIN
(1, 'System Administrator',
 'admin@campus.edu', 'TEMP_HASH_1', 'Admin'),

-- HODS
(2, 'Rahul Mehta', 'rahul.hod@campus.edu',
 'TEMP_HASH_2', 'HOD'),

(3, 'Priya Sharma', 'priya.hod@campus.edu',
 'TEMP_HASH_3', 'HOD'),

(4, 'Amit Verma', 'amit.hod@campus.edu',
 'TEMP_HASH_4', 'HOD'),

(5, 'Neha Gupta', 'neha.hod@campus.edu',
 'TEMP_HASH_5', 'HOD'),

(6, 'Karan Malhotra', 'karan.hod@campus.edu',
 'TEMP_HASH_6', 'HOD'),

-- FACULTY
(7, 'Ankit Singh', 'ankit.faculty@campus.edu',
 'TEMP_HASH_7', 'Faculty'),

(8, 'Sneha Kapoor', 'sneha.faculty@campus.edu',
 'TEMP_HASH_8', 'Faculty'),

(9, 'Rohit Jain', 'rohit.faculty@campus.edu',
 'TEMP_HASH_9', 'Faculty'),

(10, 'Pooja Verma', 'pooja.faculty@campus.edu',
 'TEMP_HASH_10', 'Faculty'),

(11, 'Vikram Rao', 'vikram.faculty@campus.edu',
 'TEMP_HASH_11', 'Faculty'),

-- STUDENTS
(12, 'Aarav Sharma', 'aarav@campus.edu',
 'TEMP_HASH_12', 'Student'),

(13, 'Ishita Gupta', 'ishita@campus.edu',
 'TEMP_HASH_13', 'Student'),

(14, 'Aditya Verma', 'aditya@campus.edu',
 'TEMP_HASH_14', 'Student'),

(15, 'Riya Mehta', 'riya@campus.edu',
 'TEMP_HASH_15', 'Student'),

(16, 'Arjun Singh', 'arjun@campus.edu',
 'TEMP_HASH_16', 'Student'),

(17, 'Kavya Jain', 'kavya@campus.edu',
 'TEMP_HASH_17', 'Student'),

(18, 'Dev Malhotra', 'dev@campus.edu',
 'TEMP_HASH_18', 'Student'),

(19, 'Ananya Rao', 'ananya@campus.edu',
 'TEMP_HASH_19', 'Student'),

(20, 'Siddharth Das', 'siddharth@campus.edu',
 'TEMP_HASH_20', 'Student'),

(21, 'Meera Kapoor', 'meera@campus.edu',
 'TEMP_HASH_21', 'Student'),

-- SOCIETIES
(22, 'IEEE Student Branch', 'ieee@campus.edu',
 'TEMP_HASH_22', 'Society'),

(23, 'Coding Society', 'coding@campus.edu',
 'TEMP_HASH_23', 'Society');


-- =========================================
-- 4. FACULTY PROFILES
-- =========================================

INSERT INTO FACULTY_PROFILE
(Faculty_ID, Employee_Code, Dept_ID, Designation)
VALUES

-- HODS
(2, 'EMP001', 1, 'Head of Department'),
(3, 'EMP002', 2, 'Head of Department'),
(4, 'EMP003', 3, 'Head of Department'),
(5, 'EMP004', 4, 'Head of Department'),
(6, 'EMP005', 5, 'Head of Department'),

-- FACULTY
(7, 'EMP006', 1, 'Assistant Professor'),
(8, 'EMP007', 2, 'Assistant Professor'),
(9, 'EMP008', 3, 'Associate Professor'),
(10, 'EMP009', 4, 'Assistant Professor'),
(11, 'EMP010', 5, 'Associate Professor');

-- =========================================
-- 5. STUDENT PROFILES
-- =========================================

INSERT INTO STUDENT_PROFILE
(Student_ID, Roll_Number, Dept_ID, Semester, Batch_Year)
VALUES

(12, '2501030012', 1, 3, 2025),
(13, '2501030013', 1, 3, 2025),
(14, '2501030014', 1, 3, 2025),

(15, '2502030015', 2, 3, 2025),
(16, '2502030016', 2, 3, 2025),

(17, '2503030017', 3, 3, 2025),
(18, '2503030018', 3, 3, 2025),

(19, '2504030019', 4, 3, 2025),

(20, '2505030020', 5, 3, 2025),
(21, '2505030021', 5, 3, 2025);


-- =========================================
-- 6. NOTICE RECORDS
-- =========================================

USE campus_notice_db;

INSERT INTO NOTICE
(Title, Body_Content, Priority, Status,
 Publish_Date, Expiry_Date, Created_By, Category_ID,
 Approved_By, Approved_At)
VALUES

-- Academic notices
('Academic Calendar - Semester 3',
 'The academic calendar for semester 3 is now available.',
 'High', 'Published',
 '2026-11-10 09:00:00', '2026-12-31 23:59:00',
 2, 1, 2, '2026-11-10 08:45:00'),

('Attendance Guidelines',
 'Students are reminded to maintain the required attendance percentage.',
 'Medium', 'Published',
 '2026-11-11 10:00:00', '2026-12-31 23:59:00',
 3, 1, 3, '2026-11-11 09:45:00'),

-- Examination notices
('Mid Semester Examination Schedule',
 'The mid semester examination timetable has been released.',
 'Urgent', 'Published',
 '2026-11-12 12:00:00', '2026-11-25 23:59:00',
 2, 2, 2, '2026-11-12 11:30:00'),

('Practical Examination Guidelines',
 'Guidelines and instructions for practical examinations.',
 'High', 'Published',
 '2026-11-13 09:00:00', '2026-11-30 23:59:00',
 4, 2, 4, '2026-11-13 08:30:00'),

-- Placement notices
('Summer Internship Registration',
 'Registration is open for summer internship opportunities.',
 'High', 'Published',
 '2026-11-14 10:00:00', '2026-11-22 23:59:00',
 7, 3, 2, '2026-11-14 09:30:00'),

('Campus Placement Preparation Session',
 'A placement preparation session will be organised for students.',
 'Medium', 'Published',
 '2026-11-14 14:00:00', '2026-12-01 23:59:00',
 8, 3, 3, '2026-11-14 13:30:00'),

-- Events
('Interdepartmental Coding Contest',
 'A coding competition will be conducted for interested students.',
 'High', 'Published',
 '2026-11-15 09:00:00', '2026-11-28 23:59:00',
 22, 4, 2, '2026-11-15 08:30:00'),

('IEEE Technical Workshop',
 'IEEE Student Branch is organising a technical workshop.',
 'Medium', 'Published',
 '2026-11-15 11:00:00', '2026-11-25 23:59:00',
 22, 4, 3, '2026-11-15 10:30:00'),

('Robotics Innovation Challenge',
 'Students are invited to participate in a robotics challenge.',
 'High', 'Published',
 '2026-11-15 15:00:00', '2026-11-29 23:59:00',
 23, 4, 6, '2026-11-15 14:30:00'),

-- Pending and draft notices
('Upcoming Hackathon Registration',
 'Registration details for the upcoming hackathon.',
 'High', 'Pending',
 NULL, '2026-12-10 23:59:00',
 23, 4, NULL, NULL),

('Guest Lecture on Artificial Intelligence',
 'A guest lecture on recent developments in AI.',
 'Medium', 'Pending',
 NULL, '2026-12-05 23:59:00',
 10, 1, NULL, NULL),

('Student Feedback Submission',
 'Students are requested to submit their semester feedback.',
 'Low', 'Draft',
 NULL, '2026-12-15 23:59:00',
 11, 1, NULL, NULL);



-- =========================================
-- 7. NOTICE TARGETS
-- =========================================

-- Notice 1: All departments, all semesters
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(1, NULL, NULL);

-- Notice 2: CSE, all semesters
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(2, 1, NULL);

-- Notice 3: All departments
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(3, NULL, NULL);

-- Notice 4: ECE, semester 3
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(4, 3, 3);

-- Notice 5: CSE and MNC, semester 3
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(5, 1, 3),
(5, 2, 3);

-- Notice 6: All departments, semester 3
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(6, NULL, 3);

-- Notice 7: CSE and MNC
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(7, 1, NULL),
(7, 2, NULL);

-- Notice 8: All departments
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(8, NULL, NULL);

-- Notice 9: Robotics and AI
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(9, 5, NULL);

-- Notice 10: All departments
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(10, NULL, NULL);

-- Notice 11: CSE
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(11, 1, NULL);

-- Notice 12: All departments
INSERT INTO NOTICE_TARGET
(Notice_ID, Dept_ID, Target_Semester)
VALUES
(12, NULL, NULL);



-- =========================================
-- 8. BOOKMARKS
-- =========================================

INSERT INTO BOOKMARK (User_ID, Notice_ID)
VALUES
(12, 1),
(12, 3),
(12, 7),
(13, 1),
(13, 5),
(14, 3),
(15, 1),
(15, 7),
(16, 5),
(17, 4),
(18, 3),
(19, 6),
(20, 9),
(21, 8);


-- =========================================
-- 9. NOTICE ATTACHMENTS
-- =========================================

INSERT INTO NOTICE_ATTACHMENT
(Notice_ID, File_Path, File_Type)
VALUES
(1, '/uploads/academic_calendar.pdf', 'PDF'),
(3, '/uploads/exam_schedule.pdf', 'PDF'),
(4, '/uploads/practical_guidelines.pdf', 'PDF'),
(5, '/uploads/internship_details.pdf', 'PDF'),
(7, '/uploads/coding_contest_rules.pdf', 'PDF'),
(8, '/uploads/ieee_workshop_poster.png', 'PNG'),
(9, '/uploads/robotics_challenge.pdf', 'PDF');
