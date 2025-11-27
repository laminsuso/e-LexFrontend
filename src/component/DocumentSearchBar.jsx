// src/components/DocumentSearchBar.jsx
import React from "react";

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 12 months" },
];

const SENDER_OPTIONS = [
  { value: "all", label: "Any sender" },
  { value: "me", label: "From me" },
  { value: "others", label: "From others" },
];

export default function DocumentSearchBar({
  searchText,
  onSearchTextChange,
  dateRange,
  onDateRangeChange,
  senderFilter,
  onSenderFilterChange,
  onClear,
}) {
  return (
    <div className="w-full flex flex-wrap items-center gap-3 mb-4">
      {/* Search box */}
      <div className="flex-1 min-w-[220px]">
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm">
          <i className="fas fa-search text-gray-400 mr-2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            placeholder="Search by title, recipient, or folder"
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Date range */}
      <select
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm"
      >
        {DATE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sender filter */}
      <select
        value={senderFilter}
        onChange={(e) => onSenderFilterChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm"
      >
        {SENDER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear button */}
      <button
        type="button"
        onClick={onClear}
        className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300"
      >
        Clear
      </button>
    </div>
  );
}
