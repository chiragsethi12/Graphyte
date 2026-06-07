import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";
import { Camera, Plus, X, UserPlus, Check, ArrowRight } from "lucide-react";
import MotionPage from "../components/layout/MotionPage";
import { motion, AnimatePresence } from "framer-motion";

const COMMON_SKILLS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "AWS",
  "Docker",
  "SQL",
  "Figma",
  "JavaScript",
  "Express",
  "MongoDB",
  "Next.js"
];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1 State: Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 2 State: Skills
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);

  // Step 3 State: Suggestions / Connections
  const [sentRequests, setSentRequests] = useState({});

  // Redirect if user object is not loaded
  useEffect(() => {
    if (user && !user.isNewUser) {
      navigate("/feed", { replace: true });
    }
  }, [user, navigate]);

  // Fetch Suggestions for Step 3
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["onboardingSuggestions"],
    queryFn: () => api.get("/users/suggestions").then((res) => res.data),
    enabled: step === 3
  });

  const suggestions = suggestionsData?.users?.slice(0, 5) || [];

  // Connect Mutation for Step 3
  const connectMutation = useMutation({
    mutationFn: (id) => api.post(`/connections/request/${id}`),
    onSuccess: (_, variables) => {
      setSentRequests((prev) => ({ ...prev, [variables]: true }));
      toast.success("Connection request sent!");
    },
    onError: () => toast.error("Failed to send request")
  });

  // Complete Onboarding Mutation
  const completeMutation = useMutation({
    mutationFn: () => api.patch("/api/users/me", { isNewUser: false }),
    onSuccess: (res) => {
      setUser(res.data.user);
      toast.success("Welcome to Graphyte!");
      navigate("/feed", { replace: true });
    },
    onError: (err) => {
      // Direct update fallback in case path prefix varies
      api.patch("/users/me", { isNewUser: false })
        .then((res) => {
          setUser(res.data.user);
          toast.success("Welcome to Graphyte!");
          navigate("/feed", { replace: true });
        })
        .catch(() => {
          toast.error("Failed to complete onboarding. Please try again.");
        });
    }
  });

  // Handle profile photo select & upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("profilePic", file);

    try {
      const { data } = await api.put("/users/update", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(data.user);
      toast.success("Profile photo uploaded!");
      // Proceed automatically to next step
      setStep(2);
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Add tag logic
  const handleAddSkill = (skill) => {
    const clean = skill.trim();
    if (!clean) return;
    if (skills.includes(clean)) {
      toast.error("Skill already added");
      return;
    }
    setSkills([...skills, clean]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const saveSkillsAndNext = async () => {
    if (skills.length < 3) {
      toast.error("Please add at least 3 skills");
      return;
    }
    if (skills.length > 10) {
      toast.error("Please limit skills to a maximum of 10");
      return;
    }

    setSavingSkills(true);
    try {
      const { data } = await api.put("/users/profile", { skills });
      setUser(data.user);
      toast.success("Skills updated!");
      setStep(3);
    } catch (err) {
      toast.error("Failed to save skills");
    } finally {
      setSavingSkills(false);
    }
  };

  const handleSkipAll = () => {
    completeMutation.mutate();
  };

  return (
    <MotionPage>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-text-primary">
        {/* Abstract dark elements background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#99004C]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#99004C]/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        <div className="w-full max-w-lg z-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <span className="font-extrabold text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#FF4D6D]">
              Graphyte
            </span>
            <p className="text-text-muted mt-2 text-sm">Let's set up your profile to get started</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8 bg-bg-elevated border border-border/60 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-accent h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <Card className="p-6 md:p-8 bg-[#111118]/80 backdrop-blur-md border-border/80 shadow-glow-accent relative">
            {step < 3 && (
              <button
                onClick={handleSkipAll}
                className="absolute top-4 right-6 text-xs font-semibold text-text-muted hover:text-white transition-colors"
              >
                Skip all
              </button>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 1: PROFILE PHOTO */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">Add a profile photo</h2>
                    <p className="text-sm text-text-muted">
                      Add a photo so people know who you are. This increases connection requests by 4x.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-2 border-border/80 flex items-center justify-center overflow-hidden bg-bg-hover relative">
                        {user?.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Avatar src="" name={user?.name || "User"} size="xl" />
                        )}
                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="onboarding-photo-input"
                        className="absolute bottom-1 right-1 bg-accent hover:bg-accent-hover text-white p-2 rounded-full cursor-pointer shadow-md transition-all duration-150 flex items-center justify-center"
                      >
                        <Camera size={16} />
                        <input
                          type="file"
                          id="onboarding-photo-input"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                          disabled={uploadingPhoto}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div />
                    <Button
                      variant="primary"
                      className="px-6"
                      onClick={() => setStep(2)}
                      disabled={uploadingPhoto}
                    >
                      Next Step <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: SKILLS INPUT */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold text-white">What are your top skills?</h2>
                    <p className="text-sm text-text-muted">
                      Add between 3 and 10 skills. This helps us recommend relevant connections and job matches.
                    </p>
                  </div>

                  {/* Tag input block */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a skill (e.g. Next.js) and press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill(skillInput);
                          }
                        }}
                        className="input-base"
                      />
                      <Button
                        variant="primary"
                        onClick={() => handleAddSkill(skillInput)}
                        className="flex-shrink-0"
                      >
                        <Plus size={18} />
                      </Button>
                    </div>

                    {/* Tag list */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-[#0A0A0F] border border-border/40 rounded-lg min-h-[50px] items-center">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-[#1A000A] text-[#FF4D6D] border border-accent/20 rounded-md font-semibold"
                          >
                            {skill}
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-text-muted hover:text-white transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-text-muted px-1">
                      <span>Count: {skills.length}/10</span>
                      {skills.length < 3 && <span className="text-[#FF4D6D]">Add at least {3 - skills.length} more</span>}
                    </div>
                  </div>

                  {/* Suggestions block */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Suggested Stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SKILLS.map((skill) => {
                        const exists = skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => (exists ? handleRemoveSkill(skill) : handleAddSkill(skill))}
                            className={`text-xs px-2.5 py-1.5 border rounded-md font-medium transition-all ${
                              exists
                                ? "bg-accent border-accent text-white"
                                : "bg-[#1A1A1E] border-border hover:bg-bg-hover hover:border-border-muted text-text-primary"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/40">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={saveSkillsAndNext}
                      loading={savingSkills}
                      disabled={skills.length < 3 || skills.length > 10}
                    >
                      Next Step <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SUGGESTIONS */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold text-white">Find your first connection</h2>
                    <p className="text-sm text-text-muted">
                      Connect with people you know on Graphyte to start building your network feed.
                    </p>
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {loadingSuggestions ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 bg-bg-hover/40 border border-border/40 rounded-lg animate-pulse"
                          >
                            <div className="w-10 h-10 bg-bg-hover rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 bg-bg-hover rounded" />
                              <div className="h-2 w-1/2 bg-bg-hover rounded" />
                            </div>
                            <div className="w-16 h-8 bg-bg-hover rounded" />
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length === 0 ? (
                      <p className="text-center text-xs text-text-muted py-6">No suggestions found.</p>
                    ) : (
                      suggestions.map((person) => {
                        const requested = sentRequests[person._id] || connectMutation.variables === person._id;
                        return (
                          <div
                            key={person._id}
                            className="flex items-center gap-3 p-3 bg-bg-hover/30 border border-border/40 rounded-lg hover:border-accent/30 transition-colors"
                          >
                            <Avatar src={person.profilePic} name={person.name} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                              <p className="text-xs text-text-muted truncate">{person.headline || "Professional on Graphyte"}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={requested ? "ghost" : "outline"}
                              className="px-3 min-h-[32px]"
                              disabled={requested || connectMutation.isPending}
                              onClick={() => connectMutation.mutate(person._id)}
                            >
                              {requested ? (
                                <span className="flex items-center gap-1 text-[#FF4D6D] text-xs">
                                  <Check size={12} /> Sent
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs">
                                  <UserPlus size={12} /> Connect
                                </span>
                              )}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/40">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => completeMutation.mutate()}
                      loading={completeMutation.isPending}
                      className="px-6"
                    >
                      Start Exploring <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </MotionPage>
  );
}
