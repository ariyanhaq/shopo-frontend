/**
 * @file GymDashboard.jsx
 * @description Live Gym & Fitness Center dashboard connected to MongoDB with dynamic attendance charts, real member metrics, and DB-backed quick actions.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, UserCheck, DollarSign, Dumbbell,
  Calendar, UserPlus, QrCode, CreditCard, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

import AddMemberModal from '@/components/gym/AddMemberModal';
import InvoiceModal from '@/components/gym/InvoiceModal';
import { GymAttendanceWidget } from '@/components/dashboard/IndustryWidgets';

export default function GymDashboard() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchGymMetrics = async () => {
    try {
      const res = await api.gym.getDashboard();
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Gym dashboard fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGymMetrics();
  }, []);

  const metrics = dashboardData?.metrics || {
    totalMembers: 0,
    activeMembers: 0,
    expiringMembers: 0,
    todayCheckins: 0,
    monthlyRevenue: 0,
    activeRate: 0,
  };

  const attendanceTrend = dashboardData?.dailyAttendanceTrend || [];
  const recentMembers = (dashboardData?.recentMembers || []).slice(0, 4);
  const maxAttendance = Math.max(...attendanceTrend.map(t => t.count), 10);

  const statCardsData = [
    {
      title: lang === 'bn' ? 'চলতি মাসের আয়' : 'Monthly Fee Revenue',
      icon: DollarSign,
      value: `৳ ${metrics.monthlyRevenue.toLocaleString()}`,
      change: `${metrics.monthlyRevenue > 0 ? '+100%' : '0%'} this month`,
      isPositive: metrics.monthlyRevenue > 0,
    },
    {
      title: lang === 'bn' ? 'মোট নিবন্ধিত সদস্য' : 'Total Athletes',
      icon: Users,
      value: metrics.totalMembers,
      change: `${metrics.totalMembers} registered`,
      isPositive: true,
    },
    {
      title: lang === 'bn' ? 'সক্রিয় সদস্য' : 'Active Pass Holders',
      icon: UserCheck,
      value: metrics.activeMembers,
      change: `${metrics.activeRate}% active rate`,
      isPositive: metrics.activeMembers > 0,
    },
    {
      title: lang === 'bn' ? 'আজকের উপস্থিতি' : "Today's Check-ins",
      icon: Dumbbell,
      value: metrics.todayCheckins,
      change: `${metrics.todayCheckins} athletes checked in`,
      isPositive: true,
    },
  ];

  const handleAddMemberSuccess = () => {
    setIsAddMemberOpen(false);
    fetchGymMetrics();
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
                  {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : stat.value}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <span className={stat.isPositive ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-amber-500'}>
                    {stat.change}
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
                  {lang === 'bn' ? 'উপস্থিতির অগ্রগতি' : 'Gym Attendance Performance'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm font-normal">
                  {lang === 'bn' ? 'চলতি মাসের দৈনিক অ্যাথলেট উপস্থিতি' : 'Daily athlete check-in volume for this month'}
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#09090b]">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'এই মাস' : 'This Month'}</span>
              </Button>
            </div>

            {/* Vertical Bar Chart (Dynamic from DB) */}
            <div className="h-44 sm:h-52 flex items-end justify-between gap-1 pt-6 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              {attendanceTrend.length > 0 ? (
                attendanceTrend.map((item, bIdx) => {
                  const barHeight = item.count > 0 ? Math.max(12, Math.round((item.count / maxAttendance) * 100)) : 6;
                  return (
                    <div key={bIdx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t-sm transition-all duration-150 relative ${
                          item.count > 0 ? 'bg-[#00df89] hover:bg-[#00c97b]' : 'bg-slate-200 dark:bg-zinc-800/60'
                        }`}
                      >
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-zinc-800 text-white text-[10px] font-normal px-1.5 py-0.5 rounded shadow-md pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {lang === 'bn' ? `দিন ${item.day}: ${item.count} জন` : `Day ${item.day}: ${item.count} check-ins`}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
                  {lang === 'bn' ? 'কোন উপস্থিতি রেকর্ড পাওয়া যায়নি' : 'No check-in logs recorded yet'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00df89]" />
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                {lang === 'bn' ? 'দৈনিক উপস্থিতি ট্র্যাকার' : 'Daily Athlete Check-ins'}
              </span>
            </div>
            <span className="text-[#00a86b] dark:text-[#00df89] font-medium">
              {metrics.todayCheckins} {lang === 'bn' ? 'জন আজ উপস্থিত' : 'checked in today'}
            </span>
          </div>
        </Card>

        {/* Quick Actions Panel (1 Column) */}
        <Card className="p-6 flex flex-col justify-between space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">
              {lang === 'bn' ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-normal mb-4">
              {lang === 'bn' ? 'সাধারণ জিম ম্যানেজমেন্ট শর্টকাট' : 'Common tasks and gym shortcuts'}
            </CardDescription>

            <div className="space-y-2.5">
              {/* Primary Green Action */}
              <Button
                variant="default"
                onClick={() => setIsAddMemberOpen(true)}
                className="w-full justify-start h-11 text-xs sm:text-sm bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium gap-2"
              >
                <UserPlus className="w-4 h-4 stroke-[2]" />
                <span>{lang === 'bn' ? 'নতুন সদস্য যুক্ত করুন' : 'Add New Member'}</span>
              </Button>

              {/* Secondary Outline Actions */}
              <Button variant="outline" onClick={() => navigate('/gym/attendance')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b] gap-2">
                <QrCode className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'দ্রুত উপস্থিতি (Check-In)' : 'Quick Check-In'}</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/gym/payments')} className="w-full justify-start h-11 text-xs sm:text-sm font-medium dark:bg-[#09090b] gap-2">
                <CreditCard className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
                <span>{lang === 'bn' ? 'ফি পেমেন্ট জমা নিন' : 'Record Fee Payment'}</span>
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <Button variant="link" onClick={() => navigate('/gym/members')} className="text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-[#00a86b] dark:hover:text-[#00df89]">
              {lang === 'bn' ? 'সকল সদস্য দেখুন' : 'View All Members'} →
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
                {lang === 'bn' ? 'সম্প্রতি নিবন্ধিত সদস্য' : 'Recent Registered Members'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {lang === 'bn' ? 'সদস্য তালিকা ও পাস মেয়াদ' : 'Latest athletes & membership passes'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/gym/members')} className="text-xs font-medium dark:bg-[#09090b]">
              {lang === 'bn' ? 'সব দেখুন' : 'View All'}
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : recentMembers.length > 0 ? (
              recentMembers.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/gym/members/${m._id}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b]/80 border border-slate-100 dark:border-zinc-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium shrink-0">
                      {m.fullName.slice(0, 2).toUpperCase()}
                    </div>
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
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">Valid until {m.endDate}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#09090b]/60 border border-slate-100 dark:border-zinc-800/60 space-y-3">
                <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'কোন সদস্য নিবন্ধিত হয়নি। প্রথম সদস্য যুক্ত করুন।' : 'No members registered yet. Add your first member to get started!'}
                </div>
                <Button size="sm" onClick={() => setIsAddMemberOpen(true)} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-medium">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  {lang === 'bn' ? 'সদস্য যোগ করুন' : 'Add First Member'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Membership Expiration Alerts (1 Column) */}
        <Card className="p-6 space-y-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-medium">
                {lang === 'bn' ? 'মেয়াদোত্তীর্ণ হতে চলা পাস' : 'Expiring Passes'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-normal">
                {lang === 'bn' ? 'নবায়ন প্রয়োজন' : 'Passes requiring renewal'}
              </CardDescription>
            </div>
            <Badge variant={metrics.expiringMembers > 0 ? 'destructive' : 'default'} className="text-[10px] font-normal">
              {metrics.expiringMembers} {lang === 'bn' ? 'জন' : 'Members'}
            </Badge>
          </div>

          <div className="space-y-3">
            {recentMembers.filter(x => x.status === 'Expiring Soon' || x.status === 'Expired').length > 0 ? (
              recentMembers.filter(x => x.status === 'Expiring Soon' || x.status === 'Expired').map((item, idx) => (
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

                  <Button variant="outline" size="sm" onClick={() => navigate('/gym/payments')} className="h-8 text-xs font-medium dark:bg-[#09090b] shrink-0 whitespace-nowrap">
                    {lang === 'bn' ? 'নবায়ন' : 'Renew'}
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-[#09090b]/60 border border-slate-100 dark:border-zinc-800/60 space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                  {lang === 'bn' ? 'সকল মেম্বারশিপ সক্রিয়' : 'All Passes Valid'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {lang === 'bn' ? 'কোন মেম্বারশিপ মেয়াদোত্তীর্ণ হয়নি' : 'No upcoming expirations in the next 3 days'}
                </div>
              </div>
            )}
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
