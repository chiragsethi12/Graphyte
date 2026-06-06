import { X, MapPin, Briefcase, Clock, DollarSign, Users, ChevronRight, ExternalLink, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

function formatSalary(salary) {
    if (!salary?.min && !salary?.max) return null;
    const fmt = (n) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: salary.currency || "USD", maximumFractionDigits: 0 }).format(n);
    if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)} / ${salary.period}`;
    if (salary.min) return `From ${fmt(salary.min)} / ${salary.period}`;
    return `Up to ${fmt(salary.max)} / ${salary.period}`;
}

const TYPE_LABELS = {
    "full-time": "Full-Time",
    "part-time": "Part-Time",
    "remote": "Remote",
    "internship": "Internship",
    "contract": "Contract",
};

const EXP_LABELS = {
    "any": "Any Experience",
    "entry": "Entry Level",
    "mid": "Mid Level",
    "senior": "Senior",
    "lead": "Lead / Principal",
};

export default function JobDetailModal({ jobId, onClose }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["job", jobId],
        queryFn: () => api.get(`/jobs/${jobId}`).then((r) => r.data),
        enabled: !!jobId,
    });

    const { data: appsData } = useQuery({
        queryKey: ["myApplications"],
        queryFn: () => api.get("/jobs/my-applications").then((r) => r.data),
    });

    const job = data?.job;
    const myApplications = appsData?.applications || [];
    const hasApplied = myApplications.some((a) => a.job?._id === jobId || a.job === jobId);

    const applyMutation = useMutation({
        mutationFn: () => api.post(`/jobs/${jobId}/apply`),
        onSuccess: () => {
            toast.success("Application submitted!");
            queryClient.invalidateQueries({ queryKey: ["myApplications"] });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to apply"),
    });

    const isOwner = job?.postedBy?._id === user?._id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
            <div className="bg-bg-overlay h-full w-full max-w-[520px] flex flex-col border-l border-border shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <p className="text-sm font-semibold text-text-muted">Job Details</p>
                    <button onClick={onClose} className="p-2 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary">
                        <X size={18} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : job ? (
                    <div className="flex-1 overflow-y-auto">
                        {/* Company + Title */}
                        <div className="px-6 pt-6 pb-4 border-b border-border">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-accent-muted border border-border-accent flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
                                    {job.company?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-text-primary leading-tight">{job.title}</h2>
                                    <p className="text-sm font-semibold text-accent mt-0.5">{job.company}</p>
                                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-muted">
                                        {job.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} /> {job.location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Briefcase size={12} /> {TYPE_LABELS[job.type] || job.type}
                                        </span>
                                        {job.experienceLevel && (
                                            <span className="flex items-center gap-1">
                                                <Layers size={12} /> {EXP_LABELS[job.experienceLevel] || job.experienceLevel}
                                            </span>
                                        )}
                                        {job.applicants?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> {job.applicants.length} applicant{job.applicants.length !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    {formatSalary(job.salary) && (
                                        <div className="mt-2.5 flex items-center gap-1 text-sm font-bold text-accent">
                                            <DollarSign size={14} />
                                            {formatSalary(job.salary)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="mt-5">
                                {isOwner ? (
                                    <Button variant="outline" fullWidth disabled>You posted this job</Button>
                                ) : (hasApplied || applyMutation.isSuccess) ? (
                                    <Button variant="outline" fullWidth disabled>
                                        Applied ✓
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={() => applyMutation.mutate()}
                                        loading={applyMutation.isPending}
                                        disabled={!job.isActive}
                                    >
                                        {job.isActive ? "Apply Now" : "Job Closed"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Skills */}
                        {job.skills?.length > 0 && (
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="text-sm font-bold text-text-primary mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((s) => (
                                        <span key={s} className="px-3 py-1 bg-accent-muted text-accent text-xs font-semibold rounded-full border border-border-accent">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="px-6 py-4 border-b border-border">
                            <h3 className="text-sm font-bold text-text-primary mb-3">About the Role</h3>
                            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </p>
                        </div>

                        {/* Deadline */}
                        {job.deadline && (
                            <div className="px-6 py-4 border-b border-border">
                                <div className="flex items-center gap-2 text-sm text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/20 p-3 rounded-md">
                                    <Clock size={14} />
                                    <span>
                                        Apply before{" "}
                                        <strong>
                                            {new Date(job.deadline).toLocaleDateString("en-US", {
                                                month: "long", day: "numeric", year: "numeric",
                                            })}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Posted by */}
                        {job.postedBy && (
                            <div className="px-6 py-4">
                                <h3 className="text-sm font-bold text-text-primary mb-3">Posted By</h3>
                                <Link
                                    to={`/profile/${job.postedBy.username || job.postedBy._id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3.5 rounded-md border border-border bg-bg-base hover:border-accent hover:bg-bg-hover transition-colors"
                                >
                                    <Avatar src={job.postedBy.profilePic} name={job.postedBy.name} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-text-primary">{job.postedBy.name}</p>
                                        <p className="text-xs text-text-muted truncate">{job.postedBy.headline}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-text-faint" />
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-muted">
                        <p>Job not found</p>
                    </div>
                )}
            </div>
        </div>
    );
}