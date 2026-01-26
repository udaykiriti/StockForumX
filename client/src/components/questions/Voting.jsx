import { useState, useEffect } from 'react';
import { FaCaretUp, FaCaretDown } from 'react-icons/fa6';
import { upvoteQuestion, upvoteAnswer } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Voting.css';

const Voting = ({ type, id, initialVotes, initialUpvotedBy = [] }) => {
    const { user } = useAuth();
    const [votes, setVotes] = useState(initialVotes);
    const [hasUpvoted, setHasUpvoted] = useState(false);

    useEffect(() => {
        if (user && initialUpvotedBy) {
            setHasUpvoted(initialUpvotedBy.includes(user._id));
        }
    }, [user, initialUpvotedBy]);

    const handleVote = async (direction) => {
        if (!user) {
            toast.error('Please login to vote');
            return;
        }

        if (direction === -1) {
            toast('Downvoting is currently disabled', { icon: '🚧' });
            return;
        }

        // Optimistic update
        const originalVotes = votes;
        const originalHasUpvoted = hasUpvoted;

        const newHasUpvoted = !hasUpvoted;
        setHasUpvoted(newHasUpvoted);
        setVotes(prev => newHasUpvoted ? prev + 1 : prev - 1);

        try {
            if (type === 'question') {
                await upvoteQuestion(id);
            } else {
                await upvoteAnswer(id);
            }
        } catch (error) {
            // Revert on error
            setVotes(originalVotes);
            setHasUpvoted(originalHasUpvoted);
            toast.error('Failed to vote');
            console.error(error);
        }
    };

    return (
        <div className="voting-container">
            <button
                className={`vote-btn ${hasUpvoted ? 'active' : ''}`}
                onClick={() => handleVote(1)}
                title="This is useful and clear"
            >
                <FaCaretUp />
            </button>

            <div className="vote-count">{votes}</div>

            <button
                className={`vote-btn downvote`}
                onClick={() => handleVote(-1)}
                title="This is unclear or not useful"
            >
                <FaCaretDown />
            </button>
        </div>
    );
};

export default Voting;
