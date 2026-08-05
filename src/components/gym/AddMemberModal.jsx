/**
 * @file AddMemberModal.jsx
 * @description 5-step multi-step modal for registering new gym members with admission fee & monthly subscription billing.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, User, Phone, ShieldAlert, HeartPulse, CheckCircle2,
  Calendar, CreditCard, ChevronRight, ChevronLeft, Dumbbell, Wallet
} from 'lucide-react';
import { INITIAL_GYM_PACKAGES, INITIAL_GYM_TRAINERS } from '@/data/gymData';

export default function AddMemberModal({ isOpen, onClose, onAddMember }) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Male',
    dob: '1998-05-15',
    emergencyContact: '',
    nid: '',
    address: '',
    medicalNotes: '',
    bloodGroup: 'O+',
    height: '175',
    weight: '72',
    bmi: '23.5',
    fitnessGoal: 'Muscle Gain',
    preferredTrainer: 'Tanvir Ahmed',
    packageId: 'pkg-1',
    admissionFee: 1000,
    monthlySubscriptionFee: 1500,
    startDate: new Date().toISOString().split('T')[0],
    lockerNumber: 'L-15'
  });

  if (!isOpen) return null;

  const handleInputChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'height' || field === 'weight') {
        const hM = parseFloat(updated.height) / 100;
        const wKg = parseFloat(updated.weight);
        if (hM > 0 && wKg > 0) {
          updated.bmi = (wKg / (hM * hM)).toFixed(1);
        }
      }
      return updated;
    });
  };

  const selectedPackage = INITIAL_GYM_PACKAGES.find(p => p.id === formData.packageId) || INITIAL_GYM_PACKAGES[0];
  const totalUpfrontPayment = parseFloat(formData.admissionFee || 0) + parseFloat(formData.monthlySubscriptionFee || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMember = {
      id: `GM-${Math.floor(1000 + Math.random() * 9000)}`,
      ...formData,
      height: `${formData.height} cm`,
      weight: `${formData.weight} kg`,
      joiningDate: formData.startDate,
      membershipPackage: selectedPackage.name,
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      remainingDays: 30,
      lastVisit: 'Just Joined',
      attendanceCount: 0,
      paidAmount: totalUpfrontPayment,
      totalDue: 0
    };
    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans font-normal text-slate-800 dark:text-zinc-200">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#00df89]" />
              <span>{lang === 'bn' ? 'নতুন মেম্বার নিবন্ধন' : 'Register New Gym Member'}</span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Step {step} of 5 — {
                step === 1 ? 'Personal Information' :
                step === 2 ? 'Contact Details' :
                step === 3 ? 'Admission & Monthly Subscription' :
                step === 4 ? 'Health & Fitness' : 'Review & Submit'
              }
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 flex">
          <div style={{ width: `${(step / 5) * 100}%` }} className="bg-[#00df89] transition-all duration-300 h-full" />
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-normal">
          
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="e.g. Tanvir Hossain"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">National ID / Passport (Optional)</label>
                  <input
                    type="text"
                    value={formData.nid}
                    onChange={(e) => handleInputChange('nid', e.target.value)}
                    placeholder="13 or 17 digit NID"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="01700-000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="member@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Emergency Contact Person & Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="01800-112233 (Father/Spouse)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Locker Number</label>
                  <input
                    type="text"
                    value={formData.lockerNumber}
                    onChange={(e) => handleInputChange('lockerNumber', e.target.value)}
                    placeholder="e.g. L-15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Residential Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="House, Road, Area, City"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Admission Fee & Monthly Subscription */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-slate-900 dark:text-white">Monthly Subscription Billing Structure</span>
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-[#00df89] text-[10px] font-normal">
                    Joining + Monthly Plan
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  New members pay a one-time admission fee upon joining, plus their first month's subscription. Subscriptions can be renewed monthly or anytime at the end of the term.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">One-Time Admission Fee (ভর্তি ফি) ৳</label>
                  <input
                    type="number"
                    value={formData.admissionFee}
                    onChange={(e) => handleInputChange('admissionFee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Monthly Subscription Fee (মাসিক ফি) ৳</label>
                  <input
                    type="number"
                    value={formData.monthlySubscriptionFee}
                    onChange={(e) => handleInputChange('monthlySubscriptionFee', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>
              </div>

              {/* Total Upfront Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-medium text-xs text-slate-700 dark:text-zinc-300 block">Total Initial Payment Due Now</span>
                  <span className="text-[11px] text-slate-400 font-normal">Admission Fee (৳{formData.admissionFee}) + 1st Month Subscription (৳{formData.monthlySubscriptionFee})</span>
                </div>
                <div className="text-xl font-medium text-emerald-600 dark:text-[#00df89]">
                  ৳ {totalUpfrontPayment.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Subscription Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Assigned Personal Trainer</label>
                  <select
                    value={formData.preferredTrainer}
                    onChange={(e) => handleInputChange('preferredTrainer', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    {INITIAL_GYM_TRAINERS.map((t) => (
                      <option key={t.id} value={t.name}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Health & Fitness */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Calculated BMI</label>
                  <input
                    type="text"
                    disabled
                    value={formData.bmi}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-200/60 dark:bg-zinc-800 font-medium text-sm text-emerald-600 dark:text-[#00df89]"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Primary Fitness Goal</label>
                <select
                  value={formData.fitnessGoal}
                  onChange={(e) => handleInputChange('fitnessGoal', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                >
                  <option value="Muscle Gain">Muscle Gain & Strength</option>
                  <option value="Weight Loss">Weight Loss & Fat Reduction</option>
                  <option value="General Fitness">General Cardio & Stamina</option>
                  <option value="Bodybuilding">Competitive Bodybuilding</option>
                  <option value="Rehabilitation">Rehabilitation & Flexibility</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Medical Notes & Allergies</label>
                <textarea
                  rows={2}
                  value={formData.medicalNotes}
                  onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                  placeholder="Mention joint issues, asthma, back pain, or surgery history..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div>
                  <h3 className="font-medium text-base text-slate-900 dark:text-white">{formData.fullName || 'Member Name'}</h3>
                  <p className="text-xs text-slate-500 font-normal">{formData.phone} • {formData.email || 'No email'}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-xs font-normal">
                  <div><span className="text-slate-400 block">One-Time Admission Fee:</span> <span className="font-medium text-slate-900 dark:text-white">৳ {formData.admissionFee}</span></div>
                  <div><span className="text-slate-400 block">Monthly Subscription:</span> <span className="font-medium text-[#00df89]">৳ {formData.monthlySubscriptionFee} / mo</span></div>
                  <div><span className="text-slate-400 block">Total Due Upfront:</span> <span className="font-medium text-emerald-600 dark:text-[#00df89]">৳ {totalUpfrontPayment}</span></div>
                  <div><span className="text-slate-400 block">Assigned Trainer:</span> <span className="font-medium text-slate-800 dark:text-zinc-200">{formData.preferredTrainer}</span></div>
                  <div><span className="text-slate-400 block">Locker Number:</span> <span className="font-medium text-slate-800 dark:text-zinc-200">{formData.lockerNumber}</span></div>
                  <div><span className="text-slate-400 block">Start Date:</span> <span className="font-medium text-slate-800 dark:text-zinc-200">{formData.startDate}</span></div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5 text-xs font-medium">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          ) : <div />}

          {step < 5 ? (
            <Button
              onClick={() => {
                if (step === 1 && !formData.fullName) return alert('Please enter member name');
                if (step === 2 && !formData.phone) return alert('Please enter phone number');
                setStep(s => s + 1);
              }}
              className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs gap-1.5"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Complete Registration & Issue Memo
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
