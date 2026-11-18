
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function StudentDashboard({ user, onLogout }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [selectedNotice, setSelectedNotice] = useState(null);

    const categories = [
        'All',
        'Academic',
        'Exams',
        'Placements',
        'Events'
    ];

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                setLoading(true);

                const response = await api.get(
                    `/notices/student/${user.userId}`
                );

                setNotices(response.data.notices || []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load notices. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, [user.userId]);

    const filteredNotices = useMemo(() => {
        return notices.filter((notice) => {
            const matchesCategory =
                category === 'All' ||
                notice.Category_Name === category;

            const matchesSearch =
                notice.Title?.toLowerCase().includes(search.toLowerCase()) ||
                notice.Body_Content?.toLowerCase().includes(search.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [notices, category, search]);

    const highPriorityCount = notices.filter(
        notice => notice.Priority === 'High' ||
                  notice.Priority === 'Urgent'
    ).length;

    const formatDate = (date) => {
        if (!date) return 'Date unavailable';

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const priorityClass = (priority) => {
        return priority?.toLowerCase() || 'medium';
    };

    return (
        <div className="portal">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <div className="sidebar-brand">
                    <div className="brand-mark">✦</div>
                    <span>Campus Notice</span>
                </div>

                <div className="sidebar-section">
                    <p className="sidebar-label">WORKSPACE</p>

                    <button
                        className="sidebar-link active"
                        onClick={() => {
                            setCategory('All');
                            setSelectedNotice(null);
                        }}
                    >
                        <span>▦</span> All Notices
                    </button>

                    <p className="sidebar-label category-label">
                        CATEGORIES
                    </p>

                    {categories.slice(1).map((item) => (
                        <button
                            key={item}
                            className={`sidebar-link ${
                                category === item ? 'active' : ''
                            }`}
                            onClick={() => {
                                setCategory(item);
                                setSelectedNotice(null);
                            }}
                        >
                            <span>◇</span> {item}
                        </button>
                    ))}
                </div>

                <div className="sidebar-bottom">
                    <div className="profile-info">
                        <div className="avatar">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>

                        <div className="profile-text">
                            <strong>{user.name}</strong>
                            <span>{user.role}</span>
                        </div>
                    </div>

                    <button className="sidebar-logout" onClick={onLogout}>
                        Log out ↗
                    </button>
                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="portal-main">

                <header className="portal-header">
                    <div>
                        <p className="breadcrumb">
                            CAMPUS / STUDENT PORTAL
                        </p>
                        <h1>Notice Board</h1>
                    </div>

                    <div className="header-user">
                        <span className="online-dot"></span>
                        <span>Connected</span>
                    </div>
                </header>

                <section className="welcome-section">
                    <div>
                        <p className="section-eyebrow">YOUR CAMPUS, UPDATED.</p>
                        <h2>
                            Good to see you, <span>{user.name?.split(' ')[0]}.</span>
                        </h2>
                        <p>
                            Here are the latest updates relevant to you.
                        </p>
                    </div>

                    <div className="welcome-decoration">CN / 001</div>
                </section>

                {/* STATISTICS */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <p>TOTAL NOTICES</p>
                        <h3>{notices.length.toString().padStart(2, '0')}</h3>
                        <span>Published for you</span>
                    </div>

                    <div className="stat-card">
                        <p>HIGH PRIORITY</p>
                        <h3>{highPriorityCount.toString().padStart(2, '0')}</h3>
                        <span>High and urgent notices</span>
                    </div>

                    <div className="stat-card">
                        <p>CATEGORIES</p>
                        <h3>
                            {new Set(notices.map(n => n.Category_Name)).size
                                .toString().padStart(2, '0')}
                        </h3>
                        <span>Categories with notices</span>
                    </div>

                </section>

                {/* NOTICE FEED */}
                <section className="notice-section">

                    <div className="notice-section-header">
                        <div>
                            <p className="section-eyebrow">CAMPUS UPDATES</p>
                            <h2>Recent notices</h2>
                        </div>

                        <span className="notice-count">
                            {filteredNotices.length} RESULTS
                        </span>
                    </div>

                    <div className="notice-toolbar">

                        <input
                            type="search"
                            placeholder="Search notices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setSelectedNotice(null);
                            }}
                        >
                            {categories.map(item => (
                                <option key={item} value={item}>
                                    {item === 'All' ? 'All categories' : item}
                                </option>
                            ))}
                        </select>

                    </div>

                    {loading && (
                        <div className="empty-state">
                            Loading your notices...
                        </div>
                    )}

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {!loading && !error && filteredNotices.length === 0 && (
                        <div className="empty-state">
                            No notices found.
                        </div>
                    )}

                    <div className="notice-list">

                        {filteredNotices.map((notice) => (

                            <article
                                className={`notice-card ${
                                    selectedNotice?.Notice_ID === notice.Notice_ID
                                        ? 'selected'
                                        : ''
                                }`}
                                key={notice.Notice_ID}
                                onClick={() => setSelectedNotice(
                                    selectedNotice?.Notice_ID === notice.Notice_ID
                                        ? null
                                        : notice
                                )}
                            >

                                <div className="notice-card-top">
                                    <span className="notice-category">
                                        {notice.Category_Name || 'General'}
                                    </span>

                                    <span className={`priority ${priorityClass(notice.Priority)}`}>
                                        {notice.Priority || 'Medium'}
                                    </span>
                                </div>

                                <h3>{notice.Title}</h3>

                                <p className="notice-description">
                                    {notice.Body_Content}
                                </p>

                                <div className="notice-card-footer">
                                    <span>
                                        BY {notice.Publisher_Name || 'Campus Authority'}
                                    </span>

                                    <span>{formatDate(notice.Publish_Date)}</span>
                                </div>

                                {selectedNotice?.Notice_ID === notice.Notice_ID && (
                                    <div className="notice-expanded">
                                        <p>{notice.Body_Content}</p>

                                        <div>
                                            <strong>Published by:</strong>{' '}
                                            {notice.Publisher_Name || 'Campus Authority'}
                                        </div>

                                        <div>
                                            <strong>Publisher role:</strong>{' '}
                                            {notice.Publisher_Role || 'Authority'}
                                        </div>

                                        <div>
                                            <strong>Expiry:</strong>{' '}
                                            {formatDate(notice.Expiry_Date)}
                                        </div>
                                    </div>
                                )}

                                <div className="notice-open">
                                    {selectedNotice?.Notice_ID === notice.Notice_ID
                                        ? 'CLOSE −'
                                        : 'VIEW DETAILS +'}
                                </div>

                            </article>

                        ))}

                    </div>

                </section>

                <footer className="portal-footer">
                    CAMPUS NOTICE MANAGEMENT SYSTEM
                    <span>VERIFIED CAMPUS INFORMATION</span>
                </footer>

            </main>
        </div>
    );
}

export default StudentDashboard;
