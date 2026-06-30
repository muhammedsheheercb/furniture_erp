"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DateFilterContextType {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  clearDates: () => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  const [startDate, setStartDateState] = useState<string>("");
  const [endDate, setEndDateState] = useState<string>("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedStart = localStorage.getItem("global_start_date");
    const savedEnd = localStorage.getItem("global_end_date");
    if (savedStart) setStartDateState(savedStart);
    if (savedEnd) setEndDateState(savedEnd);
  }, []);

  const setStartDate = (date: string) => {
    setStartDateState(date);
    if (date) {
      localStorage.setItem("global_start_date", date);
    } else {
      localStorage.removeItem("global_start_date");
    }
  };

  const setEndDate = (date: string) => {
    setEndDateState(date);
    if (date) {
      localStorage.setItem("global_end_date", date);
    } else {
      localStorage.removeItem("global_end_date");
    }
  };

  const clearDates = () => {
    setStartDateState("");
    setEndDateState("");
    localStorage.removeItem("global_start_date");
    localStorage.removeItem("global_end_date");
  };

  return (
    <DateFilterContext.Provider
      value={{
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        clearDates,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error("useDateFilter must be used within a DateFilterProvider");
  }
  return context;
}
