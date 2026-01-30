import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy loading pages
const Home = lazy(() => import('./pages/Home'));
const StockList = lazy(() => import('./pages/StockList'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const LoginOTP = lazy(() => import('./pages/LoginOTP'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/error/NotFound'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Feed = lazy(() => import('./pages/Feed'));

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <Router>
                    <div className="app">
                        <Navbar />
                        <main>
                            <ErrorBoundary>
                                <Suspense fallback={<Loader />}>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/stocks" element={<StockList />} />
                                        <Route path="/stock/:symbol" element={<StockDetail />} />
                                        <Route path="/question/:id" element={<QuestionDetail />} />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/profile/:id" element={<Profile />} />
                                        <Route path="/leaderboard" element={<Leaderboard />} />
                                        <Route path="/verify-email" element={<VerifyEmail />} />
                                        <Route path="/login-otp" element={<LoginOTP />} />
                                        <Route path="/forgot-password" element={<ForgotPassword />} />
                                        <Route path="/reset-password" element={<ResetPassword />} />
                                        <Route path="/portfolio" element={<Portfolio />} />
                                        <Route path="/analytics" element={<Analytics />} />
                                        <Route path="/feed" element={<Feed />} />
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </Suspense>
                            </ErrorBoundary>
                        </main>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                className: 'brute-toast',
                                style: {
                                    borderRadius: '0',
                                    border: '3px solid #000',
                                    background: '#fff',
                                    color: '#000',
                                    padding: '16px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    fontSize: '0.9rem',
                                    boxShadow: '6px 6px 0px #000',
                                },
                                success: {
                                    style: {
                                        background: 'var(--color-success)',
                                    },
                                },
                                error: {
                                    style: {
                                        background: 'var(--color-danger)',
                                        color: '#fff',
                                    },
                                },
                                loading: {
                                    style: {
                                        background: 'var(--color-info)',
                                    },
                                },
                            }}
                        />
                    </div>
                </Router>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
