import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { getPredictionStats, getLeaderboard } from '../services/api';
import './Analytics.css';

const Analytics = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [statsRes, leaderboardRes] = await Promise.all([
                    getPredictionStats(),
                    getLeaderboard(10)
                ]);
                setGlobalStats(statsRes.data);
                setLeaderboard(leaderboardRes.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="loading-spinner">Loading analytics...</div>;
    }

    const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

    const accuracyData = globalStats ? [
        { name: 'Correct', value: globalStats.correctPredictions },
        { name: 'Incorrect', value: globalStats.evaluatedPredictions - globalStats.correctPredictions }
    ] : [];

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <h1>Platform Analytics</h1>
                <p>Real-time insights into predictions and user performance</p>
            </header>

            {globalStats && (
                <div className="analytics-grid">
                    <div className="stat-card">
                        <h3>Total Predictions</h3>
                        <div className="stat-value">{globalStats.totalPredictions.toLocaleString()}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Global Accuracy</h3>
                        <div className="stat-value">{globalStats.accuracy}%</div>
                    </div>
                    <div className="stat-card">
                        <h3>Evaluated Predictions</h3>
                        <div className="stat-value">{globalStats.evaluatedPredictions.toLocaleString()}</div>
                    </div>
                </div>
            )}

            <div className="charts-section">
                <div className="chart-container">
                    <h2>Generic Prediction Accuracy</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={accuracyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {accuracyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h2>Top Users by Reputation</h2>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={leaderboard}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="username" type="category" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="reputation" fill="#8884d8" name="Reputation Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
