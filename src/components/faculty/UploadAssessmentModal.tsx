"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

interface UploadAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultYear?: string;
  defaultBranch?: string;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv"];
const MAX_FILE_SIZE_MB = 25;

export function UploadAssessmentModal({
  open,
  onOpenChange,
  onSuccess,
  defaultYear = "3rd Year",
  defaultBranch = "AI & DS",
}: UploadAssessmentModalProps) {
  const [year, setYear] = useState(defaultYear);
  const [branch, setBranch] = useState(defaultBranch);

  useEffect(() => {
    if (open) {
      if (defaultYear) setYear(defaultYear);
      if (defaultBranch) setBranch(defaultBranch);
    }
  }, [open, defaultYear, defaultBranch]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("QUIZ");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [status, setStatus] = useState("PUBLISHED");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    const lowerName = selectedFile.name.toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isValidExtension) {
      setErrorMessage("Unsupported file type. Supported formats: PDF, DOCX, XLSX, CSV.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client validations
    if (!title.trim()) {
      setErrorMessage("Please enter an assessment name.");
      return;
    }

    if (Number(maxMarks) <= 0 || isNaN(Number(maxMarks))) {
      setErrorMessage("Maximum marks must be greater than 0.");
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setErrorMessage("End date cannot be earlier than start date.");
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("year", year);
      formData.append("branch", branch);
      formData.append("type", type);
      formData.append("description", description.trim());
      formData.append("maxMarks", maxMarks);
      formData.append("status", status);
      if (startDate) formData.append("startDate", startDate);
      if (endDate) formData.append("endDate", endDate);
      if (file) formData.append("file", file);

      setUploadProgress(40);

      const res = await fetch("/api/faculty/assessments/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setUploadProgress(100);
      setSuccessMessage("Assessment uploaded successfully!");

      setTimeout(() => {
        // Reset and close
        setTitle("");
        setDescription("");
        setFile(null);
        setStartDate("");
        setEndDate("");
        setMaxMarks("100");
        setIsUploading(false);
        setUploadProgress(0);
        setSuccessMessage(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Upload Assessment
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Publish an assessment and curriculum resources for your cohort.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Year & Branch Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Year <span className="text-rose-500">*</span>
              </label>
              <SimpleSelect
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={[
                  { label: "4th Year", value: "4th Year" },
                  { label: "3rd Year", value: "3rd Year" },
                  { label: "2nd Year", value: "2nd Year" },
                ]}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Branch <span className="text-rose-500">*</span>
              </label>
              <SimpleSelect
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                options={[
                  { label: "AI & DS", value: "AI & DS" },
                  { label: "AI & ML", value: "AI & ML" },
                  { label: "CSE", value: "CSE" },
                  { label: "Cyber Security", value: "Cyber Security" },
                ]}
              />
            </div>
          </div>

          {/* Assessment Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assessment Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Java Assessment III or Quantitative Diagnostic"
              required
            />
          </div>

          {/* Type & Maximum Marks Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assessment Type <span className="text-rose-500">*</span>
              </label>
              <SimpleSelect
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={[
                  { label: "Quiz", value: "QUIZ" },
                  { label: "Aptitude", value: "APTITUDE" },
                  { label: "Coding", value: "CODING" },
                  { label: "Theory", value: "THEORY" },
                  { label: "Assignment", value: "ASSIGNMENT" },
                ]}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Maximum Marks <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                placeholder="100"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Description & Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Brief instructions, topics covered, or evaluation criteria..."
            />
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assessment File <span className="text-xs text-slate-400">(PDF, DOCX, XLSX, CSV up to 25MB)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  validateAndSetFile(e.target.files[0]);
                }
              }}
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
            />
            {file ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">
                  Click to browse or drag and drop your file here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PDF, DOCX, XLSX, CSV (Max 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Dates & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                End Date
              </label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Status
              </label>
              <SimpleSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { label: "Published", value: "PUBLISHED" },
                  { label: "Draft", value: "DRAFT" },
                ]}
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Uploading assessment...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="bg-blue-600 text-white hover:bg-blue-700 min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Upload Assessment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
