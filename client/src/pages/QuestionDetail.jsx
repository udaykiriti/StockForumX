import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuestion, createAnswer, acceptAnswer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import Voting from '../components/questions/Voting';
import './QuestionDetail.css';

const QuestionDetail = () => {
    const { id } = useParams();
    const [question, setQuestion] = useState(null);
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const { socket } = useSocket();

    useEffect(() => {
        fetchQuestion();
    }, [id]);

    const fetchQuestion = async () => {
        try {
            const { data } = await getQuestion(id);
            // Ensure data structure integrity
            if (!data || !data.question) {
                setQuestion(null);
                return;
            }

            const questionData = data.question;
            const answersData = Array.isArray(data.answers) ? data.answers : [];

            setQuestion({ ...questionData, answers: answersData });
        } catch (error) {
            toast.error('Failed to load question');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        if (!newAnswer.trim()) return;

        setSubmitting(true);
        try {
            const { data } = await createAnswer(id, newAnswer);
            setQuestion(prev => ({
                ...prev,
                answers: [...(prev.answers || []), data],
                answerCount: (prev.answerCount || 0) + 1
            }));
            setNewAnswer('');
            toast.success('Answer posted successfully!');
        } catch (error) {
            toast.error('Failed to post answer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcceptAnswer = async (answerId) => {
        try {
            await acceptAnswer(id, answerId);
            // Update local state to reflect acceptance
            setQuestion(prev => ({
                ...prev,
                answers: (prev.answers || []).map(a => ({
                    ...a,
                    isAccepted: a._id === answerId
                })),
                hasAcceptedAnswer: true
            }));
            toast.success('Answer accepted!');
        } catch (error) {
            toast.error('Failed to accept answer');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;
    if (!question) return <div className="error-message">Question not found</div>;

    // Safe access helpers
    const stockSymbol = question.stockId?.symbol || 'UNKNOWN';
    const authorName = question.userId?.username || 'Unknown User';
    const authorRep = question.userId?.reputation?.toFixed(0) || '0';
    const authorAvatar = authorName.charAt(0).toUpperCase();
    const views = question.views || 0;
    const upvotes = question.upvotes || 0;
    const downvotes = question.downvotes || 0;
    const tags = Array.isArray(question.tags) ? question.tags : [];
    const answers = Array.isArray(question.answers) ? question.answers : [];

    return (
        <div className="question-detail-page container">
            <div className="question-header">
                <div className="header-top">
                    <h1 className="question-headline">{question.title || 'Untitled Question'}</h1>
                    <Link to={`/stock/${stockSymbol}`} className="btn btn-secondary btn-sm">
                        Ask Question
                    </Link>
                </div>
                <div className="question-meta">
                    <div className="meta-item">
                        <span className="meta-label">Asked</span>
                        <time title={question.createdAt ? new Date(question.createdAt).toLocaleString() : ''}>
                            {question.createdAt ? formatDistanceToNow(new Date(question.createdAt)) : 'recently'} ago
                        </time>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Viewed</span>
                        {views} times
                    </div>
                </div>
            </div>

            <div className="question-layout">
                <div className="main-content">
                    <div className="question-body-container">
                        <div className="voting-cell">
                            <Voting
                                type="question"
                                id={question._id}
                                initialVotes={upvotes}
                                initialUpvotedBy={question.upvotedBy || []}
                            />
                        </div>
                        <div className="post-cell">
                            <div className="post-text">{question.content || ''}</div>

                            <div className="post-tags">
                                {tags.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>

                            <div className="post-footer">
                                <div className="post-actions">
                                    {/* Share, Edit buttons could go here */}
                                </div>
                                <div className="user-card owner">
                                    <div className="user-action-time">
                                        asked {question.createdAt ? formatDistanceToNow(new Date(question.createdAt)) : 'recently'} ago
                                    </div>
                                    <div className="user-gravatar32">
                                        <div className="avatar-placeholder">{authorAvatar}</div>
                                    </div>
                                    <div className="user-details">
                                        <Link to={`/profile/${question.userId?._id}`}>{authorName}</Link>
                                        <div className="reputation-score" title="reputation score">
                                            {authorRep}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="answers-section">
                        <div className="answers-header">
                            <h2>{answers.length} Answers</h2>
                            {/* Sort controls could go here */}
                        </div>

                        {answers.map(answer => {
                            const ansAuthorName = answer.userId?.username || 'Unknown';
                            return (
                                <div key={answer._id} className={`answer-container ${answer.isAccepted ? 'accepted-answer' : ''}`}>
                                    <div className="voting-cell">
                                        <Voting
                                            type="answer"
                                            id={answer._id}
                                            initialVotes={answer.upvotes || 0}
                                            initialUpvotedBy={answer.upvotedBy || []}
                                        />
                                        {answer.isAccepted && (
                                            <div className="accepted-check" title="The question owner accepted this answer">
                                                ✓
                                            </div>
                                        )}
                                        {!answer.isAccepted && user?._id === question.userId?._id && (
                                            <button
                                                className="accept-btn"
                                                onClick={() => handleAcceptAnswer(answer._id)}
                                                title="Accept this answer"
                                            >
                                                ✓
                                            </button>
                                        )}
                                    </div>
                                    <div className="post-cell">
                                        <div className="post-text">{answer.content}</div>

                                        <div className="post-footer">
                                            <div className="post-actions">
                                                {/* Share, Edit */}
                                            </div>
                                            <div className="user-card">
                                                <div className="user-action-time">
                                                    answered {answer.createdAt ? formatDistanceToNow(new Date(answer.createdAt)) : 'recently'} ago
                                                </div>
                                                <div className="user-details">
                                                    <Link to={`/profile/${answer.userId?._id}`}>{ansAuthorName}</Link>
                                                    <div className="reputation-score">
                                                        {answer.userId?.reputation?.toFixed(0) || '0'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="post-answer-section">
                        <h2 className="section-title">Your Answer</h2>
                        {isAuthenticated ? (
                            <form onSubmit={handleAnswerSubmit} className="answer-form">
                                <textarea
                                    value={newAnswer}
                                    onChange={(e) => setNewAnswer(e.target.value)}
                                    className="answer-input"
                                    rows={10}
                                    placeholder="Type your answer here..."
                                    required
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary submit-answer-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Posting...' : 'Post Your Answer'}
                                </button>
                            </form>
                        ) : (
                            <div className="auth-prompt">
                                <p>Please <Link to="/login">log in</Link> or <Link to="/register">sign up</Link> to answer this question.</p>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="question-sidebar">
                    {/* Sidebar widgets */}
                    <div className="sidebar-widget">
                        <h3>Stats</h3>
                        <div className="sidebar-stat-item">
                            <span className="label">Observed</span>
                            <span className="value">{views} times</span>
                        </div>
                        <div className="sidebar-stat-item">
                            <span className="label">Last updated</span>
                            <span className="value">{question.updatedAt || question.createdAt ? formatDistanceToNow(new Date(question.updatedAt || question.createdAt)) : 'recently'} ago</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default QuestionDetail;
