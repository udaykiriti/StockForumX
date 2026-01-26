import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import { FaRegComments } from 'react-icons/fa6';
import './QuestionList.css';

const QuestionList = ({ questions, loading }) => {
    if (loading) {
        return <LoadingSkeleton type="question" count={5} />;
    }

    if (questions.length === 0) {
        return (
            <EmptyState
                title="No questions yet"
                message="Be the first to ask a question about this topic!"
                icon={<FaRegComments />}
                actionLabel="Ask Question"
                actionLink="/stocks"
            />
        );
    }

    return (
        <div className="question-list">
            {questions.map((question) => (
                <QuestionCard key={question._id} question={question} />
            ))}
        </div>
    );
};

const QuestionCard = ({ question }) => {
    // const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

    return (
        <div className="question-card">
            {/* Stats Column (Stack Overflow style) */}
            <div className="question-stats">
                <div className="stat-box">
                    <div className="stat-number">{question.upvotes}</div>
                    <div className="stat-label">votes</div>
                </div>
                <div className={`stat-box ${question.hasAcceptedAnswer ? 'accepted' : ''}`}>
                    <div className="stat-number">{question.answerCount}</div>
                    <div className="stat-label">answers</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">{question.views}</div>
                    <div className="stat-label">views</div>
                </div>
            </div>

            {/* Question Content */}
            <div className="question-content">
                <h3 className="question-title">
                    <Link to={`/question/${question._id}`}>{question.title}</Link>
                </h3>
                <p className="question-excerpt">
                    {question.content.substring(0, 200)}
                    {question.content.length > 200 && '...'}
                </p>

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                    <div className="question-tags">
                        {question.tags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                    </div>
                )}

                {/* Question Footer */}
                <div className="question-footer">
                    <div className="question-author">
                        <Link to={`/profile/${question.userId?._id}`} className="author-link">
                            <span className="author-name">{question.userId?.username || 'Unknown User'}</span>
                            <span className="author-reputation">
                                {question.userId?.reputation?.toFixed(0) || '0'}
                            </span>
                        </Link>
                    </div>
                    <div className="question-time">
                        {question.createdAt ? formatDistanceToNow(new Date(question.createdAt), { addSuffix: true }) : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionList;
