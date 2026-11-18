
import { useState } from "react";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import HODDashboard from "./components/HODDashboard";
import api from "./services/api";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to connect to the server"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setEmail("");
    setPassword("");
  };

  // ADMIN DASHBOARD
  if (user?.role === "Admin") {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // STUDENT DASHBOARD
  if (user?.role === "Student") {
    return (
      <StudentDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }


  // HOD DASHBOARD
if (user?.role === "HOD") {
  return (
    <HODDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}
  // Temporary dashboard for other roles
  if (user) {
    return (
      <div className="dashboard">
        <div className="dashboard-card">
          <div className="logo">✦</div>

          <h1>Welcome, {user.name}!</h1>

          <p>
            You are logged in to Campus Notice Management System.
          </p>

          <div className="user-details">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.userId}</p>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  // LOGIN PAGE
  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-left">
          <div className="brand">
            <div className="logo">
              <span style={{ fontSize: "25px" }}>🎓</span>
            </div>
            <span>Campus Notice</span>
          </div>

          <div className="welcome-text">
            <p className="eyebrow">YOUR CAMPUS. ONE PLATFORM.</p>

            <h1>
              Stay informed.
              <br />
              Stay connected.
            </h1>

            <p>
              Access verified college notices, academic updates, events and
              announcements in one place.
            </p>
          </div>

          <div className="footer-text">
            Campus Notice Management System
          </div>
        </div>

        <div className="login-right">
          <form onSubmit={handleLogin}>
            <h2>Welcome back</h2>

            <p className="subtitle">
              Sign in to access your campus portal.
            </p>

            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="login-note">
              Secure access for students, faculty, administrators and campus
              societies.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;
