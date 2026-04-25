"use client";
import Select, { StylesConfig, GroupBase } from "react-select";
import { ISelectOption } from "@/types";

interface SearchSelectProps {
    label?: string;
    placeholder?: string;
    options: ISelectOption[];
    value?: ISelectOption | null;
    onChange: (opt: ISelectOption | null) => void;
    isLoading?: boolean;
    isDisabled?: boolean;
    error?: string;
    required?: boolean;
}

const customStyles: StylesConfig<ISelectOption, false, GroupBase<ISelectOption>> = {
    control: (base, state) => ({
        ...base,
        minHeight: "38px",
        fontSize: "14px",
        borderRadius: "8px",
        borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(99,102,241,0.3)" : "none",
        "&:hover": { borderColor: "#6366f1" },
    }),
    option: (base, state) => ({
        ...base,
        fontSize: "14px",
        backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#eef2ff" : "white",
        color: state.isSelected ? "white" : "#111827",
        cursor: "pointer",
    }),
    menu: (base) => ({ ...base, borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 99 }),
    singleValue: (base) => ({ ...base, fontSize: "14px", color: "#111827" }),
    placeholder: (base) => ({ ...base, fontSize: "14px", color: "#9ca3af" }),
};

export default function SearchSelect({
    label, placeholder = "Search...", options, value, onChange,
    isLoading, isDisabled, error, required,
}: SearchSelectProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <Select
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                isLoading={isLoading}
                isDisabled={isDisabled}
                styles={customStyles}
                isClearable
                isSearchable
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}