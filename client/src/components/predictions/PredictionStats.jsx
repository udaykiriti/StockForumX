import { FaArrowUp, FaArrowDown, FaChartPie } from 'react-icons/fa';
import './Predictions.css';

const PredictionStats = ({ predictions }) => {
    if (!predictions || predictions.length === 0) return null;

    // Calculate stats
    const total = predictions.length;
    const directionPredictions = predictions.filter(p => p.predictionType === 'direction');
    const pricePredictions = predictions.filter(p => p.predictionType === 'price');

    // Sentiment Analysis
    const bullishCount = directionPredictions.filter(p => p.direction === 'up').length;
    const bearishCount = directionPredictions.filter(p => p.direction === 'down').length;
    const totalDirection = directionPredictions.length;

    const bullishPercent = totalDirection > 0 ? Math.round((bullishCount / totalDirection) * 100) : 0;
    const bearishPercent = totalDirection > 0 ? Math.round((bearishCount / totalDirection) * 100) : 0;

    // Price Targets
    const priceTargets = pricePredictions.map(p => p.targetPrice);
    const avgTarget = priceTargets.length > 0
        ? (priceTargets.reduce((a, b) => a + b, 0) / priceTargets.length).toFixed(2)
        : null;

    const minTarget = priceTargets.length > 0 ? Math.min(...priceTargets).toFixed(2) : null;
    const maxTarget = priceTargets.length > 0 ? Math.max(...priceTargets).toFixed(2) : null;

    return (
        <div className="prediction-stats-card">
            <div className="stats-header">
                <h3><FaChartPie /> Community Sentiment</h3>
                <span className="stats-badge">{total} Predictions</span>
            </div>

            <div className="sentiment-bar-container">
                <div className="sentiment-labels">
                    <span className="sentiment-label bullish">
                        <FaArrowUp /> {bullishPercent}% Bullish
                    </span>
                    <span className="sentiment-label bearish">
                        <FaArrowDown /> {bearishPercent}% Bearish
                    </span>
                </div>
                <div className="sentiment-progress-bar">
                    <div
                        className="progress-fill bullish"
                        style={{ width: `${bullishPercent}%` }}
                    ></div>
                    <div
                        className="progress-fill bearish"
                        style={{ width: `${bearishPercent}%` }}
                    ></div>
                </div>
            </div>

            {avgTarget && (
                <div className="price-targets-grid">
                    <div className="target-box">
                        <span className="target-label">Low Target</span>
                        <span className="target-value">${minTarget}</span>
                    </div>
                    <div className="target-box main">
                        <span className="target-label">Avg Target</span>
                        <span className="target-value">${avgTarget}</span>
                    </div>
                    <div className="target-box">
                        <span className="target-label">High Target</span>
                        <span className="target-value">${maxTarget}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionStats;
