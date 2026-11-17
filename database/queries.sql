
USE campus_notice_db;

SELECT DISTINCT
    n.Notice_ID,
    n.Title,
    n.Priority,
    n.Publish_Date,
    c.Category_Name,
    u.Full_Name AS Published_By

FROM NOTICE n

JOIN CATEGORY c
    ON n.Category_ID = c.Category_ID

JOIN `USER` u
    ON n.Created_By = u.User_ID

JOIN NOTICE_TARGET nt
    ON n.Notice_ID = nt.Notice_ID

WHERE n.Status = 'Published'

AND (
    nt.Dept_ID = 1
    OR nt.Dept_ID IS NULL
)

AND (
    nt.Target_Semester = 3
    OR nt.Target_Semester IS NULL
)

ORDER BY n.Publish_Date DESC;




SELECT
    n.Notice_ID,
    n.Title,
    creator.Full_Name AS Created_By,
    creator.Role AS Creator_Role,
    approver.Full_Name AS Approved_By,
    n.Approved_At,
    n.Status

FROM NOTICE n

JOIN `USER` creator
    ON n.Created_By = creator.User_ID

LEFT JOIN `USER` approver
    ON n.Approved_By = approver.User_ID;





SELECT *
FROM NOTICE
WHERE Category_ID IN
(
    SELECT Category_ID
    FROM NOTICE
    GROUP BY Category_ID
    HAVING COUNT(*) =
    (
        SELECT MAX(total)
        FROM
        (
            SELECT COUNT(*) AS total
            FROM NOTICE
            GROUP BY Category_ID
        ) AS category_counts
    )
);



    CREATE VIEW PUBLISHED_NOTICE_VIEW AS

SELECT
    n.Notice_ID,
    n.Title,
    n.Priority,
    n.Publish_Date,
    n.Expiry_Date,
    c.Category_Name,
    u.Full_Name AS Published_By,
    u.Role AS Publisher_Role

FROM NOTICE n

JOIN CATEGORY c
    ON n.Category_ID = c.Category_ID

JOIN `USER` u
    ON n.Created_By = u.User_ID

WHERE n.Status = 'Published';