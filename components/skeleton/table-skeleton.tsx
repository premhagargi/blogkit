import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function PostTableSkeleton({ row = 5 }) {
  return (
    <>
      {Array.from({ length: row }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          <TableCell className="w-12 pl-lg">
            <Skeleton className="h-4 w-4 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function AuthorTableSkeleton({ row = 5 }) {
  return (
    <>
      {Array.from({ length: row }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          {/* Author column */}
          <TableCell className="pl-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" /> {/* avatar */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" /> {/* name */}
                <Skeleton className="h-4 w-4 rounded" />{" "}
                {/* external link icon */}
              </div>
            </div>
          </TableCell>

          {/* Posts + actions column */}
          <TableCell>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-8" /> {/* posts count */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20 rounded" /> {/* view posts btn */}
                <Skeleton className="h-6 w-12 rounded" /> {/* edit btn */}
                <Skeleton className="h-8 w-8 rounded" /> {/* menu icon */}
              </div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function TagTableSkeleton({ row = 5 }) {
  return (
    <>
      {Array.from({ length: row }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          {/* Tag name */}
          <TableCell className="pl-lg">
            <Skeleton className="h-4 w-32" />
          </TableCell>

          {/* Posts count */}
          <TableCell>
            <Skeleton className="h-4 w-8" />
          </TableCell>

          {/* Actions */}
          <TableCell className="sticky right-0 bg-background">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-6 w-20 rounded" /> {/* view posts */}
              <Skeleton className="h-6 w-12 rounded" /> {/* edit */}
              <Skeleton className="h-8 w-8 rounded" /> {/* menu */}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CategoryTableSkeleton({ row = 5 }) {
  return (
    <>
      {/* You can optionally add a skeleton for the CardTitle here */}
      <div className="ml-lg mb-sm"></div>
      <div className="overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-14"></TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead className="sticky right-0 w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: row }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="group">
                  {/* Grip */}
                  <TableCell className="w-14">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-5 w-5 rounded" />
                    </div>
                  </TableCell>

                  {/* Category name + link */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-4 rounded" />
                    </div>
                  </TableCell>

                  {/* Posts count */}
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="sticky right-0 bg-background group-hover:bg-accent/50">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-28 rounded" />
                      <Skeleton className="h-8 w-24 rounded" />
                      <Skeleton className="h-8 w-16 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export {
  PostTableSkeleton,
  AuthorTableSkeleton,
  TagTableSkeleton,
  CategoryTableSkeleton,
};
