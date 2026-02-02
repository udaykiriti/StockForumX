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

    // Neo-Brutalist Colors: Green (Success), Red (Danger), Orange (Theme), Yellow (Warning)
    const COLORS = ['#00ff88', '#ff003d', '#ff6600', '#ffb800'];

    const accuracyData = globalStats ? [
        { name: 'Correct', value: globalStats.correctPredictions },
        { name: 'Incorrect', value: globalStats.evaluatedPredictions - globalStats.correctPredictions }
    ] : [];

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: '#000',
                    border: '2px solid #ff6600',
                    padding: '10px',
                    boxShadow: '4px 4px 0px #ff6600',
                    fontWeight: 'bold',
                    color: '#fff'
                }}>
                    <p style={{ margin: 0, textTransform: 'uppercase' }}>{`${label ? label + ': ' : ''}${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-page fade-in">
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
                            <div className="stat-value" style={{ color: globalStats.accuracy > 50 ? '#00ff88' : '#ff003d' }}>
                                {globalStats.accuracy}%
                            </div>
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
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {accuracyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="square"
                                    formatter={(value) => <span style={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-container">
                        <h2>Top Users by Reputation</h2>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart
                                data={leaderboard}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                                <XAxis type="number" stroke="#666" tick={{ fill: '#888' }} />
                                <YAxis
                                    dataKey="username"
                                    type="category"
                                    width={100}
                                    stroke="#666"
                                    tick={{ fill: '#fff', fontWeight: 'bold' }}
                                />
                                <Tooltip cursor={{ fill: '#1a1a1a' }} content={<CustomTooltip />} />
                                <Bar dataKey="reputation" fill="#ff6600" name="Reputation Score" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
