
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// GET all published notices
router.get('/', async (req, res) => {
    try {
        const [notices] = await pool.query(`
            SELECT
                n.Notice_ID,
                n.Title,
                n.Body_Content,
                n.Priority,
                n.Publish_Date,
                n.Expiry_Date,
                c.Category_Name,
                u.Full_Name AS Published_By,
                u.Role AS Publisher_Role

            FROM NOTICE n

            JOIN CATEGORY c
                ON n.Category_ID = c.Category_ID

            JOIN USER u
                ON n.Created_By = u.User_ID

            WHERE n.Status = 'Published'

            ORDER BY n.Publish_Date DESC
        `);

        res.json({
            success: true,
            count: notices.length,
            notices: notices
        });

    } catch (error) {
        console.error('Notice fetch error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch notices'
        });
    }
});


// POST /api/notices/submit
// Only societies can submit notices

router.post(
    '/submit',
    authenticateToken,
    authorizeRoles('Society','Faculty'),
    async (req, res) => {

        const {
            title,
            bodyContent,
            priority,
            categoryId,
            expiryDate,
            targets
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !bodyContent ||
            !categoryId ||
            !Array.isArray(targets) ||
            targets.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Required fields or notice targets are missing'
            });
        }

        // Faculty can only target their own department
if (req.user.role === 'Faculty') {
    const [faculty] = await pool.query(
        `SELECT Dept_ID
         FROM FACULTY_PROFILE
         WHERE Faculty_ID = ?`,
        [req.user.userId]
    );

    if (faculty.length === 0) {
        return res.status(403).json({
            success: false,
            message: 'Faculty profile not found'
        });
    }

    const facultyDeptId = faculty[0].Dept_ID;

    const invalidTarget = targets.some(
        target => Number(target.deptId) !== facultyDeptId
    );

    if (invalidTarget) {
        return res.status(403).json({
            success: false,
            message: 'Faculty can only submit notices for their own department'
        });
    }
}

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Insert notice
            const [noticeResult] = await connection.query(
                `INSERT INTO NOTICE
                (Title, Body_Content, Priority, Status,
                 Created_By, Category_ID, Expiry_Date)
                VALUES (?, ?, ?, 'Pending', ?, ?, ?)`,
                [
                    title,
                    bodyContent,
                    priority || 'Medium',
                    req.user.userId,
                    categoryId,
                    expiryDate || null
                ]
            );

            const noticeId = noticeResult.insertId;

            // Insert department and semester targets
            for (const target of targets) {

                await connection.query(
                    `INSERT INTO NOTICE_TARGET
                    (Notice_ID, Dept_ID, Target_Semester)
                    VALUES (?, ?, ?)`,
                    [
                        noticeId,
                        target.deptId ?? null,
                        target.semester ?? null
                    ]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Notice submitted for approval',
                noticeId: noticeId,
                status: 'Pending'
            });

        } catch (error) {

            await connection.rollback();

            console.error('Notice submission error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not submit notice'
            });

        } finally {
            connection.release();
        }
    }
);


router.get(
    '/pending',
    authenticateToken,
    authorizeRoles('Admin', 'HOD'),
    async (req, res) => {

        try {
            let query = `
                SELECT
                    n.Notice_ID,
                    n.Title,
                    n.Body_Content,
                    n.Priority,
                    n.Status,
                    n.Created_By,
                    u.Full_Name AS Submitted_By,
                    u.Role AS Submitter_Role,
                    c.Category_Name,
                    n.Expiry_Date,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            COALESCE(d.Dept_Name, 'All Departments'),
                            ' - ',
                            COALESCE(nt.Target_Semester, 'All Semesters')
                        )
                        SEPARATOR ', '
                    ) AS Targets
                FROM NOTICE n
                JOIN \`USER\` u ON n.Created_By = u.User_ID
                JOIN CATEGORY c ON n.Category_ID = c.Category_ID
                LEFT JOIN NOTICE_TARGET nt ON n.Notice_ID = nt.Notice_ID
                LEFT JOIN DEPARTMENT d ON nt.Dept_ID = d.Dept_ID
                WHERE n.Status = 'Pending'
            `;

            const params = [];

            // HOD sees notices targeting their department.
            if (req.user.role === 'HOD') {
                query += `
                    AND EXISTS (
                        SELECT 1
                        FROM NOTICE_TARGET nt2
                        JOIN FACULTY_PROFILE fp
                            ON fp.Dept_ID = nt2.Dept_ID
                        WHERE nt2.Notice_ID = n.Notice_ID
                        AND fp.Faculty_ID = ?
                    )
                `;
                params.push(req.user.userId);
            }

            query += `
                GROUP BY n.Notice_ID
                ORDER BY n.Notice_ID DESC
            `;

            const [notices] = await pool.query(query, params);

            res.json({
                success: true,
                count: notices.length,
                notices
            });

        } catch (error) {
            console.error('Pending notices error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not retrieve pending notices'
            });
        }
    }
);



