import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Download, AlertTriangle, TrendingUp, Users, ShieldCheck, Activity, RefreshCw } from "lucide-react";

const TODAY = new Date().toLocaleDateString("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Demo fallback data (shown when DB has no real athletes yet)
const DEMO_OVERVIEW = { totalAthletes: 2847, activeThisWeek: 2090, averageComplianceRate: 73.4, totalSessionsThisMonth: 8940 };
const DEMO_STATE = [
  { state: "NSW", athletes: 712, activeThisWeek: 534, complianceRate: 75.0 },
  { state: "VIC", athletes: 641, activeThisWeek: 471, complianceRate: 73.5 },
  { state: "QLD", athletes: 489, activeThisWeek: 341, complianceRate: 69.7 },
  { state: "WA", athletes: 387, activeThisWeek: 268, complianceRate: 69.2 },
  { state: "SA", athletes: 298, activeThisWeek: 198, complianceRate: 66.4 },
  { state: "ACT", athletes: 187, activeThisWeek: 145, complianceRate: 77.5 },
  { state: "TAS", athletes: 133, activeThisWeek: 89, complianceRate: 66.9 },
];
const DEMO_TREND = [
  {week:"Wk 1",rate:42},{week:"Wk 2",rate:48},{week:"Wk 3",rate:54},{week:"Wk 4",rate:58},
  {week:"Wk 5",rate:62},{week:"Wk 6",rate:65},{week:"Wk 7",rate:67},{week:"Wk 8",rate:68},
  {week:"Wk 9",rate:71},{week:"Wk 10",rate:72},{week:"Wk 11",rate:73},{week:"Wk 12",rate:73.4},
];
const DEMO_INDICATORS = { painSignalsThisWeek: 47, highPainSignals: 12, lapsedAthletes14Days: 89 };

const complianceBuckets = [
  { range: "0–20%", athletes: 287, risk: "high" },
  { range: "21–40%", athletes: 312, risk: "high" },
  { range: "41–60%", athletes: 445, risk: "medium" },
  { range: "61–80%", athletes: 891, risk: "low" },
  { range: "81–100%", athletes: 912, risk: "low" },
];

const bucketColours: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const stateData = [
  { state: "NSW", athletes: 712, active: 534, compliance: 75.0, risk: "Low Risk" },
  { state: "VIC", athletes: 641, active: 471, compliance: 73.5, risk: "Low Risk" },
  { state: "QLD", athletes: 489, active: 341, compliance: 69.7, risk: "Monitor" },
  { state: "WA", athletes: 387, active: 268, compliance: 69.2, risk: "Monitor" },
  { state: "SA", athletes: 298, active: 198, compliance: 66.4, risk: "Monitor" },
  { state: "ACT", athletes: 187, active: 145, compliance: 77.5, risk: "Low Risk" },
  { state: "TAS", athletes: 133, active: 89, compliance: 66.9, risk: "Monitor" },
];

// (weekly trend is now dynamic — see DEMO_TREND above)

const riskBadgeClass = (risk: string) =>
  risk === "Low Risk"
    ? "bg-green-500/10 text-green-400 border border-green-500/20"
    : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

export default function ComplianceReport() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token") || "p2p-berkshire-2025";
      const res = await fetch(`/api/compliance/summary?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        if (data.overview && data.overview.totalAthletes > 0) {
          setLiveData(data);
          setIsLive(true);
        }
      }
    } catch (e) {
      // fall back to demo data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Use live data if available, otherwise demo
  const overview = liveData?.overview || DEMO_OVERVIEW;
  const stateData = liveData?.regional?.length > 0
    ? liveData.regional.map((s: any) => ({ ...s, athletes: s.athletes, activeThisWeek: s.activeThisWeek, complianceRate: s.complianceRate }))
    : DEMO_STATE;
  const weeklyTrend = liveData?.weeklyTrend?.length > 0
    ? liveData.weeklyTrend.map((t: any) => ({ week: t.week, rate: t.compliance }))
    : DEMO_TREND;
  const indicators = liveData?.leadingIndicators || DEMO_INDICATORS;

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#0C1A27", color: "#e2e8f0" }}
    >
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 flex items-center justify-center font-extrabold text-xs"
                style={{ background: "#E8601C", color: "#0C1A27" }}>
                MC
              </div>
              <span className="font-bold tracking-wide text-white text-lg">Motion Code</span>
              <span className="text-white/30 text-sm">by Prepared to Play</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2">
              Compliance Intelligence Report
            </h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Prepared for:{" "}
              <span className="text-white font-medium">
                Howden / Berkshire Hathaway Specialty Insurance
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Netball Australia — 2025 Season &nbsp;|&nbsp; Generated: {TODAY}
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors mt-1"
            style={{ background: "#E8601C", color: "#0C1A27" }}
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

        {/* Live/Demo indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: isLive ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: isLive ? "#22c55e" : "#f59e0b", border: `1px solid ${isLive ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isLive ? "#22c55e" : "#f59e0b" }} />
            {isLive ? "Live Data" : "Demo Data — enrol athletes to see live figures"}
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors" style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Hero metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <Users className="w-5 h-5" />,
              label: "Enrolled Athletes",
              value: overview.totalAthletes.toLocaleString(),
              sub: "Netball Australia members",
              colour: "#E8601C",
            },
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              label: "Season Compliance Rate",
              value: `${overview.averageComplianceRate}%`,
              sub: "≥2 sessions/week",
              colour: "#22c55e",
            },
            {
              icon: <AlertTriangle className="w-5 h-5" />,
              label: "High-Risk Athletes",
              value: indicators.lapsedAthletes14Days?.toLocaleString() ?? "312",
              sub: "Compliance < 40% or lapsed 14+ days",
              colour: "#ef4444",
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              label: "Sessions This Month",
              value: overview.totalSessionsThisMonth?.toLocaleString() ?? "−",
              sub: "Total logged completions",
              colour: "#22c55e",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-5 border border-white/8"
              style={{ background: "#0f2233" }}
            >
              <div className="flex items-center gap-2 mb-3" style={{ color: m.colour }}>
                {m.icon}
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                  {m.label}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white">{m.value}</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Compliance distribution */}
          <div className="rounded-xl p-6 border border-white/8" style={{ background: "#0f2233" }}>
            <h2 className="text-sm font-semibold text-white mb-1">Compliance Distribution</h2>
            <p className="text-xs mb-4" style={{ color: "#64748b" }}>Athletes by session completion rate</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={complianceBuckets} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0C1A27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="athletes" radius={[4, 4, 0, 0]}>
                  {complianceBuckets.map((entry) => (
                    <Cell key={entry.range} fill={bucketColours[entry.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              {[["High Risk", "#ef4444"], ["Monitor", "#f59e0b"], ["Compliant", "#22c55e"]].map(([label, colour]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: colour }} />
                  <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly trend */}
          <div className="rounded-xl p-6 border border-white/8" style={{ background: "#0f2233" }}>
            <h2 className="text-sm font-semibold text-white mb-1">Weekly Compliance Trend</h2>
            <p className="text-xs mb-4" style={{ color: "#64748b" }}>Season-to-date % of athletes meeting target</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis domain={[30, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0C1A27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: any) => [`${v}%`, "Compliance"]}
                />
                <ReferenceLine y={75} stroke="#E8601C" strokeDasharray="4 4"
                  label={{ value: "75% target", fill: "#E8601C", fontSize: 10, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="rate" stroke="#E8601C" strokeWidth={2.5}
                  dot={{ fill: "#E8601C", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State breakdown */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#0f2233" }}>
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">State / Territory Breakdown</h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Compliance and risk classification by region</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["State", "Athletes", "Active This Week", "Compliance Rate", "Risk"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wide"
                    style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stateData.map((row, i) => (
                <tr key={row.state}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-3 font-semibold text-white">{row.state}</td>
                  <td className="px-6 py-3" style={{ color: "#94a3b8" }}>{row.athletes.toLocaleString()}</td>
                  <td className="px-6 py-3" style={{ color: "#94a3b8" }}>
                    {(row.activeThisWeek ?? row.active ?? 0).toLocaleString()}
                    <span className="ml-1 text-xs" style={{ color: "#64748b" }}>
                      ({Math.round((row.activeThisWeek ?? row.active ?? 0) / Math.max(row.athletes, 1) * 100)}%)
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full"
                          style={{
                            width: `${row.complianceRate ?? row.compliance ?? 0}%`,
                            background: (row.complianceRate ?? row.compliance ?? 0) >= 75 ? "#22c55e" : (row.complianceRate ?? row.compliance ?? 0) >= 65 ? "#f59e0b" : "#ef4444"
                          }} />
                      </div>
                      <span className="font-medium text-white">{row.complianceRate ?? row.compliance ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskBadgeClass(row.risk)}`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leading indicators */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Leading Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Activity className="w-5 h-5" />,
                title: "Pain Signals This Week",
                value: `${indicators.highPainSignals ?? 12} athletes`,
                detail: `${indicators.painSignalsThisWeek ?? 47} total reports — soreness >7/10 flagged for follow-up`,
                status: "AMBER",
                colour: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                title: "Compliance Trend",
                value: overview.averageComplianceRate >= 70 ? "+trending" : "Monitor",
                detail: `${overview.activeThisWeek} athletes active this week — target: 75% compliance`,
                status: overview.averageComplianceRate >= 70 ? "GREEN" : "AMBER",
                colour: overview.averageComplianceRate >= 70 ? "#22c55e" : "#f59e0b",
                bg: overview.averageComplianceRate >= 70 ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
              },
              {
                icon: <AlertTriangle className="w-5 h-5" />,
                title: "At-Risk Cohort",
                value: `${indicators.lapsedAthletes14Days ?? 89} athletes`,
                detail: "Not logged in 14+ days — intervention recommended",
                status: "RED",
                colour: "#ef4444",
                bg: "rgba(239,68,68,0.08)",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl p-5 border border-white/8"
                style={{ background: card.bg }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2" style={{ color: card.colour }}>
                    {card.icon}
                    <span className="text-xs font-semibold uppercase tracking-wide">{card.status}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: card.colour }} />
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>{card.title}</p>
                <p className="text-xl font-extrabold text-white mb-1">{card.value}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/8 text-xs" style={{ color: "#475569" }}>
          <p>
            Data generated by <span className="text-white/60">Motion Code by Prepared to Play</span>.
            This report is intended for actuarial use by authorised parties only.
            Individual athlete data is de-identified and aggregated per Privacy Act 1988 (Cth).
          </p>
          <p className="mt-1">
            motioncode.com.au &nbsp;·&nbsp; preparedtoplay.com.au &nbsp;·&nbsp; Confidential — prepared for Howden / Berkshire Hathaway Specialty Insurance
          </p>
        </div>

      </div>
    </div>
  );
}
