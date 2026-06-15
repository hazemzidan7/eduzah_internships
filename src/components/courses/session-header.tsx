"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Button, Badge, Input, Textarea, Dialog, EmptyState } from "@/components/ui";
import { MaterialIcon } from "@/components/material-icon";
import { AddMaterialDialog } from "@/components/courses/add-material-dialog";
import { updateSession, deleteSession, deleteMaterial } from "@/lib/actions/sessions";
import { formatDate, isOverdue } from "@/lib/utils";
import { ChevronLeft, Pencil, Trash2, Plus, X, Video, FolderOpen, ClipboardList } from "lucide-react";
import type { Session, Material } from "@/lib/types";

export function SessionHeader({
  courseId,
  session,
  canManage,
}: {
  courseId: string;
  session: Session;
  canManage: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground">
        <ChevronLeft size={16} /> Back to course
      </Link>

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{session.title}</h1>
            <p className="mt-1 text-sm text-foreground/50">
              {session.session_date ? formatDate(session.session_date) : "No date set"}
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> Edit</Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Delete this session? This cannot be undone.")) deleteSession(courseId, session.id);
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          )}
        </div>
        {session.description && <p className="text-sm text-foreground/70">{session.description}</p>}
        {session.recording_url && (
          <a href={session.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <Video size={15} /> Watch recording
          </a>
        )}
        {session.assignment_title && (
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ClipboardList size={15} /> {session.assignment_title}
            </div>
            {session.assignment_description && <p className="mt-1 text-sm text-foreground/60">{session.assignment_description}</p>}
            {session.deadline && (
              <p className="mt-1 text-xs text-foreground/50">
                Due {formatDate(session.deadline)}
                {isOverdue(session.deadline) && <span className="ml-2 font-semibold text-danger">Overdue</span>}
              </p>
            )}
          </div>
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen} title="Edit Session">
        <form
          action={async (formData) => {
            await updateSession(courseId, session.id, formData);
            setEditOpen(false);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input name="title" required defaultValue={session.title} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea name="description" rows={3} defaultValue={session.description} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Session date</label>
              <Input type="date" name="session_date" defaultValue={session.session_date ?? ""} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Deadline</label>
              <Input type="date" name="deadline" defaultValue={session.deadline ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Recording URL</label>
            <Input name="recording_url" defaultValue={session.recording_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Assignment title</label>
            <Input name="assignment_title" defaultValue={session.assignment_title ?? ""} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Assignment description</label>
            <Textarea name="assignment_description" rows={2} defaultValue={session.assignment_description ?? ""} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function MaterialsList({
  courseId,
  sessionId,
  materials,
  canManage,
}: {
  courseId: string;
  sessionId: string;
  materials: Material[];
  canManage: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Materials</h2>
        {canManage && (
          <Button variant="secondary" onClick={() => setAddOpen(true)}><Plus size={15} /> Add</Button>
        )}
      </div>

      {materials.length === 0 ? (
        <EmptyState icon={<FolderOpen size={24} />} title="No materials yet" description="Materials for this session will appear here." />
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MaterialIcon type={m.type} />
              </div>
              <a href={m.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground hover:text-primary">{m.title}</p>
                <Badge className="mt-0.5">{m.type.toUpperCase()}</Badge>
              </a>
              {canManage && (
                <button onClick={() => deleteMaterial(courseId, sessionId, m.id)} className="text-foreground/40 hover:text-danger">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddMaterialDialog open={addOpen} onOpenChange={setAddOpen} courseId={courseId} sessionId={sessionId} />
    </Card>
  );
}
