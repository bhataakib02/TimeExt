"use client";

import { useState, useEffect } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import axios from "axios";
import {
    ShieldAlert,
    Lock,
    EyeOff,
    Globe,
    Plus,
    X,
    Trash2,
    Cpu,
    Zap,
    Activity,
    BrainCircuit,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FocusPage() {
    const { user, updatePreference } = useAuth();
    const [sites, setSites] = useState([]);
    const [newSite, setNewSite] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBlocklist();
        }
    }, [user]);

    async function fetchBlocklist() {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${API_URL}/focus/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSites(res.data);
        } catch (err) {
            console.error("Error fetching blocklist:", err);
        } finally {
            setLoading(false);
        }
    }

    const syncWithExtension = () => {
        try {
            const extensionId = "dfbcfgkpgbfbdjabippomkelpkboffen";
            console.log(`📡 Syncing blocklist to extension: ${extensionId}`);
            if (typeof window !== "undefined" && window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
                window.chrome.runtime.sendMessage(extensionId, { action: "syncAll" }, (response) => {
                    if (window.chrome.runtime.lastError) {
                        console.warn("❌ Could not sync blocklist:", window.chrome.runtime.lastError.message);
                    } else {
                        console.log("✅ Blocklist synced successfully");
                    }
                });
            }
        } catch (error) {
            console.warn("Extension sync failed or skipped:", error);
        }
    };

    const addSite = async () => {
        if (newSite && !sites.find(s => s.website === newSite)) {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await axios.post(`${API_URL}/focus/`, { website: newSite }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSites([...sites, res.data]);
                setNewSite("");
                syncWithExtension();
            } catch (err) {
                console.error("Error adding site to blocklist:", err);
            }
        }
    };

    const removeSite = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${API_URL}/focus/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSites(sites.filter(s => s._id !== id));
            syncWithExtension();
        } catch (err) {
            console.error("Error removing site from blocklist:", err);
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-16 min-h-screen relative pb-20">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[5%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[5%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[130px]" />
            </div>

            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center shadow-lg shadow-accent/10 border border-accent/20">
                            <ShieldAlert className="text-accent" size={32} />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                            Focus Mode
                        </h1>
                    </div>
                    <p className="text-muted text-lg font-medium max-w-2xl tracking-wide">
                        Deploy neural-layer blocking to eliminate distractions across your entire digital environment. 
                        Your focus is your most valuable currency.
                    </p>
                </div>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
                {/* Blocklist Management - 7 Cols */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7 space-y-8"
                >
                    <div className="glass-card p-10 space-y-10 border-white/5 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <h2 className="text-xs font-black uppercase text-primary tracking-[0.3em] flex items-center gap-3">
                                <Lock size={16} />
                                Neural Blocklist
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                {sites.length} Active Rules
                            </span>
                        </div>

                        <div className="relative group">
                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-all duration-500" size={20} />
                            <input
                                type="text"
                                value={newSite}
                                onChange={(e) => setNewSite(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addSite()}
                                placeholder="Add site (e.g. reddit.com)..."
                                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-6 pl-14 pr-16 focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all text-base font-medium placeholder:text-muted/50"
                            />
                            <button
                                onClick={addSite}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-background p-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {loading ? (
                                <div className="py-20 text-center space-y-4">
                                    <Activity className="mx-auto text-primary animate-pulse" size={40} />
                                    <p className="text-muted text-xs font-black uppercase tracking-widest animate-pulse">Initializing Blocklist...</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {sites.length === 0 ? (
                                        <div className="py-20 text-center space-y-6">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                                                <EyeOff size={40} />
                                            </div>
                                            <p className="text-muted font-bold text-sm">Your digital workspace is currently unrestricted.</p>
                                        </div>
                                    ) : (
                                        sites.map((site) => (
                                            <motion.div
                                                key={site._id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-3xl group hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                                                        <img 
                                                            src={`https://www.google.com/s2/favicons?domain=${site.website}&sz=64`} 
                                                            alt="" 
                                                            className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="font-black text-white/90 block text-lg">{site.website}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Status: restricted</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeSite(site._id)}
                                                    className="p-3 text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Focus Settings & Info - 5 Cols */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-5 space-y-10"
                >
                    <div className="glass-card p-10 space-y-10 border-white/5 shadow-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Activity className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Advanced Guard</h3>
                        </div>
                        
                        <div className="space-y-8">
                            <ToggleSetting
                                icon={<Lock className="text-accent" size={18} />}
                                label="Strict Lock"
                                description="Force activation across all synced devices"
                                checked={user.preferences?.strictMode}
                                onChange={(val) => updatePreference('strictMode', val)}
                                accentColor="accent"
                            />
                            <ToggleSetting
                                icon={<BrainCircuit className="text-primary" size={18} />}
                                label="AI Smart Block"
                                description="Detect adaptive distraction patterns"
                                checked={user.preferences?.smartBlock}
                                onChange={(val) => updatePreference('smartBlock', val)}
                                accentColor="primary"
                            />
                            <ToggleSetting
                                icon={<Zap className="text-yellow-400" size={18} />}
                                label="Flow Reminders"
                                description="Neuro-optimized break intervals"
                                checked={user.preferences?.breakReminders}
                                onChange={(val) => updatePreference('breakReminders', val)}
                                accentColor="yellow"
                            />
                        </div>
                    </div>

                    <div className="glass-card p-10 bg-gradient-to-br from-primary/10 to-transparent border-white/10 group overflow-hidden relative">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3 text-primary">
                                <Cpu size={28} className="animate-pulse" />
                                <h3 className="text-2xl font-black tracking-tight">How it Works</h3>
                            </div>
                            <div className="space-y-4">
                                <StepInfo 
                                    icon={<ShieldCheck className="text-green-400" size={16} />}
                                    text="Sites added to your blocklist are synchronized in real-time to your Chrome Extension."
                                />
                                <StepInfo 
                                    icon={<ShieldCheck className="text-green-400" size={16} />}
                                    text="AERO AI monitors tab behavior and restricts access to distraction sources during active flow sessions."
                                />
                                <StepInfo 
                                    icon={<ShieldCheck className="text-green-400" size={16} />}
                                    text="Smart Block uses deep-learning to identify and disable infinite-scroll patterns automatically."
                                />
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <a href="/extension" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors flex items-center gap-2">
                                    Check Extension Status <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.015);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 48px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 54px;
                    height: 28px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.05);
                    transition: .4s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 4px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }
                input:checked + .slider {
                    background-color: #6366f1;
                    border-color: rgba(99, 102, 241, 0.5);
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
                }
                input:checked + .slider.accent {
                    background-color: #f43f5e;
                    border-color: rgba(244, 63, 94, 0.5);
                    box-shadow: 0 0 20px rgba(244, 63, 94, 0.2);
                }
                input:checked + .slider.yellow {
                    background-color: #f59e0b;
                    border-color: rgba(245, 158, 11, 0.5);
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
                }
                input:checked + .slider:before {
                    transform: translateX(24px);
                    background-color: white;
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
}

function ToggleSetting({ icon, label, description, checked, onChange, accentColor }) {
    return (
        <div className="flex items-center justify-between group/toggle p-4 rounded-3xl hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-5">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                    {icon}
                </div>
                <div>
                    <p className="text-base font-black text-white/90">{label}</p>
                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold opacity-60">{description}</p>
                </div>
            </div>
            <label className="switch">
                <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className={`slider round ${accentColor}`}></span>
            </label>
        </div>
    );
}

function StepInfo({ icon, text }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1">{icon}</div>
            <p className="text-sm font-medium text-foreground/70 leading-relaxed">{text}</p>
        </div>
    );
}

function ChevronRight({ size, className }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}
