import { useState, useEffect } from 'react';
import { getQuestions, getStocks } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/questions/QuestionList';
import SearchBar from '../components/search/SearchBar';
import FilterBar from '../components/search/FilterBar';

// import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FaRegComments, FaArrowTrendUp, FaUsers, FaFire, FaBolt, FaTrophy, FaChartSimple } from 'react-icons/fa6';
import './Home.css';


const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [trendingStocks, setTrendingStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedTags, setSelectedTags] = useState([]);

    // Extract unique tags from all questions dynamically
    const availableTags = [...new Set(
        questions.flatMap(q => q.tags || [])
    )].filter(Boolean).slice(0, 10); // Limit to top 10 most common tags

    // Sync searchQuery with URL params when they change
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch !== searchQuery) {
            setSearchQuery(urlSearch || '');
        }
    }, [searchParams]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            console.log('Fetching with search:', searchQuery); // Debug log
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

            console.log('API params:', params); // Debug log

            const [questionsRes, stocksRes] = await Promise.all([
                getQuestions(params),
                getStocks({})
            ]);

            console.log('Questions fetched:', questionsRes.data?.length); // Debug log
            setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);

            const stocksData = Array.isArray(stocksRes.data) ? stocksRes.data : [];
            const sortedStocks = stocksData
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 5);
            setTrendingStocks(sortedStocks);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load feed');
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

    // Loading state is now handled by components
    // if (loading) return <Loader />;

    return (
        <div className="home-page fade-in">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            <span className="gradient-text">Stock Market</span> Discussion Hub
                        </h1>
                        <p className="hero-subtitle">
                            Where investors discuss market trends, share insights, and learn together
                        </p>

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
                                <div className="stat-value">1K+</div>
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

                        {/* Search Bar */}
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search questions..."
                        />

                        {/* Filter Bar */}
                        <FilterBar
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            selectedTags={selectedTags}
                            onTagToggle={handleTagToggle}
                            availableTags={availableTags}
                            onClearFilters={handleClearFilters}
                        />

                        <QuestionList questions={questions} loading={loading} />
                    </div>

                    {/* Right Sidebar */}
                    <aside className="feed-sidebar">
                        <div className="sidebar-widget">
                            <h3>
                                <FaFire className="widget-icon" />
                                Trending Stocks
                            </h3>
                            <div className="widget-content">
                                {trendingStocks.map(stock => (
                                    <Link to={`/stock/${stock.symbol}`} key={stock._id} className="trending-stock-item">
                                        <div className="trending-stock-info">
                                            <span className="stock-symbol">{stock.symbol}</span>
                                            <span className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                <div className="view-more-link">
                                    <Link to="/stocks">View all stocks →</Link>
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
