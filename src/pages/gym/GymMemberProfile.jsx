/**
 * @file GymMemberProfile.jsx
 * @description Comprehensive athlete profile view with real MongoDB attendance logs, fee receipts, and health metrics.
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
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
import Pagination from '@/components/common/Pagination';
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

  // Attendance Pagination
  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState(5);

  const paginatedAttendance = useMemo(() => {
    const start = (attPage - 1) * attPageSize;
    return attendanceHistory.slice(start, start + attPageSize);
  }, [attendanceHistory, attPage, attPageSize]);

  // Payment Pagination
  const [payPage, setPayPage] = useState(1);
  const [payPageSize, setPayPageSize] = useState(5);

  const paginatedPayments = useMemo(() => {
    const start = (payPage - 1) * payPageSize;
    return paymentHistory.slice(start, start + payPageSize);
  }, [paymentHistory, payPage, payPageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
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

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 dark:text-zinc-500 block">Due Fee Balance</span>
              <span className={`text-xl font-bold ${member.dueAmount > 0 ? 'text-amber-500' : 'text-[#00a86b] dark:text-[#00df89]'}`}>
                ৳ {(member.dueAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Phone</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{member.phone}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Package</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{member.membershipPackage}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Assigned Trainer</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{member.trainer || 'General Floor'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-500 block">Package Expiry</span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">{member.endDate}</span>
          </div>
        </div>
      </Card>

      {/* VIEW SELECTOR */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-52">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger size="sm" className="bg-white dark:bg-[#121215] w-full h-9.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
              <SelectValue placeholder="Overview" />
            </SelectTrigger>
            <SelectContent className="min-w-[190px]">
              <SelectItem value="Overview">Profile Overview</SelectItem>
              <SelectItem value="Attendance History">Attendance History</SelectItem>
              <SelectItem value="Payment History">Payment History</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TAB CONTENTS */}
      <Card className="p-6 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        
        {/* Tab 1: Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Fitness Goals & Profile</h3>
              <p className="text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-[#09090b] p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                {member.fitnessGoal || 'No specific fitness goals recorded.'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Health Notes & Medical History</h3>
              <p className="text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-[#09090b] p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                {member.healthNotes || 'No existing injuries or medical conditions declared.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance Logs */}
        {activeTab === 'Attendance History' && (
          <div className="space-y-3">
            {attendanceHistory.length > 0 ? (
              <div className="overflow-x-auto space-y-4">
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
                    {paginatedAttendance.map((log) => (
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

                {attendanceHistory.length > attPageSize && (
                  <Pagination
                    currentPage={attPage}
                    totalItems={attendanceHistory.length}
                    pageSize={attPageSize}
                    pageSizeOptions={[5, 10, 20]}
                    onPageChange={setAttPage}
                    onPageSizeChange={setAttPageSize}
                  />
                )}
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
              <div className="overflow-x-auto space-y-4">
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
                    {paginatedPayments.map((p) => (
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

                {paymentHistory.length > payPageSize && (
                  <Pagination
                    currentPage={payPage}
                    totalItems={paymentHistory.length}
                    pageSize={payPageSize}
                    pageSizeOptions={[5, 10, 20]}
                    onPageChange={setPayPage}
                    onPageSizeChange={setPayPageSize}
                  />
                )}
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
