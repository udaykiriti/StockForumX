import './SearchBar.css';

const FilterBar = ({ sortBy, onSortChange, selectedTags = [], onTagToggle, availableTags = [], onClearFilters }) => {
    return (
        <div className="filter-bar">
            <span className="filter-label">Sort:</span>
            <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
            >
                <option value="recent">Newest</option>
                <option value="popular">Popular</option>
                <option value="unanswered">Unanswered</option>
            </select>

            {availableTags.length > 0 && (
                <>
                    <span className="filter-label" style={{ marginLeft: '16px' }}>Tags:</span>
                    <div className="filter-chips">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                className={`filter-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                                onClick={() => onTagToggle(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {(selectedTags.length > 0 || sortBy !== 'recent') && (
                <button className="clear-filters-btn" onClick={onClearFilters}>
                    Clear Filters
                </button>
            )}
        </div>
    );
};

export default FilterBar;
