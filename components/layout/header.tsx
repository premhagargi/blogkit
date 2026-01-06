"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LifeBuoy,
  Inbox,
  ArrowUpRight,
  MessageSquare,
  Menu,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { ThemeToggle } from "./theme-toggle";
import { InboxNotifications } from "../notifications/inbox-notifications";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const showViewBlog = pathname.includes("/blogs/");

  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background px-3 py-1">
        <div className="flex h-[--header-height] items-center justify-between px-[--header-horizontal-padding]">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-full bg-muted"></div>
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div className="h-8 w-8 rounded-full bg-muted"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const initial = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background px-3 py-1">
      <div className="flex h-[--header-height] items-center justify-between px-[--header-horizontal-padding]">
        <div className="flex flex-1 items-center">
          <BreadcrumbNav />
        </div>

        <div className="hidden items-center  md:flex">
          {showViewBlog && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full mx-1 hover:border-primary/20 hover:border-1 text-nomal"
            >
              <Link href="#" className="text-normal">
                View Blog
                <ArrowUpRight className=" h-4 w-4 text-muted-foreground " />
              </Link>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="h-8 rounded-full px-3 bg-transparent border-primary/20 border-1 text-normal"
          >
            Feedback
          </Button>
          <TooltipProvider>
            <div className="flex items-center gap-[--gap-xs] mx-2 rounded-full  ">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8  hover:text-primary bg-transparent rounded-full"
                  >
                    <LifeBuoy className="h-4 w-4 text-normal" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Support</p>
                </TooltipContent>
              </Tooltip>
              <InboxNotifications />
            </div>
          </TooltipProvider>
          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="User menu"
                className="flex items-center justify-center rounded-full border-primary/20 border-1"
              >
                <Avatar className="h-8 w-8 cursor-pointer ">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="flex items-center gap-3 p-2">
                <Avatar>
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="bg-muted font-medium text-muted-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <p className="truncate text-normal">{user.name}</p>
                  <p className="truncate text-small">{user.email}</p>
                </div>
              </div>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-normal">Log out</span>
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="">
                <Menu className="h-5 w-5 text-muted-foreground hover:text-primary bg-transparent rounded-full" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] p-4">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 pb-4">
                  <Avatar>
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback className="bg-muted font-medium text-muted-foreground ">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-1 flex-col gap-1 py-4">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:text-primary bg-transparent rounded-full"
                      asChild
                    >
                      <Link href="#">
                        <ArrowUpRight className="mr-2 h-4 w-4  hover:text-primary" />
                        <p className="text-normal">View Blog</p>
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start  hover:text-primary bg-transparent rounded-full"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Feedback
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start  hover:text-primary bg-transparent rounded-full"
                    >
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      Support
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start  hover:text-primary bg-transparent rounded-full"
                    >
                      <Inbox className="mr-2 h-4 w-4" />
                      Inbox
                    </Button>
                  </SheetClose>
                </div>
                <Separator />
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
