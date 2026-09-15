"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Link as LinkIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Building,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { Github, Linkedin } from "@/components/ui/social-icons";
import { DashboardSkeleton, ErrorState } from "@/components/feedback/states";

interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
}

interface CertificationItem {
  id?: string;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
  credentialId?: string;
}

interface ProfileCompleteness {
  percentage: number;
  missing: string[];
  totalChecks: number;
  completedCount: number;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [college, setCollege] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [cgpa, setCgpa] = useState<number | "">("");
  const [semester, setSemester] = useState<number | "">("");
  const [tenthPercentage, setTenthPercentage] = useState<number | "">("");
  const [twelfthPercentage, setTwelfthPercentage] = useState<number | "">("");
  const [activeBacklogs, setActiveBacklogs] = useState<number>(0);
  const [bio, setBio] = useState("");

  // Skills
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [toolsTechnologies, setToolsTechnologies] = useState<string[]>([]);
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newTool, setNewTool] = useState("");

  // Career
  const [targetRole, setTargetRole] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [preferredCompanies, setPreferredCompanies] = useState<string[]>([]);
  const [newCompany, setNewCompany] = useState("");

  // Social & Professional Links
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Projects & Certifications
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);

  // Scores
  const [placementReadiness, setPlacementReadiness] = useState(0);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);

  // Load Real Profile Data
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch("/api/student/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load profile (HTTP ${res.status})`);
      }
      const data = (await res.json()) as any;
      const u = data.user;
      const s = data.student;

      setName(u.name || "");
      setEmail(u.email || "");
      setRollNumber(s.rollNumber || "");
      setDepartment(s.department || "");
      setPhone(s.phone || "");
      setCollege(s.college || "");
      setUniversity(s.university || "");
      setCourse(s.course || "B.Tech");
      setBranch(s.branch || s.department || "");
      setYear(s.year || "Year 3");
      setGraduationYear(s.graduationYear || "2026");
      setCgpa(typeof s.cgpa === "number" ? s.cgpa : "");
      setSemester(typeof s.semester === "number" ? s.semester : "");
      setTenthPercentage(typeof s.tenthPercentage === "number" ? s.tenthPercentage : "");
      setTwelfthPercentage(typeof s.twelfthPercentage === "number" ? s.twelfthPercentage : "");
      setActiveBacklogs(typeof s.activeBacklogs === "number" ? s.activeBacklogs : 0);
      setBio(s.bio || "");

      // Skills arrays
      setTechnicalSkills(Array.isArray(s.technicalSkills) && s.technicalSkills.length > 0 ? s.technicalSkills : s.skills || []);
      setSoftSkills(s.softSkills || []);
      setToolsTechnologies(s.toolsTechnologies || []);

      // Career & Links
      setTargetRole(s.targetRole || "Software Development Engineer (SDE)");
      setTargetDomain(s.targetDomain || "Full Stack & Cloud Systems");
      setPreferredCompanies(s.preferredCompanies || []);
      setGithubUrl(s.githubUrl || "");
      setLinkedinUrl(s.linkedinUrl || "");
      setPortfolioUrl(s.portfolioUrl || "");

      // Projects & Certs
      setProjects(s.projects || []);
      setCertifications(s.certifications || []);
      setPlacementReadiness(s.placementReadiness || 0);
      setCompleteness(data.completeness || null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Skill Helpers
  const addTechSkill = () => {
    if (newTechSkill.trim() && !technicalSkills.includes(newTechSkill.trim())) {
      setTechnicalSkills([...technicalSkills, newTechSkill.trim()]);
      setNewTechSkill("");
    }
  };
  const removeTechSkill = (skill: string) => {
    setTechnicalSkills(technicalSkills.filter((s) => s !== skill));
  };

  const addSoftSkill = () => {
    if (newSoftSkill.trim() && !softSkills.includes(newSoftSkill.trim())) {
      setSoftSkills([...softSkills, newSoftSkill.trim()]);
      setNewSoftSkill("");
    }
  };
  const removeSoftSkill = (skill: string) => {
    setSoftSkills(softSkills.filter((s) => s !== skill));
  };

  const addTool = () => {
    if (newTool.trim() && !toolsTechnologies.includes(newTool.trim())) {
      setToolsTechnologies([...toolsTechnologies, newTool.trim()]);
      setNewTool("");
    }
  };
  const removeTool = (tool: string) => {
    setToolsTechnologies(toolsTechnologies.filter((t) => t !== tool));
  };

  const addCompany = () => {
    if (newCompany.trim() && !preferredCompanies.includes(newCompany.trim())) {
      setPreferredCompanies([...preferredCompanies, newCompany.trim()]);
      setNewCompany("");
    }
  };
  const removeCompany = (comp: string) => {
    setPreferredCompanies(preferredCompanies.filter((c) => c !== comp));
  };

  // Project Helpers
  const addEmptyProject = () => {
    setProjects([
      ...projects,
      {
        title: "",
        description: "",
        technologies: [],
        githubUrl: "",
        liveUrl: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };
  const updateProject = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };
  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Certification Helpers
  const addEmptyCertification = () => {
    setCertifications([
      ...certifications,
      {
        title: "",
        issuer: "",
        issueDate: "",
        credentialUrl: "",
        credentialId: "",
      },
    ]);
  };
  const updateCertification = (index: number, field: keyof CertificationItem, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };
  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Save to Database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        phone,
        bio,
        college,
        university,
        course,
        branch,
        year,
        graduationYear,
        cgpa: typeof cgpa === "number" ? cgpa : undefined,
        semester: typeof semester === "number" ? semester : undefined,
        tenthPercentage: typeof tenthPercentage === "number" ? tenthPercentage : undefined,
        twelfthPercentage: typeof twelfthPercentage === "number" ? twelfthPercentage : undefined,
        activeBacklogs: Number(activeBacklogs) || 0,
        technicalSkills,
        softSkills,
        toolsTechnologies,
        targetRole,
        targetDomain,
        preferredCompanies,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        projects: projects.filter((p) => p.title.trim()),
        certifications: certifications.filter((c) => c.title.trim()),
      };

      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        throw new Error(data.error || "Failed to update profile.");
      }

      const result = (await res.json()) as any;
      setCompleteness(result.completeness);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadProfile();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Placement Profile"
          description="Manage your real academic records, competencies, and placement portfolio."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (errorMessage && !name) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Placement Profile"
          description="Manage your real academic records, competencies, and placement portfolio."
        />
        <ErrorState
          title="Unable to load profile"
          message={errorMessage}
          onRetry={loadProfile}
        />
      </div>
    );
  }

  const completionPct = completeness?.percentage ?? 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Placement Profile"
          description="Keep your verified academic records, technical portfolio, and placement preferences up to date."
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/student/resume")}
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            Resume Creator
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Save Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Profile updated and synchronized with PostgreSQL successfully!</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Completion Meter Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Profile Completion Status
                </h3>
                <Badge
                  variant={completionPct >= 80 ? "default" : "secondary"}
                  className={completionPct >= 80 ? "bg-emerald-600" : "bg-amber-500 text-white"}
                >
                  {completionPct}% Complete
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                A complete profile boosts placement readiness score and generates verified resumes.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-700">{completionPct}%</span>
            </div>
          </div>
          <Progress value={completionPct} className="h-2.5 bg-slate-200" />

          {completeness?.missing && completeness.missing.length > 0 && (
            <div className="mt-4 pt-3 border-t border-blue-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Missing fields: </span>
              {completeness.missing.join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Personal Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic identity and verified contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Likith Yadav"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Authenticated)
              </label>
              <Input value={email} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio / Summary
              </label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Aspiring Software Engineer passionate about distributed systems."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: College & Academic Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              College & Academic Records
            </CardTitle>
            <CardDescription>
              Institutional enrollment and academic performance benchmarks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID / Roll Number *
              </label>
              <Input value={rollNumber} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science and Engineering"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Degree / Course
              </label>
              <Input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="B.Tech"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Artificial Intelligence & Data Science"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Year / Academic Standing
              </label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Year 3 (6th Semester)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Graduation Year
              </label>
              <Input
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2026"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cumulative CGPA (out of 10.0) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="8.50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                12th Standard Percentage (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={twelfthPercentage}
                onChange={(e) => setTwelfthPercentage(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="92.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10th Standard Percentage (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={tenthPercentage}
                onChange={(e) => setTenthPercentage(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="94.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Backlogs
              </label>
              <Input
                type="number"
                min="0"
                value={activeBacklogs}
                onChange={(e) => setActiveBacklogs(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Name
              </label>
              <Input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Institute of Technology"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Name
              </label>
              <Input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="State University"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Skills & Competencies */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Skills & Technical Competencies
            </CardTitle>
            <CardDescription>
              Categorized skills displayed on your candidate profile and resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Technical Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Programming Languages & Core Computer Science
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {technicalSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-50 text-blue-800 border-blue-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeTechSkill(skill)}
                      className="text-blue-500 hover:text-rose-600 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <Input
                  value={newTechSkill}
                  onChange={(e) => setNewTechSkill(e.target.value)}
                  placeholder="e.g. Python, Java, Data Structures"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTechSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTechSkill}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Soft Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Soft Skills & Professional Communication
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {softSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1 text-sm bg-emerald-50 text-emerald-800 border-emerald-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSoftSkill(skill)}
                      className="text-emerald-500 hover:text-rose-600 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <Input
                  value={newSoftSkill}
                  onChange={(e) => setNewSoftSkill(e.target.value)}
                  placeholder="e.g. Technical Leadership, Verbal Presentation"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSoftSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSoftSkill}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tools & Frameworks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Frameworks, Cloud & Developer Tools
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {toolsTechnologies.map((tool) => (
                  <Badge
                    key={tool}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1 text-sm bg-slate-100 text-slate-800 border-slate-300"
                  >
                    {tool}
                    <button
                      type="button"
                      onClick={() => removeTool(tool)}
                      className="text-slate-500 hover:text-rose-600 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <Input
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  placeholder="e.g. Next.js, PostgreSQL, Docker, Git"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTool();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTool}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-blue-600" />
                Technical Projects
              </CardTitle>
              <CardDescription>
                Showcase notable software, engineering, or research projects.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmptyProject}
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" /> Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No projects added yet. Click &quot;Add Project&quot; to highlight your work.
              </p>
            ) : (
              projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Project #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(idx)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Project Title *
                      </label>
                      <Input
                        value={proj.title}
                        onChange={(e) => updateProject(idx, "title", e.target.value)}
                        placeholder="e.g. Distributed Task Queue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Technologies Used (comma separated)
                      </label>
                      <Input
                        value={proj.technologies.join(", ")}
                        onChange={(e) =>
                          updateProject(
                            idx,
                            "technologies",
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="React, Node.js, Redis, PostgreSQL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Project Description & Impact
                    </label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => updateProject(idx, "description", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Describe what you built, algorithmic complexity, and key accomplishments."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        GitHub Repository URL
                      </label>
                      <Input
                        value={proj.githubUrl || ""}
                        onChange={(e) => updateProject(idx, "githubUrl", e.target.value)}
                        placeholder="https://github.com/username/project"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Live Demo / Deployment URL
                      </label>
                      <Input
                        value={proj.liveUrl || ""}
                        onChange={(e) => updateProject(idx, "liveUrl", e.target.value)}
                        placeholder="https://project.domain.com"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section 5: Certifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Certifications & Badges
              </CardTitle>
              <CardDescription>
                Accredited industry certifications (AWS, Microsoft, Google Cloud, Oracle).
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmptyCertification}
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" /> Add Certification
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {certifications.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No certifications added yet.
              </p>
            ) : (
              certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Certificate Name *
                    </label>
                    <Input
                      value={cert.title}
                      onChange={(e) => updateCertification(idx, "title", e.target.value)}
                      placeholder="e.g. AWS Certified Developer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Issuing Organization *
                    </label>
                    <Input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(idx, "issuer", e.target.value)}
                      placeholder="Amazon Web Services"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Credential Link
                      </label>
                      <Input
                        value={cert.credentialUrl || ""}
                        onChange={(e) => updateCertification(idx, "credentialUrl", e.target.value)}
                        placeholder="https://credly.com/..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCertification(idx)}
                      className="text-rose-600 hover:bg-rose-50 h-10 w-10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Section 6: Placement Preferences & Social Links */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Career Preferences & Professional Links
            </CardTitle>
            <CardDescription>
              Target roles and online developer presence for placement drives.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role(s)
              </label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Software Development Engineer (SDE)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Job Domain
              </label>
              <Input
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="Full-Stack, Cloud Architecture, ML Systems"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Profile URL
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Personal Portfolio / Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourname.dev"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save All Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
