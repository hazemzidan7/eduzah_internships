import { FileText, FileArchive, FileVideo, Link2, File, Presentation } from "lucide-react";
import type { MaterialType } from "@/lib/types";

export function MaterialIcon({ type, size = 18 }: { type: MaterialType; size?: number }) {
  switch (type) {
    case "pdf":
      return <FileText size={size} />;
    case "zip":
      return <FileArchive size={size} />;
    case "video":
      return <FileVideo size={size} />;
    case "link":
      return <Link2 size={size} />;
    case "ppt":
      return <Presentation size={size} />;
    case "doc":
      return <File size={size} />;
    default:
      return <File size={size} />;
  }
}
