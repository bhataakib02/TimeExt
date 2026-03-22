/**
 * DASHBOARD OVERVIEW PAGE - ULTRA PREMIUM REDESIGN
 */
"use client";

import { useEffect, useState } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import axios from "axios";
import { 
    Activity, 
    TrendingUp, 
    Clock, 
    Target, 
    Zap, 
    ArrowUpRight, 
    Search, 
    Bell, 
    X, 
    Plus, 
    Pencil, 
    Trophy,
    ExternalLink,
    PieChart,
    ChevronRight,
    MousePointer2,
    LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { io } from "socket.io-client";
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

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        score: 0,
        totalTime: 0,
        productiveTime: 0,
        unproductiveTime: 0,
        neutralTime: 0,
        streak: 0,
        peakHour: null
    });
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topSites, setTopSites] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [celebratedGoal, setCelebratedGoal] = useState(null);
    const [showNewGoal, setShowNewGoal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        label: "",
        targetSeconds: 3600,
        type: "productive",
        website: ""
    });

    useEffect(() => {
        if (user) {
            fetchAllData();

            const socket = io("http://localhost:5003");
            socket.emit("authenticate", { userId: user.id });

            socket.on("notification", (notif) => {
                setNotifications(prev => [...prev, { id: Date.now(), ...notif }]);
                setTimeout(() => {
                    setNotifications(prev => prev.slice(1));
                }, 5000);
            });

            return () => socket.disconnect();
        }
    }, [user]);

    async function fetchAllData() {
        setLoading(true);
        try {
            const [statsRes, goalsRes, sitesRes] = await Promise.all([
                axios.get(`${API_URL}/tracking/stats`),
                axios.get(`${API_URL}/goals/progress`),
                axios.get(`${API_URL}/tracking?range=today&limit=5`)
            ]);

            setStats(statsRes.data);
            setGoals(goalsRes.data);
            setTopSites(sitesRes.data.slice(0, 5));

            const newlyCompleted = goalsRes.data.find(g => (g.currentSeconds || 0) >= g.targetSeconds && !sessionStorage.getItem(`celebrated_${g._id}`));
            if (newlyCompleted) {
                setCelebratedGoal(newlyCompleted);
                sessionStorage.setItem(`celebrated_${newlyCompleted._id}`, "true");
            }
        } catch (err) {
            console.error("Could not fetch dashboard data");
        } finally {
            setLoading(false);
        }
    }

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (editingGoal) {
                res = await axios.put(`${API_URL}/goals/${editingGoal._id}`, newGoal);
                setGoals(goals.map(g => g._id === res.data._id ? res.data : g));
            } else {
                res = await axios.post(`${API_URL}/goals/`, newGoal);
                setGoals([...goals, res.data]);
            }
            setShowNewGoal(false);
            setEditingGoal(null);
            setNewGoal({ label: "", targetSeconds: 3600, type: "productive", website: "" });
        } catch (err) {
            console.error("❌ Error creating/updating goal:", err.response?.data || err.message);
        }
    };

    const formatPeakHour = (hour) => {
        if (hour === null || hour === undefined) return "Calculating...";
        const h = hour % 12 || 12;
        const ampm = hour >= 12 ? "PM" : "AM";
        return `Peak @ ${h} ${ampm}`;
    };

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

    const distribution = [
        { name: "Productive", value: stats.productiveTime || 0, color: "#22c55e" },
        { name: "Neutral", value: stats.neutralTime || 0, color: "#94a3b8" },
        { name: "Unproductive", value: stats.unproductiveTime || 0, color: "#ef4444" }
    ].filter(d => d.value > 0);

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto min-h-screen">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            {/* Notifications */}
            <div className="fixed top-8 right-8 z-50 flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="pointer-events-auto glass-card p-4 border-l-4 border-l-primary flex items-start gap-4 shadow-2xl min-w-[300px]"
                        >
                            <Bell className="text-primary mt-1" size={20} />
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-wider">{n.title}</h4>
                                <p className="text-xs text-muted font-medium">{n.message}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <header className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Welcome back, {user?.name.split(' ')[0]}
                    </h1>
                    <p className="text-muted mt-3 font-medium tracking-wide flex items-center gap-2">
                        <Activity size={14} className="text-primary" />
                        AERO AI is monitoring your <span className="text-white font-black underline decoration-primary/50 underline-offset-4">Productivity Momentum</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/analytics" className="premium-btn group">
                        <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" />
                        Detailed Report
                    </Link>
                </div>
            </header>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Zap size={24} />}
                    label="Focus Score"
                    value={`${stats.score}%`}
                    trend={stats.score > 70 ? "OPTIMAL" : "NEEDS FOCUS"}
                    color="primary"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="Total Focus"
                    value={formatTime(stats.totalTime)}
                    trend={`${formatTime(stats.productiveTime)} prod.`}
                    color="accent"
                />
                <StatCard
                    icon={<Target size={24} />}
                    label="Streak"
                    value={`${stats.streak} Days`}
                    trend="RESISTANCE"
                    color="secondary"
                />
                <StatCard
                    icon={<Activity size={24} />}
                    label="Peak Period"
                    value={stats.peakHour ? `${stats.peakHour % 12 || 12} ${stats.peakHour >= 12 ? 'PM' : 'AM'}` : "..."}
                    trend="IDEAL ZONE"
                    color="blue"
                />
            </div>

            {/* Main Summary Section - REDESIGNED PER USER REQUEST */}
            <div className="relative">
                <div className="glass-card overflow-hidden border-white/5 shadow-2xl">
                    {/* Header bar */}
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Daily Activity Hub</h2>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Real-time performance snapshot</p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Live Live Monitoring</span>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Col 1: Summary Table */}
                            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                                <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={14} /> Usage Breakdown
                                </h3>
                                
                                <div className="space-y-3">
                                    <ActivityRow label="Deep Work (Productive)" time={stats.productiveTime} color="green" total={stats.totalTime} />
                                    <ActivityRow label="Distraction (Unproductive)" time={stats.unproductiveTime} color="red" total={stats.totalTime} />
                                    <ActivityRow label="Necessary Tasks (Neutral)" time={stats.neutralTime} color="slate" total={stats.totalTime} />
                                    <div className="pt-4 border-t border-white/5">
                                        <ActivityRow label="Total Screen Time" time={stats.totalTime} color="primary" total={stats.totalTime} isBold />
                                    </div>
                                </div>
                            </div>

                            {/* Col 2: Goal Tracking List */}
                            <div className="lg:col-span-6 xl:col-span-4 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Target size={14} /> Active Goals
                                    </h3>
                                    <button onClick={() => setShowNewGoal(true)} className="text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
                                        + Add New
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {goals.length > 0 ? (
                                        goals.slice(0, 3).map(goal => (
                                            <div key={goal._id} className="relative group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-black tracking-tight text-white/80">{goal.label || goal.website}</span>
                                                    <span className="text-[10px] font-bold font-mono text-muted">{goal.targetSeconds > 0 ? Math.round((goal.currentSeconds/goal.targetSeconds)*100) : 0}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${goal.targetSeconds > 0 ? Math.min(100, (goal.currentSeconds/goal.targetSeconds)*100) : 0}%` }}
                                                        className={`h-full bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]`}
                                                    />
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        setEditingGoal(goal);
                                                        setNewGoal({ label: goal.label, targetSeconds: goal.targetSeconds, type: goal.type, website: goal.website });
                                                        setShowNewGoal(true);
                                                    }} className="p-1 hover:text-primary"><Pencil size={12} /></button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-[10px] text-muted/40 font-black uppercase tracking-widest">No Goals Set</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Col 3: Visual Distribution */}
                            <div className="lg:col-span-6 xl:col-span-3 flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-[40px] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="h-40 w-full relative mb-4">
                                    {distribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <RePieChart>
                                                <Pie
                                                    data={distribution}
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {distribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full rounded-full border-4 border-white/5 border-dashed flex items-center justify-center">
                                            <PieChart className="text-muted/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-sm font-black text-muted uppercase tracking-tighter">Focus</span>
                                        <span className="text-xl font-black text-white">{stats.score}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-white/90 uppercase tracking-widest mb-1">Focus Insight</p>
                                    <p className="text-[10px] text-muted italic leading-relaxed px-4">
                                        {stats.peakHour ? `Ideal focus phase at ${stats.peakHour}:00.` : "Analyzing patterns..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Top Platforms Recap */}
            <section className="space-y-6 pb-20">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                        <MousePointer2 size={16} className="text-secondary" /> Top Activity Today
                    </h3>
                    <Link href="/analytics" className="text-[10px] font-black text-muted hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                        View Ranking <ArrowUpRight size={14} />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {topSites.map((site, i) => (
                        <motion.div
                            key={site._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-5 group hover:bg-white/[0.04] transition-all hover:scale-[1.03] cursor-pointer"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center p-1.5">
                                    <img src={`https://www.google.com/s2/favicons?domain=${site._id}&sz=64`} className="w-full h-full rounded" alt="" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black truncate text-white/90">{site._id}</h4>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">#{i+1}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-black font-mono text-primary">{formatTime(site.totalTime)}</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${site.category === 'productive' ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Modal for New Goal */}
            <AnimatePresence>
                {showNewGoal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card w-full max-w-md p-10 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                            <button onClick={() => setShowNewGoal(false)} className="absolute top-6 right-6 text-muted hover:text-white"><X size={24} /></button>
                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Set Target</h2>
                            </div>
                            <form onSubmit={handleCreateGoal} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Goal Name</label>
                                    <input required value={newGoal.label} onChange={e=>setNewGoal({...newGoal, label:e.target.value})} className="premium-input" placeholder="e.g. Build Feature" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Target (Hrs)</label>
                                        <input type="number" value={Math.floor(newGoal.targetSeconds/3600)} onChange={e=>setNewGoal({...newGoal, targetSeconds: (parseInt(e.target.value)*3600 + (newGoal.targetSeconds%3600))})} className="premium-input" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Website</label>
                                        <input required value={newGoal.website} onChange={e=>setNewGoal({...newGoal, website:e.target.value})} className="premium-input" placeholder="github.com" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary text-background font-black py-4 rounded-2xl hover:scale-[1.02] shadow-xl transition-all">
                                    ACTIVATE GOAL
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Celebration Modal */}
            <AnimatePresence>
                {celebratedGoal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card w-full max-w-sm p-12 text-center"
                        >
                            <Trophy size={80} className="mx-auto text-yellow-500 mb-8 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Mastery Achieved!</h2>
                            <p className="text-muted font-bold tracking-widest uppercase text-[10px] mb-8">{celebratedGoal.label || celebratedGoal.website}</p>
                            <button onClick={() => setCelebratedGoal(null)} className="premium-btn w-full justify-center">CONTINUE GRIND</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.015);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 48px;
                }
                .premium-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    color: black;
                    padding: 12px 24px;
                    border-radius: 18px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 11px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-btn:hover {
                    box-shadow: 0 0 30px rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .premium-input {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 14px 20px;
                    outline: none;
                    font-size: 13px;
                    font-weight: 600;
                    color: white;
                    transition: all 0.3s;
                }
                .premium-input:focus {
                    border-color: rgba(99, 102, 241, 0.4);
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color }) {
    const colors = {
        primary: "text-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]",
        accent: "text-accent bg-accent/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]",
        secondary: "text-[#22c55e] bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
        blue: "text-blue-400 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className={`glass-card p-7 relative overflow-hidden group border-white/5`}
        >
            <div className="relative z-10 space-y-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]} border border-white/5`}>
                    {icon}
                </div>
                <div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">{label}</div>
                    <div className="text-3xl font-black tracking-tighter mt-1 text-white/95">{value}</div>
                    <div className="mt-2 text-[9px] font-black text-muted/60 uppercase tracking-widest flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors[color].split(' ')[0].replace('text-', 'bg-')}`} />
                        {trend}
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full -mr-10 -mt-10 blur-2xl" />
        </motion.div>
    );
}

function ActivityRow({ label, time, color, total, isBold }) {
    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        let res = "";
        if (h > 0) res += `${h}h `;
        if (m > 0) res += `${m}m `;
        res += `${s}s`;
        return res;
    };

    const colors = {
        green: "bg-green-500 text-green-400",
        red: "bg-red-500 text-red-400",
        slate: "bg-slate-400 text-slate-400",
        primary: "bg-primary text-primary"
    };

    return (
        <div className={`flex items-center justify-between group ${isBold ? 'text-white' : 'text-muted/80'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${colors[color].split(' ')[0]}`} />
                <span className={`text-[12px] font-bold tracking-tight ${isBold ? 'text-sm' : ''}`}>{label}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className={`font-mono ${isBold ? 'text-lg font-black' : 'text-sm font-bold'}`}>{formatTime(time)}</span>
                {!isBold && total > 0 && (
                    <span className="text-[9px] font-black opacity-20 group-hover:opacity-100 transition-opacity">
                        {total > 0 ? Math.round((time/total)*100) : 0}% Usage
                    </span>
                )}
            </div>
        </div>
    );
}
