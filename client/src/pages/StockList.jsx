import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocks, getSectors } from '../services/api';
import SearchBar from '../components/search/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import StockCard from '../components/stocks/StockCard';
import toast from 'react-hot-toast';
import './StockList.css';

const StockList = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('symbol');
    const [searchQuery, setSearchQuery] = useState('');
    const [sectors, setSectors] = useState(['all']);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: sectorData } = await getSectors();
                setSectors(['all', ...sectorData]);
                await fetchStocks(1);
            } catch (error) {
                console.error('Failed to load initial data');
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchStocks(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filter, sortBy]);

    const fetchStocks = async (pageNum = page) => {
        setLoading(true);
        try {
            const params = {
                page: pageNum,
                limit: 12,
                search: searchQuery,
                sector: filter,
                sortBy: sortBy
            };
            const { data: res } = await getStocks(params);
            setStocks(res.data || []);
            setTotalPages(res.totalPages || 1);
            setTotal(res.total || 0);
        } catch (error) {
            toast.error('Failed to load stocks');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            fetchStocks(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="stock-list-page fade-in">
            <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)' }}>
                <div className="page-header">
                    <h1>Stocks</h1>
                    <p>Total {total} stocks available across {sectors.length - 1} sectors</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search stocks... Indian: .NS (e.g. RELIANCE.NS) • Global: Ticker (e.g. AAPL)"
                            />
                        </div>
                        <div className="filter-section" style={{ margin: 0 }}>
                            <select
                                className="sort-dropdown"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="symbol">A-Z</option>
                                <option value="trending">Trending</option>
                                <option value="bullish">Bullish</option>
                                <option value="gainers">Top Gainers</option>
                                <option value="losers">Top Losers</option>
                            </select>
                        </div>
                    </div>

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
                    {loading ? (
                        <LoadingSkeleton type="stock" count={12} />
                    ) : stocks.length > 0 ? (
                        stocks.map(stock => (
                            <StockCard key={stock._id} stock={stock} />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <EmptyState
                                title="STOCKS NOT FOUND"
                                message={`We couldn't find any stocks matching "${searchQuery}"`}
                                action="Reset Search"
                                onAction={() => { setSearchQuery(''); setFilter('all'); }}
                            />
                        </div>
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '40px 0' }}>
                        <button
                            className="filter-btn"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                            style={{ padding: '8px 20px', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            Previous
                        </button>

                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                            Page {page} of {totalPages}
                        </span>

                        <button
                            className="filter-btn"
                            disabled={page === totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            style={{ padding: '8px 20px', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockList;