router.put(
    '/:noticeId/approve',
    authenticateToken,
    authorizeRoles('Admin', 'HOD'),
    async (req, res) => {

        const { noticeId } = req.params;

        try {
            let sql = `
                UPDATE NOTICE n
                SET
                    n.Status = 'Published',
                    n.Approved_By = ?,
                    n.Approved_At = NOW(),
                    n.Publish_Date = NOW()
                WHERE n.Notice_ID = ?
                AND n.Status = 'Pending'
            `;

            const params = [req.user.userId, noticeId];

            // HOD can approve only notices exclusively
            // targeted to their own department.
            if (req.user.role === 'HOD') {

                sql += `
                    AND EXISTS (
                        SELECT 1
                        FROM FACULTY_PROFILE fp
                        WHERE fp.Faculty_ID = ?
                        AND NOT EXISTS (
                            SELECT 1
                            FROM NOTICE_TARGET nt
                            WHERE nt.Notice_ID = n.Notice_ID
                            AND (
                                nt.Dept_ID IS NULL
                                OR nt.Dept_ID <> fp.Dept_ID
                            )
                        )
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM NOTICE_TARGET nt
                        JOIN FACULTY_PROFILE fp
                            ON nt.Dept_ID = fp.Dept_ID
                        WHERE nt.Notice_ID = n.Notice_ID
                        AND fp.Faculty_ID = ?
                    )
                `;

                params.push(req.user.userId, req.user.userId);
            }

            const [result] = await pool.query(sql, params);

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Notice not found, already processed, or you are not authorised to approve it'
                });
            }

            res.json({
                success: true,
                message: 'Notice approved and published successfully',
                noticeId: Number(noticeId)
            });

        } catch (error) {
            console.error('Notice approval error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not approve notice'
            });
        }
    }
);


router.put(
    '/:noticeId/reject',
    authenticateToken,
    authorizeRoles('Admin', 'HOD'),
    async (req, res) => {

        const { noticeId } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        try {
            let sql = `
                UPDATE NOTICE n
                SET
                    n.Status = 'Rejected',
                    n.Rejection_Reason = ?
                WHERE n.Notice_ID = ?
                AND n.Status = 'Pending'
            `;

            const params = [reason.trim(), noticeId];

            // HOD can reject only notices targeting their department
            if (req.user.role === 'HOD') {

                sql += `
                    AND EXISTS (
                        SELECT 1
                        FROM FACULTY_PROFILE fp
                        WHERE fp.Faculty_ID = ?
                        AND NOT EXISTS (
                            SELECT 1
                            FROM NOTICE_TARGET nt
                            WHERE nt.Notice_ID = n.Notice_ID
                            AND (
                                nt.Dept_ID IS NULL
                                OR nt.Dept_ID <> fp.Dept_ID
                            )
                        )
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM NOTICE_TARGET nt
                        JOIN FACULTY_PROFILE fp
                            ON nt.Dept_ID = fp.Dept_ID
                        WHERE nt.Notice_ID = n.Notice_ID
                        AND fp.Faculty_ID = ?
                    )
                `;

                params.push(req.user.userId, req.user.userId);
            }

            const [result] = await pool.query(sql, params);

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Notice not found, already processed, or you are not authorised to reject it'
                });
            }

            res.json({
                success: true,
                message: 'Notice rejected successfully',
                noticeId: Number(noticeId)
            });

        } catch (error) {
            console.error('Notice rejection error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not reject notice'
            });
        }
    }
);



