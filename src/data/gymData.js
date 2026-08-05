/**
 * @file gymData.js
 * @description Comprehensive mock dataset and state management for Shopo Gym Management Module.
 */

export const INITIAL_GYM_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Monthly Membership',
    nameBn: 'মাসিক মেম্বারশিপ',
    price: 3000,
    duration: '1 Month',
    durationDays: 30,
    benefits: ['Full Gym Access', 'Locker Room', 'Steam Bath (1x/wk)'],
    description: 'Standard monthly gym pass for regular workout enthusiasts.',
    color: 'emerald',
    status: 'Active',
    maxClasses: 4,
    freezeAllowed: false,
    personalTrainer: false,
    dietPlan: false
  },
  {
    id: 'pkg-2',
    name: 'Quarterly Fitness Pass',
    nameBn: 'ত্রৈমাসিক ফিটনেস পাস',
    price: 8000,
    duration: '3 Months',
    durationDays: 90,
    benefits: ['Full Gym Access', 'Personalized Workout Plan', 'Free Shaker Bottle', '2 Freeze Days'],
    description: 'Save 12% on a 3-month commitment with free trainer consultation.',
    color: 'blue',
    status: 'Active',
    maxClasses: 12,
    freezeAllowed: true,
    personalTrainer: false,
    dietPlan: true
  },
  {
    id: 'pkg-3',
    name: '6-Month VIP Transformation',
    nameBn: '৬ মাসের ভিআইপি ট্রান্সফরমেশন',
    price: 15000,
    duration: '6 Months',
    durationDays: 180,
    benefits: ['Full Gym & Spa Access', 'Personal Trainer (12 Sessions)', 'Custom Diet Plan', 'Unlimited Classes'],
    description: 'Our popular mid-term package with 1-on-1 personal trainer guidance.',
    color: 'purple',
    status: 'Active',
    maxClasses: 99,
    freezeAllowed: true,
    personalTrainer: true,
    dietPlan: true
  },
  {
    id: 'pkg-4',
    name: '1-Year Platinum Elite',
    nameBn: '১ বছরের প্লাটিনাম এলিট',
    price: 26000,
    duration: '12 Months',
    durationDays: 365,
    benefits: ['24/7 Access', 'Dedicated Locker', 'Free Guest Pass (2/mo)', 'Full PT & Nutritionist', 'All Classes Included'],
    description: 'Ultimate 1-year transformation membership with premium perks.',
    color: 'amber',
    status: 'Active',
    maxClasses: 999,
    freezeAllowed: true,
    personalTrainer: true,
    dietPlan: true
  }
];

export const INITIAL_GYM_TRAINERS = [
  {
    id: 'tr-1',
    name: 'Tanvir Ahmed',
    photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80',
    phone: '+880 1711-223344',
    email: 'tanvir.fitness@shopo.bd',
    specialization: 'Bodybuilding & Heavy Strength',
    salary: 35000,
    workingHours: '06:00 AM - 02:00 PM',
    assignedMembersCount: 24,
    status: 'Active'
  },
  {
    id: 'tr-2',
    name: 'Sabrina Islam',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+880 1819-887766',
    email: 'sabrina.yoga@shopo.bd',
    specialization: 'Weight Loss & Pilates',
    salary: 32000,
    workingHours: '02:00 PM - 10:00 PM',
    assignedMembersCount: 18,
    status: 'Active'
  },
  {
    id: 'tr-3',
    name: 'Rocky Chowdhury',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+880 1912-334455',
    email: 'rocky.crossfit@shopo.bd',
    specialization: 'HIIT & Functional Conditioning',
    salary: 38000,
    workingHours: '10:00 AM - 06:00 PM',
    assignedMembersCount: 30,
    status: 'Active'
  }
];

