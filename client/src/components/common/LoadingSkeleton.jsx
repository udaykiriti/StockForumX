import './LoadingSkeleton.css';

const LoadingSkeleton = ({ type = 'card', count = 3 }) => {
    const skeletons = Array(count).fill(0);

    if (type === 'question') {
        return (
            <div className="skeleton-list">
                {skeletons.map((_, index) => (
                    <div key={index} className="skeleton-question">
                        <div className="skeleton-stats">
                            <div className="skeleton-stat-box"></div>
                            <div className="skeleton-stat-box"></div>
                            <div className="skeleton-stat-box"></div>
                        </div>
                        <div className="skeleton-content">
                            <div className="skeleton-line skeleton-title"></div>
                            <div className="skeleton-line skeleton-text"></div>
                            <div className="skeleton-line skeleton-text short"></div>
                            <div className="skeleton-tags">
                                <div className="skeleton-tag"></div>
                                <div className="skeleton-tag"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'stock') {
        return (
            <div className="skeleton-grid">
                {skeletons.map((_, index) => (
                    <div key={index} className="skeleton-stock-card">
                        <div className="skeleton-line skeleton-stock-symbol"></div>
                        <div className="skeleton-line skeleton-stock-name"></div>
                        <div className="skeleton-line skeleton-stock-price"></div>
                        <div className="skeleton-stats-row">
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'user') {
        return (
            <div className="skeleton-list">
                {skeletons.map((_, index) => (
                    <div key={index} className="skeleton-user-row">
                        <div className="skeleton-circle"></div>
                        <div className="skeleton-line skeleton-username"></div>
                        <div className="skeleton-line skeleton-tier"></div>
                        <div className="skeleton-line skeleton-reputation"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Default card skeleton
    return (
        <div className="skeleton-list">
            {skeletons.map((_, index) => (
                <div key={index} className="skeleton-card">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text short"></div>
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
