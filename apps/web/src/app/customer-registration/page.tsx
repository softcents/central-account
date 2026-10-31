'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  Building2,
  User,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  MapPin,
  Users,
  PhoneCall,
  FileCheck2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type CustomerType = 'INDIVIDUAL' | 'COMPANY';

type CompanyPosition =
  | 'OWNER'
  | 'MANAGING_DIRECTOR'
  | 'CHAIRMAN'
  | 'DIRECTOR'
  | 'CEO'
  | 'MANAGER'
  | 'AUTHORIZED_REPRESENTATIVE'
  | 'OTHER';

type Gender = 'MALE' | 'FEMALE';

const COMPANY_POSITIONS: { value: CompanyPosition; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'MANAGING_DIRECTOR', label: 'Managing Director' },
  { value: 'CHAIRMAN', label: 'Chairman' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'CEO', label: 'CEO' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'AUTHORIZED_REPRESENTATIVE', label: 'Authorized Representative' },
  { value: 'OTHER', label: 'Other' },
];

const COMMON_COUNTRIES = [
  'Bangladesh',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates',
  'India',
  'Malaysia',
  'Saudi Arabia',
];

export default function CustomerRegistrationPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, updateCustomerRegistration } = useAuth();

  // Loading & submit states
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');

  // II. Company Information
  const [companyName, setCompanyName] = useState('');
  const [authorizedPersonName, setAuthorizedPersonName] = useState('');
  const [companyPosition, setCompanyPosition] = useState<CompanyPosition>('DIRECTOR');

  // III. Personal Information
  const [fullName, setFullName] = useState('');
  const [nidPassportNumber, setNidPassportNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');

  // IV. Present Address
  const [presentStreet, setPresentStreet] = useState('');
  const [presentCity, setPresentCity] = useState('');
  const [presentPostalCode, setPresentPostalCode] = useState('');
  const [presentCountry, setPresentCountry] = useState('Bangladesh');

  // V. Permanent Address
  const [sameAsPresentAddress, setSameAsPresentAddress] = useState(false);
  const [permanentStreet, setPermanentStreet] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentPostalCode, setPermanentPostalCode] = useState('');
  const [permanentCountry, setPermanentCountry] = useState('Bangladesh');

  // VI. Family Information
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  // VII. Contact Information
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // VIII. KYC Declaration
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  // Sync Permanent Address when "Same as Present Address" is checked
  useEffect(() => {
    if (sameAsPresentAddress) {
      setPermanentStreet(presentStreet);
      setPermanentCity(presentCity);
      setPermanentPostalCode(presentPostalCode);
      setPermanentCountry(presentCountry);
    }
  }, [sameAsPresentAddress, presentStreet, presentCity, presentPostalCode, presentCountry]);

  // Keep contact info in sync with personal info if user hasn't explicitly diverged
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (!contactPhone || contactPhone === phoneNumber) {
      setContactPhone(val);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!contactEmail || contactEmail === email) {
      setContactEmail(val);
    }
  };

  // Fetch pre-existing registration or default user data
  useEffect(() => {
    async function loadRegistrationData() {
      if (!token) {
        setIsFetchingData(false);
        return;
      }

      try {
        const res = await apiFetch<any>('/users/me/customer-registration', {}, token);
        if (res.ok && res.data) {
          const { isCompleted, email: userEmail, defaultPhone, defaultName, defaultCountry, data } =
            res.data;

          if (data) {
            setCustomerType(data.customer_type || 'INDIVIDUAL');
            setCompanyName(data.company_name || '');
            setAuthorizedPersonName(data.authorized_person_name || '');
            setCompanyPosition(data.company_position || 'DIRECTOR');
            setFullName(data.full_name || '');
            setNidPassportNumber(data.nid_passport_number || '');
            setPhoneNumber(data.phone_number || '');
            setEmail(data.email || userEmail || '');
            if (data.date_of_birth) {
              const d = new Date(data.date_of_birth);
              if (!isNaN(d.getTime())) {
                setDateOfBirth(d.toISOString().split('T')[0]);
              }
            }
            setGender(data.gender || 'MALE');
            setPresentStreet(data.present_street || '');
            setPresentCity(data.present_city || '');
            setPresentPostalCode(data.present_postal_code || '');
            setPresentCountry(data.present_country || 'Bangladesh');

            setSameAsPresentAddress(data.same_as_present_address || false);
            setPermanentStreet(data.permanent_street || '');
            setPermanentCity(data.permanent_city || '');
            setPermanentPostalCode(data.permanent_postal_code || '');
            setPermanentCountry(data.permanent_country || 'Bangladesh');

            setFatherName(data.father_name || '');
            setMotherName(data.mother_name || '');
            setContactPhone(data.contact_phone || '');
            setContactEmail(data.contact_email || userEmail || '');
            setDeclarationConfirmed(data.declaration_confirmed || false);

            if (isCompleted) {
              setIsSuccess(true);
            }
          } else {
            // Pre-fill with available default user info
            if (userEmail) {
              setEmail(userEmail);
              setContactEmail(userEmail);
            }
            if (defaultPhone) {
              setPhoneNumber(defaultPhone);
              setContactPhone(defaultPhone);
            }
            if (defaultName) {
              setFullName(defaultName);
            }
            if (defaultCountry) {
              const match = COMMON_COUNTRIES.find((c) =>
                c.toLowerCase().includes(defaultCountry.toLowerCase()),
              );
              if (match) {
                setPresentCountry(match);
                setPermanentCountry(match);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load customer registration:', err);
      } finally {
        setIsFetchingData(false);
      }
    }

    if (!authLoading) {
      loadRegistrationData();
    }
  }, [token, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError('Your session has expired. Please sign in to continue.');
      return;
    }

    // Validation
    if (!declarationConfirmed) {
      setFormError(
        'You must tick the declaration confirmation checkbox before submitting this form.',
      );
      return;
    }

    if (customerType === 'COMPANY') {
      if (!companyName.trim()) {
        setFormError('Company Name is required for company customer registration.');
        return;
      }
      if (!authorizedPersonName.trim()) {
        setFormError('Authorized Person Name is required for company customer registration.');
        return;
      }
    }

    if (!fullName.trim()) {
      setFormError('Full Name is required and must match your NID/Passport exactly.');
      return;
    }

    if (!nidPassportNumber.trim()) {
      setFormError('National ID / Passport Number is required.');
      return;
    }

    if (!dateOfBirth) {
      setFormError('Valid Date of Birth is required.');
      return;
    }

    if (!fatherName.trim() || !motherName.trim()) {
      setFormError("Both Father's Name and Mother's Name are mandatory.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customerType,
      companyName: customerType === 'COMPANY' ? companyName.trim() : undefined,
      authorizedPersonName: customerType === 'COMPANY' ? authorizedPersonName.trim() : undefined,
      companyPosition: customerType === 'COMPANY' ? companyPosition : undefined,
      fullName: fullName.trim(),
      nidPassportNumber: nidPassportNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      gender,
      presentStreet: presentStreet.trim(),
      presentCity: presentCity.trim(),
      presentPostalCode: presentPostalCode.trim(),
      presentCountry: presentCountry.trim(),
      sameAsPresentAddress,
      permanentStreet: (sameAsPresentAddress ? presentStreet : permanentStreet).trim(),
      permanentCity: (sameAsPresentAddress ? presentCity : permanentCity).trim(),
      permanentPostalCode: (sameAsPresentAddress ? presentPostalCode : permanentPostalCode).trim(),
      permanentCountry: (sameAsPresentAddress ? presentCountry : permanentCountry).trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      declarationConfirmed: true,
    };

    try {
      const res = await apiFetch<any>(
        '/users/me/customer-registration',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        token,
      );

      if (!res.ok) {
        const errorMsg =
          res.data?.message ||
          (Array.isArray(res.data?.errors) ? res.data.errors[0] : 'Failed to save customer registration');
        setFormError(errorMsg);
      } else {
        updateCustomerRegistration(res.data.customerRegistration);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setFormError('Could not contact identity server. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isFetchingData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium">Loading KYC & Customer Registration record...</span>
      </div>
    );
  }

  // Not signed in state
  if (!user && !token) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Authentication Required</h2>
          <p className="text-xs text-slate-400 mt-2">
            Please log in to your verified Central Account account to complete your mandatory customer
            registration.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12 relative">
        <div className="max-w-xl w-full">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-800/50 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Record Successfully Registered & Verified</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Customer Registration Completed!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your personal and customer information has been securely stored in Central Account.
                Your user registration is now fully completed.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">Customer Type:</span>
                <span className="font-semibold text-white uppercase">{customerType}</span>
              </div>
              {customerType === 'COMPANY' && companyName && (
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 font-medium">Company Name:</span>
                  <span className="font-semibold text-white">{companyName}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">Full Name:</span>
                <span className="font-semibold text-white">{fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">NID / Passport:</span>
                <span className="font-mono text-slate-200">{nidPassportNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">Registered Email:</span>
                <span className="text-slate-200">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Primary Contact Phone:</span>
                <span className="text-slate-200">{contactPhone || phoneNumber}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/identity"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <span>Proceed to Biometric KYC</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Edit Form Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
      {/* Top Header Card */}
      <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl relative overflow-hidden shadow-xl shadow-black/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Mandatory Registration Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            KYC & Customer Registration Form
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Please fill out all mandatory customer and personal details below. This step is
            strictly required to finalize your registration and activate platform privileges.
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Registration Stage
          </span>
          <span className="text-sm font-bold text-indigo-400 mt-0.5">Step 2 of 2: KYC Details</span>
          <span className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Email Verified</span>
          </span>
        </div>
      </div>

      {formError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-start space-x-3 shadow-lg shadow-rose-950/20">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-200 text-sm">Submission Incomplete</h4>
            <p className="mt-0.5 leading-relaxed">{formError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* I. CUSTOMER TYPE */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">I</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Customer Type</h2>
              <p className="text-xs text-slate-400">Select whether you are registering as an Individual or a Company</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Option */}
            <label
              className={`relative flex items-center space-x-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                customerType === 'INDIVIDUAL'
                  ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="customerType"
                value="INDIVIDUAL"
                checked={customerType === 'INDIVIDUAL'}
                onChange={() => setCustomerType('INDIVIDUAL')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Individual</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Personal identity for individuals and independent customers
                </span>
              </div>
            </label>

            {/* Company Option */}
            <label
              className={`relative flex items-center space-x-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                customerType === 'COMPANY'
                  ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="customerType"
                value="COMPANY"
                checked={customerType === 'COMPANY'}
                onChange={() => setCustomerType('COMPANY')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-white">Company</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Corporate entity, enterprise organization or registered business
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* II. COMPANY INFORMATION (Only for Company Customers) */}
        {customerType === 'COMPANY' && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-violet-500/30 backdrop-blur-xl shadow-lg space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <span className="text-sm font-bold">II</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Company Information</h2>
                  <p className="text-xs text-violet-300">Only for Company Customers</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-[10px] font-semibold uppercase tracking-wider">
                Corporate Entity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required={customerType === 'COMPANY'}
                  placeholder="e.g. Acme Innovations Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Authorized Person Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required={customerType === 'COMPANY'}
                  placeholder="e.g. John Doe"
                  value={authorizedPersonName}
                  onChange={(e) => setAuthorizedPersonName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Company Position <span className="text-rose-400">*</span>
                </label>
                <select
                  value={companyPosition}
                  onChange={(e) => setCompanyPosition(e.target.value as CompanyPosition)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                >
                  {COMPANY_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value} className="bg-slate-900 text-white">
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* III. PERSONAL INFORMATION */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">III</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Personal Information</h2>
              <p className="text-xs text-slate-400">
                Official applicant identity matching government identification
              </p>
            </div>
          </div>

          {/* Section III Mandatory Requirement Note */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start space-x-3 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Identity Matching Note:</strong> Full Name, Birth Date, Gender, NID/Passport Number,
              Father&apos;s Name and Mother&apos;s Name must exactly match the submitted National ID or Passport.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full Name as shown on NID / Passport"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                National ID Number / Passport Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1990123456789 or A01234567"
                value={nidPassportNumber}
                onChange={(e) => setNidPassportNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +880 1712-345678"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Birth Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Gender <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={gender === 'MALE'}
                    onChange={() => setGender('MALE')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                  <span className="text-xs text-slate-200 font-medium">Male</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={gender === 'FEMALE'}
                    onChange={() => setGender('FEMALE')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                  <span className="text-xs text-slate-200 font-medium">Female</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* IV. PRESENT ADDRESS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">IV</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Present Address</h2>
              <p className="text-xs text-slate-400">Current residential address</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Street / Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="House, Road, Apartment, Village/Area"
                value={presentStreet}
                onChange={(e) => setPresentStreet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="City / District"
                value={presentCity}
                onChange={(e) => setPresentCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Postal / ZIP Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1205"
                value={presentPostalCode}
                onChange={(e) => setPresentPostalCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Country <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Country Name (e.g. Bangladesh)"
                value={presentCountry}
                onChange={(e) => setPresentCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* V. PERMANENT ADDRESS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <span className="text-sm font-bold">V</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Permanent Address</h2>
                <p className="text-xs text-slate-400">Official permanent or registered domicile address</p>
              </div>
            </div>

            {/* Same as Present Address Checkbox */}
            <label className="inline-flex items-center space-x-2.5 p-2 px-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 cursor-pointer select-none transition-all hover:bg-indigo-900/30">
              <input
                type="checkbox"
                checked={sameAsPresentAddress}
                onChange={(e) => setSameAsPresentAddress(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <span className="text-xs font-semibold text-indigo-300">Same as Present Address</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            When Same as Present Address is selected, all Present Address information will automatically
            be copied to the Permanent Address.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Street / Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={sameAsPresentAddress}
                placeholder="House, Road, Apartment, Village/Area"
                value={permanentStreet}
                onChange={(e) => setPermanentStreet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={sameAsPresentAddress}
                placeholder="City / District"
                value={permanentCity}
                onChange={(e) => setPermanentCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Postal / ZIP Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={sameAsPresentAddress}
                placeholder="e.g. 1205"
                value={permanentPostalCode}
                onChange={(e) => setPermanentPostalCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Country <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={sameAsPresentAddress}
                placeholder="Country Name (e.g. Bangladesh)"
                value={permanentCountry}
                onChange={(e) => setPermanentCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* VI. FAMILY INFORMATION */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">VI</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Family Information</h2>
              <p className="text-xs text-slate-400">Parents&apos; details matching your official records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Father&apos;s Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Father's Full Name (matching NID/Passport)"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mother&apos;s Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Mother's Full Name (matching NID/Passport)"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* VII. CONTACT INFORMATION */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-lg space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="text-sm font-bold">VII</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Contact Information</h2>
              <p className="text-xs text-slate-400">Direct points of contact for official correspondence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +880 1712-345678"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="contact@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* VIII. KYC VERIFICATION & DECLARATION */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span className="text-sm font-bold">VIII</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                KYC Verification &amp; Declaration
              </h2>
              <p className="text-xs text-amber-300/80">Compliance acknowledgement and confirmation</p>
            </div>
          </div>

          {/* Important Notice Callout Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Important Notice</span>
            </div>
            <p className="leading-relaxed">
              All information provided in this form must be true, accurate, complete, and consistent
              with the applicant&apos;s valid National ID (NID) or Passport.
            </p>
            <div className="pt-1">
              <p className="font-semibold text-slate-200 mb-1.5">
                The following information must match the submitted identification document exactly:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 font-medium">
                <li>Full Name</li>
                <li>Date of Birth</li>
                <li>Gender</li>
                <li>National ID / Passport Number</li>
                <li>Father&apos;s Name</li>
                <li>Mother&apos;s Name</li>
              </ul>
            </div>
            <p className="text-slate-400 text-[11px] pt-1 leading-relaxed">
              Any incorrect, incomplete, or mismatched information may require additional verification or
              correction before the application is approved.
            </p>
          </div>

          {/* Mandatory Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-colors">
            <label className="flex items-start space-x-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={declarationConfirmed}
                onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900 cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                I confirm that all information provided in this form is true, accurate, complete, and
                matches my valid National ID/Passport.
              </span>
            </label>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              Submission triggers secure ledger recording in the Central Account database.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !declarationConfirmed}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Registration Record...</span>
                </>
              ) : (
                <>
                  <span>Save Record &amp; Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