export const INITIAL_GYM_MEMBERS = [
  {
    id: 'GM-1001',
    fullName: 'Mahmudur Rahman',
    fullNameBn: 'মাহমুদুর রহমান',
    phone: '01712-345678',
    email: 'mahmud.r@gmail.com',
    gender: 'Male',
    dob: '1995-04-12',
    emergencyContact: '01819-998877 (Wife)',
    nid: '1995267389102',
    address: 'House 42, Road 11, Banani, Dhaka',
    medicalNotes: 'Slight lower back tension, avoid heavy deadlifts.',
    bloodGroup: 'O+',
    height: '178 cm',
    weight: '76 kg',
    bmi: '24.0',
    fitnessGoal: 'Muscle Gain',
    preferredTrainer: 'Tanvir Ahmed',
    joiningDate: '2026-01-10',
    membershipPackage: '6-Month VIP Transformation',
    packageId: 'pkg-3',
    startDate: '2026-01-10',
    endDate: '2026-07-10',
    status: 'Active',
    remainingDays: 14,
    lastVisit: '2026-08-05 09:30 AM',
    attendanceCount: 48,
    lockerNumber: 'L-12',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    paidAmount: 15000,
    totalDue: 0
  },
  {
    id: 'GM-1002',
    fullName: 'Nusrat Jahan',
    fullNameBn: 'নুসরাত জাহান',
    phone: '01819-456789',
    email: 'nusrat.j@hotmail.com',
    gender: 'Female',
    dob: '1998-09-20',
    emergencyContact: '01711-222333 (Father)',
    nid: '1998129847103',
    address: 'Flat 3B, Sector 7, Uttara, Dhaka',
    medicalNotes: 'None',
    bloodGroup: 'A+',
    height: '162 cm',
    weight: '58 kg',
    bmi: '22.1',
    fitnessGoal: 'Weight Loss & Cardio',
    preferredTrainer: 'Sabrina Islam',
    joiningDate: '2026-05-01',
    membershipPackage: 'Quarterly Fitness Pass',
    packageId: 'pkg-2',
    startDate: '2026-05-01',
    endDate: '2026-08-01',
    status: 'Expiring Soon',
    remainingDays: 3,
    lastVisit: '2026-08-04 05:15 PM',
    attendanceCount: 32,
    lockerNumber: 'L-05',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    paidAmount: 8000,
    totalDue: 0
  },
  {
    id: 'GM-1003',
    fullName: 'Sajid Hossain',
    fullNameBn: 'সাজিদ হোসেন',
    phone: '01911-889900',
    email: 'sajid.h@yahoo.com',
    gender: 'Male',
    dob: '1992-11-05',
    emergencyContact: '01911-000111 (Brother)',
    nid: '1992837461920',
    address: 'Gulshan 2, Dhaka',
    medicalNotes: 'Right knee rehab recovery.',
    bloodGroup: 'B+',
    height: '172 cm',
    weight: '84 kg',
    bmi: '28.4',
    fitnessGoal: 'Fat Loss',
    preferredTrainer: 'Rocky Chowdhury',
    joiningDate: '2025-12-01',
    membershipPackage: 'Monthly Membership',
    packageId: 'pkg-1',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'Expired',
    remainingDays: 0,
    lastVisit: '2026-07-28 07:00 AM',
    attendanceCount: 19,
    lockerNumber: 'L-22',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    paidAmount: 3000,
    totalDue: 1500
  },
  {
    id: 'GM-1004',
    fullName: 'Farhana Akter',
    fullNameBn: 'ফারহানা আক্তার',
    phone: '01755-112233',
    email: 'farhana.a@gmail.com',
    gender: 'Female',
    dob: '2000-02-14',
    emergencyContact: '01755-998877',
    nid: '',
    address: 'Dhanmondi 27, Dhaka',
    medicalNotes: 'None',
    bloodGroup: 'AB+',
    height: '165 cm',
    weight: '54 kg',
    bmi: '19.8',
    fitnessGoal: 'General Fitness',
    preferredTrainer: 'Sabrina Islam',
    joiningDate: '2026-02-15',
    membershipPackage: '1-Year Platinum Elite',
    packageId: 'pkg-4',
    startDate: '2026-02-15',
    endDate: '2027-02-15',
    status: 'Active',
    remainingDays: 194,
    lastVisit: '2026-08-05 08:10 AM',
    attendanceCount: 72,
    lockerNumber: 'L-08',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    paidAmount: 26000,
    totalDue: 0
  }
];

export const INITIAL_ATTENDANCE_LOGS = [
  { id: 'att-1', memberId: 'GM-1001', memberName: 'Mahmudur Rahman', timeIn: '08:30 AM', timeOut: '09:45 AM', date: '2026-08-05', status: 'Checked Out', trainer: 'Tanvir Ahmed' },
  { id: 'att-2', memberId: 'GM-1004', memberName: 'Farhana Akter', timeIn: '08:10 AM', timeOut: 'In Gym', date: '2026-08-05', status: 'In Workout', trainer: 'Sabrina Islam' },
  { id: 'att-3', memberId: 'GM-1002', memberName: 'Nusrat Jahan', timeIn: '05:15 PM', timeOut: '06:30 PM', date: '2026-08-04', status: 'Checked Out', trainer: 'Sabrina Islam' },
  { id: 'att-4', memberId: 'GM-1001', memberName: 'Mahmudur Rahman', timeIn: '06:00 AM', timeOut: '07:20 AM', date: '2026-08-04', status: 'Checked Out', trainer: 'Tanvir Ahmed' },
  { id: 'att-5', memberId: 'GM-1003', memberName: 'Sajid Hossain', timeIn: '07:00 AM', timeOut: '08:15 AM', date: '2026-08-03', status: 'Checked Out', trainer: 'Rocky Chowdhury' },
  { id: 'att-6', memberId: 'GM-1004', memberName: 'Farhana Akter', timeIn: '04:30 PM', timeOut: '05:45 PM', date: '2026-08-03', status: 'Checked Out', trainer: 'Sabrina Islam' },
  { id: 'att-7', memberId: 'GM-1002', memberName: 'Nusrat Jahan', timeIn: '09:00 AM', timeOut: '10:15 AM', date: '2026-08-02', status: 'Checked Out', trainer: 'Sabrina Islam' },
  { id: 'att-8', memberId: 'GM-1001', memberName: 'Mahmudur Rahman', timeIn: '05:00 PM', timeOut: '06:40 PM', date: '2026-08-01', status: 'Checked Out', trainer: 'Tanvir Ahmed' }
];

