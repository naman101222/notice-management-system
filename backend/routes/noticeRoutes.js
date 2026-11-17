
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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

module.exports = router;



// GET notices relevant to a particular student
router.get('/student/:studentId', async (req, res) => {
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
