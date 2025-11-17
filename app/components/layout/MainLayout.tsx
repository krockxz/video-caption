import { ReactNode, useState } from "react";
import { Header, HeaderProps } from "./Header";
import { Sidebar, SidebarProps } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MainLayoutProps {
  children: ReactNode;
  headerProps?: HeaderProps;
  sidebarProps?: Omit<SidebarProps, "isOpen" | "onClose">;
  showSidebar?: boolean;
  className?: string;
}

export function MainLayout({
  children,
  headerProps,
  sidebarProps = {},
  showSidebar = true,
  className
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Header
        {...headerProps}
      />

      <div className="flex">
        {/* Mobile sidebar toggle */}
        {showSidebar && (
          <div className="sticky top-14 z-30 flex h-12 w-full items-center border-b bg-background px-4 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="mr-2"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <span className="text-sm font-medium">Menu</span>
          </div>
        )}

        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile sidebar */}
            <div className="md:hidden">
              <Sidebar
                {...sidebarProps}
                isOpen={sidebarOpen}
                onClose={handleSidebarClose}
              />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <Sidebar
                {...sidebarProps}
                isOpen={true}
                onClose={() => {}} // Desktop sidebar is always open
              />
            </div>
          </>
        )}

        {/* Main content */}
        <main
          className={cn(
            "flex-1",
            showSidebar && "md:ml-0", // Sidebar is positioned fixed, so no margin needed
            className
          )}
        >
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}