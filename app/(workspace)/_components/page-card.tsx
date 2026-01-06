import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { ExternalLink, Edit2, Eye, Clock, User } from "lucide-react";
import Link from "next/link";

interface PageCardProps {
  page: {
    id: string;
    title: string;
    slug: string;
    type:
      | "BLOG"
      | "CHANGELOG"
      | "HELP_DOC"
      | "HELPDESK"
      | "KNOWLEDGE_BASE"
      | "FAQ";
    status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
    createdAt: Date;
    updatedAt: Date;
    author: string;
    publishedAt: Date | null;
  };
  workspaceSlug: string;
}

export function PageCard({ page, workspaceSlug }: PageCardProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "BLOG":
        return {
          label: "Blog",
          variant: "secondary" as const,
          color: "bg-blue-100 text-blue-700",
        };
      case "CHANGELOG":
        return {
          label: "Changelog",
          variant: "secondary" as const,
          color: "bg-purple-100 text-purple-700",
        };
      case "HELP_DOC":
        return {
          label: "Help Doc",
          variant: "secondary" as const,
          color: "bg-green-100 text-green-700",
        };
      default:
        return {
          label: type,
          variant: "secondary" as const,
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return {
          label: "Published",
          color: "bg-green-100 text-green-700",
          dot: "●",
        };
      case "DRAFT":
        return {
          label: "Draft",
          color: "bg-yellow-100 text-yellow-700",
          dot: "●",
        };
      case "SCHEDULED":
        return {
          label: "Scheduled",
          color: "bg-blue-100 text-blue-700",
          dot: "●",
        };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700", dot: "●" };
    }
  };

  const short = (date: Date) => {
    return formatDistanceToNowStrict(date, {
      addSuffix: true,
      roundingMethod: "floor",
      locale: {
        formatDistance: (token, count) => {
          const map: Record<string, string> = {
            lessThanXSeconds: `${count}s`,
            xSeconds: `${count}s`,
            halfAMinute: "30s",
            lessThanXMinutes: `${count}m`,
            xMinutes: `${count}m`,
            aboutXHours: `${count}h`,
            xHours: `${count}h`,
            xDays: `${count}d`,
            aboutXMonths: `${count}mo`,
            xMonths: `${count}mo`,
            aboutXYears: `${count}y`,
            xYears: `${count}y`,
            overXYears: `${count}y`,
            almostXYears: `${count}y`,
          };

          return (map[token] ?? `${count}`) + " ago";
        },
      },
    });
  };

  const typeConfig = getTypeConfig(page.type);
  const statusConfig = getStatusConfig(page.status);
  const timeAgo = short(page.updatedAt);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 p-0 rounded-lg">
      <CardContent className="p-0">
        {/* Preview Image Area */}
        <div className="bg-gray-50 rounded-t-lg p-4 h-32 flex items-center justify-center border-b">
          <div className="w-full h-full bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <p className="text-small">No preview available</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and URL */}
          <div className="mb-4 flex justify-between">
            <div>
              <h3 className="text-main mb-1 line-clamp-1">{page.title}</h3>
              <Link
                href={page.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-small hover:underline"
              >
                {page.slug}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-normal rounded-full px-8"
                asChild
              >
                <Link href={`/${workspaceSlug}/blogs/${page.id}`}>Edit</Link>
              </Button>
              {/* <Button variant="ghost" size="sm" className="p-2">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <ExternalLink className="w-4 h-4" />
            </Button> */}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between text-small text-gray-500">
            <div className="flex items-center gap-2 ">
              {/* <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
            >
              {typeConfig.label}
            </span> */}
              <span
                className={`px-2 py-1 rounded-full text-small ${statusConfig.color}`}
              >
                {statusConfig.dot} {statusConfig.label}
              </span>
            </div>
            <span className="flex items-center gap-1 text-small">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1 text-small">
              <User className="w-3 h-3" />
              {page.author}
            </span>
          </div>

          {/* Action Buttons */}

          {/* Type and Status Badges */}
        </div>
      </CardContent>
    </Card>
  );
}
