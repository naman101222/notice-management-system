
import { useEffect, useState } from "react";
import api from "../services/api";

function HODDashboard({ user, onLogout }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notices/pending");
      setNotices(response.data.notices || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load pending notices."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleApprove = async (noticeId) => {
    if (!window.confirm("Are you sure you want to approve this notice?")) {
      return;
    }

    try {
      setActionLoading(noticeId);

      await api.put(`/notices/${noticeId}/approve`);

      alert("Notice approved successfully.");
      await loadNotices();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to approve notice."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (noticeId) => {
    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(noticeId);

      await api.put(`/notices/${noticeId}/reject`, {
        reason: reason.trim(),
      });

      alert("Notice rejected successfully.");
      setRejectingId(null);
      setReason("");
      await loadNotices();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to reject notice."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="hod-portal">
      <aside className="hod-sidebar">
        <div className="hod-brand">
          <span className="hod-brand-icon">✦</span>
          <span>Campus Notice</span>
        </div>

        <div className="hod-nav-label">WORKSPACE</div>

        <div className="hod-nav-item active">
          <span>▤</span>
          Notice Approvals
        </div>

        <div className="hod-sidebar-bottom">
          <div className="hod-user">
            <div className="hod-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>Head of Department</span>
            </div>
          </div>

          <button onClick={onLogout} className="hod-logout">
            Log out ↗
          </button>
        </div>
      </aside>

      <main className="hod-main">
        <header className="hod-header">
          <div>
            <p className="hod-eyebrow">DEPARTMENT WORKSPACE</p>
            <h1>Notice Approvals</h1>
            <p>Review and manage notices submitted for your department.</p>
          </div>

          <button
            className="hod-refresh"
            onClick={loadNotices}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="hod-stats">
          <div className="hod-stat-card">
            <span>Pending Notices</span>
            <strong>{notices.length}</strong>
            <small>Awaiting your review</small>
          </div>
        </section>

        <section className="hod-notices-section">
          <div className="hod-section-heading">
            <div>
              <h2>Pending Submissions</h2>
              <p>Review each notice before approving or rejecting it.</p>
            </div>
            <span>{notices.length} notices</span>
          </div>

          {loading && <p className="hod-message">Loading notices...</p>}

          {!loading && error && (
            <p className="hod-error">{error}</p>
          )}

          {!loading && !error && notices.length === 0 && (
            <div className="hod-empty">
              <div>✓</div>
              <h3>All caught up!</h3>
              <p>There are no pending notices to review.</p>
            </div>
          )}

          {!loading && !error && notices.map((notice) => (
            <article className="hod-notice-card" key={notice.Notice_ID}>
              <div className="hod-notice-top">
                <span className="hod-category">
                  {notice.Category_Name}
                </span>

                <span className={`hod-priority ${notice.Priority?.toLowerCase()}`}>
                  {notice.Priority} Priority
                </span>
              </div>

              <h3>{notice.Title}</h3>
              <p className="hod-description">{notice.Body_Content}</p>

              <div className="hod-notice-details">
                <div>
                  <span>Submitted by</span>
                  <strong>{notice.Submitted_By}</strong>
                  <small>{notice.Submitter_Role}</small>
                </div>

                <div>
                  <span>Target audience</span>
                  <strong>{notice.Targets}</strong>
                </div>

                <div>
                  <span>Expiry date</span>
                  <strong>{formatDate(notice.Expiry_Date)}</strong>
                </div>

                <div>
                  <span>Notice ID</span>
                  <strong>#{notice.Notice_ID}</strong>
                </div>
              </div>

              {rejectingId === notice.Notice_ID && (
                <div className="hod-rejection-box">
                  <label>Reason for rejection</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this notice is being rejected..."
                    rows={3}
                  />

                  <div className="hod-rejection-actions">
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="hod-confirm-reject"
                      onClick={() => handleReject(notice.Notice_ID)}
                      disabled={actionLoading === notice.Notice_ID}
                    >
                      {actionLoading === notice.Notice_ID
                        ? "Processing..."
                        : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}

              <div className="hod-card-actions">
                <button
                  className="hod-reject-button"
                  onClick={() => {
                    setRejectingId(notice.Notice_ID);
                    setReason("");
                  }}
                  disabled={actionLoading === notice.Notice_ID}
                >
                  Reject
                </button>

                <button
                  className="hod-approve-button"
                  onClick={() => handleApprove(notice.Notice_ID)}
                  disabled={actionLoading === notice.Notice_ID}
                >
                  {actionLoading === notice.Notice_ID
                    ? "Processing..."
                    : "Approve Notice"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default HODDashboard;
