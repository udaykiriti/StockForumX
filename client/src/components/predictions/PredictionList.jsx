import { formatDistanceToNow } from 'date-fns';
import { FaArrowUp, FaArrowDown, FaBullseye, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import './Predictions.css';

const PredictionList = ({ predictions }) => {
    if (!predictions || predictions.length === 0) {
        return (
            <div className="no-data-placeholder">
                <p>No predictions yet. Be the first to predict!</p>
            </div>
        );
    }

    return (
        <div className="prediction-list">
            {predictions.map(prediction => (
                <PredictionCard key={prediction._id} prediction={prediction} />
            ))}
        </div>
    );
};

const PredictionCard = ({ prediction }) => {
    const isUp = prediction.direction === 'up';

    return (
        <div className="prediction-card">
            <div className="prediction-main">
                {prediction.predictionType === 'direction' ? (
                    <div className={`prediction-badge ${isUp ? 'up' : 'down'}`}>
                        {isUp ? <FaArrowUp /> : <FaArrowDown />}
                        <span>{isUp ? 'Bullish' : 'Bearish'}</span>
                    </div>
                ) : (
                    <div className="prediction-badge price">
                        <FaBullseye />
                        <span>${prediction.targetPrice || 0}</span>
                    </div>
                )}

                <div className="prediction-details">
                    <div className="user-info">
                        <strong>{prediction.userId?.username || 'Unknown'}</strong>
                        <span>•</span>
                        <span className="prediction-timeframe">
                            <FaClock style={{ marginRight: '4px', fontSize: '10px' }} />
                            Target: {prediction.targetDate ? formatDistanceToNow(new Date(prediction.targetDate), { addSuffix: true }) : 'N/A'}
                        </span>
                    </div>
                    {prediction.reasoning && (
                        <div className="prediction-reasoning">
                            {prediction.reasoning}
                        </div>
                    )}
                </div>
            </div>

            <div className="prediction-status">
                {prediction.isEvaluated ? (
                    <span className={`status-pill ${prediction.isCorrect ? 'correct' : 'incorrect'}`}>
                        {prediction.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                ) : (
                    <span className="status-pill pending">Pending</span>
                )}
            </div>
        </div>
    );
};

export default PredictionList;
