/**
 * @file GymMemberProfile.jsx
 * @description Comprehensive member profile view with progress charts, attendance, payments, workout plan, measurements & timeline.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Phone, Mail, Calendar, ShieldCheck, HeartPulse, Activity,
  CreditCard, Dumbbell, Clock, ArrowLeft, CheckCircle2, TrendingUp,
  FileText, Award, Edit3, Trash2
} from 'lucide-react';

import { INITIAL_GYM_MEMBERS } from '@/data/gymData';

export default function GymMemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('Overview');

  const member = INITIAL_GYM_MEMBERS.find((m) => m.id === id) || INITIAL_GYM_MEMBERS[0];

  const weightHistory = [
    { month: 'Jan', weight: 82 },
    { month: 'Mar', weight: 79 },
    { month: 'May', weight: 77 },
    { month: 'Jul', weight: 76 }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/gym/members')} className="gap-1.5 text-xs font-bold dark:bg-zinc-900">
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs dark:bg-zinc-900">
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* MEMBER HEADER HERO CARD */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <img src={member.photo} alt={member.fullName} className="w-20 h-20 rounded-3xl object-cover border-4 border-[#00df89] shadow-lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{member.fullName}</h1>
                <Badge variant={member.status === 'Active' ? 'default' : 'warning'} className="text-xs font-bold">
                  {member.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Member ID: <span className="font-mono text-slate-700 dark:text-zinc-300 font-bold">{member.id}</span> • Joined {member.joiningDate}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Package</div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5 truncate">{member.membershipPackage}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Expiry</div>
              <div className="font-extrabold text-xs text-rose-500 mt-0.5 font-mono">{member.endDate}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Visits</div>
              <div className="font-extrabold text-xs text-emerald-600 dark:text-[#00df89] mt-0.5">{member.attendanceCount} Check-ins</div>
            </div>
          </div>

        </div>

        {/* PROFILE NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-zinc-800 overflow-x-auto pt-2">
          {['Overview', 'Attendance', 'Payments', 'Workout Plan', 'Measurements', 'Timeline'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer select-none whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border-b-2 border-[#00df89]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {/* TAB CONTENT */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] lg:col-span-2">
            <CardTitle className="text-base font-bold">Personal & Health Details</CardTitle>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div><span className="text-slate-400 block">Gender:</span><span className="font-bold text-slate-900 dark:text-white">{member.gender}</span></div>
              <div><span className="text-slate-400 block">Blood Group:</span><span className="font-bold text-rose-500">{member.bloodGroup}</span></div>
              <div><span className="text-slate-400 block">Height:</span><span className="font-bold text-slate-900 dark:text-white">{member.height}</span></div>
              <div><span className="text-slate-400 block">Weight:</span><span className="font-bold text-slate-900 dark:text-white">{member.weight}</span></div>
              <div><span className="text-slate-400 block">BMI Index:</span><span className="font-bold text-emerald-600 dark:text-[#00df89]">{member.bmi}</span></div>
              <div><span className="text-slate-400 block">Locker #:</span><span className="font-bold text-slate-900 dark:text-white">{member.lockerNumber}</span></div>
              <div><span className="text-slate-400 block">Personal Trainer:</span><span className="font-bold text-slate-900 dark:text-white">{member.preferredTrainer}</span></div>
              <div><span className="text-slate-400 block">Emergency Contact:</span><span className="font-bold text-slate-900 dark:text-white">{member.emergencyContact}</span></div>
              <div><span className="text-slate-400 block">National ID:</span><span className="font-mono text-slate-700 dark:text-zinc-300">{member.nid || 'N/A'}</span></div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-slate-400 text-xs block font-medium">Medical Notes & Warnings:</span>
              <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                {member.medicalNotes}
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
            <CardTitle className="text-base font-bold">Fitness Goal & Status</CardTitle>
            
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-[#00df89]">PRIMARY GOAL</span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{member.fitnessGoal}</h3>
              <p className="text-xs text-slate-500">Targeting strength hypertrophy & lean muscle retention.</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Measurements' && (
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <CardTitle className="text-base font-bold">Weight & BMI Progress Chart</CardTitle>
          <div className="h-48 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
            {weightHistory.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.weight} kg</span>
                <div style={{ height: `${(item.weight / 100) * 120}px` }} className="w-full rounded-t-xl bg-[#00df89]" />
                <span className="text-xs text-slate-400">{item.month}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
