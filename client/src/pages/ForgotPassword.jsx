import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaKey } from 'react-icons/fa';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset link sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">
                                <FaKey />
                            </div>
                        </div>
                        <h1 className="auth-title">Reset Password</h1>
                        <p className="auth-subtitle">Enter your email to receive an OTP.</p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@company.com"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>
                    ) : (
                        <div className="success-message">
                            <p>OTP sent to {email}.</p>
                            <Link to={`/reset-password?email=${email}`} className="btn btn-primary btn-lg">
                                Enter Reset Code
                            </Link>
                        </div>
                    )}
                    <div className="auth-footer">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
