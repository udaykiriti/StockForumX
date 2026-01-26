import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaMobileAlt } from 'react-icons/fa';
import './Auth.css';

const LoginOTP = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginOTPInit, loginOTPVerify } = useAuth();
    const navigate = useNavigate();

    const handleInit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginOTPInit(email);
            setStep(2);
            toast.success('OTP sent to your email!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginOTPVerify(email, otp);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
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
                                <FaMobileAlt />
                            </div>
                        </div>
                        <h1 className="auth-title">Passwordless Login</h1>
                        <p className="auth-subtitle">
                            {step === 1 ? 'Enter your email to receive an OTP.' : 'Enter the OTP sent to your email.'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleInit} className="auth-form">
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
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="auth-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="otp">OTP Code</label>
                                <input
                                    type="text"
                                    id="otp"
                                    className="form-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? 'Verifying...' : 'Login'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-lg"
                                style={{ marginTop: '10px' }}
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>
                        </form>
                    )}
                    <div className="auth-footer">
                        <Link to="/login">Back to Password Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginOTP;
