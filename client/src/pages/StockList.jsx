import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStocks } from '../services/api';
import SearchBar from '../components/search/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { FaChartLine } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import './StockList.css';

import * as ReactWindow from 'react-window';
import * as AutoSizerPkg from 'react-virtualized-auto-sizer';

// Workaround for CJS/ESM interop issues in Vite/Rollup build
// Using bracket notation to bypass static analysis "is not exported" errors
const Grid = ReactWindow.FixedSizeGrid || ReactWindow['FixedSizeGrid'] || ReactWindow.default?.['FixedSizeGrid'];
const AutoSizer = AutoSizerPkg.default || AutoSizerPkg['default'] || AutoSizerPkg;

// ... existing imports ...

const StockList = () => {
    // ... existing state ...
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ... existing useEffects/fetches ...
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

    const sectors = ['all', ...new Set(stocks.map(s => s.sector).filter(Boolean))];

    // Grid Cell Renderer
    const Cell = ({ columnIndex, rowIndex, style, data }) => {
        const { stocks, columnCount } = data;
        const index = rowIndex * columnCount + columnIndex;

        if (index >= stocks.length) return null;

        const stock = stocks[index];

        // Adjust style for gap simulation (react-window uses absolute positioning)
        const gap = 40;
        const adjustedStyle = {
            ...style,
            left: style.left + (gap / 2),
            top: style.top + (gap / 2),
            width: style.width - gap,
            height: style.height - gap
        };

        return (
            <div style={adjustedStyle}>
                <Link to={`/stock/${stock.symbol}`} className="stock-card" style={{ height: '100%', margin: 0 }}>
                    <div className="stock-header">
                        <div>
                            <h3 className="stock-symbol">{stock.symbol || 'N/A'}</h3>
                            <p className="stock-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {stock.name || 'Unknown'}
                            </p>
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
                            <span className="stat-label">Mkt Cap</span>
                            <span className="stat-value">${((stock.marketCap || 0) / 1000000000).toFixed(1)}B</span>
                        </div>
                    </div>
                </Link>
            </div>
        );
    };

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

                <div className="stocks-grid-container" style={{ flex: 1, minHeight: 0 }}>
                    {filteredStocks.length > 0 ? (
                        <AutoSizer>
                            {({ height, width }) => {
                                // Responsive column calculation
                                const minColumnWidth = 320;
                                const columnCount = Math.max(1, Math.floor(width / minColumnWidth));
                                const columnWidth = width / columnCount;
                                const rowCount = Math.ceil(filteredStocks.length / columnCount);
                                const rowHeight = 380; // Approximate card height + gap

                                return (
                                    <Grid
                                        columnCount={columnCount}
                                        columnWidth={columnWidth}
                                        height={height}
                                        rowCount={rowCount}
                                        rowHeight={rowHeight}
                                        width={width}
                                        itemData={{ stocks: filteredStocks, columnCount }}
                                    >
                                        {Cell}
                                    </Grid>
                                );
                            }}
                        </AutoSizer>
                    ) : (
                        <EmptyState
                            title="STOCKS NOT FOUND"
                            message={`We couldn't find any stocks matching "${searchQuery}"`}
                            action="Reset Search"
                            onAction={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockList;
