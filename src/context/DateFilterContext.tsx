"use client";

import React, { createContext, useContext, useState } from "react";

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

  const setStartDate = (date: string) => {
    setStartDateState(date);
  };

  const setEndDate = (date: string) => {
    setEndDateState(date);
  };

  const clearDates = () => {
    setStartDateState("");
    setEndDateState("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("global_start_date");
      localStorage.removeItem("global_end_date");
    }
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
