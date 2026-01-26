import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaChartLine, FaEye, FaEyeSlash, FaGoogle, FaGithub } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        location: '',
        tradingExperience: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const { fullName, username, email, phone, location, tradingExperience, password, confirmPassword } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const passwordStrength = useMemo(() => {
        if (!password) return { level: '', label: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 1) return { level: 'weak', label: 'Weak' };
        if (strength <= 2) return { level: 'fair', label: 'Fair' };
        if (strength <= 3) return { level: 'good', label: 'Good' };
        return { level: 'strong', label: 'Strong' };
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);

        try {
            await register({
                fullName,
                username,
                email,
                phone,
                location,
                tradingExperience,
                password
            });

            // Check if token was received
            if (localStorage.getItem('token')) {
                toast.success('Account created successfully!');
                navigate('/');
            } else {
                toast.success('Please check your email for verification OTP.');
                navigate(`/verify-email?email=${encodeURIComponent(email)}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container auth-container-wide">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">
                                <FaChartLine />
                            </div>
                        </div>
                        <h1 className="auth-title">Create an account</h1>
                        <p className="auth-subtitle">Join thousands of traders today.</p>
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
                        <span>or register with email</span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className="form-input"
                                value={fullName}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    className="form-input"
                                    value={username}
                                    onChange={handleChange}
                                    required
                                    minLength={3}
                                    placeholder="johndoe"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-input"
                                    value={email}
                                    onChange={handleChange}
                                    required
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className="form-input"
                                    value={phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="location">Location</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    className="form-input"
                                    value={location}
                                    onChange={handleChange}
                                    placeholder="New York, NY"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="tradingExperience">Trading Experience</label>
                            <select
                                id="tradingExperience"
                                name="tradingExperience"
                                className="form-input"
                                value={tradingExperience}
                                onChange={handleChange}
                            >
                                <option value="">Select your experience level</option>
                                <option value="beginner">Beginner - Just starting out</option>
                                <option value="intermediate">Intermediate - 1-3 years</option>
                                <option value="advanced">Advanced - 3-5 years</option>
                                <option value="expert">Expert - 5+ years</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        className="form-input"
                                        value={password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
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
                                {password && (
                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280' }}>
                                        Strength: <span style={{
                                            color: passwordStrength.level === 'weak' ? '#ef4444' :
                                                passwordStrength.level === 'fair' ? '#f59e0b' :
                                                    passwordStrength.level === 'good' ? '#10b981' : '#059669',
                                            fontWeight: '600'
                                        }}>{passwordStrength.label}</span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading || (password && confirmPassword && password !== confirmPassword)}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
