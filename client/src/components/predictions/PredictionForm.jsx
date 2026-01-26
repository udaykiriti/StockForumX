import { useState } from 'react';
import { createPrediction } from '../../services/api';
import toast from 'react-hot-toast';
import { FaArrowUp, FaArrowDown, FaClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Predictions.css';

const PredictionForm = ({ stockId, onPredictionCreated }) => {
    const { user } = useAuth();
    const [predictionType, setPredictionType] = useState('direction'); // 'direction' or 'price'
    const [direction, setDirection] = useState(null);
    const [targetPrice, setTargetPrice] = useState('');
    const [timeframe, setTimeframe] = useState('1d');
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please login to make a prediction');
            return;
        }

        if (predictionType === 'direction' && !direction) {
            toast.error('Please select a direction (Up or Down)');
            return;
        }

        if (predictionType === 'price' && !targetPrice) {
            toast.error('Please enter a target price');
            return;
        }

        if (!reasoning.trim()) {
            toast.error('Please provide your reasoning');
            return;
        }

        setLoading(true);
        try {
            const predictionData = {
                stockId,
                predictionType,
                timeframe,
                reasoning,
                direction: predictionType === 'direction' ? direction : undefined,
                targetPrice: predictionType === 'price' ? parseFloat(targetPrice) : undefined
            };

            await createPrediction(predictionData);
            toast.success('Prediction posted successfully!');
            // Reset form
            setDirection(null);
            setTargetPrice('');
            setReasoning('');
            if (onPredictionCreated) onPredictionCreated();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post prediction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="prediction-form">
            <h3>Make a Prediction</h3>

            <div className="prediction-type-toggle">
                <button
                    className={`type-btn ${predictionType === 'direction' ? 'active' : ''}`}
                    onClick={() => setPredictionType('direction')}
                >
                    Direction
                </button>
                <button
                    className={`type-btn ${predictionType === 'price' ? 'active' : ''}`}
                    onClick={() => setPredictionType('price')}
                >
                    Price Target
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {predictionType === 'direction' ? (
                    <div className="direction-selector">
                        <div
                            className={`direction-card up ${direction === 'up' ? 'selected' : ''}`}
                            onClick={() => setDirection('up')}
                        >
                            <FaArrowUp className="direction-icon" />
                            <span>Bullish (Up)</span>
                        </div>
                        <div
                            className={`direction-card down ${direction === 'down' ? 'selected' : ''}`}
                            onClick={() => setDirection('down')}
                        >
                            <FaArrowDown className="direction-icon" />
                            <span>Bearish (Down)</span>
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="form-label">Target Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder="e.g. 150.00"
                        />
                    </div>
                )}

                <div className="prediction-options">
                    <div className="form-group">
                        <label className="form-label">Timeframe</label>
                        <select
                            className="form-select"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                        >
                            <option value="1h">1 Hour</option>
                            <option value="1d">24 Hours</option>
                            <option value="1w">1 Week</option>
                            <option value="1m">1 Month</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Reasoning</label>
                    <textarea
                        className="form-textarea"
                        rows="3"
                        value={reasoning}
                        onChange={(e) => setReasoning(e.target.value)}
                        placeholder="Why do you think this will happen?"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Post Prediction'}
                </button>
            </form>
        </div>
    );
};

export default PredictionForm;
