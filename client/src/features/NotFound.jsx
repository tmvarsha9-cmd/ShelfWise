import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border rounded-card max-w-lg mx-auto my-12">
      <div className="w-12 h-12 rounded-btn bg-surface-muted border border-border flex items-center justify-center text-text-muted mb-4">
        <FileQuestion className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h1 className="text-[20px] font-semibold text-text mb-2">Page not found</h1>
      <p className="text-[14px] text-text-muted mb-6">
        The screen or record you requested does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to dashboard</span>
      </Link>
    </div>
  );
}
