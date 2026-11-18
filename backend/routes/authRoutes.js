const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user in database
    const [users] = await pool.query(
      `SELECT User_ID, Full_Name, Email, Password_Hash, Role , Is_Active
             FROM \`USER\`
             WHERE Email = ?`,
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // 3. Check whether the account is active
    if (!user.Is_Active) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Contact the administrator.",
      });
    }

    // 3. Compare entered password with stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.Password_Hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        userId: user.User_ID,
        role: user.Role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    // 5. Send successful response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        userId: user.User_ID,
        name: user.Full_Name,
        email: user.Email,
        role: user.Role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
