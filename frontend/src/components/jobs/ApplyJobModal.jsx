import { X, Plus, Trash2, Upload } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function ApplyJobModal({ jobId, jobTitle, companyName, onClose }) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      coverLetter: "",
      portfolioLinks: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "portfolioLinks",
  });

  const applyMutation = useMutation({
    mutationFn: (formData) => api.post(`/jobs/${jobId}/apply`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["myApplications"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit application");
    },
  });

  const onSubmit = (values) => {
    const formData = new FormData();
    if (values.resume && values.resume[0]) {
      formData.append("resume", values.resume[0]);
    }
    formData.append("coverLetter", values.coverLetter || "");

    const links = values.portfolioLinks
      .map((link) => link.value?.trim())
      .filter(Boolean);
    formData.append("portfolioLinks", JSON.stringify(links));

    applyMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-bg-overlay rounded-xl border border-border shadow-lg w-full max-w-[500px] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Apply for Role</h2>
            <p className="text-xs text-text-muted mt-0.5">{jobTitle} at {companyName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Resume Upload */}
          <div>
            <label className="text-sm font-semibold text-text-muted mb-1 block">Upload Resume (PDF, DOC, DOCX) *</label>
            <div className="relative">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                error={errors.resume?.message}
                className="file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-muted file:text-accent hover:file:bg-accent-muted-hover cursor-pointer"
                {...register("resume", {
                  required: "Please upload your resume",
                  validate: {
                    fileType: (files) => {
                      if (!files || !files[0]) return true;
                      const file = files[0];
                      const allowedExtensions = [".pdf", ".doc", ".docx"];
                      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
                      return allowedExtensions.includes(ext) || "Only PDF, DOC, and DOCX files are allowed";
                    },
                    fileSize: (files) => {
                      if (!files || !files[0]) return true;
                      return files[0].size <= 10 * 1024 * 1024 || "Resume file size must be under 10MB";
                    },
                  },
                })}
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="text-sm font-semibold text-text-muted mb-1 block">Cover Letter (optional)</label>
            <textarea
              placeholder="Explain why you are a great fit for this role..."
              rows={4}
              maxLength={2000}
              className={`w-full px-3 py-2 text-sm bg-bg-elevated border rounded-md text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none leading-relaxed ${
                errors.coverLetter ? "border-semantic-destructive focus:ring-semantic-destructive" : "border-border hover:border-text-faint"
              }`}
              {...register("coverLetter", {
                maxLength: { value: 2000, message: "Cover letter cannot exceed 2000 characters" },
              })}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.coverLetter ? (
                <p className="text-xs text-semantic-destructive">{errors.coverLetter.message}</p>
              ) : (
                <div />
              )}
              <p className="text-[10px] text-text-faint ml-auto">Max 2,000 characters</p>
            </div>
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text-muted">Portfolio / Work Links</label>
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 py-1 px-2 rounded-md hover:bg-accent-muted transition-colors"
              >
                <Plus size={13} /> Add Link
              </button>
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="e.g. https://github.com/username"
                      error={errors.portfolioLinks?.[index]?.value?.message}
                      {...register(`portfolioLinks.${index}.value`, {
                        pattern: {
                          value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
                          message: "Please enter a valid URL",
                        },
                      })}
                    />
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-3.5 rounded-md border border-border text-text-muted hover:bg-bg-hover hover:text-semantic-destructive transition-colors flex-shrink-0 min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={applyMutation.isPending}
          >
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}
