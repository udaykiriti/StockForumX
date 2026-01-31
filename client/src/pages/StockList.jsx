import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocks, getSectors } from '../services/api';
import SearchBar from '../components/search/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { FaChartLine } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import './StockList.css';

const StockList = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sectors, setSectors] = useState(['all']);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: sectorData } = await getSectors();
                setSectors(['all', ...sectorData]);
                await fetchStocks();
            } catch (error) {
                console.error('Failed to load initial data');
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchStocks();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const fetchStocks = async () => {
        try {
            const params = searchQuery ? { search: searchQuery } : {};
            const { data } = await getStocks(params);
            setStocks(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load stocks');
        } finally {
            setLoading(false);
        }
    };

    const filteredStocks = filter === 'all'
        ? stocks
        : stocks.filter(s => s.sector === filter);

    if (loading) {
        return (
            <div className="stock-list-page">
                <div className="container">
                    <LoadingSkeleton type="stock" count={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="stock-list-page fade-in">
            <div className="container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
                <div className="page-header">
                    <h1>Stocks</h1>
                    <p>Browse stocks by sector and market performance</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search stocks by symbol or name..."
                    />

                    <div className="filter-section" style={{ marginTop: '20px', marginBottom: '0' }}>
                        <div className="filter-buttons">
                            {sectors.map(sector => (
                                <button
                                    key={sector}
                                    className={`filter-btn ${filter === sector ? 'active' : ''}`}
                                    onClick={() => setFilter(sector)}
                                >
                                    {sector}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="stocks-grid">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map(stock => (
                            <Link to={`/stock/${stock.symbol}`} key={stock._id} className="stock-card">
                                <div className="stock-header">
                                    <div>
                                        <h3 className="stock-symbol">{stock.symbol || 'N/A'}</h3>
                                        <p className="stock-name">{stock.name || 'Unknown'}</p>
                                    </div>
                                    <span className="badge badge-info">{stock.sector || 'Other'}</span>
                                </div>

                                <div className="stock-price">
                                    <span className="price">${(stock.currentPrice || 0).toFixed(2)}</span>
                                    <span className={`change ${(stock.change || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        {(stock.change || 0) >= 0 ? '+' : ''}{Math.abs(stock.changePercent || 0)}%
                                    </span>
                                </div>

                                <div className="stock-stats">
                                    <div className="stat">
                                        <span className="stat-label">Volume</span>
                                        <span className="stat-value">{((stock.volume || 0) / 1000000).toFixed(1)}M</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Market Cap</span>
                                        <span className="stat-value">${((stock.marketCap || 0) / 1000000000).toFixed(1)}B</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <EmptyState
                                title="STOCKS NOT FOUND"
                                message={`We couldn't find any stocks matching "${searchQuery}"`}
                                action="Reset Search"
                                onAction={() => setSearchQuery('')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockList;
