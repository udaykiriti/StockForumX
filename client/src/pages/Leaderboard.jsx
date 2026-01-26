import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
import { Link } from 'react-router-dom';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';
import './Leaderboard.css';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data } = await getLeaderboard(50);
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getTierColor = (tier) => {
        const colors = {
            'Legend': '#EF4444',
            'Master': '#F59E0B',
            'Expert': '#8B5CF6',
            'Apprentice': '#3B82F6',
            'Novice': '#6B7280'
        };
        return colors[tier?.label] || '#6B7280';
    };

    if (loading) {
        return (
            <div className="leaderboard-page">
                <div className="container">
                    <LoadingSkeleton type="user" count={10} />
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page fade-in">
            <div className="container">
                <div className="page-header">
                    <h1>Users</h1>
                    <div className="header-actions">
                        {/* Could render timeframe filters here */}
                    </div>
                </div>

                <div className="leaderboard-table">
                    <div className="table-header">
                        <div className="col-rank">#</div>
                        <div className="col-user">User</div>
                        <div className="col-tier">Tier</div>
                        <div className="col-reputation">Reputation</div>
                        <div className="col-stats">Accuracy</div>
                    </div>

                    {users.map((user, index) => (
                        <Link to={`/profile/${user._id}`} key={user._id} className="table-row">
                            <div className={`col-rank rank-${user.rank}`}>
                                #{user.rank}
                            </div>
                            <div className="col-user">
                                <div className="user-avatar-small">
                                    {(user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span className="username">{user.username || 'Unknown'}</span>
                            </div>
                            <div className="col-tier">
                                <span className="tier-badge">
                                    {user.tier?.label || 'Novice'}
                                </span>
                            </div>
                            <div className="col-reputation">
                                {(user.reputation || 0).toFixed(0)}
                            </div>
                            <div className="col-stats">
                                <span className="accuracy-label">
                                    {user.accuracy || 0}%
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
