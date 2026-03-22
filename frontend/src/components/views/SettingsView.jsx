"use client";

import { useState, useEffect } from "react";
import {
    User,
    Bell,
    Shield,
    Palette,
    Cloud,
    Trash2,
    Save,
    Loader2,
    Timer
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { useTheme } from "@/components/layout/Providers";

export default function SettingsView() {
    const { user, checkUser, logout } = useAuth();
    const { theme, setTheme: setGlobalTheme } = useTheme();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [notifications, setNotifications] = useState({ focus: true, daily: true });
    const [weeklyGoalHours, setWeeklyGoalHours] = useState(40);
    const [deepWorkMinutes, setDeepWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setGlobalTheme(user.preferences?.theme || "dark");
            setWeeklyGoalHours(user.preferences?.weeklyGoalHours || 40);
            setDeepWorkMinutes(user.preferences?.deepWorkMinutes || 25);
            setBreakMinutes(user.preferences?.breakMinutes || 5);
            const userNotifs = user.preferences?.notifications;
            if (typeof userNotifs === "object" && userNotifs !== null) {
                setNotifications({ focus: userNotifs.focus ?? true, daily: userNotifs.daily ?? true });
            } else if (typeof userNotifs === "boolean") {
                setNotifications({ focus: userNotifs, daily: userNotifs });
            }
        }
    }, [user]);

    const synchronizeSettings = async () => {
        setIsSaving(true);
        try {
            await authService.updateProfile({ name, email });
            await authService.updatePreferences({ theme, notifications, weeklyGoalHours, deepWorkMinutes, breakMinutes });
            await checkUser();
            alert("Settings synchronized successfully.");
        } catch (err) {
            console.error("error saving settings:", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold  tracking-tight">Settings</h1>
                <p className="text-muted mt-2 text-sm">Manage your account and platform preferences.</p>
            </header>

            <div className="flex flex-col gap-6">
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                        <User className="text-primary" size={20} />
                        <h2 className="font-bold  uppercase tracking-wider text-sm">Account Profile</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                        </div>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                        <Timer className="text-primary" size={20} />
                        <h2 className="font-bold uppercase tracking-wider text-sm">Focus Sessions</h2>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-6">
                        <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3" value={deepWorkMinutes} onChange={(e) => setDeepWorkMinutes(parseInt(e.target.value))} placeholder="Work Min" />
                        <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3" value={breakMinutes} onChange={(e) => setBreakMinutes(parseInt(e.target.value))} placeholder="Break Min" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pb-12">
                <button onClick={synchronizeSettings} disabled={isSaving} className="bg-primary text-background px-10 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}
