import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSearch } from 'react-icons/fa';
import { getStocks } from '../../services/api';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tickerStocks, setTickerStocks] = useState([]);

    useEffect(() => {
        const fetchTickerData = async () => {
            try {
                const { data } = await getStocks({ limit: 10, sortBy: 'trending' });
                setTickerStocks(data.data || []);
            } catch (error) {
                console.error('Failed to fetch ticker data:', error);
            }
        };
        fetchTickerData();

        // Refresh every minute
        const interval = setInterval(fetchTickerData, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery)}`);
            setIsMenuOpen(false);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
            <div className="market-ticker">
                <div className="ticker-scroll">
                    {/* Render twice for infinite scroll */}
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="ticker-content-group">
                            {tickerStocks.length > 0 ? (
                                tickerStocks.map(stock => (
                                    <Link key={stock.symbol} to={`/stock/${stock.symbol}`} className="ticker-pair">
                                        {stock.symbol}
                                        <span className={stock.change >= 0 ? 'ticker-up' : 'ticker-down'}>
                                            ${stock.currentPrice.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                                        </span>
                                        <span className="ticker-separator">///</span>
                                    </Link>
                                ))
                            ) : (
                                <span className="ticker-status-badge">INITIALIZING LIVE FEED...</span>
                            )}
                            <span className="ticker-status-badge">MARKET STATUS: <span className="status-live">LIVE</span></span>
                            <span className="ticker-separator">///</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
                    <span className="brand-logo-icon"></span>
                    <span className="brand-text">Stock<span className="brand-bold">ForumX</span></span>
                </Link>

                <div className="navbar-burger" onClick={toggleMenu}>
                    <div className="burger-line"></div>
                    <div className="burger-line"></div>
                    <div className="burger-line"></div>
                </div>

                <div className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
                    <div className="navbar-search-wrapper">
                        <form className="navbar-search" onSubmit={handleSearch}>
                            <FaSearch className="search-icon-nav" />
                            <input
                                type="text"
                                placeholder="SEARCH STOCKS..."
                                className="search-input-nav"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                title="🇮🇳 Indian: .NS | 🌍 Global: Ticker"
                            />
                        </form>
                    </div>

                    <div className="navbar-content">
                        <div className="navbar-links">
                            <Link to="/stocks" className="nav-link" onClick={() => setIsMenuOpen(false)}>Stocks</Link>
                            <Link to="/feed" className="nav-link" onClick={() => setIsMenuOpen(false)}>Feed</Link>
                            <Link to="/leaderboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>Leaderboard</Link>
                            {isAuthenticated && (
                                <Link to="/portfolio" className="nav-link portfolio-link" onClick={() => setIsMenuOpen(false)}>Portfolio</Link>
                            )}
                        </div>

                        <div className="navbar-auth">
                            {isAuthenticated ? (
                                <div className="user-section">
                                    <NotificationBell />
                                    <Link to={`/profile/${user._id}`} className="user-profile-link" onClick={() => setIsMenuOpen(false)}>
                                        <div className="avatar-small">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="reputation-count" title="reputation">
                                            {user.reputation.toFixed(0)}
                                        </span>
                                    </Link>
                                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="btn-logout" title="Log out">
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="btn btn-login" onClick={() => setIsMenuOpen(false)}>Log in</Link>
                                    <Link to="/register" className="btn btn-signup" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
