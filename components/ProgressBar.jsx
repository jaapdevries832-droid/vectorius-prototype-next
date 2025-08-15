export default function ProgressBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
