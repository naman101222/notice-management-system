
import { useEffect, useState } from "react";
import api from "../services/api";

function SocietyDashboard({ user, onLogout }) {
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
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
        expiryDate: ""
    });

    const [targets, setTargets] = useState([
        { deptId: "", semester: "" }
    ]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [optionsRes, noticesRes] = await Promise.all([
                api.get("/notices/options"),
                api.get("/notices/mine")
            ]);

            setCategories(optionsRes.data.categories);
            setDepartments(optionsRes.data.departments);
            setNotices(noticesRes.data.notices);

        } catch (err) {
            setError(
                err.response?.data?.message || "Could not load dashboard data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFormChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const updateTarget = (index, field, value) => {
        const updated = [...targets];
        updated[index][field] = value;
        setTargets(updated);
    };

    const addTarget = () => {
        setTargets([
            ...targets,
            { deptId: "", semester: "" }
        ]);
    };

    const removeTarget = (index) => {
        setTargets(targets.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.title.trim() || !form.bodyContent.trim()) {
            setError("Please enter the notice title and description.");
            return;
        }

        if (!form.categoryId) {
            setError("Please select a category.");
            return;
        }

        const formattedTargets = targets.map((target) => ({
            deptId: target.deptId ? Number(target.deptId) : null,
            semester: target.semester ? Number(target.semester) : null
        }));

        try {
            setSaving(true);

            await api.post("/notices/submit", {
                ...form,
                categoryId: Number(form.categoryId),
                expiryDate: form.expiryDate
                    ? `${form.expiryDate} 23:59:59`
                    : null,
                targets: formattedTargets
            });

            setSuccess("Notice submitted successfully for approval!");

            setForm({
                title: "",
                bodyContent: "",
                priority: "Medium",
                categoryId: "",
                expiryDate: ""
            });

            setTargets([{ deptId: "", semester: "" }]);

            await loadData();

        } catch (err) {
            setError(
                err.response?.data?.message || "Notice submission failed."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="society-loading">Loading dashboard...</div>;
    }

    return (
        <div className="society-dashboard">

            <aside className="society-sidebar">
                <h2>Campus<span>Notice</span></h2>

                <p className="society-sidebar-label">SOCIETY PORTAL</p>

                <div className="society-profile">
                    <div className="society-avatar">
                        {user.name?.charAt(0)}
                    </div>
                    <div>
                        <strong>{user.name}</strong>
                        <small>Society Account</small>
                    </div>
                </div>

                <button onClick={onLogout} className="society-logout">
                    Logout
                </button>
            </aside>

            <main className="society-main">

                <header className="society-header">
                    <div>
                        <p>WELCOME BACK</p>
                        <h1>{user.name}</h1>
                        <span>Manage your society announcements.</span>
                    </div>

                    <div className="society-role">SOCIETY</div>
                </header>

                {error && <div className="society-error">{error}</div>}
                {success && <div className="society-success">{success}</div>}

                <section className="society-stats">
                    <div className="society-stat-card">
                        <span>Total Submissions</span>
                        <h2>{notices.length}</h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Pending</span>
                        <h2>
                            {notices.filter(n => n.Status === "Pending").length}
                        </h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Published</span>
                        <h2>
                            {notices.filter(n => n.Status === "Published").length}
                        </h2>
                    </div>

                    <div className="society-stat-card">
                        <span>Rejected</span>
                        <h2>
                            {notices.filter(n => n.Status === "Rejected").length}
                        </h2>
                    </div>
                </section>

                <section className="society-section">
                    <h2>Submit a New Notice</h2>
                    <p>Submit your announcement for administrative approval.</p>

                    <form onSubmit={handleSubmit} className="society-form">

                        <label>Notice Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleFormChange}
                            placeholder="Enter notice title"
                            required
                        />

                        <label>Description</label>
                        <textarea
                            name="bodyContent"
                            value={form.bodyContent}
                            onChange={handleFormChange}
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
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">Select category</option>
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
                                    onChange={handleFormChange}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={form.expiryDate}
                                    onChange={handleFormChange}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>

                        <div className="society-target-heading">
                            <div>
                                <h3>Target Audience</h3>
                                <p>Choose the departments and semesters.</p>
                            </div>
                            <button type="button" onClick={addTarget}>
                                + Add Audience
                            </button>
                        </div>

                        {targets.map((target, index) => (
                            <div className="society-target-row" key={index}>

                                <select
                                    value={target.deptId}
                                    onChange={e =>
                                        updateTarget(index, "deptId", e.target.value)
                                    }
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option
                                            key={dept.Dept_ID}
                                            value={dept.Dept_ID}
                                        >
                                            {dept.Dept_Name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={target.semester}
                                    onChange={e =>
                                        updateTarget(index, "semester", e.target.value)
                                    }
                                >
                                    <option value="">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>

                                {targets.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeTarget(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="society-submit"
                            disabled={saving}
                        >
                            {saving ? "Submitting..." : "Submit for Approval"}
                        </button>

                    </form>
                </section>

                <section className="society-section">
                    <h2>Your Submitted Notices</h2>
                    <p>Track the approval status of your announcements.</p>

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
                                                {notice.Category_Name} · Notice #{notice.Notice_ID}
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
                                            <strong>Reason for rejection:</strong>
                                            <p>{notice.Rejection_Reason}</p>
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

export default SocietyDashboard;
