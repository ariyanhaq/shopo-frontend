import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  X, User, Phone, ShieldAlert, HeartPulse, CheckCircle2,
  Calendar, CreditCard, ChevronRight, ChevronLeft, Dumbbell, Wallet, Loader2
} from 'lucide-react';

export default function AddMemberModal({ isOpen, onClose, onAddMember }) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);

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
    preferredTrainer: 'General Trainer',
    packageId: '',
    admissionFee: 1000,
    monthlySubscriptionFee: 1500,
    startDate: new Date().toISOString().split('T')[0],
    lockerNumber: 'L-15'
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch available packages and trainers from DB
      const loadOptions = async () => {
        try {
          const [pkgRes, trainerRes] = await Promise.all([
            api.gym.packages.list(),
            api.gym.trainers.list(),
          ]);
          if (pkgRes.data && pkgRes.data.length > 0) {
            setPackages(pkgRes.data);
            setFormData(prev => ({
              ...prev,
              packageId: pkgRes.data[0]._id,
              monthlySubscriptionFee: pkgRes.data[0].price,
              admissionFee: pkgRes.data[0].admission_fee || 1000,
            }));
          }
          if (trainerRes.data) {
            setTrainers(trainerRes.data);
          }
        } catch (err) {
          console.warn('Failed to load packages/trainers in modal:', err.message);
        }
      };
      loadOptions();
    }
  }, [isOpen]);

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
      if (field === 'packageId') {
        const selected = packages.find(p => p._id === val);
        if (selected) {
          updated.monthlySubscriptionFee = selected.price;
          updated.admissionFee = selected.admission_fee || 0;
        }
      }
      return updated;
    });
  };

  const totalUpfrontPayment = parseFloat(formData.admissionFee || 0) + parseFloat(formData.monthlySubscriptionFee || 0);

  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে সদস্যের নাম ও মোবাইল নম্বর পূরণ করুন।' : 'Please provide member full name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPkg = packages.find(p => p._id === formData.packageId);
      const res = await api.gym.members.create({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        dob: formData.dob,
        emergencyContact: formData.emergencyContact,
        nid: formData.nid,
        address: formData.address,
        medicalNotes: formData.medicalNotes,
        bloodGroup: formData.bloodGroup,
        height: formData.height,
        weight: formData.weight,
        bmi: formData.bmi,
        fitnessGoal: formData.fitnessGoal,
        trainer: formData.preferredTrainer,
        membershipPackage: selectedPkg?.name || 'Standard Monthly',
        package_id: formData.packageId || null,
        admissionFee: parseFloat(formData.admissionFee || 0),
        monthlyFee: parseFloat(formData.monthlySubscriptionFee || 0),
        paidAmount: totalUpfrontPayment,
        dueAmount: 0,
        startDate: formData.startDate,
        lockerNumber: formData.lockerNumber,
      });

      toast.success(lang === 'bn' ? 'জিম সদস্য সফলভাবে নিবন্ধিত হয়েছে!' : 'Gym member registered successfully!');
      if (onAddMember) {
        onAddMember(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to register member in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full p-6 sm:p-8 bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/80 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium">
              <Dumbbell className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">
                {lang === 'bn' ? 'নতুন জিম সদস্য নিবন্ধন' : 'Register New Athlete / Member'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn' ? `ধাপ ${step} এর ৩: তথ্য পূরণ করুন` : `Step ${step} of 3: Member details & plan`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Personal & Contact */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahmudur Rahman"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs focus:ring-2 focus:ring-[#00df89] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs focus:ring-2 focus:ring-[#00df89] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'ইমেইল' : 'Email Address'}
                </label>
                <input
                  type="email"
                  placeholder="athlete@domain.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs focus:ring-2 focus:ring-[#00df89] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'জরুরি যোগাযোগ নম্বর' : 'Emergency Contact'}
                </label>
                <input
                  type="tel"
                  placeholder="018XXXXXXXX"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs focus:ring-2 focus:ring-[#00df89] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Gender</label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => handleInputChange('gender', val)}
                >
                  <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Blood Group</label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(val) => handleInputChange('bloodGroup', val)}
                >
                  <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Locker No</label>
                <input
                  type="text"
                  placeholder="L-12"
                  value={formData.lockerNumber}
                  onChange={(e) => handleInputChange('lockerNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Body Stats & Goals */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Calculated BMI</label>
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00a86b] dark:text-[#00df89] font-medium text-xs text-center">
                  {formData.bmi || '22.5'} BMI
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Fitness Goal</label>
                <Select
                  value={formData.fitnessGoal}
                  onValueChange={(val) => handleInputChange('fitnessGoal', val)}
                >
                  <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Fitness Goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Muscle Gain & Bulking">Muscle Gain & Bulking</SelectItem>
                    <SelectItem value="Fat Loss & Shred">Fat Loss & Shred</SelectItem>
                    <SelectItem value="General Fitness & Cardio">General Fitness & Cardio</SelectItem>
                    <SelectItem value="Strength & Powerlifting">Strength & Powerlifting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Assigned Trainer</label>
                <Select
                  value={formData.preferredTrainer}
                  onValueChange={(val) => handleInputChange('preferredTrainer', val)}
                >
                  <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Select Trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Coach">General Coach</SelectItem>
                    {trainers.map((t, idx) => (
                      <SelectItem key={idx} value={t.name}>{t.name} ({t.specialization})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Medical Notes / Injuries</label>
              <input
                type="text"
                placeholder="e.g. Lower back pain, none"
                value={formData.medicalNotes}
                onChange={(e) => handleInputChange('medicalNotes', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Package & Billing */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'মেম্বারশিপ প্যাকেজ' : 'Membership Package'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {packages.map((pkg) => (
                  <div
                    key={pkg._id}
                    onClick={() => handleInputChange('packageId', pkg._id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.packageId === pkg._id
                        ? 'border-[#00df89] bg-emerald-500/5 dark:bg-[#00df89]/5'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b]/80'
                    }`}
                  >
                    <div className="flex justify-between items-center font-medium text-xs text-slate-900 dark:text-white">
                      <span>{pkg.name}</span>
                      <span className="text-[#00a86b] dark:text-[#00df89]">৳ {pkg.price}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">{pkg.duration}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Admission Fee (৳)</label>
                <input
                  type="number"
                  value={formData.admissionFee}
                  onChange={(e) => handleInputChange('admissionFee', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Subscription Fee (৳)</label>
                <input
                  type="number"
                  value={formData.monthlySubscriptionFee}
                  onChange={(e) => handleInputChange('monthlySubscriptionFee', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none font-medium"
                />
              </div>
            </div>

            {/* Total Billing Receipt Preview */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">Total Upfront Fee Collected:</div>
                <div className="text-xl font-medium text-slate-900 dark:text-white">৳ {totalUpfrontPayment.toLocaleString()}</div>
              </div>
              <Badge variant="default" className="bg-[#00df89] text-[#011812] text-xs">
                Auto-Invoiced in DB
              </Badge>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          {step > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="gap-1.5 text-xs">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium gap-1.5 text-xs">
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium gap-1.5 text-xs"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />}
              <span>{isSubmitting ? 'Saving to DB...' : 'Complete & Save Member'}</span>
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
}
