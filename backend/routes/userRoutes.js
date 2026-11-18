
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');

const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Generate a temporary password for the new account
const generateTemporaryPassword = () => {
    return crypto.randomBytes(9).toString('base64url');
};

// GET /api/users
// Admin can view all registered users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT
                u.User_ID,
                u.Full_Name,
                u.Email,
                u.Role,
                u.Is_Active,
                CASE
                    WHEN u.Role = 'Student' THEN d.Dept_Name
                    WHEN u.Role IN ('Faculty', 'HOD') THEN d.Dept_Name
                    ELSE NULL
                END AS Department,
                CASE
                    WHEN u.Role = 'Student' THEN sp.Semester
                    ELSE NULL
                END AS Semester
            FROM \`USER\` u
            LEFT JOIN STUDENT_PROFILE sp
                ON u.User_ID = sp.Student_ID
            LEFT JOIN FACULTY_PROFILE fp
                ON u.User_ID = fp.Faculty_ID
            LEFT JOIN DEPARTMENT d
                ON d.Dept_ID = COALESCE(sp.Dept_ID, fp.Dept_ID)
            ORDER BY u.User_ID DESC
        `);

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Fetch users error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to retrieve users.'
        });
    }
});

// POST /api/users
// Admin creates a Student, Faculty, HOD or Society account
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const {
        fullName,
        email,
        role,
        deptId,
        semester,
        rollNumber,
        batchYear,
        employeeCode,
        designation
    } = req.body;

    // Basic validation
    if (!fullName?.trim() || !email?.trim() || !role) {
        return res.status(400).json({
            success: false,
            message: 'Full name, email and role are required.'
        });
    }

    const allowedRoles = ['Student', 'Faculty', 'HOD', 'Society'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role. Admin accounts cannot be created here.'
        });
    }

    if (role === 'Student') {
        if (!deptId || !semester || !rollNumber?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Student requires department, semester and roll number.'
            });
        }

        if (!Number.isInteger(Number(semester)) ||
            Number(semester) < 1 || Number(semester) > 8) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be between 1 and 8.'
            });
        }
    }

    if (role === 'Faculty' || role === 'HOD') {
        if (!deptId) {
            return res.status(400).json({
                success: false,
                message: 'Faculty and HOD accounts require a department.'
            });
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check whether the email is already registered
        const [existingUsers] = await connection.query(
            'SELECT User_ID FROM `USER` WHERE Email = ?',
            [email.trim()]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        const temporaryPassword = generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        // Create the main user account
        const [userResult] = await connection.query(
            `INSERT INTO \`USER\`
                (Full_Name, Email, Password_Hash, Role)
             VALUES (?, ?, ?, ?)`,
            [
                fullName.trim(),
                email.trim(),
                passwordHash,
                role
            ]
        );

        const newUserId = userResult.insertId;

        // Create the appropriate profile
        if (role === 'Student') {
            await connection.query(
                `INSERT INTO STUDENT_PROFILE
                    (Student_ID, Roll_Number, Dept_ID, Semester, Batch_Year)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    newUserId,
                    rollNumber.trim(),
                    Number(deptId),
                    Number(semester),
                    batchYear || null
                ]
            );
        }

        if (role === 'Faculty' || role === 'HOD') {
            await connection.query(
                `INSERT INTO FACULTY_PROFILE
                    (Faculty_ID, Employee_Code, Dept_ID, Designation)
                 VALUES (?, ?, ?, ?)`,
                [
                    newUserId,
                    employeeCode?.trim() || null,
                    Number(deptId),
                    designation?.trim() ||
                        (role === 'HOD' ? 'Head of Department' : 'Faculty')
                ]
            );
        }

        // Society accounts only require a USER record.
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'User account created successfully.',
            credentials: {
                userId: newUserId,
                fullName: fullName.trim(),
                email: email.trim(),
                role,
                temporaryPassword
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Create user error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email, roll number or employee code already exists.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'The selected department does not exist.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Unable to create user account.'
        });

    } finally {
        connection.release();
    }
});


// PATCH /api/users/:id/deactivate
router.patch('/:id/deactivate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Prevent Admin from deactivating their own account
        if (userId === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        const [result] = await pool.execute(
            'UPDATE `USER` SET Is_Active = FALSE WHERE User_ID = ? AND Is_Active = TRUE',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already inactive'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


// PATCH /api/users/:id/activate
router.patch('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const [result] = await pool.execute(
            'UPDATE `USER` SET Is_Active = TRUE WHERE User_ID = ? AND Is_Active = FALSE',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already active'
            });
        }

        res.json({
            success: true,
            message: 'User activated successfully'
        });

    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


module.exports = router;
