"use client";

import { useState, useEffect } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import axios from "axios";
import {
    BarChart3,
    PieChart,
    Clock,
    TrendingUp,
    ExternalLink,
    Globe,
    Zap,
    Target,
    Activity,
    Calendar,
    MousePointer2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RePieChart,
    Pie
} from "recharts";

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [range, setRange] = useState("today");
    const [sites, setSites] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [scoreData, setScoreData] = useState({ score: 0, productive: 0, unproductive: 0, neutral: 0, total: 0 });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, range]);

    async function fetchData() {
        setLoading(true);
        try {
            const [sitesRes, distRes, hourlyRes] = await Promise.all([
                axios.get(`${API_URL}/tracking?range=${range}`),
                axios.get(`${API_URL}/tracking/score?range=${range}`),
                axios.get(`${API_URL}/tracking/hourly?range=${range}`)
            ]);

            setSites(sitesRes.data);
            setScoreData(distRes.data);

            const distData = [
                { name: "Productive", value: distRes.data.productive, color: "#22c55e", glow: "rgba(34, 197, 94, 0.4)" },
                { name: "Neutral", value: distRes.data.neutral, color: "#64748b", glow: "rgba(100, 116, 139, 0.2)" },
                { name: "Unproductive", value: distRes.data.unproductive, color: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" }
            ].filter(d => d.value > 0);
            setDistribution(distData);

            const hourlyChartData = hourlyRes.data.map(h => ({
                hour: h.hour,
                display: `${h.hour}:00`,
                total: Math.round((h.productive + h.unproductive + h.neutral) / 60)
            }));
            setHourly(hourlyChartData);

        } catch (err) {
            console.error("Error fetching analytics data:", err);
        } finally {
            setLoading(false);
        }
    }

    function formatTime(seconds) {
        if (!seconds || seconds <= 0) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        let result = "";
        if (h > 0) result += `${h}h `;
        if (m > 0 || h > 0) result += `${m}m `;
        result += `${s}s`;
        return result.trim();
    }

    if (!user) return null;

    const filteredSites = sites
        .filter(site => categoryFilter === "all" || site.category === categoryFilter)
        .slice(0, 20);

    const maxTime = sites.length > 0 ? sites[0].totalTime : 1;
    const rangeLabels = { today: "Today", week: "This Week", month: "This Month" };

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto min-h-screen">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                        Analytics
                    </h1>
                    <p className="text-muted mt-3 font-medium tracking-wide flex items-center gap-2">
                        <Calendar size={14} />
                        Insights for <span className="text-primary font-bold">{rangeLabels[range]}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    {["today", "week", "month"].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-500 relative overflow-hidden group ${
                                range === r ? "text-background" : "text-muted hover:text-white"
                            }`}
                        >
                            {range === r && (
                                <motion.div 
                                    layoutId="range-bg"
                                    className="absolute inset-0 bg-primary shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumStatCard
                    icon={<Clock size={22} />}
                    label="Screen Time"
                    value={formatTime(scoreData.total)}
                    subLabel="Total Active"
                    color="primary"
                    loading={loading}
                />
                <PremiumStatCard
                    icon={<Zap size={22} />}
                    label="Productive"
                    value={formatTime(scoreData.productive)}
                    subLabel="Deep Work"
                    color="green"
                    loading={loading}
                />
                <PremiumStatCard
                    icon={<Globe size={22} />}
                    label="Sites Visited"
                    value={sites.length.toString()}
                    subLabel="Total Sites"
                    color="blue"
                    loading={loading}
                />
                <PremiumStatCard
                    icon={<Target size={22} />}
                    label="Focus Score"
                    value={`${scoreData.score}%`}
                    subLabel="Efficiency"
                    color="accent"
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hourly Activity - Redesigned */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 glass-card p-8 border-white/10 group overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-wider">Hourly Pulse</h2>
                                <p className="text-xs text-muted/60 font-medium">Activity levels throughout the day</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-72 w-full relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted/40 animate-pulse font-black uppercase tracking-widest text-xs">Analyzing Data...</div>
                        ) : hourly.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted/50 text-sm">No activity recorded for this period</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={hourly} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="1 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="display" 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        interval={2}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{
                                            backgroundColor: "rgba(10,10,18,0.95)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "16px",
                                            padding: "16px",
                                            backdropBlur: "12px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }}
                                        labelStyle={{ color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}
                                        formatter={(v) => [`${v} mins`, "Activity"]}
                                    />
                                    <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="url(#barGradient)" minPointSize={4}>
                                        {hourly.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.total > 40 ? "var(--color-primary)" : entry.total > 15 ? "rgba(99, 102, 241, 0.6)" : "rgba(99, 102, 241, 0.2)"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Donut Chart - Ultra Polish */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8 flex flex-col border-white/10 group relative"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[80px] -z-10 group-hover:bg-accent/10 transition-all duration-1000" />
                    
                    <div className="flex items-center gap-4 mb-10 w-full">
                        <div className="p-3 bg-accent/20 rounded-2xl text-accent shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider">Split</h2>
                            <p className="text-xs text-muted/60 font-medium">Usage Allocation</p>
                        </div>
                    </div>

                    <div className="h-56 w-full relative flex items-center justify-center mb-8">
                        {distribution.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <RePieChart>
                                        <Pie
                                            data={distribution}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                            animationDuration={1500}
                                        >
                                            {distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: "rgba(10,10,18,0.9)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "12px",
                                                padding: "10px"
                                            }}
                                            formatter={(v) => [`${formatTime(v)}`, "Time"]}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                                    <span className="text-4xl font-black text-white glow-text">
                                        {scoreData.score}%
                                    </span>
                                    <span className="text-[10px] text-muted uppercase font-black tracking-widest mt-1">Focus</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-muted/40 font-bold uppercase tracking-widest text-xs italic">Awaiting Activity</div>
                        )}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5 mt-auto">
                        {distribution.map((item) => (
                            <div key={item.name} className="flex items-center justify-between group/legend">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.glow}` }} />
                                    <span className="text-sm font-bold text-muted group-hover/legend:text-white transition-colors">{item.name}</span>
                                </div>
                                <span className="text-sm font-black font-mono">{formatTime(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Platform Leaderboard */}
            <div className="glass-card overflow-hidden border-white/10 relative">
                <div className="p-8 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-white/80">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Website Activity</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted/60 font-medium">Top platforms used in {rangeLabels[range]}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        {["all", "productive", "neutral", "unproductive"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-5 py-2 flex items-center gap-2 text-[11px] font-black rounded-xl transition-all capitalize border ${
                                    categoryFilter === cat 
                                    ? "bg-white/10 text-white border-white/20 shadow-xl" 
                                    : "text-muted hover:text-white border-transparent"
                                }`}
                            >
                                {cat !== "all" && (
                                    <div className={`w-2 h-2 rounded-full ${cat === "productive" ? "bg-green-500" : cat === "unproductive" ? "bg-red-500" : "bg-slate-400"}`} />
                                )}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-24 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-muted uppercase tracking-[0.2em] text-[10px] font-black">Decrypting Patterns...</p>
                    </div>
                ) : filteredSites.length === 0 ? (
                    <div className="p-24 text-center">
                        <p className="text-muted/50 font-medium italic">Your journey for {rangeLabels[range].toLowerCase()} is just beginning.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredSites.map((site, index) => {
                                const percentage = maxTime > 0 ? Math.round((site.totalTime / maxTime) * 100) : 0;
                                const isProductive = site.category === "productive";
                                const isUnproductive = site.category === "unproductive";
                                
                                const categoryStyles = isProductive
                                    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                    : isUnproductive
                                        ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                        : "bg-slate-500/10 text-slate-400 border-white/10";

                                const barColors = isProductive
                                    ? "from-green-500/60 to-green-400"
                                    : isUnproductive
                                        ? "from-red-600/60 to-red-400"
                                        : "from-primary/60 to-indigo-400";

                                return (
                                    <motion.div
                                        key={site._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="relative group flex items-center gap-6 px-6 py-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-default mb-2 mx-2"
                                    >
                                        {/* Rank Badge */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-[10px] text-muted/30 group-hover:text-primary transition-colors">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>

                                        {/* Website Info */}
                                        <div className="flex items-center gap-4 min-w-[220px] w-[300px]">
                                            <div className="relative">
                                                <img 
                                                    src={`https://www.google.com/s2/favicons?domain=${site._id}&sz=64`}
                                                    alt=""
                                                    className="w-6 h-6 rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => { e.currentTarget.src = "/globe.svg"; }}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <a 
                                                    href={`https://${site._id}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="font-bold text-sm tracking-tight text-white/90 hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    {site._id}
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-50" />
                                                </a>
                                                <span className={`w-fit mt-1 text-[8px] font-black px-2 py-0.5 rounded-md uppercase border tracking-[0.1em] ${categoryStyles}`}>
                                                    {site.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar Controller */}
                                        <div className="flex-1 hidden md:flex items-center gap-8 pr-2">
                                            <div className="flex-1 h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1, ease: "circOut" }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${barColors} shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
                                                />
                                            </div>
                                            <div className="flex flex-col items-end min-w-[120px]">
                                                <span className="text-sm font-black font-mono text-white/90">{formatTime(site.totalTime)}</span>
                                                <span className="text-[9px] text-muted/50 font-black uppercase tracking-[0.1em]">{percentage}% OF TOTAL</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(15, 15, 23, 0.4);
                    backdrop-filter: blur(20px);
                    border-radius: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: border-color 0.5s ease;
                }
                .glass-card:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .glow-text {
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

function PremiumStatCard({ icon, label, value, subLabel, color, loading }) {
    const variants = {
        primary: "text-primary shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-primary/10 border-primary/20",
        green: "text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.15)] bg-green-500/10 border-green-500/20",
        blue: "text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-blue-500/10 border-blue-500/20",
        accent: "text-accent shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-accent/10 border-accent/20"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-card p-6 border-white/5 relative group cursor-default"
        >
            <div className={`absolute -inset-0.5 rounded-[42px] bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 -z-10`} />
            
            <div className="flex flex-col gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${variants[color]}`}>
                    {icon}
                </div>
                <div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">{label}</span>
                        {loading ? (
                            <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
                        ) : (
                            <span className="text-3xl font-black tracking-tighter text-white/95">{value}</span>
                        )}
                        <span className="text-[10px] text-muted/40 font-bold uppercase tracking-widest mt-2">
                           ● {subLabel}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
