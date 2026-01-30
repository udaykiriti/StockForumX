import React, { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaArrowUp, FaArrowDown, FaRegComment, FaRegChartBar } from 'react-icons/fa';
import './Home.css'; // Re-use Home styles for consistency
import './Feed.css';

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

    if (loading && page === 1) return <div className="loader"></div>;

    return (
        <div className="home-container">
            <header className="feed-header">
                <h1 className="feed-title">Your Feed</h1>
                <p className="feed-subtitle">Activity from people you follow</p>
            </header>

            <div className="feed-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {activities.length === 0 ? (
                    <div className="feed-empty-state">
                        <div className="feed-empty-icon">👥</div>
                        <p className="feed-empty-text">No activity yet. Follow some top traders to see their market moves here!</p>
                        <Link to="/leaderboard" className="btn-find-people">Find People to Follow</Link>
                    </div>
                ) : (
                    activities.map((item) => (
                        <div key={item._id} className="stock-card" style={{ marginBottom: '1rem' }}>
                            <div className="card-header">
                                <div className="user-info">
                                    <Link to={`/profile/${item.userId._id}`} style={{ fontWeight: 'bold', color: '#fff', textDecoration: 'none' }}>
                                        {item.userId.username}
                                    </Link>
                                    <span className="reputation-badge" style={{ fontSize: '0.8rem', padding: '2px 6px' }}>{item.userId.reputation} Rep</span>
                                    <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                                        {item.type === 'PREDICTION' ? 'predicted on' : 'asked regarding'}
                                    </span>
                                    <Link to={`/stocks/${item.stockId.symbol}`} style={{ marginLeft: '0.5rem', color: '#4caf50' }}>{item.stockId.symbol}</Link>
                                </div>
                                <span className="timestamp">{formatDistanceToNow(new Date(item.createdAt))} ago</span>
                            </div>

                            <div className="card-body">
                                {item.type === 'PREDICTION' && (
                                    <div className="prediction-preview">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {item.direction === 'UP' ? '🚀 Bullish' : '🐻 Bearish'}
                                            </span>
                                            {item.isEvaluated && (
                                                <span className={`status-badge ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {item.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            )}
                                        </div>
                                        <p>{item.reasoning}</p>
                                        <p>Target: ${item.targetPrice}</p>
                                    </div>
                                )}

                                {item.type === 'QUESTION' && (
                                    <div className="question-preview">
                                        <h3 style={{ margin: '0 0 0.5rem' }}>{item.title}</h3>
                                        <p style={{ color: '#ccc' }}>{item.content.substring(0, 100)}...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {activities.length > 0 && (
                    <button onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
                        Load More
                    </button>
                )}
            </div>
        </div>
    );
};

export default Feed;
