"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  CheckCircle2,
  ExternalLink,
  Edit,
  Sparkles,
  Loader2,
  Mail,
  Phone,
  Globe,
  GraduationCap,
  Briefcase,
  Award,
} from "lucide-react";
import { Github, Linkedin } from "@/components/ui/social-icons";
import { DashboardSkeleton, ErrorState } from "@/components/feedback/states";
import { jsPDF } from "jspdf";
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } from "docx";

type TemplateType = "modern" | "classic" | "technical";

interface ProfileData {
  user: {
    name: string;
    email: string;
  };
  student: {
    rollNumber: string;
    department: string;
    phone?: string;
    college?: string;
    university?: string;
    course?: string;
    branch?: string;
    year?: string;
    graduationYear?: string;
    cgpa?: number;
    tenthPercentage?: number;
    twelfthPercentage?: number;
    activeBacklogs?: number;
    technicalSkills?: string[];
    softSkills?: string[];
    toolsTechnologies?: string[];
    skills?: string[];
    targetRole?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    bio?: string;
    projects?: Array<{
      title: string;
      description: string;
      technologies: string[];
      githubUrl?: string;
      liveUrl?: string;
    }>;
    certifications?: Array<{
      title: string;
      issuer: string;
      issueDate?: string;
      credentialUrl?: string;
    }>;
  };
  completeness: {
    percentage: number;
    missing: string[];
  };
}

