"use client";

import { useState, useEffect } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import axios from "axios";
import {
    Target,
    CheckCircle2,
    Circle,
    Plus,
    Trophy,
    Flame,
    X,
    Trash2,
    Zap,
    Pencil,
    ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GoalsPage() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [showNewGoal, setShowNewGoal] = useState(false);
    const [celebratedGoal, setCelebratedGoal] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newGoal, setNewGoal] = useState({
        label: "",
        targetSeconds: 3600,
        type: "productive",
        website: ""
    });

    useEffect(() => {
        if (user) {
            fetchGoals();
        }
    }, [user]);

    async function fetchGoals() {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${API_URL}/goals/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGoals(res.data);

            const newlyCompleted = res.data.find(g => (g.currentSeconds || 0) >= g.targetSeconds && !sessionStorage.getItem(`celebrated_${g._id}`));
            if (newlyCompleted) {
                setCelebratedGoal(newlyCompleted);
                sessionStorage.setItem(`celebrated_${newlyCompleted._id}`, "true");
            }
        } catch (err) {
            console.error("❌ Error fetching goals:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateGoal(e) {
        e.preventDefault();
        try {
            const token = localStorage.getItem("accessToken");
            console.log("✈️ Sending Goal Request:", { mode: editingGoal ? "PUT" : "POST", goal: newGoal, url: editingGoal ? `${API_URL}/goals/${editingGoal._id}` : `${API_URL}/goals` });
            let res;
            if (editingGoal) {
                // Update existing goal
                res = await axios.put(`${API_URL}/goals/${editingGoal._id}`, newGoal, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGoals(goals.map(g => g._id === res.data._id ? res.data : g));
            } else {
                // Create new goal
                res = await axios.post(`${API_URL}/goals`, newGoal, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGoals([...goals, res.data]);
            }
            setShowNewGoal(false);
            setEditingGoal(null);
            setNewGoal({ label: "", targetSeconds: 3600, type: "productive", website: "" });
        } catch (err) {
            console.error("❌ Error creating/updating goal:", err.response?.data || err.message);
        }
    }

    const openEditModal = (goal) => {
        setEditingGoal(goal);
        setNewGoal({
            label: goal.label,
            targetSeconds: goal.targetSeconds,
            type: goal.type,
            website: goal.website || ""
        });
        setShowNewGoal(true);
    };

    async function handleDeleteGoal(id) {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${API_URL}/goals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGoals(goals.filter(g => g._id !== id));
        } catch (err) {
            console.error("Error deleting goal");
        }
    }

    if (!user) return null;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold  tracking-tight">Goals & Targets</h1>
                    <p className="text-muted mt-2 ">Define your productivity boundaries and track your progress.</p>
                </div>
                <button
                    onClick={() => setShowNewGoal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Set New Goal
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-muted italic">Analyzing your objectives...</div>
                ) : goals.length === 0 ? (
                    <div className="col-span-full glass-card p-20 flex flex-col items-center justify-center text-center space-y-4">
                        <Target size={48} className="text-muted/20" />
                        <h3 className="text-xl font-bold ">No goals set yet</h3>
                        <p className="text-muted text-sm max-w-xs ">Break your day into measurable targets to stay focused and productive.</p>
                        <button onClick={() => setShowNewGoal(true)} className="btn-secondary mt-4">Create Your First Goal</button>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div key={goal._id} className="glass-card p-8 group hover:border-primary/50 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${goal.type === 'productive' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                                    {goal.type === 'productive' ? <Zap size={24} /> : <Target size={24} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(goal)}
                                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        title="Edit Goal"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to delete this goal?")) {
                                                handleDeleteGoal(goal._id);
                                            }
                                        }}
                                        className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                        title="Delete Goal"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold  mb-2">{goal.label || goal.website}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted font-black uppercase tracking-widest mb-6">
                                <span className={goal.type === 'productive' ? 'text-primary' : 'text-accent'}>{goal.type}</span>
                                <span>•</span>
                                <span>{Math.floor(goal.targetSeconds / 3600) > 0 ? `${Math.floor(goal.targetSeconds / 3600)}h ` : ""}{Math.floor((goal.targetSeconds % 3600) / 60)}m Target</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-muted">Progress</span>
                                    <span>{goal.progress || 0}%</span>
                                </div>
                                <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, goal.progress || 0)}%` }} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for New Goal */}
            <AnimatePresence>
                {showNewGoal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-card w-full max-w-md p-8 relative shadow-2xl border-primary/20"
                        >
                            <button
                                onClick={() => {
                                    setShowNewGoal(false);
                                    setEditingGoal(null);
                                    setNewGoal({ label: "", targetSeconds: 3600, type: "productive", website: "" });
                                }}
                                className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8">
                                <h1 className="text-3xl font-bold  text-foreground">
                                    {editingGoal ? "Edit Goal" : "Set New Goal"}
                                </h1>
                                <p className="text-sm text-muted  mt-1">
                                    {editingGoal ? "Refine your productivity targets." : "Define your target and start tracking."}
                                </p>
                            </div>

                            <form onSubmit={handleCreateGoal} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Goal Name</label>
                                    <input
                                        required
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-foreground/[0.08] transition-all  text-sm text-foreground"
                                        placeholder="e.g. Deep Work Session"
                                        value={newGoal.label}
                                        onChange={e => setNewGoal({ ...newGoal, label: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Target Time</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-foreground/[0.08] transition-all  text-sm pr-12 text-foreground"
                                                placeholder="0"
                                                value={Math.floor(newGoal.targetSeconds / 3600)}
                                                onChange={e => {
                                                    const h = parseInt(e.target.value) || 0;
                                                    const m = Math.floor((newGoal.targetSeconds % 3600) / 60);
                                                    setNewGoal({ ...newGoal, targetSeconds: (h * 3600) + (m * 60) });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-muted font-black group-focus-within:text-primary uppercase">HRS</span>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-foreground/[0.08] transition-all  text-sm pr-12 text-foreground"
                                                placeholder="0"
                                                value={Math.floor((newGoal.targetSeconds % 3600) / 60)}
                                                onChange={e => {
                                                    const m = parseInt(e.target.value) || 0;
                                                    const h = Math.floor(newGoal.targetSeconds / 3600);
                                                    setNewGoal({ ...newGoal, targetSeconds: (h * 3600) + (m * 60) });
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-muted font-black group-focus-within:text-primary uppercase">MIN</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Goal Type</label>
                                        <select
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-foreground/[0.08] transition-all  text-sm appearance-none cursor-pointer text-foreground"
                                            value={newGoal.type}
                                            onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}
                                        >
                                            <option value="productive" className="bg-background text-foreground">Productive</option>
                                            <option value="unproductive" className="bg-background text-foreground">Limit (Max)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Website (Required)</label>
                                        <input
                                            required
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-foreground/[0.08] transition-all  text-sm text-foreground"
                                            placeholder="e.g. github.com"
                                            value={newGoal.website}
                                            onChange={e => setNewGoal({ ...newGoal, website: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary text-background font-bold py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 active:scale-95 text-sm mt-4">
                                    {editingGoal ? "Update Goal Target" : "Create Goal Target"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Celebration Modal */}
            <AnimatePresence>
                {celebratedGoal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="glass-card w-full max-w-sm p-10 text-center relative overflow-hidden border-primary/20 shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
                            <Trophy size={64} className="mx-auto text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            <h2 className="text-3xl font-black  mb-2 text-foreground">Goal Completed!</h2>
                            <p className="text-sm text-muted  mb-6">Congratulations! You successfully completed:</p>
                            <div className="bg-foreground/5 py-3 px-4 rounded-xl mb-8 border border-foreground/10">
                                <p className="font-bold text-lg text-primary tracking-wide uppercase">{celebratedGoal.label || celebratedGoal.website}</p>
                            </div>
                            <button
                                onClick={() => setCelebratedGoal(null)}
                                className="w-full bg-primary text-background font-bold py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 active:scale-95 text-sm"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


// Unused GoalStat and GoalItem components removed for code clarity.
