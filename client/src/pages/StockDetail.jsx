import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getStock, getQuestions, toggleWatchlist, getWatchlist, getStockHistory, getPredictions } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/questions/QuestionList';
import AskQuestionButton from '../components/questions/AskQuestionButton';
import CandlestickChart from '../components/stocks/CandlestickChart';
import toast from 'react-hot-toast';
import { FaStar, FaRegStar } from 'react-icons/fa6';
import './StockDetail.css';
import PredictionForm from '../components/predictions/PredictionForm';
import PredictionList from '../components/predictions/PredictionList';
import PredictionStats from '../components/predictions/PredictionStats';
import Loader from '../components/common/Loader';
import TradeBox from '../components/predictions/TradeBox';

const StockDetail = () => {
    const { symbol } = useParams();
    const [stock, setStock] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [volumeData, setVolumeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('questions');
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchStockData();
    }, [symbol]);

    useEffect(() => {
        if (socket && stock) {
            socket.on('question:new', (newQuestion) => {
                if (newQuestion.stockId._id === stock._id) {
                    setQuestions(prev => [newQuestion, ...prev]);
                }
            });

            socket.on('prediction:new', (newPrediction) => {
                if (newPrediction.stockId._id === stock._id) {
                    setPredictions(prev => [newPrediction, ...prev]);
                }
            });

            return () => {
                socket.off('question:new');
                socket.off('prediction:new');
            };
        }
    }, [socket, stock]);

    const fetchStockData = async () => {
        try {
            const { data } = await getStock(symbol);
            setStock(data);

            const [questionsRes, predictionsRes, historyRes] = await Promise.all([
                getQuestions({ stockId: data._id }),
                getPredictions({ stockId: data._id }),
                getStockHistory(symbol)
            ]);

            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            setPredictions(Array.isArray(predictionsRes.data) ? predictionsRes.data : []);


            const history = Array.isArray(historyRes.data) ? historyRes.data : [];
            // Map data for chart
            setChartData(history.map(item => ({
                time: item.time || item.date, // support both just in case
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close
            })));

            setVolumeData(history.map(item => ({
                time: item.time || item.date,
                value: item.volume
            })));

            if (isAuthenticated) {
                const watchlistRes = await getWatchlist();
                setIsInWatchlist(watchlistRes.data.some(s => s._id === data._id));
            }
        } catch (error) {
            toast.error('Failed to load stock data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePredictionCreated = (newPrediction) => {
        setPredictions(prev => [newPrediction, ...prev]);
    };

    const handleToggleWatchlist = async () => {
        try {
            const { data } = await toggleWatchlist(stock._id);
            setIsInWatchlist(data.isInWatchlist);
            toast.success(data.message);
        } catch (error) {
            toast.error('Failed to update watchlist');
        }
    };

    const refreshQuestions = async () => {
        if (!stock) return;
        try {
            const { data } = await getQuestions({ stockId: stock._id });
            setQuestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <Loader />;

    if (!stock) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Stock not found</h2>
            </div>
        );
    }

    const MemoizedChart = useMemo(() => (
        <CandlestickChart
            data={chartData}
            volumeData={volumeData}
            height={450}
        />
    ), [chartData, volumeData]);

    return (
        <div className="stock-detail-page fade-in">
            <div className="stock-header-section">
                <div className="container">
                    <div className="stock-header-content">
                        <div className="stock-info">
                            <div className="symbol-wrapper">
                                <h1 className="stock-symbol">{stock.symbol}</h1>
                                {isAuthenticated && (
                                    <button
                                        className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
                                        onClick={handleToggleWatchlist}
                                        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                                    >
                                        {isInWatchlist ? <FaStar /> : <FaRegStar />}
                                    </button>
                                )}
                            </div>
                            <div className="stock-name-badge">
                                <p className="stock-name">{stock.name}</p>
                                <span className="badge badge-info">{stock.sector}</span>
                            </div>
                        </div>
                        <div className="stock-price-info">
                            <div className="current-price">${stock?.currentPrice?.toFixed(2) || '0.00'}</div>
                            <div className={`price-change ${stock?.change >= 0 ? 'positive' : 'negative'}`}>
                                {stock?.change >= 0 ? '+' : ''}{Math.abs(stock?.change || 0).toFixed(2)} ({Math.abs(stock?.changePercent || 0)}%)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="stock-content">
                    <main className="stock-main">
                        {/* Interactive Price History Chart */}
                        {MemoizedChart}

                        <div className="tabs-container">
                            <div className="tabs">
                                <button
                                    className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('questions')}
                                >
                                    Questions ({questions.length})
                                </button>
                                <button
                                    className={`tab ${activeTab === 'predictions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('predictions')}
                                >
                                    Predictions
                                </button>
                                <button
                                    className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chat')}
                                >
                                    Live Chat
                                </button>
                            </div>
                            {activeTab === 'questions' && isAuthenticated && (
                                <AskQuestionButton stockId={stock._id} onQuestionAsked={refreshQuestions} />
                            )}
                        </div>

                        <div className="tab-content">
                            {activeTab === 'questions' && (
                                <div className="questions-section">
                                    <div className="section-header">
                                        <h3>{questions.length} Questions</h3>
                                    </div>
                                    <QuestionList questions={questions} />
                                </div>
                            )}

                            {activeTab === 'predictions' && (
                                <div className="predictions-section">
                                    <PredictionStats predictions={predictions} />
                                    <PredictionForm
                                        stockId={stock._id}
                                        onPredictionCreated={handlePredictionCreated}
                                    />
                                    <div className="section-header" style={{ marginTop: '30px' }}>
                                        <h3>Community Predictions</h3>
                                    </div>
                                    <PredictionList predictions={predictions} />
                                </div>
                            )}

                            {activeTab === 'chat' && (
                                <div className="chat-section">
                                    <div className="placeholder-box">
                                        <h3>Live Chat Coming Soon</h3>
                                        <p>Chat with other investors about {stock.symbol} in real-time.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className="stock-sidebar">
                        {isAuthenticated && <TradeBox stock={stock} />}
                        <div className="sidebar-widget">
                            <h3>About {stock.symbol}</h3>
                            <div className="widget-content">
                                <p className="stock-description">{stock.description || "No description available."}</p>
                                <div className="profile-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Industry</span>
                                        <span className="meta-value">{stock.industry}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Website</span>
                                        <a href={stock.website} target="_blank" rel="noopener noreferrer" className="meta-link">
                                            {stock.website ? new URL(stock.website).hostname : 'N/A'}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sidebar-widget brute-frame">
                            <h3>Community Sentiment</h3>
                            <div className="widget-content">
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                                        <span>{stock.sentimentLabel || 'Neutral'}</span>
                                        <span>{Math.round(stock.sentimentScore || 50)}%</span>
                                    </div>
                                    <div className="sentiment-bar-bg" style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div
                                            className="sentiment-bar-fill"
                                            style={{
                                                height: '100%',
                                                width: `${stock.sentimentScore || 50}%`,
                                                background: (stock.sentimentScore || 50) > 60 ? 'var(--accent-success)' : (stock.sentimentScore || 50) < 40 ? 'var(--accent-danger)' : 'var(--accent-warning)',
                                                boxShadow: `0 0 15px ${(stock.sentimentScore || 50) > 60 ? 'var(--accent-success)' : (stock.sentimentScore || 50) < 40 ? 'var(--accent-danger)' : 'var(--accent-warning)'}`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7, fontStyle: 'italic' }}>
                                    Based on real-time analysis of community questions and answers.
                                </p>
                            </div>
                        </div>

                        <div className="sidebar-widget">
                            <h3>Stats</h3>
                            <div className="widget-content">
                                <div className="sidebar-stat">
                                    <span className="stat-label">Volume</span>
                                    <span className="stat-value">{(stock.volume / 1000000).toFixed(1)}M</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">Market Cap</span>
                                    <span className="stat-value">${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">High 24h</span>
                                    <span className="stat-value">${stock.high24h.toFixed(2)}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">Low 24h</span>
                                    <span className="stat-value">${stock.low24h.toFixed(2)}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">52W High</span>
                                    <span className="stat-value">${stock.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">52W Low</span>
                                    <span className="stat-value">${stock.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">P/E Ratio</span>
                                    <span className="stat-value">{stock.peRatio?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">Div Yield</span>
                                    <span className="stat-value">{stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default StockDetail;
