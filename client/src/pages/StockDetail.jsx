import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStock, getQuestions } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/questions/QuestionList';
import AskQuestionButton from '../components/questions/AskQuestionButton';
import toast from 'react-hot-toast';
import './StockDetail.css';
import PredictionForm from '../components/predictions/PredictionForm';
import PredictionList from '../components/predictions/PredictionList';
import PredictionStats from '../components/predictions/PredictionStats';
import { getPredictions } from '../services/api';
import Loader from '../components/common/Loader';

const StockDetail = () => {
    const { symbol } = useParams();
    const [stock, setStock] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [predictions, setPredictions] = useState([]); // Add predictions state
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('questions');
    const [isAskModalOpen, setIsAskModalOpen] = useState(false);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchStockData();
    }, [symbol]);

    useEffect(() => {
        if (socket && stock) {
            // Listen for new questions
            socket.on('question:new', (newQuestion) => {
                if (newQuestion.stockId._id === stock._id) {
                    setQuestions(prev => [newQuestion, ...prev]);
                }
            });

            // Listen for new predictions
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

            // Fetch related questions and predictions
            const [questionsRes, predictionsRes] = await Promise.all([
                getQuestions({ stockId: data._id }),
                getPredictions({ stockId: data._id })
            ]);

            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            setPredictions(Array.isArray(predictionsRes.data) ? predictionsRes.data : []);
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

    // fetchQuestions removed as it is now integrated into fetchStockData
    // We keep a separate function for manual refreshing if needed, but for now
    // let's just expose a refresh function if the button needs it.

    const refreshQuestions = async () => {
        if (!stock) return;
        try {
            const { data } = await getQuestions({ stockId: stock._id });
            setQuestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!stock) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Stock not found</h2>
            </div>
        );
    }

    return (
        <div className="stock-detail-page">
            {/* Stock Header */}
            <div className="stock-header-section">
                <div className="container">
                    <div className="stock-header-content">
                        <div className="stock-info">
                            <h1 className="stock-symbol">{stock.symbol}</h1>
                            <p className="stock-name">{stock.name}</p>
                            <span className="badge badge-info">{stock.sector}</span>
                        </div>
                        <div className="stock-price-info">
                            <div className="current-price">${stock.currentPrice.toFixed(2)}</div>
                            <div className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                {stock.change >= 0 ? '+' : ''}{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent)}%)
                            </div>
                        </div>
                    </div>
                    <div className="stock-stats-bar">
                        <div className="stat-item">
                            <span className="stat-label">Volume</span>
                            <span className="stat-value">{(stock.volume / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Market Cap</span>
                            <span className="stat-value">${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">High</span>
                            <span className="stat-value">${stock.high24h.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Low</span>
                            <span className="stat-value">${stock.low24h.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                <div className="stock-content">
                    {/* Sidebar */}
                    <aside className="stock-sidebar">
                        <div className="sidebar-card">
                            <h3>About {stock.symbol}</h3>
                            <p className="stock-description">{stock.description}</p>
                        </div>
                        <div className="sidebar-card">
                            <h3>Stats</h3>
                            <div className="sidebar-stats">
                                <div className="sidebar-stat">
                                    <span className="stat-label">Questions</span>
                                    <span className="stat-value">{stock.stats?.questionCount || 0}</span>
                                </div>
                                <div className="sidebar-stat">
                                    <span className="stat-label">Predictions</span>
                                    <span className="stat-value">{stock.stats?.predictionCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="stock-main">
                        {/* Tabs */}
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

                        {/* Tab Content */}
                        <div className="tab-content">
                            {activeTab === 'questions' && (
                                <div className="questions-section">
                                    <div className="section-header">
                                        <h3>{questions.length} Questions</h3>
                                        <div className="section-actions">
                                            <button className="btn btn-secondary btn-sm">Newest</button>
                                            <button className="btn btn-secondary btn-sm">Votes</button>
                                        </div>
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
                                    <div className="section-header">
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
                </div>
            </div>
        </div>
    );
};

export default StockDetail;
