import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserStats, getUserPredictions, getQuestions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileEdit from '../components/profile/ProfileEdit';
import Loader from '../components/common/Loader';
import { FaTrophy, FaCalendar, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Profile.css';

// Helper component to fetch and show predictions list
const UserPredictionsList = ({ userId }) => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const { data } = await getUserPredictions(userId);
                setPredictions(data.predictions || []);
            } catch (err) {
                console.error('Error fetching predictions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPredictions();
    }, [userId]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading predictions...</div>;
    }

    if (predictions.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No predictions yet
            </div>
        );
    }

    return (
        <div className="predictions-list">
            {predictions.map(pred => (
                <div key={pred._id} className="prediction-card">
                    <div className="prediction-header">
                        <span className="stock-symbol">{pred.stockId?.symbol || 'N/A'}</span>
                        <span className={`prediction-type ${pred.predictionType}`}>
                            {pred.predictionType}
                        </span>
                    </div>
                    <div className="prediction-details">
                        <div className="prediction-price">
                            Target: ${pred.targetPrice?.toFixed(2)}
                        </div>
                        <div className="prediction-timeframe">
                            {pred.timeframe}
                        </div>
                    </div>
                    <div className="prediction-reasoning">
                        {pred.reasoning}
                    </div>
                    <div className="prediction-footer">
                        <span className={`prediction-status ${pred.status}`}>
                            {pred.status}
                        </span>
                        <span className="prediction-date">
                            {format(new Date(pred.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helper component for user questions
const UserQuestionsList = ({ userId }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data } = await getQuestions({ userId });
                setQuestions(data || []);
            } catch (err) {
                console.error('Error fetching questions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [userId]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading questions...</div>;
    }

    if (questions.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No questions asked yet
            </div>
        );
    }

    return (
        <div className="questions-list">
            {questions.map(q => (
                <div key={q._id} className="question-card">
                    <h3 className="question-title">{q.title}</h3>
                    <div className="question-meta">
                        <span>{q.stockId?.symbol}</span>
                        <span>{q.answerCount} answers</span>
                        <span>{q.upvotes} upvotes</span>
                        <span>{format(new Date(q.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('predictions');
    const [showEditModal, setShowEditModal] = useState(false);

    const isOwnProfile = currentUser && currentUser._id === id;

    const handleProfileUpdate = (updatedData) => {
        setUser(prev => ({
            ...prev,
            ...updatedData
        }));
        toast.success('Profile updated successfully!');
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                console.log('Fetching profile for ID:', id);
                const response = await getUserStats(id);
                console.log('Profile data:', response.data);

                if (!response.data || !response.data.user) {
                    // Handle missing data structure gracefully
                    setError('User data unavailable');
                    return;
                }

                setStats(response.data);
                setUser(response.data.user);
                setError(null);
            } catch (err) {
                console.error('Profile fetch error:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfile();
    }, [id]);

    // Loading state
    // Loading state
    if (loading) {
        return <Loader />;
    }

    // Error state
    if (error) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    // No user found
    if (!user) {
        return (
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                <h2>User not found</h2>
            </div>
        );
    }

    // Main render
    return (
        <div className="profile-page fade-in">
            <div className="container">
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                        ) : (
                            user.username?.charAt(0).toUpperCase() || '?'
                        )}
                    </div>
                    <div className="profile-info">
                        <div className="profile-name-row">
                            <div>
                                <h1>{user.username}</h1>
                                {user.status && <p className="user-status">{user.status}</p>}
                            </div>
                            <div className="profile-actions">
                                <div className="reputation-badge">
                                    {stats?.user?.tier?.label || stats?.user?.tier || 'Member'}
                                </div>
                                {isOwnProfile && (
                                    <button
                                        className="btn btn-primary btn-edit-profile"
                                        onClick={() => setShowEditModal(true)}
                                    >
                                        <FaEdit /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                        {user.bio && <p className="user-bio">{user.bio}</p>}
                        <div className="profile-stats-badges">
                            <div className="stat-badge">
                                <FaTrophy /> {user.reputation || 0} reputation
                            </div>
                            <div className="stat-badge">
                                <FaCalendar /> Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="stats-grid-container">
                    <div className="stat-card-profile">
                        <span className="label">Predictions</span>
                        <span className="value">{stats?.predictions?.total || 0}</span>
                        <span className="sub-value">{stats?.predictions?.correct || 0} Correct</span>
                    </div>
                    <div className="stat-card-profile">
                        <span className="label">Accuracy</span>
                        <span className="value">
                            {stats?.predictions?.evaluated > 0
                                ? ((stats.predictions.correct / stats.predictions.evaluated) * 100).toFixed(1)
                                : 0}%
                        </span>
                        <span className="sub-value">{stats?.predictions?.evaluated || 0} evaluated</span>
                    </div>
                    <div className="stat-card-profile">
                        <span className="label">Questions</span>
                        <span className="value">{stats?.questions?.total || 0}</span>
                        <span className="sub-value">{stats?.questions?.totalUpvotes || 0} votes</span>
                    </div>
                    <div className="stat-card-profile">
                        <span className="label">Answers</span>
                        <span className="value">{stats?.answers?.total || 0}</span>
                        <span className="sub-value">{stats?.answers?.accepted || 0} accepted</span>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="content-section">
                    <div className="main-column">
                        <div className="profile-tabs">
                            <button
                                className={`profile-tab ${activeTab === 'predictions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('predictions')}
                            >
                                Predictions
                            </button>
                            <button
                                className={`profile-tab ${activeTab === 'questions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('questions')}
                            >
                                Questions
                            </button>
                        </div>

                        {activeTab === 'predictions' && (
                            <div className="profile-content">
                                <UserPredictionsList userId={id} />
                            </div>
                        )}

                        {activeTab === 'questions' && (
                            <div className="profile-content">
                                <UserQuestionsList userId={id} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Edit Modal */}
            {showEditModal && (
                <ProfileEdit
                    user={user}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleProfileUpdate}
                />
            )}
        </div>
    );
};

export default Profile;
