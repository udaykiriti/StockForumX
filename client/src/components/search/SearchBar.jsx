import { FaSearch, FaTimes } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ value = '', onChange, placeholder = 'Search questions...' }) => {
    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const handleClear = () => {
        if (onChange) {
            onChange('');
        }
    };

    return (
        <div className="search-bar-container">
            <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                />
                {value && (
                    <button
                        className="clear-search-btn"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
