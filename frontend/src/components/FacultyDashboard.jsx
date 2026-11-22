
import { useEffect, useState } from "react";
import api from "../services/api";

function FacultyDashboard({ user, onLogout }) {
    const [categories, setCategories] = useState([]);
    const [department, setDepartment] = useState(null);
    const [notices, setNotices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        title: "",
        bodyContent: "",
        priority: "Medium",
        categoryId: "",
        semester: "",
        expiryDate: ""
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [optionsRes, noticesRes] = await Promise.all([
                api.get("/notices/options"),
                api.get("/notices/mine")
            ]);

            setCategories(optionsRes.data.categories || []);

            // Faculty receives only their own department.
            setDepartment(optionsRes.data.departments?.[0] || null);

            setNotices(noticesRes.data.notices || []);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load Faculty dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!department) {
            setError("Your department could not be identified.");
            return;
        }

        if (!form.categoryId) {
            setError("Please select a category.");
            return;
        }

        try {
            setSaving(true);

            await api.post("/notices/submit", {
                title: form.title,
                bodyContent: form.bodyContent,
                priority: form.priority,
                categoryId: Number(form.categoryId),
                expiryDate: form.expiryDate
                    ? `${form.expiryDate} 23:59:59`
                    : null,

                // Faculty can only target their own department.
                targets: [{
                    deptId: department.Dept_ID,
                    semester: form.semester
                        ? Number(form.semester)
                        : null
                }]
            });

            setSuccess("Notice submitted successfully for approval!");

            setForm({
                title: "",
                bodyContent: "",
                priority: "Medium",
                categoryId: "",
                semester: "",
                expiryDate: ""
            });

            await loadData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Notice submission failed."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="society-loading">
                Loading Faculty dashboard...
            </div>
        );
    }

    return (
        <div className="society-dashboard">

            <aside className="society-sidebar">
                <h2>Campus<span>Notice</span></h2>

                <p className="society-sidebar-label">FACULTY PORTAL</p>

                <div className="society-profile">
                    <div className="society-avatar">
                        {user.name?.charAt(0)}
                    </div>

                    <div>
                        <strong>{user.name}</strong>
                        <small>Faculty Account</small>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="society-logout"
                >
                    Logout
                </button>
            </aside>

            <main className="society-main">

                <header className="society-header">
                    <div>
                        <p>FACULTY WORKSPACE</p>
                        <h1>{user.name}</h1>
                        <span>
                            Manage departmental announcements.
                        </span>
                    </div>

                    <div className="society-role">FACULTY</div>
                </header>

                {error && (
                    <div className="society-error">{error}</div>
                )}

                {success && (
                    <div className="society-success">{success}</div>
                )}

                <section className="society-stats">

                    <div className="society-stat-card">
                        <span>Total Submissions</span>
                        <h2>{notices.length}</h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Pending</span>
                        <h2>
                            {notices.filter(
                                n => n.Status === "Pending"
                            ).length}
                        </h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Published</span>
                        <h2>
                            {notices.filter(
                                n => n.Status === "Published"
                            ).length}
                        </h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Rejected</span>
                        <h2>
                            {notices.filter(
                                n => n.Status === "Rejected"
                            ).length}
                        </h2>
                    </div>

                </section>

                <section className="society-section">
                    <h2>Submit a Department Notice</h2>

                    <p>
                        Submit an announcement for approval by your HOD
                        or the administrator.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="society-form"
                    >

                        <label>Notice Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Enter notice title"
                            required
                        />

                        <label>Description</label>
                        <textarea
                            name="bodyContent"
                            value={form.bodyContent}
                            onChange={handleChange}
                            placeholder="Write the notice details..."
                            rows="5"
                            required
                        />

                        <div className="society-form-grid">

                            <div>
                                <label>Category</label>

                                <select
                                    name="categoryId"
                                    value={form.categoryId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select category
                                    </option>

                                    {categories.map(category => (
                                        <option
                                            key={category.Category_ID}
                                            value={category.Category_ID}
                                        >
                                            {category.Category_Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Priority</label>

                                <select
                                    name="priority"
                                    value={form.priority}
                                    onChange={handleChange}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label>Target Semester</label>

                                <select
                                    name="semester"
                                    value={form.semester}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        All Semesters
                                    </option>

                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Expiry Date</label>

                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={form.expiryDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                        </div>

                        <div style={{
                            marginTop: "22px",
                            padding: "15px",
                            background: "#121212",
                            border: "1px solid #383838"
                        }}>
                            <label style={{ marginTop: 0 }}>
                                Target Department
                            </label>

                            <strong>
                                {department?.Dept_Name || "Department unavailable"}
                            </strong>

                            <p style={{
                                color: "#999",
                                fontSize: "12px",
                                marginBottom: 0
                            }}>
                                Your department is assigned automatically
                                and cannot be changed.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="society-submit"
                            disabled={saving || !department}
                        >
                            {saving
                                ? "Submitting..."
                                : "Submit for Approval"}
                        </button>

                    </form>
                </section>

                <section className="society-section">
                    <h2>My Submitted Notices</h2>

                    <p>
                        Track the approval status of your announcements.
                    </p>

                    {notices.length === 0 ? (
                        <p>No notices submitted yet.</p>
                    ) : (
                        <div className="society-notice-list">

                            {notices.map(notice => (
                                <article
                                    className="society-notice-card"
                                    key={notice.Notice_ID}
                                >

                                    <div className="society-notice-top">
                                        <div>
                                            <h3>{notice.Title}</h3>

                                            <small>
                                                {notice.Category_Name}
                                                {" · "}
                                                Notice #{notice.Notice_ID}
                                            </small>
                                        </div>

                                        <span className={`society-status ${notice.Status.toLowerCase()}`}>
                                            {notice.Status}
                                        </span>
                                    </div>

                                    <p>{notice.Body_Content}</p>

                                    <small>
                                        Priority: {notice.Priority}
                                    </small>

                                    {notice.Targets && (
                                        <p className="society-target-info">
                                            Audience: {notice.Targets}
                                        </p>
                                    )}

                                    {notice.Rejection_Reason && (
                                        <div className="society-rejection">
                                            <strong>
                                                Reason for rejection:
                                            </strong>

                                            <p>
                                                {notice.Rejection_Reason}
                                            </p>
                                        </div>
                                    )}

                                </article>
                            ))}

                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

export default FacultyDashboard;