export const INITIAL_GYM_PAYMENTS = [
  { id: 'INV-GYM-901', memberId: 'GM-1001', memberName: 'Mahmudur Rahman', package: '6-Month VIP Transformation', amount: 15000, paid: 15000, due: 0, date: '2026-01-10', method: 'bKash', status: 'Paid' },
  { id: 'INV-GYM-902', memberId: 'GM-1002', memberName: 'Nusrat Jahan', package: 'Quarterly Fitness Pass', amount: 8000, paid: 8000, due: 0, date: '2026-05-01', method: 'Card', status: 'Paid' },
  { id: 'INV-GYM-903', memberId: 'GM-1003', memberName: 'Sajid Hossain', package: 'Monthly Membership', amount: 3000, paid: 1500, due: 1500, date: '2026-07-01', method: 'Cash', status: 'Partial' }
];

export const INITIAL_WORKOUT_TEMPLATES = [
  {
    id: 'wt-1',
    title: 'Hypertrophy Muscle Build (Male)',
    goal: 'Muscle Gain',
    difficulty: 'Intermediate',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '8-12', rest: '90s', notes: 'Keep shoulders retracted' },
      { name: 'Incline DB Press', sets: 3, reps: '10-12', rest: '60s', notes: '30 degree incline' },
      { name: 'Barbell Squat', sets: 4, reps: '6-8', rest: '120s', notes: 'Below parallel' },
      { name: 'Lat Pulldown', sets: 4, reps: '10-12', rest: '60s', notes: 'Squeeze back at bottom' }
    ]
  },
  {
    id: 'wt-2',
    title: 'Fat Loss & High Intensity Conditioning',
    goal: 'Weight Loss',
    difficulty: 'All Levels',
    exercises: [
      { name: 'Treadmill Incline Interval Run', sets: 5, reps: '2 mins', rest: '60s', notes: '10% incline, speed 9.0' },
      { name: 'Kettlebell Swings', sets: 4, reps: '20 reps', rest: '45s', notes: 'Explosive hip drive' },
      { name: 'Bodyweight Burpees', sets: 3, reps: '15 reps', rest: '45s', notes: 'Chest to floor' },
      { name: 'Plank Hold', sets: 3, reps: '60 seconds', rest: '30s', notes: 'Tight core' }
    ]
  }
];

export const INITIAL_CLASSES = [
  { id: 'cls-1', name: 'Power Yoga & Core Stretch', trainer: 'Sabrina Islam', time: 'Mon, Wed, Fri • 07:00 AM', capacity: 15, enrolled: 12, category: 'Yoga', room: 'Studio 1' },
  { id: 'cls-2', name: 'Extreme HIIT Fat Burn', trainer: 'Rocky Chowdhury', time: 'Tue, Thu • 06:00 PM', capacity: 20, enrolled: 18, category: 'HIIT', room: 'Main Arena' },
  { id: 'cls-3', name: 'CrossFit WOD Heavy Lift', trainer: 'Tanvir Ahmed', time: 'Daily • 08:00 PM', capacity: 12, enrolled: 10, category: 'CrossFit', room: 'Rig Area' }
];

export const INITIAL_EQUIPMENT = [
  { id: 'eq-1', name: 'Commercial Treadmill Pro T90', category: 'Cardio', purchaseDate: '2024-03-10', condition: 'Available', maintenanceDate: '2026-09-10', warranty: '3 Years' },
  { id: 'eq-2', name: 'Olympic Squat Rack & Barbell', category: 'Strength', purchaseDate: '2023-11-15', condition: 'Available', maintenanceDate: '2026-08-15', warranty: '5 Years' },
  { id: 'eq-3', name: 'Cable Crossover Machine', category: 'Machines', purchaseDate: '2024-01-20', condition: 'Maintenance', maintenanceDate: '2026-08-02', warranty: '2 Years' }
];

export const INITIAL_EXPENSES = [
  { id: 'exp-1', category: 'Rent', title: 'Monthly Gym Facility Rent', amount: 80000, date: '2026-08-01', method: 'Bank Transfer' },
  { id: 'exp-2', category: 'Electricity', title: 'AC & Heavy Lighting Electric Bill', amount: 35000, date: '2026-08-03', method: 'bKash' },
  { id: 'exp-3', category: 'Maintenance', title: 'Treadmill Belt Replacement', amount: 8500, date: '2026-08-04', method: 'Cash' }
];
