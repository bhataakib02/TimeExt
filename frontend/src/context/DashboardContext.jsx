"use client";

import { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    return useContext(DashboardContext);
}
