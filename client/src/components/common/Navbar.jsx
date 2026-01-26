import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSearch } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to home page with search query
            navigate(`/?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-logo-icon"></span>
                    <span className="brand-text">Stock<span className="brand-bold">ForumX</span></span>
                </Link>

                <form className="navbar-search" onSubmit={handleSearch}>
                    <FaSearch className="search-icon-nav" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        className="search-input-nav"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                <div className="navbar-content">
                    <div className="navbar-links">
                        <Link to="/stocks" className="nav-link">Stocks</Link>
                        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                    </div>

                    <div className="navbar-auth">
                        {isAuthenticated ? (
                            <div className="user-section">
                                <Link to={`/profile/${user._id}`} className="user-profile-link">
                                    <div className="avatar-small">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="reputation-count" title="reputation">
                                        {user.reputation.toFixed(0)}
                                    </span>
                                </Link>
                                <button onClick={logout} className="btn-logout" title="Log out">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-login">Log in</Link>
                                <Link to="/register" className="btn btn-signup">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
