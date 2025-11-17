import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Video, Settings, Upload, BarChart3, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const menuItems = [
    {
      icon: <Video className="h-4 w-4" />,
      label: "My Videos",
      href: "/videos",
      badge: null
    },
    {
      icon: <Upload className="h-4 w-4" />,
      label: "Upload Video",
      href: "/upload",
      badge: "New"
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Analytics",
      href: "/analytics",
      badge: null
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      href: "/settings",
      badge: null
    },
    {
      icon: <HelpCircle className="h-4 w-4" />,
      label: "Help & Docs",
      href: "/help",
      badge: null
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">VC</span>
              </div>
              <span className="font-semibold">VC Platform</span>
            </div>

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <a href={item.href} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage:</span>
                <span>2.3 GB / 10 GB</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}