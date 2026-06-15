"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input, Textarea, StatusBadge, Avatar, Dialog, EmptyState } from "@/components/ui";
import { submitAssignment, gradeSubmission } from "@/lib/actions/submissions";
import { formatDateTime } from "@/lib/utils";
import { Loader2, FileCheck, Link2, Download } from "lucide-react";
import type { Submission, Profile } from "@/lib/types";

export function StudentSubmissionPanel({
  courseId,
  sessionId,
  userId,
  submission,
}: {
  courseId: string;
  sessionId: string;
  userId: string;
  submission: Submission | null;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = submission?.status === "approved";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const file = formData.get("file") as File | null;
      const link = (formData.get("link_url") as string) || null;

      if (file && file.size > 0) {
        const supabase = createClient();
        const path = `${userId}/${sessionId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
        await submitAssignment(courseId, sessionId, { file_url: urlData.publicUrl, file_name: file.name });
      } else if (link) {
        await submitAssignment(courseId, sessionId, { link_url: link });
      } else {
        setError("Attach a file or provide a link.");
        setLoading(false);
        return;
      }
      setLinkUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Your Submission</h2>
        <StatusBadge status={submission?.status ?? "not_submitted"} />
      </div>

      {submission && submission.status !== "not_submitted" && (
        <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm">
          <p className="text-foreground/70">Submitted {formatDateTime(submission.submitted_at)}</p>
          {submission.file_name && (
            <a href={submission.file_url ?? "#"} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 font-medium text-primary hover:underline">
              <Download size={14} /> {submission.file_name}
            </a>
          )}
          {submission.link_url && (
            <a href={submission.link_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 font-medium text-primary hover:underline">
              <Link2 size={14} /> {submission.link_url}
            </a>
          )}
          {submission.grade !== null && (
            <p className="mt-2 font-semibold text-foreground">Grade: {submission.grade}%</p>
          )}
          {submission.feedback && <p className="mt-1 text-foreground/70">Feedback: {submission.feedback}</p>}
        </div>
      )}

      {locked ? (
        <p className="text-sm text-foreground/50">This submission has been approved and can no longer be edited.</p>
      ) : (
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Upload file</label>
            <input name="file" type="file" className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground" />
          </div>
          <p className="text-center text-xs text-foreground/40">— or —</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Submission link</label>
            <Input name="link_url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            <FileCheck size={16} /> {submission && submission.status !== "not_submitted" ? "Resubmit" : "Submit"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export function InstructorSubmissionPanel({
  courseId,
  sessionId,
  students,
  submissions,
}: {
  courseId: string;
  sessionId: string;
  students: Profile[];
  submissions: Submission[];
}) {
  const [gradingFor, setGradingFor] = useState<{ submission: Submission; student: Profile } | null>(null);
  const subMap = new Map(submissions.map((s) => [s.student_id, s]));

  if (students.length === 0) {
    return <EmptyState icon={<FileCheck size={24} />} title="No students enrolled" description="Enroll students to track their submissions." />;
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold text-foreground">Submissions</h2>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-foreground/50">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((st) => {
              const sub = subMap.get(st.id);
              return (
                <tr key={st.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={st.name} src={st.avatar_url} size={26} />
                      <span className="font-medium text-foreground">{st.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/50">{sub?.submitted_at ? formatDateTime(sub.submitted_at) : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={sub?.status ?? "not_submitted"} /></td>
                  <td className="px-4 py-3 text-foreground/70">{sub?.grade !== null && sub?.grade !== undefined ? `${sub.grade}%` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {sub && sub.status !== "not_submitted" && (
                      <button onClick={() => setGradingFor({ submission: sub, student: st })} className="text-xs font-medium text-primary hover:underline">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {gradingFor && (
        <Dialog open={!!gradingFor} onOpenChange={(open) => !open && setGradingFor(null)} title={`Review — ${gradingFor.student.name}`}>
          <div className="space-y-3">
            {gradingFor.submission.file_name && (
              <a href={gradingFor.submission.file_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Download size={14} /> {gradingFor.submission.file_name}
              </a>
            )}
            {gradingFor.submission.link_url && (
              <a href={gradingFor.submission.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Link2 size={14} /> {gradingFor.submission.link_url}
              </a>
            )}
            <form
              action={async (formData) => {
                await gradeSubmission(courseId, sessionId, gradingFor.submission.id, formData);
                setGradingFor(null);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Grade (%)</label>
                <Input name="grade" type="number" min={0} max={100} defaultValue={gradingFor.submission.grade ?? ""} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Feedback</label>
                <Textarea name="feedback" rows={3} defaultValue={gradingFor.submission.feedback ?? ""} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" name="action" value="review" variant="secondary">Save Review</Button>
                <Button type="submit" name="action" value="approve">Approve</Button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