// GET notices submitted by the logged-in society
router.get(
    '/mine',
    authenticateToken,
    authorizeRoles('Society', 'Faculty'),
    async (req, res) => {
        try {
            const [notices] = await pool.query(
                `
                SELECT
                    n.Notice_ID,
                    n.Title,
                    n.Body_Content,
                    n.Priority,
                    n.Status,
                    n.Expiry_Date,
                    n.Rejection_Reason,
                    n.Created_By,
                    c.Category_Name,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            COALESCE(d.Dept_Name, 'All Departments'),
                            ' - ',
                            COALESCE(nt.Target_Semester, 'All Semesters')
                        )
                        SEPARATOR ', '
                    ) AS Targets
                FROM NOTICE n
                JOIN CATEGORY c
                    ON n.Category_ID = c.Category_ID
                LEFT JOIN NOTICE_TARGET nt
                    ON n.Notice_ID = nt.Notice_ID
                LEFT JOIN DEPARTMENT d
                    ON nt.Dept_ID = d.Dept_ID
                WHERE n.Created_By = ?
                GROUP BY n.Notice_ID
                ORDER BY n.Notice_ID DESC
                `,
                [req.user.userId]
            );

            res.json({
                success: true,
                count: notices.length,
                notices
            });

        } catch (error) {
            console.error('Society notices error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not retrieve your notices'
            });
        }
    }
);


// GET categories and departments for Society notice submission
router.get(
    '/options',
    authenticateToken,
    authorizeRoles('Society', 'Faculty'),
    async (req, res) => {
        try {
            const [categories] = await pool.query(
                `SELECT Category_ID, Category_Name
                 FROM CATEGORY
                 ORDER BY Category_Name`
            );

           let departments;

if (req.user.role === 'Faculty') {
    const [facultyDepartments] = await pool.query(
        `SELECT d.Dept_ID, d.Dept_Name
         FROM FACULTY_PROFILE f
         JOIN DEPARTMENT d
             ON f.Dept_ID = d.Dept_ID
         WHERE f.Faculty_ID = ?`,
        [req.user.userId]
    );

    departments = facultyDepartments;

} else {
    const [allDepartments] = await pool.query(
        `SELECT Dept_ID, Dept_Name
         FROM DEPARTMENT
         ORDER BY Dept_Name`
    );

    departments = allDepartments;
}

            res.json({
                success: true,
                categories,
                departments
            });

        } catch (error) {
            console.error('Options fetch error:', error);

            res.status(500).json({
                success: false,
                message: 'Could not fetch categories and departments'
            });
        }
    }
);

// GET notices relevant to a particular student
router.get('/student/:studentId', authenticateToken, async (req, res) => {

    // Students can only access their own notices
    if (
    req.user.role === 'Student' &&
    req.user.userId !== Number(req.params.studentId)
    ) {
    return res.status(403).json({
        success: false,
        message: 'You are not authorized to access these notices'
    });
    }

    try {
        const studentId = req.params.studentId;

        const [notices] = await pool.query(`
            SELECT DISTINCT
                n.Notice_ID,
                n.Title,
                n.Body_Content,
                n.Priority,
                n.Publish_Date,
                n.Expiry_Date,
                c.Category_Name,
                u.Full_Name AS Published_By,
                u.Role AS Publisher_Role

            FROM STUDENT_PROFILE sp

            JOIN NOTICE_TARGET nt
                ON (
                    nt.Dept_ID IS NULL
                    OR nt.Dept_ID = sp.Dept_ID
                )
                AND (
                    nt.Target_Semester IS NULL
                    OR nt.Target_Semester = sp.Semester
                )

            JOIN NOTICE n
                ON n.Notice_ID = nt.Notice_ID

            JOIN CATEGORY c
                ON n.Category_ID = c.Category_ID

            JOIN \`USER\` u
                ON n.Created_By = u.User_ID

            WHERE sp.Student_ID = ?
            AND n.Status = 'Published'

            ORDER BY n.Publish_Date DESC
        `, [studentId]);

        res.json({
            success: true,
            studentId: studentId,
            count: notices.length,
            notices: notices
        });

    } catch (error) {
        console.error('Student notice error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch student notices'
        });
    }
});

module.exports = router;
