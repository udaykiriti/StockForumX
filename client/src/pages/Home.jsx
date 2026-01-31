import { useState, useEffect, useMemo } from 'react';
import { getQuestions, getStocks, getUserCount } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/questions/QuestionList';
import SearchBar from '../components/search/SearchBar';
import DiscussionFilters from '../components/search/DiscussionFilters';

import toast from 'react-hot-toast';
import { FaRegComments, FaArrowTrendUp, FaUsers, FaFire, FaBolt, FaTrophy, FaChartSimple } from 'react-icons/fa6';
import EmptyState from '../components/common/EmptyState';
import './Home.css';


const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [trendingStocks, setTrendingStocks] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedTags, setSelectedTags] = useState([]);
    const [error, setError] = useState(null);

    // Dynamic formatting for user count
    const formatUserCount = (count) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M+';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K+';
        return count;
    };

    // Extract unique tags from all questions dynamically
    const availableTags = useMemo(() => {
        return [...new Set(
            questions.flatMap(q => q?.tags || [])
        )].filter(Boolean).slice(0, 10); // Limit to top 10 most common tags
    }, [questions]);

    // Sync searchQuery with URL params when they change
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch !== searchQuery) {
            setSearchQuery(urlSearch || '');
        }
    }, [searchParams]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, sortBy, selectedTags]);

    const fetchData = async () => {
        try {
            const params = {
                sort: sortBy,
                search: searchQuery || undefined,
                tag: selectedTags.length > 0 ? selectedTags[0] : undefined
            };

            setError(null);

            const results = await Promise.allSettled([
                getQuestions(params),
                getStocks({ limit: 5, sortBy: 'trending' }),
                getUserCount()
            ]);

            const questionsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
            const stocksRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
            const userCountRes = results[2].status === 'fulfilled' ? results[2].value : { data: { count: 0 } };

            if (results[0].status === 'rejected') console.error('Feed failed:', results[0].reason);
            if (results[1].status === 'rejected') console.error('Stocks failed:', results[1].reason);

            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
            setUserCount(userCountRes.data?.count || 0);

            setTrendingStocks(Array.isArray(stocksRes.data) ? stocksRes.data : []);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load feed');
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [tag]
        );
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSortBy('recent');
        setSelectedTags([]);
    };

    return (
        <div className="home-page fade-in">
            <div className="hero-section brute-grid">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text-wrapper">
                            <h1 className="hero-title">
                                <span className="gradient-text">Stock Market</span> Discussion Hub
                            </h1>
                            <p className="hero-subtitle">
                                Where investors discuss market trends, share insights, and learn together
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FaRegComments />
                                </div>
                                <div className="stat-value">{questions.length}+</div>
                                <div className="stat-label">Questions</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FaArrowTrendUp />
                                </div>
                                <div className="stat-value">{trendingStocks.length}</div>
                                <div className="stat-label">Trending Stocks</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FaUsers />
                                </div>
                                <div className="stat-value">{formatUserCount(userCount)}</div>
                                <div className="stat-label">Active Users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="feed-layout">
                    {/* Main Feed */}
                    <div className="feed-main">
                        <div className="feed-header">
                            <h2>Latest Discussions</h2>
                            {isAuthenticated && (
                                <Link to="/stocks" className="btn btn-primary">
                                    Ask Question
                                </Link>
                            )}
                        </div>

                        {/* Search Bar Section */}
                        <div className="search-section-wrapper">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search stocks (e.g., RELIANCE.NS, AAPL)..."
                            />
                        </div>

                        {/* Filter Bar */}
                        <DiscussionFilters
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            selectedTags={selectedTags}
                            onTagToggle={handleTagToggle}
                            availableTags={availableTags}
                            onClearFilters={handleClearFilters}
                        />

                        {error && !loading ? (
                            <div className="feed-error-brute brute-frame">
                                <h3>FEED UNAVAILABLE</h3>
                                <p>We're having trouble reaching the exchange. Try refreshing the page.</p>
                                <button className="btn btn-primary" onClick={fetchData}>
                                    RETRY CONNECTION
                                </button>
                            </div>
                        ) : questions.length === 0 && !loading ? (
                            <EmptyState
                                title="NO DISCUSSIONS"
                                message="The forum is quiet... be the first to start a conversation!"
                                action="Clear Filters"
                                onAction={handleClearFilters}
                            />
                        ) : (
                            <QuestionList questions={questions} loading={loading} />
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <aside className="feed-sidebar">
                        <div className="sidebar-widget brute-frame">
                            <h3>
                                <FaFire className="widget-icon" />
                                Trending Stocks
                            </h3>
                            <div className="widget-content">
                                {trendingStocks.map(stock => (
                                    <Link to={`/stock/${stock.symbol}`} key={stock.symbol} className="trending-stock-item">
                                        <div className="trending-stock-info">
                                            <span className="stock-symbol">{stock.symbol}</span>
                                            <span className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                <div className="view-more-link">
                                    <Link to="/stocks">View all stocks</Link>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-widget">
                            <h3>
                                <FaBolt className="widget-icon" />
                                Quick Links
                            </h3>
                            <div className="widget-content">
                                <div className="quick-links">
                                    <Link to="/leaderboard" className="quick-link">
                                        <FaTrophy className="link-icon" />
                                        <span>Leaderboard</span>
                                    </Link>
                                    <Link to="/stocks" className="quick-link">
                                        <FaChartSimple className="link-icon" />
                                        <span>Browse Stocks</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div >
            </div >
        </div >
    );
};

export default Home;
