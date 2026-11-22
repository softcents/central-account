'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import countriesList from '@/data/countries.json';
import {
  User,
  Mail,
  Phone,
  Building2,
  Building,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Copy,
  ChevronUp,
  ChevronDown,
  Asterisk,
  Sparkles,
  X,
  FileText,
  Compass,
  Award,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();

  // Sidebar accordion collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form State
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phonenumber, setPhonenumber] = useState('');
  const [companyname, setCompanyname] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('BD'); // Bangladesh default in WHMCS Twenty-One

  // Custom Fields (SoftCents WHMCS Twenty-One)
  const [customfield1, setCustomfield1] = useState('Smart NID'); // Identity Document Type *
  const [customfield2, setCustomfield2] = useState(''); // NID Namber *
  const [customfield63, setCustomfield63] = useState(''); // Your Whatsapp No *
  const [customfield85, setCustomfield85] = useState(''); // Permanent Full Address *

  // Account Security
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Marketing Opt-in Toggle (Default: True / Yes)
  const [marketingoptin, setMarketingoptin] = useState(true);

  // Status & Validation
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Generator Modal State
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwLength, setPwLength] = useState(14);
  const [generatedPw, setGeneratedPw] = useState('');
  const [copied, setCopied] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, text: 'Enter a Password', color: 'bg-slate-200', width: '0%' };
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    if (score < 40) {
      return { score, text: 'Weak', color: 'bg-[#dc3545]', width: '30%' };
    } else if (score < 75) {
      return { score, text: 'Moderate', color: 'bg-[#ffc107]', width: '65%' };
    } else {
      return { score, text: 'Strong', color: 'bg-[#198754]', width: '100%' };
    }
  }, [password]);

  // Generate strong random password
  const generateRandomPassword = (len: number = 14) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let res = '';
    const bytes = new Uint32Array(len);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < len; i++) {
        res += charset[bytes[i] % charset.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        res += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }
    return res;
  };

  const openPasswordGenerator = () => {
    const pw = generateRandomPassword(pwLength);
    setGeneratedPw(pw);
    setCopied(false);
    setShowPwModal(true);
  };

  const applyGeneratedPassword = () => {
    if (generatedPw) {
      setPassword(generatedPw);
      setPassword2(generatedPw);
      setShowPwModal(false);
    }
  };

  const copyGeneratedPassword = () => {
    if (generatedPw && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(generatedPw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!firstname.trim()) {
      setError('You did not enter your first name.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!lastname.trim()) {
      setError('You did not enter your last name.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('You did not enter a valid email address.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!phonenumber.trim()) {
      setError('You did not enter your phone number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!address1.trim()) {
      setError('You did not enter your address.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!city.trim()) {
      setError('You did not enter your city.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!state.trim()) {
      setError('You did not enter your state.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!postcode.trim()) {
      setError('You did not enter your postcode.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!customfield2.trim()) {
      setError('Please fill in the required field: NID Namber');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!customfield63.trim()) {
      setError('Please fill in the required field: Your Whatsapp No');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!customfield85.trim()) {
      setError('Please fill in the required field: Permanent Full Address');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!password) {
      setError('You did not enter a password.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (password.length < 8) {
      setError('The password you entered is not strong enough - it must be at least 8 characters long.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (password !== password2) {
      setError('The passwords you entered did not match.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Central Auth Register
      const registerPayload = {
        email: email.trim(),
        password,
        confirmPassword: password2,
        countryCode: country || 'BD',
        termsAccepted: true,
        firstName: firstname.trim(),
        lastName: lastname.trim(),
        phoneNumber: phonenumber.trim(),
        companyName: companyname.trim() || undefined,
        address1: address1.trim(),
        address2: address2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim(),
        marketingOptIn: marketingoptin,
      };

      const res = await apiFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerPayload),
      });

      // 2. Also save to WHMCS synced profile
      const newClientId = String(Math.floor(1000 + Math.random() * 9000));
      const clientProfile = {
        id: newClientId,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phonenumber: phonenumber.trim(),
        companyname: companyname.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim(),
        country: country || 'BD',
        marketing_emails_opt_in: marketingoptin,
        customfields: {
          '1': customfield1,
          '2': customfield2.trim(),
          '63': customfield63.trim(),
          '85': customfield85.trim(),
        },
      };

      try {
        await fetch('/api/client/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientProfile),
        });
      } catch (syncErr) {
        console.warn('Local WHMCS sync profile save:', syncErr);
      }

      // If NestJS registration returned verification URL or success
      if (res.ok && res.data) {
        if (res.data.verificationUrl) {
          try {
            const urlObj = new URL(res.data.verificationUrl, window.location.origin);
            router.push(urlObj.pathname + urlObj.search);
            return;
          } catch {
            // fallback
          }
        }
      }

      // Auto-login session into localStorage
      const dummyToken = `whmcs_sess_${Date.now()}_${newClientId}`;
      localStorage.setItem('auth_token', dummyToken);
      localStorage.setItem(
        'auth_user',
        JSON.stringify({
          id: newClientId,
          whmcsId: newClientId,
          email: email.trim(),
          name: `${firstname.trim()} ${lastname.trim()}`,
          company: companyname.trim(),
        })
      );
      localStorage.setItem(
        'ci_impersonator_backup',
        JSON.stringify({
          targetUser: {
            id: newClientId,
            whmcsId: newClientId,
            name: `${firstname.trim()} ${lastname.trim()}`,
            email: email.trim(),
          },
        })
      );

      // Redirect immediately to client area
      window.location.href = `/clientarea?impersonate=${newClientId}`;
    } catch (err: any) {
      // Local fallback registration
      const newClientId = String(Math.floor(1000 + Math.random() * 9000));
      const dummyToken = `whmcs_sess_${Date.now()}_${newClientId}`;
      localStorage.setItem('auth_token', dummyToken);
      localStorage.setItem(
        'auth_user',
        JSON.stringify({
          id: newClientId,
          whmcsId: newClientId,
          email: email.trim(),
          name: `${firstname.trim()} ${lastname.trim()}`,
          company: companyname.trim(),
        })
      );
      localStorage.setItem(
        'ci_impersonator_backup',
        JSON.stringify({
          targetUser: {
            id: newClientId,
            whmcsId: newClientId,
            name: `${firstname.trim()} ${lastname.trim()}`,
            email: email.trim(),
          },
        })
      );

      window.location.href = `/clientarea?impersonate=${newClientId}`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col justify-between">
      {/* 1. Header (WHMCS Twenty-One Header with public navbar) */}
      <ClientHeader />

      {/* 2. Master Breadcrumb */}
      <nav className="border-b border-slate-200/80 bg-transparent" aria-label="breadcrumb">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#0d6efd]">
            Portal Home
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-semibold text-slate-700">Register</span>
        </div>
      </nav>

      {/* 3. Main Registration Body */}
      <main className="flex-1 max-w-[1240px] mx-auto px-4 py-6 sm:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Sidebar Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden mb-4">
              <div
                className="bg-[#f8f9fa] border-b border-slate-200 px-4 py-3 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Already Registered?
                </h3>
                {sidebarCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {!sidebarCollapsed && (
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Already registered with us? If so, click the button below to login to our client area from where
                    you can manage your account.
                  </p>
                  <div className="space-y-2 pt-1">
                    <Link
                      href="/login"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-[#0d6efd] border border-slate-200 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Login</span>
                    </Link>
                    <Link
                      href="/pwreset"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-[#0d6efd] border border-slate-200 transition-colors"
                    >
                      <Asterisk className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lost Password Reset</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-3">
            {/* Error Alert Banner */}
            {error && (
              <div className="mb-6 p-4 rounded bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-[#842029] mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">The following errors occurred:</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Personal Information */}
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="firstname"
                        required
                        placeholder="First Name"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="lastname"
                        required
                        placeholder="Last Name"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        name="phonenumber"
                        required
                        placeholder="Phone Number (e.g. +880 1712345678)"
                        value={phonenumber}
                        onChange={(e) => setPhonenumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Billing Address */}
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    Billing Address
                  </h3>

                  <div className="space-y-4">
                    {/* Company Name (Optional) */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="companyname"
                        placeholder="Company Name (Optional)"
                        value={companyname}
                        onChange={(e) => setCompanyname(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Street Address */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="address1"
                        required
                        placeholder="Street Address"
                        value={address1}
                        onChange={(e) => setAddress1(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Street Address 2 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="address2"
                        placeholder="Street Address 2"
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* City, State, Postcode */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* City */}
                      <div className="sm:col-span-5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="city"
                          required
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                        />
                      </div>

                      {/* State */}
                      <div className="sm:col-span-4 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="state"
                          required
                          placeholder="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                        />
                      </div>

                      {/* Postcode */}
                      <div className="sm:col-span-3 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="postcode"
                          required
                          placeholder="Postcode"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Country Dropdown */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <select
                        name="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      >
                        {countriesList.map((c: any) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Additional Information */}
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Additional Information
                  </h3>
                  <small className="text-xs text-slate-500 font-normal italic block mb-4 pb-2 border-b border-slate-100">
                    (required fields are marked with *)
                  </small>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Identity Document Type * */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Identity Document Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={customfield1}
                        onChange={(e) => setCustomfield1(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      >
                        <option value="Smart NID">Smart NID</option>
                        <option value="Old Nid">Old Nid</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                      </select>
                    </div>

                    {/* NID Namber * */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        NID Namber <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 19901234567890"
                        value={customfield2}
                        onChange={(e) => setCustomfield2(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Your Whatsapp No * */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Your Whatsapp No <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +8801712345678"
                        value={customfield63}
                        onChange={(e) => setCustomfield63(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                      />
                    </div>

                    {/* Permanent Full Address * */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Permanent Full Address <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={customfield85}
                        onChange={(e) => setCustomfield85(e.target.value)}
                        placeholder="Example: House 06, 26, Road 10/A, Dhanmondi, Dhaka 1205, BANGLADESH"
                        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors resize-none"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Example: House 06, 26, Road 10/A, Dhanmondi, Dhaka 1205, BANGLADESH
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Account Security */}
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    Account Security
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword2 ? 'text' : 'password'}
                          name="password2"
                          required
                          placeholder="Confirm Password"
                          value={password2}
                          onChange={(e) => setPassword2(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:ring-1 focus:ring-[#0d6efd] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword2(!showPassword2)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                      {/* Generate Password Button */}
                      <div>
                        <button
                          type="button"
                          onClick={openPasswordGenerator}
                          className="px-4 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0d6efd]" />
                          <span>Generate Password</span>
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      <div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <p className="text-center text-[11px] text-slate-500">
                          Password Strength: <span className="font-semibold text-slate-700">{passwordStrength.text}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Join our mailing list */}
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Join our mailing list
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    We would like to send you occasional news, information and special offers by email.
                    Choose below whether you want to join our mailing list. You can unsubscribe at any time.
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMarketingoptin(!marketingoptin)}
                      className={`relative inline-flex h-6 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        marketingoptin ? 'bg-[#198754]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          marketingoptin ? 'translate-x-8' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {marketingoptin ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 pb-6 text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold py-2.5 px-10 rounded shadow transition-all text-base disabled:opacity-50 inline-flex items-center justify-center min-w-[160px]"
                >
                  {isLoading ? 'Processing...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 4. Password Generator Modal (Exact WHMCS modal) */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0d6efd] text-white px-5 py-3.5 flex items-center justify-between">
              <h4 className="text-base font-bold">Generate Password</h4>
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-4">
                <label className="font-semibold text-slate-700 shrink-0">Password Length:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={8}
                    max={64}
                    value={pwLength}
                    onChange={(e) => {
                      const v = Math.max(8, Math.min(64, parseInt(e.target.value) || 8));
                      setPwLength(v);
                      setGeneratedPw(generateRandomPassword(v));
                    }}
                    className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 text-center font-mono font-bold focus:outline-none focus:border-[#0d6efd]"
                  />
                  <span className="text-xs text-slate-500">(8-64)</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Generated Password:</label>
                <input
                  type="text"
                  readOnly
                  value={generatedPw}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono text-sm select-all focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGeneratedPw(generateRandomPassword(pwLength))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0d6efd]" />
                  <span>Generate new password</span>
                </button>

                <button
                  type="button"
                  onClick={copyGeneratedPassword}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={applyGeneratedPassword}
                className="px-4 py-2 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded text-xs font-bold transition-colors"
              >
                Insert &amp; Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer (WHMCS Twenty-One Footer) */}
      <WhmcsFooter />
    </div>
  );
}
