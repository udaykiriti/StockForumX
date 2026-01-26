import './Loader.css';

const Loader = () => {
    return (
        <div className="loader-container">
            <div className="trading-loader">
                <div className="candle"></div>
                <div className="candle"></div>
                <div className="candle"></div>
                <div className="candle"></div>
                <div className="candle"></div>
            </div>
        </div>
    );
};

export default Loader;
