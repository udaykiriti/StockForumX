import { useState } from 'react';
import { createQuestion } from '../../services/api';
import toast from 'react-hot-toast';
import './AskQuestionModal.css';

const QUESTION_TAGS = [
    'Technical Analysis',
    'Fundamental Analysis',
    'News',
    'Earnings',
    'Market Sentiment',
    'Options',
    'Dividends',
    'Risk Management',
    'Strategy',
    'Other'
];

const AskQuestionModal = ({ stockId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [similarQuestions, setSimilarQuestions] = useState([]);

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length < 5) {
                setSelectedTags([...selectedTags, tag]);
            } else {
                toast.error('Maximum 5 tags allowed');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (title.length < 15) {
            toast.error('Title must be at least 15 characters');
            return;
        }

        if (content.length < 30) {
            toast.error('Question body must be at least 30 characters');
            return;
        }

        setLoading(true);

        try {
            await createQuestion({
                stockId,
                title,
                content,
                tags: selectedTags
            });

            toast.success('Question posted successfully!');
            onSuccess();
        } catch (error) {
            if (error.response?.data?.similarQuestions) {
                setSimilarQuestions(error.response.data.similarQuestions);
                toast.error('Similar questions found. Please check them first.');
            } else {
                toast.error(error.response?.data?.message || 'Failed to post question');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content ask-question-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ask a Question</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="ask-question-form">
                    <div className="form-group">
                        <label className="form-label">
                            Title
                            <span className="label-hint">Be specific and imagine you're asking a question to another person</span>
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Why did AAPL drop 5% after earnings?"
                            maxLength={200}
                            required
                        />
                        <div className="char-count">{title.length}/200</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Question Details
                            <span className="label-hint">Include all the information someone would need to answer your question</span>
                        </label>
                        <textarea
                            className="form-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Provide more context about your question..."
                            rows={8}
                            maxLength={5000}
                            required
                        />
                        <div className="char-count">{content.length}/5000</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Tags
                            <span className="label-hint">Add up to 5 tags to describe what your question is about</span>
                        </label>
                        <div className="tag-selector">
                            {QUESTION_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {similarQuestions.length > 0 && (
                        <div className="similar-questions-alert">
                            <h4>Similar questions found:</h4>
                            <ul>
                                {similarQuestions.map((sq, index) => (
                                    <li key={index}>
                                        <a href={`/question/${sq.question._id}`} target="_blank" rel="noopener noreferrer">
                                            {sq.question.title}
                                        </a>
                                        <span className="similarity-score">{(sq.similarity * 100).toFixed(0)}% similar</span>
                                    </li>
                                ))}
                            </ul>
                            <p>Please check if your question has already been answered.</p>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AskQuestionModal;
