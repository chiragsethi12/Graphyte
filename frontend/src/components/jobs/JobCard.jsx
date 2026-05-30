import { useMemo } from "react";
import { MapPin, DollarSign, Clock, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Badge from "../ui/Badge";

const badgeConfig = {
  "Active Now": "green",
  "Featured": "premium",
};

function formatSalary(salary) {
  if (!salary) return null;
  if (typeof salary === "string") return salary;

  const { min, max, currency, period } = salary;
  if (!min && !max) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} – ${fmt(max)} / ${period}`;
  if (min) return `From ${fmt(min)} / ${period}`;
  return `Up to ${fmt(max)} / ${period}`;
}

export default function JobCard({ job }) {
  const { user } = useAuth();

  // Query myApplications to determine applied status
  const { data: appsData } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => api.get("/jobs/my-applications").then((r) => r.data),
  });

  const isApplied = useMemo(() => {
    if (!appsData?.applications) return false;
    return appsData.applications.some((app) => {
      const jobId = typeof app.job === "object" ? app.job?._id : app.job;
      return jobId === job._id;
    });
  }, [appsData, job._id]);

  const isOwner = typeof job.postedBy === "object" ? job.postedBy?._id === user?._id : job.postedBy === user?._id;
  const badge = job.badge || (job.featured ? "Featured" : null);

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5 flex flex-col gap-3 hover:shadow-card-hover transition-all duration-150 h-full">
      {/* Top Section: Logo & Badges */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 overflow-hidden flex-shrink-0">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain" />
          ) : (
            job.company?.[0]
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {isApplied && <Badge variant="green" className="text-[10px]">Applied</Badge>}
          {badge && (
            <Badge variant={badgeConfig[badge] || "gray"} className="text-[10px]">{badge}</Badge>
          )}
        </div>
      </div>

      {/* Title & Company */}
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{job.title}</h3>
        <p className="text-sm font-medium text-primary mt-0.5 truncate">{job.company}</p>
        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed min-h-[4.5em]">{job.description}</p>
      </div>

      {/* Skills badge chips (max 4, then "+N more") */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 bg-primary-50 text-primary-800 text-[10px] font-medium rounded-full border border-primary-100"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Meta parameters */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        )}
        {formatSalary(job.salary) && (
          <span className="flex items-center gap-1"><DollarSign size={11} />{formatSalary(job.salary)}</span>
        )}
        {job.type && (
          <span className="flex items-center gap-1"><Clock size={11} />{job.type}</span>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-100 pt-3 mt-auto flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <Calendar size={11} />
          Posted {new Date(job.createdAt).toLocaleDateString()}
        </span>
        {isOwner && (
          <span className="text-xs font-semibold text-primary">
            {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
