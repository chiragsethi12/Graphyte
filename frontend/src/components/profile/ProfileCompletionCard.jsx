import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Card from "../ui/Card";

const FIELDS = [
  { key: "name",       label: "Full name",       weight: 10, check: (u) => !!u.name?.trim() },
  { key: "headline",   label: "Headline",         weight: 15, check: (u) => !!u.headline?.trim() },
  { key: "about",      label: "About / Bio",      weight: 20, check: (u) => !!(u.about?.trim() || u.bio?.trim()) },
  { key: "profilePic", label: "Profile photo",     weight: 15, check: (u) => !!u.profilePic },
  { key: "bannerPic",  label: "Banner image",      weight: 5,  check: (u) => !!u.bannerPic },
  { key: "location",   label: "Location",          weight: 5,  check: (u) => !!u.location?.trim() },
  { key: "skills",     label: "Skills (3+)",       weight: 10, check: (u) => (u.skills?.length || 0) >= 3 },
  { key: "experience", label: "Experience",        weight: 10, check: (u) => (u.experience?.length || 0) >= 1 },
  { key: "education",  label: "Education",         weight: 10, check: (u) => (u.education?.length || 0) >= 1 },
];

/* ─── SVG Circular Progress Ring ──────────────────────────────── */
function ProgressRing({ percentage, size = 96, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on completion
  const strokeColor =
    percentage >= 80
      ? "#22c55e"   // green-500
      : percentage >= 50
      ? "#f59e0b"   // amber-500
      : "#660033";  // primary

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function ProfileCompletionCard({ profile }) {
  const navigate = useNavigate();

  const { percentage, completed, suggestions } = useMemo(() => {
    let earned = 0;
    const done = [];
    const todo = [];

    for (const field of FIELDS) {
      if (field.check(profile)) {
        earned += field.weight;
        done.push(field);
      } else {
        todo.push(field);
      }
    }

    return {
      percentage: earned,
      completed: done,
      suggestions: todo,
    };
  }, [profile]);

  // Don't show if profile is 100% complete
  if (percentage === 100) return null;

  return (
    <Card className="p-5">
      {/* Ring + heading */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <ProgressRing percentage={percentage} size={80} strokeWidth={6} />
          {/* Percentage text centered in the ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-extrabold text-gray-800">{percentage}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Profile Strength</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {percentage < 50
              ? "Let's get started!"
              : percentage < 80
              ? "Looking good — keep going!"
              : "Almost there!"}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.slice(0, 3).map((field) => (
            <button
              key={field.key}
              onClick={() => navigate("/settings")}
              className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <AlertCircle size={14} className="text-gray-300 flex-shrink-0" />
              <span className="text-xs text-gray-600 flex-1">
                Add <span className="font-semibold text-gray-800">{field.label.toLowerCase()}</span>
                {" "}to reach {Math.min(percentage + field.weight, 100)}%
              </span>
              <ArrowRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Completed fields */}
      {completed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {completed.map((field) => (
              <span
                key={field.key}
                className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium"
              >
                <CheckCircle size={10} />
                {field.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
