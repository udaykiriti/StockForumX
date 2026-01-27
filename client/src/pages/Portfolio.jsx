import { useState, useEffect } from 'react';
import { getPortfolio, getTradeHistory, getWatchlist } from '../services/api';
import { Link } from 'react-router-dom';
import { FaWallet, FaChartPie, FaClockRotateLeft, FaArrowTrendUp, FaArrowTrendDown, FaStar } from 'react-icons/fa6';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import './Portfolio.css';

const Portfolio = () => {
    const [portfolio, setPortfolio] = useState(null);
    const [history, setHistory] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('holdings');

    useEffect(() => {
        fetchPortfolioData();
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const [portfolioRes, historyRes, watchlistRes] = await Promise.all([
                getPortfolio(),
                getTradeHistory(),
                getWatchlist()
            ]);
            setPortfolio(portfolioRes.data);
            setHistory(historyRes.data);
            setWatchlist(watchlistRes.data);
        } catch (error) {
            console.error('Failed to load portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="portfolio-page fade-in">
            <div className="container">
                {/* Portfolio Header / Net Worth */}
                <div className="portfolio-header-card brute-frame">
                    <div className="net-worth-section">
                        <span className="label">ESTIMATED NET WORTH</span>
                        <h1 className="value">${portfolio?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                        <div className="header-stats">
                            <div className="header-stat">
                                <span className="stat-label">CASH BALANCE</span>
                                <span className="stat-value">${portfolio?.balance.toLocaleString()}</span>
                            </div>
                            <div className="header-stat">
                                <span className="stat-label">HOLDINGS VALUE</span>
                                <span className="stat-value">${portfolio?.holdingsValue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="portfolio-tabs brute-frame">
                    <button
                        className={`tab-btn ${activeTab === 'holdings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('holdings')}
                    >
                        <FaChartPie /> CURRENT HOLDINGS
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <FaClockRotateLeft /> TRADE HISTORY
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('watchlist')}
                    >
                        <FaStar /> WATCHLIST
                    </button>
                </div>

                {/* Tab Content */}
                <div className="portfolio-content">
                    {activeTab === 'holdings' ? (
                        <div className="holdings-grid">
                            {portfolio?.holdings.length === 0 ? (
                                <EmptyState
                                    title="EMPTY PORTFOLIO"
                                    message="You don't own any stocks yet. Go to the stock market to make your first trade!"
                                    action="Browse Stocks"
                                    onAction={() => window.location.href = '/stocks'}
                                />
                            ) : (
                                portfolio?.holdings.map(holding => (
                                    <Link to={`/stock/${holding.stockId.symbol}`} key={holding._id} className="holding-card brute-frame">
                                        <div className="holding-header">
                                            <div className="stock-info">
                                                <span className="symbol">{holding.stockId.symbol}</span>
                                                <span className="name">{holding.stockId.name}</span>
                                            </div>
                                            <div className={`price-info ${holding.stockId.change >= 0 ? 'up' : 'down'}`}>
                                                ${holding.stockId.currentPrice.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="holding-stats">
                                            <div className="h-stat">
                                                <span className="l">SHARES</span>
                                                <span className="v">{holding.quantity}</span>
                                            </div>
                                            <div className="h-stat">
                                                <span className="l">AVG PRICE</span>
                                                <span className="v">${holding.averagePrice.toFixed(2)}</span>
                                            </div>
                                            <div className="h-stat">
                                                <span className="l">MARKET VALUE</span>
                                                <span className="v">${holding.currentValue.toFixed(2)}</span>
                                            </div>
                                            <div className={`h-stat ${holding.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                                                <span className="l">P/L</span>
                                                <span className="v">
                                                    {holding.profitLoss >= 0 ? '+' : ''}${Math.abs(holding.profitLoss).toFixed(2)}
                                                    <span className="p">({holding.profitLossPercent.toFixed(2)}%)</span>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    ) : activeTab === 'history' ? (
                        <div className="history-list brute-frame">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>TYPE</th>
                                        <th>SYMBOL</th>
                                        <th>QUANTITY</th>
                                        <th>PRICE</th>
                                        <th>TOTAL</th>
                                        <th>DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(tx => (
                                        <tr key={tx._id}>
                                            <td className={`tx-type ${tx.type}`}>
                                                {tx.type.toUpperCase()}
                                            </td>
                                            <td className="tx-symbol">{tx.stockId.symbol}</td>
                                            <td>{tx.quantity}</td>
                                            <td>${tx.price.toFixed(2)}</td>
                                            <td>${tx.totalAmount.toFixed(2)}</td>
                                            <td className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && <p className="empty-msg">No transactions recorded.</p>}
                        </div>
                    ) : (
                        <div className="watchlist-grid">
                            {watchlist.length === 0 ? (
                                <EmptyState
                                    title="EMPTY WATCHLIST"
                                    message="You haven't added any stocks to your watchlist yet."
                                    action="Browse Stocks"
                                    onAction={() => window.location.href = '/stocks'}
                                />
                            ) : (
                                watchlist.map(stock => (
                                    <Link to={`/stock/${stock.symbol}`} key={stock._id} className="stock-card brute-frame">
                                        <div className="stock-card-header">
                                            <span className="symbol">{stock.symbol}</span>
                                            <span className={`price-tag ${stock.change >= 0 ? 'up' : 'down'}`}>
                                                ${stock.currentPrice.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="stock-card-body">
                                            <span className="name">{stock.name}</span>
                                            <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
