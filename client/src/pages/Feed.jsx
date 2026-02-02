import React, { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaArrowUp, FaArrowDown, FaRegComment, FaRegChartBar } from 'react-icons/fa';
import './Home.css'; // Re-use Home styles for consistency
import './Feed.css';
import Loader from '../components/common/Loader';

const Feed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const { user } = useAuth();

    useEffect(() => {
        fetchFeed();
    }, [page]);

    const fetchFeed = async () => {
        try {
            const res = await getFeed(page);
            setActivities(prev => page === 1 ? res.data : [...prev, ...res.data]);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && page === 1) return <Loader />;

    return (
        <div className="feed-container">
            <header className="feed-header">
                <h1 className="feed-title">Market Pulse</h1>
                <p className="feed-subtitle">Live Trading Signals & Discussions</p>
            </header>

            <div className="feed-list-container">
                {activities.length === 0 ? (
                    <div className="feed-empty-state">
                        <div className="feed-empty-icon">📡</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Signal Yet</h2>
                        <p className="feed-empty-text">The market is quiet. Follow top traders to tune into the noise.</p>
                        <Link to="/leaderboard" className="btn-find-people">Scout Traders</Link>
                    </div>
                ) : (
                    activities.map((item) => (
                        <div key={item._id} className={`feed-item ${item.type.toLowerCase()}-item`}>
                            {/* Left: Stats Sidebar */}
                            <div className="feed-item-stats">
                                {item.type === 'PREDICTION' && (
                                    <>
                                        <div className={`stat-box ${item.direction === 'UP' ? 'bullish' : 'bearish'}`}>
                                            <span className="stat-value">{item.direction === 'UP' ? 'Bull' : 'Bear'}</span>
                                        </div>
                                        <div className="stat-box neutral">
                                            <span className="stat-value">${item.targetPrice}</span>
                                            <span className="stat-label">Target</span>
                                        </div>
                                    </>
                                )}
                                {item.type === 'QUESTION' && (
                                    <>
                                        <div className="stat-box">
                                            <span className="stat-value">{item.upvotes?.length || 0}</span>
                                            <span className="stat-label">votes</span>
                                        </div>
                                        <div className="stat-box highlight">
                                            <span className="stat-value">{item.answers?.length || 0}</span>
                                            <span className="stat-label">answers</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right: Main Content */}
                            <div className="feed-item-content">
                                <Link
                                    to={item.type === 'PREDICTION' ? `/stocks/${item.stockId.symbol}` : `/question/${item._id}`}
                                    className="feed-item-title"
                                >
                                    {item.type === 'PREDICTION'
                                        ? `Prediction: ${item.stockId.symbol} to reach $${item.targetPrice}`
                                        : item.title}
                                </Link>

                                <p className="feed-item-excerpt">
                                    {item.type === 'PREDICTION' ? item.reasoning : item.content.substring(0, 200) + '...'}
                                </p>

                                <div className="feed-item-meta">
                                    <div className="feed-tags">
                                        <span className="feed-tag stock-tag">{item.stockId.symbol}</span>
                                        {item.type === 'PREDICTION' && <span className="feed-tag type-tag">Prediction</span>}
                                        {item.type === 'QUESTION' && <span className="feed-tag type-tag">Question</span>}
                                    </div>

                                    <div className="feed-user-card">
                                        <div className="feed-user-avatar-sm">
                                            {item.userId.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="feed-user-info-mini">
                                            <Link to={`/profile/${item.userId._id}`} className="mini-username">
                                                {item.userId.username}
                                            </Link>
                                            <span className="mini-time">
                                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {activities.length > 0 && !loading && (
                    <button onClick={() => setPage(p => p + 1)} className="btn-load-more">
                        Load More signals
                    </button>
                )}
                {loading && page > 1 && <Loader />}
            </div>
        </div>
    );
};

export default Feed;
