import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Heart } from "lucide-react";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className || ''}`}>
      <div className="container py-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">VC</span>
              </div>
              <span className="font-semibold">Video Captioning</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional video captioning platform powered by AI. Upload, generate, and customize captions for your videos.
            </p>
          </div>

          {/* Technology section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Technology</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href="https://remotion.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <span>Remotion</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href="https://openai.com/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <span>OpenAI Whisper</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href="https://nextjs.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <span>Next.js</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </li>
            </ul>
          </div>

          {/* Resources section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href="/docs">Documentation</a>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href="/api/health">API Status</a>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href="/support">Support</a>
                </Button>
              </li>
            </ul>
          </div>

          {/* Legal section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href="/privacy">Privacy Policy</a>
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href="/terms">Terms of Service</a>
                </Button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>© 2024 Video Captioning Platform. All rights reserved.</span>
            </div>

            <div className="flex items-center space-x-4">
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
                  <span>GitHub</span>
                </a>
              </Button>

              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <span>Made with</span>
                <Heart className="h-3 w-3 fill-current text-red-500" />
                <span>for developers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}