export default function ResumeCreatorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateType>("modern");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/student/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load student profile (HTTP ${res.status})`);
      }
      const data = (await res.json()) as ProfileData;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const user = profile?.user;
  const student = profile?.student;

  const techSkills =
    student?.technicalSkills && student.technicalSkills.length > 0
      ? student.technicalSkills
      : student?.skills || [];
  const tools = student?.toolsTechnologies || [];
  const softSkills = student?.softSkills || [];
  const projects = student?.projects || [];
  const certifications = student?.certifications || [];

  // ==========================================
  // GENERATE PDF USING JSPDF
  // ==========================================
  const handleDownloadPdf = async () => {
    if (!user || !student) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        unit: "pt",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 45;

      // Header: Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(26, 54, 93); // Dark Navy
      doc.text(user.name, margin, y);
      y += 18;

      // Role / Tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(74, 85, 104);
      const roleText = student.targetRole || "Software Development Engineer";
      doc.text(roleText, margin, y);
      y += 14;

      // Contact row
      const contacts: string[] = [];
      if (user.email) contacts.push(user.email);
      if (student.phone) contacts.push(student.phone);
      if (student.linkedinUrl) contacts.push(student.linkedinUrl);
      if (student.githubUrl) contacts.push(student.githubUrl);

      doc.setFontSize(9);
      doc.setTextColor(113, 128, 150);
      doc.text(contacts.join("  |  "), margin, y);
      y += 15;

      // Divider line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;

      const printSectionHeader = (title: string) => {
        if (y > 700) {
          doc.addPage();
          y = 45;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175); // Blue
        doc.text(title.toUpperCase(), margin, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.75);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;
      };

      // 1. Education
      printSectionHeader("Education");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const degree = `${student.course || "B.Tech"} in ${student.branch || student.department || "Computer Science"}`;
      doc.text(degree, margin, y);

      const grad = `Graduation: ${student.graduationYear || "2026"}`;
      doc.setFont("helvetica", "normal");
      doc.text(grad, pageWidth - margin - doc.getTextWidth(grad), y);
      y += 12;

      const institution = `${student.college || "University Institute of Technology"}, ${student.university || "State University"}`;
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text(institution, margin, y);

      if (student.cgpa) {
        const cgpaText = `CGPA: ${student.cgpa} / 10.0`;
        doc.text(cgpaText, pageWidth - margin - doc.getTextWidth(cgpaText), y);
      }
      y += 16;

      // 2. Technical Skills
      printSectionHeader("Skills & Competencies");
      doc.setFontSize(9);

      if (techSkills.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("Languages & Concepts: ", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(techSkills.join(", "), margin + 120, y);
        y += 13;
      }

      if (tools.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("Frameworks & Tools: ", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(tools.join(", "), margin + 120, y);
        y += 13;
      }

      if (softSkills.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("Professional Skills: ", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(softSkills.join(", "), margin + 120, y);
        y += 15;
      }
      y += 3;

      // 3. Projects
      if (projects.length > 0) {
        printSectionHeader("Projects");
        for (const proj of projects) {
          if (y > 700) {
            doc.addPage();
            y = 45;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(proj.title, margin, y);

          if (proj.technologies && proj.technologies.length > 0) {
            const techStr = `[${proj.technologies.join(", ")}]`;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            doc.text(techStr, margin + doc.getTextWidth(proj.title) + 8, y);
          }
          y += 12;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const splitDesc = doc.splitTextToSize(proj.description, pageWidth - margin * 2);
          doc.text(splitDesc, margin, y);
          y += splitDesc.length * 11 + 6;
        }
      }

      // 4. Certifications
      if (certifications.length > 0) {
        printSectionHeader("Certifications");
        for (const cert of certifications) {
          if (y > 720) {
            doc.addPage();
            y = 45;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`•  ${cert.title}`, margin, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          const issuerStr = `— ${cert.issuer}`;
          doc.text(issuerStr, margin + doc.getTextWidth(`•  ${cert.title}`) + 6, y);
          y += 14;
        }
      }

      doc.save(`${user.name.replace(/\s+/g, "_")}_Placement_Resume.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please verify your profile fields.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ==========================================
  // GENERATE DOCX USING DOCX LIBRARY
  // ==========================================
  const handleDownloadDocx = async () => {
    if (!user || !student) return;
    setIsGeneratingDocx(true);

    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Header: Name
              new Paragraph({
                text: user.name,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
              }),
              // Role
              new Paragraph({
                children: [
                  new TextRun({
                    text: student.targetRole || "Software Development Engineer",
                    bold: true,
                    color: "2563EB",
                  }),
                ],
              }),
              // Contacts
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${user.email} | ${student.phone || ""} | ${student.linkedinUrl || ""} | ${student.githubUrl || ""}`,
                    size: 18,
                    color: "64748B",
                  }),
                ],
                spacing: { after: 200 },
              }),

              // Education Section
              new Paragraph({
                text: "EDUCATION",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${student.course || "B.Tech"} in ${student.branch || student.department || "Computer Science"}`,
                    bold: true,
                  }),
                  new TextRun({
                    text: ` — ${student.college || "University Institute of Technology"} (CGPA: ${student.cgpa || "N/A"})`,
                  }),
                ],
              }),
              new Paragraph({
                text: `Graduation: ${student.graduationYear || "2026"}`,
                spacing: { after: 200 },
              }),

              // Skills Section
              new Paragraph({
                text: "SKILLS & COMPETENCIES",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Technical Skills: ", bold: true }),
                  new TextRun({ text: techSkills.join(", ") }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Frameworks & Tools: ", bold: true }),
                  new TextRun({ text: tools.join(", ") }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Soft Skills: ", bold: true }),
                  new TextRun({ text: softSkills.join(", ") }),
                ],
                spacing: { after: 200 },
              }),

              // Projects Section
              ...(projects.length > 0
                ? [
                    new Paragraph({
                      text: "PROJECTS",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 200, after: 100 },
                    }),
                    ...projects.flatMap((p) => [
                      new Paragraph({
                        children: [
                          new TextRun({ text: p.title, bold: true }),
                          new TextRun({
                            text: p.technologies?.length ? ` (${p.technologies.join(", ")})` : "",
                            italics: true,
                          }),
                        ],
                      }),
                      new Paragraph({
                        text: p.description,
                        spacing: { after: 120 },
                      }),
                    ]),
                  ]
                : []),

              // Certifications Section
              ...(certifications.length > 0
                ? [
                    new Paragraph({
                      text: "CERTIFICATIONS",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 200, after: 100 },
                    }),
                    ...certifications.map(
                      (c) =>
                        new Paragraph({
                          children: [
                            new TextRun({ text: `• ${c.title}`, bold: true }),
                            new TextRun({ text: ` — ${c.issuer}` }),
                          ],
                        })
                    ),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.name.replace(/\s+/g, "_")}_Placement_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX generation error:", err);
      alert("Failed to generate DOCX file.");
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Resume Creator"
          description="Transform your verified placement profile into campus-ready resumes."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Resume Creator"
          description="Transform your verified placement profile into campus-ready resumes."
        />
        <ErrorState
          title="Profile Data Required"
          message={error || "Could not retrieve your student profile."}
          onRetry={loadProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Resume Creator"
          description="Generated directly from your verified profile data without manual re-entry."
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/student/profile")}
            className="flex items-center gap-1.5"
          >
            <Edit className="h-4 w-4" /> Edit Profile Data
          </Button>
          <Button
            onClick={handleDownloadDocx}
            disabled={isGeneratingDocx}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 flex items-center gap-2"
          >
            {isGeneratingDocx ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-blue-600" />
            )}
            Download DOCX
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold text-slate-900">Select Resume Template:</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={template === "modern" ? "default" : "outline"}
            onClick={() => setTemplate("modern")}
            className={template === "modern" ? "bg-blue-600 text-white" : ""}
          >
            Modern Campus
          </Button>
          <Button
            size="sm"
            variant={template === "classic" ? "default" : "outline"}
            onClick={() => setTemplate("classic")}
            className={template === "classic" ? "bg-blue-600 text-white" : ""}
          >
            Classic ATS
          </Button>
          <Button
            size="sm"
            variant={template === "technical" ? "default" : "outline"}
            onClick={() => setTemplate("technical")}
            className={template === "technical" ? "bg-blue-600 text-white" : ""}
          >
            Technical SDE
          </Button>
        </div>
      </div>

      {/* Live Resume Preview Paper */}
      <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200 shadow-lg max-w-4xl mx-auto space-y-6 font-sans text-slate-800">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {user?.name || "Student Name"}
              </h1>
              <p className="text-base font-medium text-blue-600 mt-1">
                {student?.targetRole || "Software Development Engineer (SDE)"}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </div>
              {student?.phone && (
                <div className="flex items-center sm:justify-end gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
            {student?.linkedinUrl && (
              <a
                href={student.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
            {student?.githubUrl && (
              <a
                href={student.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-800 hover:underline"
              >
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
            {student?.portfolioUrl && (
              <a
                href={student.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-800 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" /> Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
            Education
          </h2>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-900">
                {student?.course || "B.Tech"} in {student?.branch || student?.department || "Computer Science and Engineering"}
              </p>
              <p className="text-sm text-slate-600">
                {student?.college || "Institute of Technology"}, {student?.university || "State Technical University"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">
                Graduation: {student?.graduationYear || "2026"}
              </span>
              {student?.cgpa && (
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  CGPA: {student.cgpa} / 10.0
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
            Technical Competencies
          </h2>
          <div className="space-y-1.5 text-sm">
            {techSkills.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800">Programming Languages: </span>
                <span className="text-slate-600">{techSkills.join(", ")}</span>
              </div>
            )}
            {tools.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800">Frameworks & Cloud Tools: </span>
                <span className="text-slate-600">{tools.join(", ")}</span>
              </div>
            )}
            {softSkills.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800">Professional Skills: </span>
                <span className="text-slate-600">{softSkills.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
              Technical Projects
            </h2>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-900 text-sm">{proj.title}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-xs font-mono text-slate-500">
                        [{proj.technologies.join(", ")}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
              Certifications & Honors
            </h2>
            <div className="space-y-1.5">
              {certifications.map((c, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">• {c.title}</span>
                  <span className="text-slate-500">{c.issuer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
