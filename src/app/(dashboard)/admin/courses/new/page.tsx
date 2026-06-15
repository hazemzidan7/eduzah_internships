import { Topbar } from "@/components/topbar";
import { Card, Input, Textarea, Select, Button } from "@/components/ui";
import { createCourse } from "@/lib/actions/courses";

const CATEGORIES = [
  "Flutter Development",
  "Front-End",
  "Full Stack",
  "Cyber Security",
  "Networking",
  "English",
  "Graphic Design",
  "AI/ML",
];

export default function NewCoursePage() {
  return (
    <div>
      <Topbar title="New Course" subtitle="Create a new course for the platform" />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-2xl">
          <form action={createCourse} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input name="title" required placeholder="e.g. Flutter Development Bootcamp" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea name="description" required rows={4} placeholder="What will students learn in this course?" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select name="category" required defaultValue="">
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select name="status" defaultValue="draft">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Duration</label>
                <Input name="duration_text" placeholder="e.g. 8 weeks" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Banner URL (optional)</label>
                <Input name="banner_url" placeholder="https://..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit">Create Course</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
