export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  const styles = {
    completed: "bg-green-100 text-green-700 border border-green-300",
    declined: "bg-red-100 text-red-700 border border-red-300",
    pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    sent: "bg-blue-100 text-blue-700 border border-blue-300",
    default: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  const text = {
    completed: "Completed",
    declined: "Declined",
    pending: "In Progress",
    sent: "Sent",
  };

  const className = styles[normalized] || styles.default;
  const label = text[normalized] || status || "Unknown";

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
