import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ROLES = ["All", "Admin", "HOD", "Faculty", "Student", "Society"];

const emptyForm = {
  fullName: "",
  email: "",
  role: "Student",
  deptId: "",
  semester: "1",
  rollNumber: "",
  batchYear: new Date().getFullYear(),
  employeeCode: "",
  designation: "",
};

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const [activeTab, setActiveTab] = useState("users");
  const [updatingId, setUpdatingId] = useState(null);

  const [pendingNotices, setPendingNotices] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [processingNoticeId, setProcessingNoticeId] = useState(null);

  const [rejectingNoticeId, setRejectingNoticeId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      setUsers(response.data.users || response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingNotices = async () => {
    try {
      setLoadingPending(true);
      setPendingError("");

      const response = await api.get("/notices/pending");

      setPendingNotices(response.data.notices || []);
    } catch (err) {
      setPendingError(
        err.response?.data?.message || "Unable to load pending notices.",
      );
    } finally {
      setLoadingPending(false);
    }
  };

  const approveNotice = async (noticeId) => {
    try {
      setProcessingNoticeId(noticeId);
      setPendingError("");

      await api.put(`/notices/${noticeId}/approve`);

      await loadPendingNotices();
    } catch (err) {
      setPendingError(
        err.response?.data?.message || "Unable to approve notice.",
      );
    } finally {
      setProcessingNoticeId(null);
    }
  };

  const rejectNotice = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setPendingError("Please provide a rejection reason.");
      return;
    }

    try {
      setProcessingNoticeId(rejectingNoticeId);
      setPendingError("");

      await api.put(`/notices/${rejectingNoticeId}/reject`, {
        reason: rejectionReason.trim(),
      });

      setRejectingNoticeId(null);
      setRejectionReason("");

      await loadPendingNotices();
    } catch (err) {
      setPendingError(
        err.response?.data?.message || "Unable to reject notice.",
      );
    } finally {
      setProcessingNoticeId(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.Full_Name || "";
      const email = u.Email || "";
      const role = u.Role || "";
      const isActive = Boolean(u.Is_Active);

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "All" || role === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && isActive) ||
        (statusFilter === "Inactive" && !isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = {
    total: users.length,
    active: users.filter((u) => Boolean(u.Is_Active)).length,
    inactive: users.filter((u) => !Boolean(u.Is_Active)).length,
    students: users.filter((u) => u.Role === "Student").length,
    faculty: users.filter((u) => ["Faculty", "HOD"].includes(u.Role)).length,
    societies: users.filter((u) => u.Role === "Society").length,
  };

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createUser = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        deptId: form.deptId ? Number(form.deptId) : undefined,
        semester: Number(form.semester),
        batchYear: Number(form.batchYear),
      };

      const response = await api.post("/users", payload);

      setCredentials(response.data.credentials);
      setShowForm(false);
      setForm(emptyForm);

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally {
      setSaving(false);
    }
  };

  const changeUserStatus = async (targetUser) => {
    const id = targetUser.User_ID;
    const isActive = Boolean(targetUser.Is_Active);

    if (id === user.userId) {
      alert("You cannot deactivate your own account.");
      return;
    }

    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${targetUser.Full_Name}'s account?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingId(id);
      setError("");

      await api.patch(`/users/${id}/${action}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} account.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="portal">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>Campus Notice</span>
        </div>

        <p className="sidebar-label">ADMIN WORKSPACE</p>

        <button
          className={`nav-item ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          ▦ &nbsp; User Management
        </button>

        <button
          className={`nav-item ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("approvals");
            loadPendingNotices();
          }}
        >
          ◇ &nbsp; Notice Approvals
        </button>

        <div className="admin-sidebar-profile">
          <div className="admin-profile-details">
            <div className="admin-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="admin-profile-text">
              <strong>{user.name}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="admin-logout-button" onClick={onLogout}>
            <span>Log out</span>
            <span>↗</span>
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <span>CAMPUS / ADMIN PORTAL</span>
          <span className="connection-status">● Connected</span>
        </div>

        {activeTab === "users" ? (
          <>
            <section className="admin-heading">
              <div>
                <p className="eyebrow">ADMINISTRATION</p>
                <h1>User Management</h1>
                <p>Manage campus accounts and access permissions.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  setError("");
                  setShowForm(true);
                }}
              >
                + Add User
              </button>
            </section>

            <section className="stats-grid admin-stats">
              <div className="stat-card">
                <span>TOTAL USERS</span>
                <strong>{counts.total}</strong>
              </div>
              <div className="stat-card">
                <span>ACTIVE ACCOUNTS</span>
                <strong>{counts.active}</strong>
              </div>
              <div className="stat-card">
                <span>INACTIVE ACCOUNTS</span>
                <strong>{counts.inactive}</strong>
              </div>
              <div className="stat-card">
                <span>STUDENTS</span>
                <strong>{counts.students}</strong>
              </div>
            </section>

            <section className="admin-user-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CAMPUS DIRECTORY</p>
                  <h2>Registered accounts</h2>
                </div>
                <span>{filteredUsers.length} RESULTS</span>
              </div>

              <div className="user-toolbar">
                <input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role === "All" ? "All roles" : role}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {error && <p className="error-message">{error}</p>}

              {loading ? (
                <p className="empty-state">Loading users...</p>
              ) : (
                <div className="users-table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>EMAIL</th>
                        <th>ROLE</th>
                        <th>DEPARTMENT</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((u) => {
                        const isActive = Boolean(u.Is_Active);

                        return (
                          <tr key={u.User_ID}>
                            <td>
                              <strong>{u.Full_Name}</strong>
                              <small>ID: {u.User_ID}</small>
                            </td>

                            <td>{u.Email}</td>

                            <td>
                              <span className="role-pill">{u.Role}</span>
                            </td>

                            <td>{u.Department || "—"}</td>

                            <td>
                              <span
                                className={`status-pill ${
                                  isActive ? "status-active" : "status-inactive"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td>
                              <button
                                className={`status-action ${
                                  isActive
                                    ? "deactivate-action"
                                    : "activate-action"
                                }`}
                                disabled={
                                  updatingId === u.User_ID ||
                                  u.User_ID === user.userId
                                }
                                onClick={() => changeUserStatus(u)}
                              >
                                {updatingId === u.User_ID
                                  ? "Updating..."
                                  : isActive
                                    ? "Deactivate"
                                    : "Reactivate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <p className="empty-state">No matching users found.</p>
                  )}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="admin-heading">
              <div>
                <p className="eyebrow">REVIEW WORKFLOW</p>
                <h1>Notice Approvals</h1>
                <p>
                  Review and approve notices submitted by faculty and societies.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadPendingNotices}
                disabled={loadingPending}
              >
                {loadingPending ? "Refreshing..." : "↻ Refresh"}
              </button>
            </section>

            <section className="approval-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">AWAITING REVIEW</p>
                  <h2>Pending submissions</h2>
                </div>

                <span>{pendingNotices.length} PENDING</span>
              </div>

              {pendingError && <p className="error-message">{pendingError}</p>}

              {loadingPending ? (
                <p className="empty-state">Loading pending notices...</p>
              ) : pendingNotices.length === 0 ? (
                <div className="empty-state">
                  <h3>All caught up!</h3>
                  <p>There are no notices waiting for approval.</p>
                </div>
              ) : (
                <div className="approval-list">
                  {pendingNotices.map((notice) => (
                    <article className="approval-card" key={notice.Notice_ID}>
                      <div className="approval-card-header">
                        <div>
                          <span className="approval-category">
                            {notice.Category_Name}
                          </span>
                          <h3>{notice.Title}</h3>
                        </div>

                        <span
                          className={`priority-pill priority-${notice.Priority?.toLowerCase()}`}
                        >
                          {notice.Priority}
                        </span>
                      </div>

                      <p className="approval-description">
                        {notice.Body_Content}
                      </p>

                      <div className="approval-meta">
                        <div>
                          <span>SUBMITTED BY</span>
                          <strong>{notice.Submitted_By}</strong>
                          <small>{notice.Submitter_Role}</small>
                        </div>

                        <div>
                          <span>TARGET AUDIENCE</span>
                          <strong>{notice.Targets}</strong>
                        </div>

                        <div>
                          <span>EXPIRY DATE</span>
                          <strong>
                            {notice.Expiry_Date
                              ? new Date(notice.Expiry_Date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "Not specified"}
                          </strong>
                        </div>
                      </div>

                      <div className="approval-actions">
                        <button
                          className="approve-button"
                          disabled={processingNoticeId === notice.Notice_ID}
                          onClick={() => approveNotice(notice.Notice_ID)}
                        >
                          {processingNoticeId === notice.Notice_ID
                            ? "Processing..."
                            : "✓ Approve Notice"}
                        </button>

                        <button
                          className="reject-button"
                          disabled={processingNoticeId === notice.Notice_ID}
                          onClick={() => {
                            setPendingError("");
                            setRejectingNoticeId(notice.Notice_ID);
                            setRejectionReason("");
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showForm && (
        <div className="modal-overlay">
          <form className="admin-modal" onSubmit={createUser}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">NEW ACCOUNT</p>
                <h2>Create User</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <label>Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={updateForm}
              placeholder="Enter full name"
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateForm}
              placeholder="name@campus.edu"
              required
            />

            <label>Account Role</label>
            <select name="role" value={form.role} onChange={updateForm}>
              {["Student", "Faculty", "HOD", "Society"].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {form.role !== "Society" && (
              <>
                <label>Department</label>
                <select
                  name="deptId"
                  value={form.deptId}
                  onChange={updateForm}
                  required
                >
                  <option value="">Select department</option>
                  <option value="1">CSE</option>
                  <option value="2">MNC</option>
                  <option value="3">ECE</option>
                  <option value="4">IT</option>
                  <option value="5">RAI</option>
                </select>
              </>
            )}

            {form.role === "Student" && (
              <>
                <label>Semester</label>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={updateForm}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <label>Roll Number</label>
                <input
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={updateForm}
                  required
                />

                <label>Batch Year</label>
                <input
                  type="number"
                  name="batchYear"
                  value={form.batchYear}
                  onChange={updateForm}
                  required
                />
              </>
            )}

            {(form.role === "Faculty" || form.role === "HOD") && (
              <>
                <label>Employee Code</label>
                <input
                  name="employeeCode"
                  value={form.employeeCode}
                  onChange={updateForm}
                  required
                />

                <label>Designation</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={updateForm}
                  required
                />
              </>
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button className="primary-button" disabled={saving}>
                {saving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}


      {rejectingNoticeId !== null && (
  <div className="modal-overlay">
    <form className="admin-modal" onSubmit={rejectNotice}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">NOTICE REVIEW</p>
          <h2>Reject Notice</h2>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => {
            setRejectingNoticeId(null);
            setRejectionReason("");
            setPendingError("");
          }}
        >
          ×
        </button>
      </div>

      <p>
        Please provide a reason for rejecting this notice.
        The submitter should be able to understand what needs correction.
      </p>

      <label>Rejection Reason</label>

      <textarea
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder="Explain why this notice is being rejected..."
        rows={4}
        required
      />

      {pendingError && (
        <p className="error-message">{pendingError}</p>
      )}

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setRejectingNoticeId(null);
            setRejectionReason("");
            setPendingError("");
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="reject-button"
          disabled={processingNoticeId === rejectingNoticeId}
        >
          {processingNoticeId === rejectingNoticeId
            ? "Rejecting..."
            : "Confirm Rejection"}
        </button>
      </div>
    </form>
  </div>
)}
      {credentials && (
        <div className="modal-overlay">
          <div className="admin-modal credential-modal">
            <p className="eyebrow">ACCOUNT CREATED</p>
            <h2>Temporary credentials</h2>

            <p className="credential-warning">
              Save these credentials now. The temporary password is displayed
              only in this confirmation.
            </p>

            <div className="credential-row">
              <span>User ID</span>
              <strong>{credentials.userId}</strong>
            </div>

            <div className="credential-row">
              <span>Name</span>
              <strong>{credentials.fullName}</strong>
            </div>

            <div className="credential-row">
              <span>Email</span>
              <strong>{credentials.email}</strong>
            </div>

            <div className="credential-row">
              <span>Temporary password</span>
              <strong>{credentials.temporaryPassword}</strong>
            </div>

            <button
              className="primary-button"
              onClick={() =>
                navigator.clipboard.writeText(
                  `Email: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`,
                )
              }
            >
              Copy Credentials
            </button>

            <button
              className="secondary-button"
              onClick={() => setCredentials(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
