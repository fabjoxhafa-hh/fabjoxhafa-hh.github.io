import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { User } from '../types';
import { getUsers, addUser } from '../utils/storage';
import { ShieldCheck, UserCheck, Eye, EyeOff, Upload, ArrowRight, Sparkles } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
  onAdminLoginSuccess: () => void;
  darkMode: boolean;
}

const PROGRAM_OPTIONS = [
  'Software Engineering (BSc)',
  'Computer Engineering & IT (BSc)',
  'Artificial Intelligence and Data Science (BSc)',
  'Electronics Engineering (BSc)',
  'Robotics & Mechatronics Engineering (BSc)',
  'Telecommunication Engineering (BSc)',
  'Digital Marketing (BSc)',
  'Fintech and Investments (BSc)',
  'Business Analytics (BSc)',
  'International Finance and Economics (BSc)',
  'Business Administration & IT (BA)',
  'Software Engineering (MSc)',
  'Multimedia Design (MSc)',
  'Network & Cyber Security (MSc)',
  'Computer Engineering & Big Data (MSc)',
  'Business Administration (MBA)',
  'Finance and Banking (MSc)',
  'Accounting & Auditing (MSc)',
  'Digital Marketing (MSc)',
  'Business Information Technology (MSc)'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
];

export default function Auth({ onLoginSuccess, onAdminLoginSuccess, darkMode }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminForm, setIsAdminForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regProgram, setRegProgram] = useState(PROGRAM_OPTIONS[0]);
  const [regYear, setRegYear] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(PRESET_AVATARS[0]);
  
  // Admin Login fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Error/Success state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState('');
  const [etherealPreviewUrl, setEtherealPreviewUrl] = useState('');
  const [sandboxOTP, setSandboxOTP] = useState('');
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [clientLockoutUntil, setClientLockoutUntil] = useState<number>(0);
  const [clientAttempts, setClientAttempts] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (!loginEmail || !loginPassword) {
        setError('Please fill in all standard credentials.');
        setLoading(false);
        return;
      }

      const users = getUsers();
      const matched = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

      if (!matched) {
        setError('User not found. Please register an account.');
        setLoading(false);
        return;
      }

      if (matched.password !== loginPassword) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      // Option: remember email
      if (rememberMe) {
        localStorage.setItem('cit_remember_email', loginEmail);
      } else {
        localStorage.removeItem('cit_remember_email');
      }

      setLoading(false);
      onLoginSuccess(matched);
    }, 600);
  };

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    setTimeout(() => {
      if (!regName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
        setError('All credentials and information fields are required.');
        setLoading(false);
        return;
      }

      // Email validation
      if (!regEmail.endsWith('@cit.edu.al') && !regEmail.toLowerCase().includes('.edu')) {
        setError('Please enter a valid academic email address (e.g., student@cit.edu.al).');
        setLoading(false);
        return;
      }

      if (regPassword.length < 6) {
        setError('Password must contain at least 6 characters.');
        setLoading(false);
        return;
      }

      if (regPassword !== regConfirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      const users = getUsers();
      const exists = users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());

      if (exists) {
        setError('Account already exists for this academic email.');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: 'u_' + Date.now(),
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        profilePhoto: profilePhoto,
        studyProgram: regProgram,
        yearOfStudy: regYear,
        bio: 'CIT Student pursuing engineering or business excellence.',
        skills: [],
        socialLinks: {},
        joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      };

      addUser(newUser);
      setSuccess('Account created successfully! Connecting...');
      
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(newUser);
      }, 500);

    }, 800);
  };

  const handleAdminSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Name = CitCit, Password = FabjoGenti6767
      if (adminUsername === 'CitCit' && adminPassword === 'FabjoGenti6767') {
        setLoading(false);
        onAdminLoginSuccess();
      } else {
        setError('Access Denied: Invalid administrator credentials.');
        setLoading(false);
      }
    }, 700);
  };

  // Step 1: Submit email to request OTP and generate on server
  const handleRequestOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!forgotEmail.trim()) {
      setError('Please enter your academic student email.');
      return;
    }

    const now = Date.now();
    if (clientLockoutUntil > now) {
      const waitMins = Math.ceil((clientLockoutUntil - now) / 60000);
      setError(`Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in ${waitMins} minute(s).`);
      return;
    }

    setLoading(true);

    const usersList = getUsers();
    const normalizedEmail = forgotEmail.toLowerCase().trim();
    const registeredEmails = usersList.map(u => u.email.toLowerCase().trim());

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotEmail.trim(),
          registeredEmails
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || 'Failed to dispatch password recovery code.');
        return;
      }

      if (data.isDemoMode) {
        setSandboxOTP(data.otp);
        setIsSandboxMode(true);
        setSuccess(`[Dev Mode] ${data.message}`);
      } else {
        setIsSandboxMode(false);
        setSandboxOTP('');
        setSuccess('A verification code has been successfully dispatched to your registered email address.');
      }
      setForgotStep('verify');
    } catch (err) {
      setLoading(false);
      console.warn('API connection offline; falling back to dynamic static integration for GitHub Pages.', err);
      
      // Strict rule check: show error if the uncreated account tries to reset password
      const existsLocally = registeredEmails.some(email => email === normalizedEmail);
      if (!existsLocally) {
        setError('This email address is not registered on CitConnect. Please register first or verify that you typed it correctly.');
        return;
      }

      // Generate a dynamic local client OTP for static/demo modes
      const clientOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setSandboxOTP(clientOTP);
      setIsSandboxMode(true);
      setSuccess(`[GitHub Pages Demo] A simulated verification code has been dispatched. Use code ${clientOTP} to verify ownership.`);
      setForgotStep('verify');
    }
  };

  // Step 2: Submit OTP for verification
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    const now = Date.now();
    if (clientLockoutUntil > now) {
      const waitMins = Math.ceil((clientLockoutUntil - now) / 60000);
      setError(`Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in ${waitMins} minute(s).`);
      return;
    }

    setLoading(true);

    if (isSandboxMode) {
      // Local client-side simulation verification
      setTimeout(() => {
        setLoading(false);
        if (forgotCode.trim() === sandboxOTP) {
          setSuccess('Identity fully verified! Now configure a strong new password.');
          setForgotStep('reset');
          setClientAttempts(0);
        } else {
          const nextAttempts = clientAttempts + 1;
          if (nextAttempts >= 5) {
            setClientLockoutUntil(Date.now() + 5 * 60 * 1000);
            setClientAttempts(0);
            setError('Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in 5 minutes.');
          } else {
            setClientAttempts(nextAttempts);
            setError(`Incorrect security verification code. You have ${5 - nextAttempts} attempt(s) remaining.`);
          }
        }
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim(), code: forgotCode.trim() }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || 'Password recovery identity check failed.');
        return;
      }

      setSuccess('Identity fully verified! Now configure a strong new password.');
      setForgotStep('reset');
    } catch (err) {
      setLoading(false);
      console.warn('API error; falling back to client fallback validation.', err);
      setError('Error communicating with verification endpoint.');
    }
  };

  // Step 3: Complete Password reset
  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotNewPassword || !forgotConfirmNewPassword) {
      setError('Both password parameters must be supplied.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setError('The secure password must span at least 6 characters.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmNewPassword) {
      setError('Inputs do not match: please confirm identically.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Look up and update profile in storage replica
      const usersList = getUsers();
      const userIndex = usersList.findIndex(
        u => u.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim()
      );

      if (userIndex === -1) {
        setError('Save error: Target academic user went out of sync.');
        setLoading(false);
        return;
      }

      usersList[userIndex].password = forgotNewPassword;
      localStorage.setItem('cit_connect_users', JSON.stringify(usersList));

      setLoading(false);
      setSuccess('Your password has been reset successfully! Redirecting...');
      
      setTimeout(() => {
        setForgotPasswordMode(false);
        setForgotStep('request');
        setForgotEmail('');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmNewPassword('');
        setEtherealPreviewUrl('');
        setSuccess('');
      }, 2000);
    }, 600);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'cit-pattern-dark text-gray-100' : 'cit-pattern-light text-gray-800'}`}>
      <div className={`w-full max-w-lg rounded-2xl border ${darkMode ? 'bg-cit-dark-500 border-gray-800 shadow-2xl' : 'bg-white border-gray-150 shadow-xl'} overflow-hidden transition-all duration-300`}>
        
        {/* Brand Banner */}
        <div className="bg-cit-blue-500 relative p-8 text-center text-white overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Sparkles className="w-24 h-24 text-cit-red-500" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* CIT Logo Circle Representation */}
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-3">
              <span className="text-cit-blue-500 font-display font-extrabold text-xl tracking-tight">CIT</span>
              <div className="w-2 h-2 rounded-full bg-cit-red-500 ml-0.5 animate-pulse"></div>
            </div>
            
            <h1 className="font-display text-2xl font-bold tracking-tight">CitConnect</h1>
            <p className="text-cit-blue-100 text-xs mt-1">
              {isAdminForm ? 'CIT Platform Administration Portal' : 'Connecting Canadian Institute of Technology Students'}
            </p>
          </div>
          
          {/* Form Selector Tab */}
          <div className="flex h-10 mt-6 bg-cit-blue-600 rounded-lg p-1 relative z-10">
            {!isAdminForm ? (
              <>
                <button
                  type="button"
                  id="auth-tab-login"
                  onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
                  className={`flex-1 text-xs font-semibold rounded-md transition-all ${!isRegister ? 'bg-white text-cit-blue-500 shadow-md' : 'text-cit-blue-100 hover:text-white'}`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  id="auth-tab-register"
                  onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
                  className={`flex-1 text-xs font-semibold rounded-md transition-all ${isRegister ? 'bg-white text-cit-blue-500 shadow-md' : 'text-cit-blue-100 hover:text-white'}`}
                >
                  Create Account
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center text-xs font-medium text-white px-2">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-red-400" /> Admin Access Authorization
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          
          {/* Error & Success Toasts */}
          {error && (
            <div id="auth-error" className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 shrink-0"></span>
              {error}
            </div>
          )}

          {success && (
            <div id="auth-success" className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shrink-0"></span>
              {success}
            </div>
          )}

          {/* FORGOT PASSWORD MODAL/SPLIT */}
          {forgotPasswordMode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                <h3 className="font-display font-bold text-lg tracking-tight">Recover Academic Password</h3>
                <span className="text-[10px] bg-cit-blue-50 dark:bg-slate-800/50 text-cit-blue-500 dark:text-cit-blue-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Step {forgotStep === 'request' ? '1/3' : forgotStep === 'verify' ? '2/3' : '3/3'}
                </span>
              </div>

              {/* STEP 1: Enter email and submit */}
              {forgotStep === 'request' && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Input your registered CIT student email. We will generate and transmit a dynamic authentication security key to your email inbox.
                  </p>
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 align-left">Academic Student Email</label>
                    <input
                      type="email"
                      id="forgot-email"
                      required
                      placeholder="student@cit.edu.al"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      id="forgot-back-btn"
                      onClick={() => {
                        setForgotPasswordMode(false);
                        setError('');
                        setSuccess('');
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold text-center border transition ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-850' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Return to Sign In
                    </button>
                    <button
                      type="submit"
                      id="forgot-submit-btn"
                      disabled={loading}
                      className="flex-1 bg-cit-blue-500 hover:bg-cit-blue-600 text-white py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>Dispatch OTP Code <ArrowRight className="w-3.5 h-3.5 ml-1" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify Code */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Emailed dynamic OTP code sent. Enter the 6-digit numeric verification code to identify your ownership.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Verification Key Code</label>
                    <input
                      type="text"
                      id="forgot-code"
                      required
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-2.5 rounded-lg border text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      id="forgot-verify-back-btn"
                      onClick={() => {
                        setForgotStep('request');
                        setError('');
                        setSuccess('');
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold text-center border transition ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-850' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      id="forgot-verify-submit-btn"
                      disabled={loading}
                      className="flex-1 bg-cit-blue-500 hover:bg-cit-blue-600 text-white py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>Verify Security Code <ArrowRight className="w-3.5 h-3.5 ml-1" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Reset password */}
              {forgotStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    Set a new strong, secure password for your CitConnect student credential.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">New Password (Min. 6 characters)</label>
                      <input
                        type="password"
                        id="forgot-new-password"
                        required
                        placeholder="••••••••"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        id="forgot-confirm-password"
                        required
                        placeholder="••••••••"
                        value={forgotConfirmNewPassword}
                        onChange={(e) => setForgotConfirmNewPassword(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="forgot-reset-submit-btn"
                      disabled={loading}
                      className="w-full bg-cit-blue-500 hover:bg-cit-blue-600 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>Save Clean New Password</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : isAdminForm ? (
            /* ADMIN FORM */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 text-left">Admin Identity Code</label>
                <input
                  type="text"
                  id="admin-username"
                  required
                  placeholder="Enter administrator name"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-red-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 text-left">Security Password</label>
                <input
                  type="password"
                  id="admin-password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-red-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <button
                type="submit"
                id="admin-login-submit"
                disabled={loading}
                className="w-full bg-cit-red-500 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-cit-red-600 transition flex items-center justify-center disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Authenticate Admin Mode
                  </>
                )}
              </button>

              <button
                type="button"
                id="admin-exit-btn"
                onClick={() => { setIsAdminForm(false); setError(''); }}
                className="w-full text-center text-xs text-gray-400 hover:text-cit-blue-500 font-semibold"
              >
                Return to Student Portal
              </button>
            </form>
          ) : !isRegister ? (
            /* STUDENT LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 text-left">Registered CIT Email</label>
                <input
                  type="email"
                  id="login-email"
                  required
                  placeholder="student@cit.edu.al"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 text-left">Password</label>
                  <button
                    type="button"
                    id="login-forgot-btn"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-xs text-cit-red-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2">
                <label className="flex items-center text-xs text-gray-400 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 rounded border-gray-300 dark:border-gray-800 focus:ring-cit-blue-500 h-4 w-4 text-cit-blue-500"
                  />
                  Remember Me on this device
                </label>
              </div>

              <button
                type="submit"
                id="login-btn-submit"
                disabled={loading}
                className="w-full bg-cit-blue-500 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-cit-blue-600 transition flex items-center justify-center disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Sign In to Student Network <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Are you university staff?</span>
                <button
                  type="button"
                  id="login-to-admin-btn"
                  onClick={() => { setIsAdminForm(true); setError(''); }}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md hover:bg-cit-red-50 hover:text-cit-red-500 font-semibold flex items-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin Login
                </button>
              </div>
            </form>
          ) : (
            /* STUDENT REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center pb-4">
                <span className="text-xs font-semibold text-gray-400 mb-2">PICK PROFILE PHOTO</span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="relative group">
                    <img
                      src={profilePhoto}
                      alt="Selected Profile"
                      className="w-14 h-14 rounded-full border-2 border-cit-blue-500 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150"
                    >
                      <Upload className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  
                  {/* Preset pictures */}
                  <div className="flex gap-1.5">
                    {PRESET_AVATARS.map((av, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setProfilePhoto(av)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${profilePhoto === av ? 'border-cit-red-500 scale-110 shadow' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={av} alt="avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Name & Username</label>
                <input
                  type="text"
                  id="register-name"
                  required
                  placeholder="Name & Username"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">CIT Student Email</label>
                <input
                  type="email"
                  id="register-email"
                  required
                  placeholder="student@cit.edu.al"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Study Program</label>
                  <select
                    id="register-program"
                    value={regProgram}
                    onChange={(e) => setRegProgram(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  >
                    {PROGRAM_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Year of Study</label>
                  <select
                    id="register-year"
                    value={regYear}
                    onChange={(e) => setRegYear(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Senior/Junior)</option>
                    <option value={4}>Master Studies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    id="register-password"
                    required
                    placeholder="Min. 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    id="register-confirm-password"
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cit-blue-500 ${darkMode ? 'bg-cit-dark-600 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="register-btn-submit"
                disabled={loading}
                className="w-full bg-cit-blue-500 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-cit-blue-600 transition flex items-center justify-center disabled:opacity-60 pt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-1.5" /> Initialize Student Account
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
