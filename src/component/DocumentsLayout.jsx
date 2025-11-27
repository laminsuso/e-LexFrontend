// src/components/DocumentsLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DocumentSearchBar from "./DocumentSearchBar"; // we'll create this next

export default function DocumentsLayout() {
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState("6m");
  const [senderFilter, setSenderFilter] = useState("all");

  const handleClear = () => {
    setSearchText("");
    setDateRange("6m");
    setSenderFilter("all");
  };

  return (
    <div className="w-full">
      {/* Search bar at top of all document tabs */}
      <DocumentSearchBar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        senderFilter={senderFilter}
        onSenderFilterChange={setSenderFilter}
        onClear={handleClear}
      />

      {/* Children (Need Sign / In Progress / Completed / Drafts / Declined) */}
      <Outlet context={{ searchText, dateRange, senderFilter }} />
    </div>
  );
}
