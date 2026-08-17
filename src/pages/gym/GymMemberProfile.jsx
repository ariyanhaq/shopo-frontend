/**
 * @file GymMemberProfile.jsx
 * @description Comprehensive athlete profile view with real MongoDB attendance logs, fee receipts, and health metrics.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Phone, Mail, Calendar, HeartPulse, Activity,
  CreditCard, Dumbbell, Clock, ArrowLeft, CheckCircle2,
  FileText, Edit3, Trash2, Loader2
} from 'lucide-react';

import RecordPaymentModal from '@/components/gym/RecordPaymentModal';

export default function GymMemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.gym.members.getById(id);
      if (res.data) {
        setMember(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym member profile:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
        <span>Loading member profile...</span>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-base font-medium text-slate-800 dark:text-zinc-200">Member Not Found</h2>
        <Button onClick={() => navigate('/gym/members')} className="text-xs">
          Back to Members
        </Button>
      </div>
    );
  }

  const attendanceHistory = member.attendanceHistory || [];
  const paymentHistory = member.paymentHistory || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/gym/members')} className="gap-1.5 text-xs font-medium dark:bg-zinc-900">
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-medium gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" /> Record Payment
          </Button>
        </div>
      </div>

      {/* MEMBER HEADER HERO CARD */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xl border border-emerald-500/20">
              {member.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white">{member.fullName}</h1>
                <Badge variant={member.status === 'Active' ? 'default' : 'warning'} className="text-xs font-normal uppercase">
                  {member.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Locker #{member.lockerNumber || 'N/A'} • {member.gender} • Joined: {member.startDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-zinc-800">
            <div>
              <div className="text-xs text-slate-400">Package</div>
              <div className="text-sm font-medium text-slate-800 dark:text-zinc-200">{member.membershipPackage}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Valid Until</div>
              <div className="text-sm font-medium text-slate-800 dark:text-zinc-200">{member.endDate}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Due Balance</div>
              <div className={`text-sm font-medium ${member.dueAmount > 0 ? 'text-amber-500' : 'text-[#00a86b] dark:text-[#00df89]'}`}>
                ৳ {(member.dueAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
          {['Overview', 'Attendance History', 'Payment History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white dark:bg-zinc-800'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800">
              <div className="text-xs text-slate-400">Phone Number</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">{member.phone}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800">
              <div className="text-xs text-slate-400">Emergency Contact</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">{member.emergencyContact || 'Not specified'}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800">
              <div className="text-xs text-slate-400">Body Stats</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {member.height}cm / {member.weight}kg ({member.bmi} BMI)
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800">
              <div className="text-xs text-slate-400">Fitness Goal</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">{member.fitnessGoal}</div>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance Logs */}
        {activeTab === 'Attendance History' && (
          <div className="space-y-3">
            {attendanceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 border-b border-slate-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Check-in Time</th>
                      <th className="p-3">Check-out Time</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {attendanceHistory.map((log) => (
                      <tr key={log._id}>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{log.date}</td>
                        <td className="p-3 text-slate-600 dark:text-zinc-300">{log.checkInTime}</td>
                        <td className="p-3 text-slate-600 dark:text-zinc-300">{log.checkOutTime}</td>
                        <td className="p-3">{log.method}</td>
                        <td className="p-3">
                          <Badge variant="default" className="text-[10px]">{log.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                No attendance logs found for this member.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'Payment History' && (
          <div className="space-y-3">
            {paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 border-b border-slate-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Plan / Description</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Paid (৳)</th>
                      <th className="p-3">Due (৳)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {paymentHistory.map((p) => (
                      <tr key={p._id}>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{p.invoiceNumber}</td>
                        <td className="p-3 text-slate-600 dark:text-zinc-300">{p.date}</td>
                        <td className="p-3">{p.package_name}</td>
                        <td className="p-3">{p.method}</td>
                        <td className="p-3 font-medium text-[#00a86b] dark:text-[#00df89]">৳ {p.paid.toLocaleString()}</td>
                        <td className="p-3 font-medium text-slate-700 dark:text-zinc-300">৳ {p.due.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={p.status === 'Paid' ? 'default' : 'warning'} className="text-[10px]">{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                No fee payments recorded yet for this member.
              </div>
            )}
          </div>
        )}

      </Card>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onRecordPayment={fetchProfile}
        defaultMemberId={member._id}
      />

    </div>
  );
}
