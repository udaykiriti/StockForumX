import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AskQuestionModal from './AskQuestionModal';
import './AskQuestionButton.css';

const AskQuestionButton = ({ stockId, onQuestionAsked }) => {
    const [showModal, setShowModal] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowModal(true);
    };

    return (
        <>
            <button className="btn btn-primary ask-question-btn" onClick={handleClick}>
                Ask Question
            </button>
            {showModal && (
                <AskQuestionModal
                    stockId={stockId}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        onQuestionAsked();
                    }}
                />
            )}
        </>
    );
};

export default AskQuestionButton;
