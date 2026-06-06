import { TrendingUp } from "lucide-react";

const insights = [
  { category: "STRATEGY", title: "The Rise of Fractional Leadership", readers: "12k professionals reading" },
  { category: "TECH", title: "Ethical AI in Recruitment", readers: "8.6k professionals reading" },
];

export default function TrendingInsights() {
  return (
    <div className="bg-bg-elevated rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">Trending Insights</h3>
        <TrendingUp size={16} className="text-accent" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((item) => (
          <button
            key={item.title}
            className="text-left p-3.5 rounded-md bg-bg-base border border-border hover:bg-bg-hover hover:border-accent transition-colors group min-h-[44px]"
          >
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
              {item.category}
            </span>
            <p className="text-sm font-semibold text-text-primary group-hover:text-accent leading-snug">
              {item.title}
            </p>
            <p className="text-[11px] text-text-muted mt-1">{item.readers}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
