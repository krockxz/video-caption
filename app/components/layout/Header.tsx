import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Github, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export interface HeaderProps {
  title?: string;
  showStatus?: boolean;
  apiStatus?: "healthy" | "error" | "loading";
}

export function Header({
  title = "Video Captioning Platform",
  showStatus = true,
  apiStatus = "healthy"
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusColor = () => {
    switch (apiStatus) {
      case "healthy":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "loading":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case "healthy":
        return <CheckCircle className="h-3 w-3" />;
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      case "loading":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case "healthy":
        return "API Online";
      case "error":
        return "API Error";
      case "loading":
        return "Loading...";
      default:
        return "Unknown";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Left side - Logo/Title */}
        <div className="mr-4 flex">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">VC</span>
              </div>
              <span className="hidden font-bold sm:inline-block">
                {title}
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Right side - Status and GitHub link */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* API Status Indicator */}
            {showStatus && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                  {getStatusIcon()}
                  <span className="text-xs">{getStatusText()}</span>
                </Badge>
              </div>
            )}
          </div>

          {/* GitHub Link */}
          <nav className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline-block">GitHub</span>
              </a>
            </Button>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container py-4 space-y-2">
            <Link
              href="/"
              className="block px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded"
            >
              Home
            </Link>
            <a
              href="/videos"
              className="block px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded"
            >
              My Videos
            </a>
            <a
              href="/upload"
              className="block px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded"
            >
              Upload Video
            </a>
          </div>
        </div>
      )}
    </header>
  );
}