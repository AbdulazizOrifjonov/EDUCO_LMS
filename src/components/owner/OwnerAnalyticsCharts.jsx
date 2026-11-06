import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  GraduationCap,
  Award,
  Layers,
  ArrowUpRight,
  Sparkles,
  Building2,
  Calendar,
  CreditCard,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function OwnerAnalyticsCharts({ analytics }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue' | 'students'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCourse, setHoveredCourse] = useState(null);

  if (!analytics) return null;

  const {
    revenue = {},
    courseDistribution = [],
    teachersPerformance = [],
    roomOccupancy = [],
  } = analytics;

  const history = revenue.history || [];

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Max value for scaling
  const maxVal = Math.max(
    ...history.map((h) => (activeMetric === 'revenue' ? h.expected : h.students)),
    activeMetric === 'revenue' ? 100000000 : 160
  );

  // Generate SVG coordinates for data points
  const points = history.map((item, idx) => {
    const val = activeMetric === 'revenue' ? item.expected : item.students;
    const x =
      paddingX +
      (idx / Math.max(history.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      (val / (maxVal || 1)) * (chartHeight - paddingY * 2);
    return { x, y, ...item, val };
  });

  // Build SVG smooth Bézier curve path
  const buildSmoothPath = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[0];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Donut chart calculations
  const totalStudentsInCourses = courseDistribution.reduce(
    (sum, c) => sum + (c.students || 0),
    0
  );
  const donutRadius = 65;
  const donutCircumference = 2 * Math.PI * donutRadius;

  let accumulatedPercent = 0;
  const donutSlices = courseDistribution.map((course) => {
    const pct = course.percentage || 0;
    const strokeDasharray = `${(pct / 100) * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * donutCircumference);
    accumulatedPercent += pct;
    return {
      ...course,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6">
      {/* SECTION 1: FINANCIAL DYNAMICS & REVENUE AREA CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart (2 cols) - Rises smoothly from the bottom */}
        <Card
          className="lg:col-span-2 !p-5 relative overflow-hidden animate-slide-up-soft shadow-card hover:shadow-card-hover transition-all duration-300"
          title={
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-emerald-500/20 text-blue-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {activeMetric === 'revenue'
                      ? "Oylik tushum va moliyaviy dinamika"
                      : "O‘quvchilar sonining oylik o‘sish sur‘ati"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeMetric === 'revenue'
                      ? "Markazning hisoblangan va to‘langan kurs to‘lovlari tahlili"
                      : "Faol talabalarning oylar kesimidagi dinamikasi"}
                  </p>
                </div>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary">
                <button
                  type="button"
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMetric === 'revenue'
                      ? 'bg-white dark:bg-surface-dark text-blue-600 dark:text-emerald-400 shadow-xs scale-102'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  💰 Tushum (UZS)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric('students')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMetric === 'students'
                      ? 'bg-white dark:bg-surface-dark text-blue-600 dark:text-emerald-400 shadow-xs scale-102'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📈 Talabalar soni
                </button>
              </div>
            </div>
          }
        >
          {/* Quick Stat Pill Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 hover:-translate-y-0.5 transition-transform duration-200">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Jami kutilayotgan
              </span>
              <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                {(revenue.totalExpected || 0).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">UZS</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 hover:-translate-y-0.5 transition-transform duration-200">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Yig‘ilgan to‘lov
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                {(revenue.totalCollected || 0).toLocaleString()} <span className="text-[10px] font-normal text-emerald-500/70">UZS</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 hover:-translate-y-0.5 transition-transform duration-200">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Qoldiq / Qarzdorlik
              </span>
              <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                {(revenue.totalPending || 0).toLocaleString()} <span className="text-[10px] font-normal text-amber-500/70">UZS</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 hover:-translate-y-0.5 transition-transform duration-200">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Yillik o‘sish sur‘ati
              </span>
              <span className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +194%
              </span>
            </div>
          </div>

          {/* SVG Canvas with Rising Curve */}
          <div className="relative pt-4 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 sm:h-56 select-none animate-slide-up-soft"
            >
              <defs>
                <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.38" />
                  <stop offset="90%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="areaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                  <stop offset="90%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-gray-200 dark:text-gray-800"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-gray-400 font-mono font-medium"
                    >
                      {activeMetric === 'revenue'
                        ? `${Math.round((maxVal * pct) / 1000000)}M`
                        : `${Math.round(maxVal * pct)}`}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={activeMetric === 'revenue' ? 'url(#areaGradientBlue)' : 'url(#areaGradientGreen)'}
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Smooth Line with Drawing Animation */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={activeMetric === 'revenue' ? '#2563EB' : '#10B981'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="transition-all duration-700 ease-out animate-chart-draw"
                />
              )}

              {/* Data Dots & Hover Hitboxes with Pop Animation */}
              {points.map((pt, i) => (
                <g key={i} className="cursor-pointer group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === i ? 6.5 : 4}
                    fill={activeMetric === 'revenue' ? '#2563EB' : '#10B981'}
                    className="stroke-white dark:stroke-surface-dark transition-all duration-200 ease-out"
                    strokeWidth="2.5"
                  />
                  {/* Invisible enlarged hitbox for smooth hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={20}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X-axis Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-500 dark:fill-gray-400 font-bold transition-colors group-hover:fill-blue-600 dark:group-hover:fill-emerald-400"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredPoint !== null && points[hoveredPoint] && (
              <div
                className="absolute z-20 pointer-events-none -translate-x-1/2 bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl backdrop-blur-md animate-pop-scale"
                style={{
                  left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                  top: `${Math.max(10, (points[hoveredPoint].y / chartHeight) * 100 - 38)}%`,
                }}
              >
                <div className="text-[10px] text-gray-300 dark:text-gray-600 font-normal">
                  {points[hoveredPoint].month} oyi ko‘rsatkichi:
                </div>
                <div className="text-xs font-black">
                  {activeMetric === 'revenue'
                    ? `${points[hoveredPoint].expected.toLocaleString()} UZS`
                    : `${points[hoveredPoint].students} ta talaba`}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* DONUT: Course Popularity Distribution (1 col) - Glides in smoothly from the right */}
        <Card
          className="!p-5 flex flex-col justify-between animate-slide-right-soft shadow-card hover:shadow-card-hover transition-all duration-300"
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Kurslar bo‘yicha taqsimot
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    O‘quvchilar yo‘nalishlari ulushi
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50">
                {courseDistribution.length} ta kurs
              </span>
            </div>
          }
        >
          {/* Donut SVG with Spinning Entrance */}
          <div className="flex items-center justify-center py-2 relative">
            <svg width="170" height="170" viewBox="0 0 170 170" className="animate-donut-spin">
              <circle
                cx="85"
                cy="85"
                r={donutRadius}
                fill="transparent"
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="20"
              />
              {donutSlices.map((slice, i) => (
                <circle
                  key={slice.id || i}
                  cx="85"
                  cy="85"
                  r={donutRadius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={hoveredCourse === slice.id ? 24 : 20}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-500 ease-out cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredCourse(slice.id)}
                  onMouseLeave={() => setHoveredCourse(null)}
                />
              ))}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center animate-pop-scale">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {totalStudentsInCourses}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                Jami a‘zolik
              </span>
            </div>
          </div>

          {/* Course Legend List - Staggered slide in */}
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
            {courseDistribution.map((course, idx) => (
              <div
                key={course.id}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
                onClick={() => navigate('/owner/courses')}
                style={{ animationDelay: `${idx * 45}ms` }}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-200 cursor-pointer animate-slide-right-soft ${
                  hoveredCourse === course.id
                    ? 'bg-gray-100 dark:bg-surface-dark-tertiary translate-x-1 shadow-xs'
                    : 'hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                    {course.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-medium text-gray-400 text-[11px]">
                    {course.students} o‘quvchi
                  </span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    {course.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SECTION 2: TEACHERS LOAD & CLASSROOM OCCUPANCY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Workload & Performance Leaderboard - Glides in from Left */}
        <Card
          className="!p-5 animate-slide-left-soft [animation-delay:150ms] shadow-card hover:shadow-card-hover transition-all duration-300"
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    O‘qituvchilar yuklamasi va reytingi
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Guruhlar soni, talabalar qamrovi va davomat ko‘rsatkichi
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/owner/users?role=teacher')}
                className="text-xs text-blue-600 dark:text-emerald-400 font-bold hover:translate-x-0.5 transition-transform"
              >
                Barchasi →
              </Button>
            </div>
          }
        >
          <div className="space-y-2.5 pt-2">
            {teachersPerformance.slice(0, 5).map((teacher, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              return (
                <div
                  key={teacher.id}
                  onClick={() => navigate(`/owner/users/profile/${teacher.id}`)}
                  style={{ animationDelay: `${(idx + 1) * 70}ms` }}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 hover:border-amber-500/40 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group animate-slide-left-soft"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-black w-6 text-center shrink-0">
                      {medal}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        teacher.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                        {teacher.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {teacher.subject} &bull; <span className="font-semibold text-gray-700 dark:text-gray-300">{teacher.groupsCount} ta guruh</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-gray-900 dark:text-white block">
                        {teacher.studentsCount} <span className="text-[10px] font-medium text-gray-400">o‘quvchi</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {teacher.attendanceRate}% davomat
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Classroom & Group Capacity Occupancy - Glides in from Right */}
        <Card
          className="!p-5 animate-slide-right-soft [animation-delay:150ms] shadow-card hover:shadow-card-hover transition-all duration-300"
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Xonalar va Auditoriyalar bandligi
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mashg‘ulotlar zichligi va xonalardan foydalanish ko‘rsatkichi
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/owner/schedule')}
                className="text-xs text-blue-600 dark:text-emerald-400 font-bold hover:translate-x-0.5 transition-transform"
              >
                Jadval →
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {roomOccupancy.slice(0, 6).map((rm, idx) => (
              <div
                key={idx}
                style={{ animationDelay: `${(idx + 1) * 70}ms` }}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 space-y-2 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 animate-slide-right-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    {rm.room}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300">
                    {rm.occupancyPct}% band
                  </span>
                </div>

                {/* Progress bar with smooth growth */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${rm.occupancyPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{rm.groupsCount} ta guruh</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{rm.studentsCount} o‘quvchi</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
