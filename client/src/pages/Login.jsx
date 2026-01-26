import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaChartLine, FaEye, FaEyeSlash, FaGoogle, FaGithub } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';

            if (msg.includes('verify your email')) {
                toast.error('Account not verified. Redirecting...');
                setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}`), 1500);
            } else {
                toast.error(msg);
            }
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
                                <FaChartLine />
                            </div>
                        </div>
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Please enter your details to sign in.</p>
                    </div>

                    <div className="social-buttons">
                        <button type="button" className="social-btn">
                            <FaGoogle /> Google
                        </button>
                        <button type="button" className="social-btn">
                            <FaGithub /> GitHub
                        </button>
                    </div>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

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

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="form-extras">
                            <div className="remember-me">
                                {/* Can add remember me checkbox here if needed */}
                            </div>
                            <Link to="/forgot-password" className="forgot-password">
                                Forgot password?
                            </Link>
                        </div>

                        <div style={{ padding: '10px 0', textAlign: 'center' }}>
                            <Link to="/login-otp" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px' }}>
                                Login with OTP (Passwordless)
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
