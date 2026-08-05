/**
 * @file GymDashboard.jsx
 * @description Gym & Fitness Center dashboard aligned with Shopo's core UI design, stat cards, bar chart, and quick actions.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, UserX, Clock, DollarSign, CreditCard,
  Plus, QrCode, Calendar, ChevronRight, Dumbbell, ShieldAlert,
  CheckCircle2, UserPlus, PackagePlus, FileText, AlertTriangle
} from 'lucide-react';

import AddMemberModal from '@/components/gym/AddMemberModal';
import InvoiceModal from '@/components/gym/InvoiceModal';
import { GymAttendanceWidget } from '@/components/dashboard/IndustryWidgets';
import {
  INITIAL_GYM_MEMBERS,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_GYM_PAYMENTS,
  INITIAL_GYM_PACKAGES
} from '@/data/gymData';

export default function GymDashboard() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { activeShop } = useShop();

  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [members, setMembers] = useState(INITIAL_GYM_MEMBERS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE_LOGS);
  const [payments, setPayments] = useState(INITIAL_GYM_PAYMENTS);
  const [packages] = useState(INITIAL_GYM_PACKAGES);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Daily attendance bar heights for chart
  const attendanceBars = [
    45, 52, 48, 60, 58, 65, 70, 62, 68, 72,
    80, 78, 85, 82, 90, 95, 88, 100, 98, 105,
    110, 102, 115, 120, 125, 118, 130, 135, 132, 140
  ];

  // Top 4 Stat Cards aligned with main Dashboard.jsx
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const todayAttendance = attendance.filter(a => a.date === '2026-08-05').length;
  const monthlyRevenue = payments.reduce((acc, p) => acc + p.paid, 0);

  const statCardsData = [
    { title: 'Monthly Revenue', icon: DollarSign, value: `৳ ${monthlyRevenue.toLocaleString()}`, change: '+15.4% vs last month', isPositive: true },
    { title: 'Total Members', icon: Users, value: totalMembers, change: '+18 this month', isPositive: true },
    { title: 'Active Members', icon: UserCheck, value: activeMembers, change: `${Math.round((activeMembers / totalMembers) * 100)}% active rate`, isPositive: true },
    { title: "Today's Attendance", icon: Dumbbell, value: todayAttendance, change: '+12 vs yesterday', isPositive: true }
  ];

  const handleAddMemberSuccess = (newMember) => {
    setMembers([newMember, ...members]);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ---------------------------------------------------- */}
      {/* TOP STAT CARDS ROW (4 Columns)                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCardsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5 hover:shadow-xs transition-shadow border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400">
                  {stat.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <span className={stat.isPositive ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-rose-500'}>
                    {stat.isPositive ? '↑' : '↓'} {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MIDDLE ROW: Attendance Performance Chart + Quick Actions */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Performance Chart (2 Columns) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-medium">
                  Gym Attendance Performance
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm font-normal">
                  Daily athlete check-in volume for this month
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#09090b]">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'এই মাস' : selectedPeriod}</span>
              </Button>
            </div>

            {/* Vertical Bar Chart */}
            <div className="h-44 sm:h-52 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              {attendanceBars.map((val, bIdx) => (
                <div key={bIdx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <div
                    style={{ height: `${(val / 140) * 100}%` }}
                    className="w-full rounded-t-sm bg-[#00df89] hover:bg-[#00c97b] transition-all duration-150 relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-normal px-1.5 py-0.5 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap">
                      Day {bIdx + 1}: {val} check-ins
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00df89]" />
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                Daily Athlete Check-ins
              </span>
            </div>
            <span className="text-[#00a86b] dark:text-[#00df89] font-medium">
              +14% from last month
            </span>
          </div>
        </Card>

        {/* Quick Actions Panel (1 Column) */}
        <Card className="p-6 flex flex-col justify-between space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal mb-4">
              Common tasks and gym shortcuts
            </CardDescription>

            <div className="space-y-2.5">
              {/* Primary Green Action */}
              <Button
                variant="default"
                onClick={() => setIsAddMemberOpen(true)}
                className="w-full justify-start h-11 text-xs sm:text-sm bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium gap-2"
              >
                <UserPlus className="w-4 h-4 stroke-[2]" />
                <span>Add New Member</span>
              </Button>

              {/* Secondary Outline Actions */}
              <Button variant="outline" onClick={() => navigate('/gym/attendance')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b] gap-2">
                <QrCode className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>Quick Check-In</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/gym/payments')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b] gap-2">
                <CreditCard className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>Record Fee Payment</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <Button variant="link" onClick={() => navigate('/gym/members')} className="text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-[#00a86b] dark:hover:text-[#00df89]">
              View All Members →
            </Button>
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM ROW: Recent Members + Membership Expirations */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Registered Members List (2 Columns) */}
        <Card className="lg:col-span-2 p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-medium">
                Recent Registered Members
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                Latest athletes & membership passes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/gym/members')} className="text-xs font-medium dark:bg-[#09090b]">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((m, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/gym/members/${m.id}`)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <img src={m.photo} alt={m.fullName} className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-zinc-800 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                      <span className="truncate">{m.fullName}</span>
                      <Badge variant={m.status === 'Active' ? 'default' : 'warning'} className="uppercase text-[10px] font-normal shrink-0">
                        {m.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate">{m.membershipPackage} • {m.phone}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 whitespace-nowrap">
                  <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">{m.endDate}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">{m.remainingDays} days left</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Membership Expiration Alerts (1 Column) */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-medium">
                Expiring Memberships
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                Passes requiring renewal
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-[10px] font-normal">
              14 Members
            </Badge>
          </div>

          <div className="space-y-3">
            {members.filter(x => x.status === 'Expiring Soon' || x.status === 'Expired').map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 gap-3"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{item.fullName}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal truncate">{item.membershipPackage} • {item.endDate}</div>
                </div>

                <Button variant="outline" size="sm" onClick={() => navigate('/gym/memberships')} className="h-8 text-xs font-medium dark:bg-[#09090b] shrink-0 whitespace-nowrap">
                  Renew
                </Button>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ---------------------------------------------------- */}
      {/* GYM ATTENDANCE INDUSTRY WIDGET AT BOTTOM             */}
      {/* ---------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
        <GymAttendanceWidget />
      </div>

      {/* MODALS */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMemberSuccess}
      />

      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        payment={selectedInvoice}
      />

    </div>
  );
}
