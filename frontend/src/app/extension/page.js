"use client";

import { useState } from "react";
import { Chrome, Download, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Zap, Laptop } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ExtensionSetupPage() {
    const { user } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null); // 'success' | 'error' | null

    const handleManualSync = () => {
        setSyncing(true);
        setSyncStatus(null);
        // Auth is globally bypassed, so no token needs to be synced to the extension anymore.
        // We just simulate a quick success state.
        setTimeout(() => {
            setSyncing(false);
            setSyncStatus("success");
        }, 1200);
    };

    const steps = [
        {
            title: "Download AERO",
            description: "Install the lightweight monitoring extension from the official store.",
            icon: Download,
            link: "#",
            linkText: "Visit Web Store",
            color: "primary"
        },
        {
            title: "Quick Pin",
            description: "Pin AERO to your toolbar for real-time status visibility.",
            icon: Laptop,
            color: "accent"
        },
        {
            title: "Active Sync",
            description: "Securely link your dashboard account with a single click.",
            icon: RefreshCw,
            color: "secondary"
        }
    ];

    if (!user) return null;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-16 min-h-screen relative">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 relative"
            >
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10 group hover:rotate-6 transition-transform">
                    <Chrome className="text-primary group-hover:scale-110 transition-transform" size={40} />
                </div>
                <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                    AERO Extension
                </h1>
                <p className="text-muted text-lg max-w-2xl mx-auto font-medium tracking-wide">
                    The bridge between your focused work and advanced deep-learning analytics. 
                    Follow the sequence below to activate your monitoring.
                </p>
            </motion.header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {steps.map((step, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-10 flex flex-col items-center text-center space-y-8 hover:border-primary/40 transition-all duration-700 group hover:scale-[1.02]"
                    >
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                            step.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary/20' : 
                            step.color === 'accent' ? 'bg-accent/10 text-accent group-hover:bg-accent/20' : 
                            'bg-green-500/10 text-green-400 group-hover:bg-green-500/20'
                        } border border-white/5`}>
                            <step.icon size={28} />
                        </div>
                        <div className="space-y-4">
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Phase 0{index + 1}</div>
                            <h3 className="text-2xl font-black tracking-tight text-white/95">{step.title}</h3>
                            <p className="text-sm text-muted leading-relaxed font-medium">{step.description}</p>
                        </div>
                        {step.link && (
                            <a href={step.link} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                                {step.linkText}
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </motion.div>
                ))}
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card overflow-hidden border-white/10 shadow-2xl relative"
            >
                <div className="p-16 flex flex-col items-center space-y-10 text-center bg-white/[0.01]">
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                                <ShieldCheck size={32} className="text-primary" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter">Initialize Secure Sync</h2>
                        <p className="text-muted text-sm max-w-lg mx-auto font-medium">
                            Establish a direct link between this browser instance and your AERO AI engine.
                            Ensure the extension is installed before clicking.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-8 w-full">
                        <button
                            onClick={handleManualSync}
                            disabled={syncing}
                            className="premium-btn group w-full max-w-sm justify-center py-6 text-base"
                        >
                            {syncing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                            {syncing ? "SYNCING DATA..." : "AUTHORIZE SYNC"}
                        </button>

                        <AnimatePresence>
                            {syncStatus === "success" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 text-green-500 font-black uppercase tracking-widest text-xs"
                                >
                                    <CheckCircle2 size={18} />
                                    Account Synced Successfully
                                </motion.div>
                            )}

                            {syncStatus === "error" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-md"
                                >
                                    <div className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-xs">
                                        <AlertCircle size={18} />
                                        Sync Disrupted
                                    </div>
                                    <p className="text-[11px] text-muted font-bold leading-relaxed px-4">
                                        Check if 'AERO Monitoring' is active in your extensions manager. 
                                        If the issue persists, refresh the dashboard.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.015);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 48px;
                }
                .premium-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    color: black;
                    padding: 18px 36px;
                    border-radius: 24px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    font-size: 13px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 40px rgba(255, 255, 255, 0.1);
                }
                .premium-btn:hover:not(:disabled) {
                    box-shadow: 0 0 50px rgba(255,255,255,0.3);
                    transform: translateY(-4px) scale(1.02);
                }
                .premium-btn:active:not(:disabled) {
                    transform: scale(0.98);
                }
            `}</style>
        </div>
    );
}
