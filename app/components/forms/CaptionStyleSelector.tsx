import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Film, LayoutPanelTop, Mic } from "lucide-react";

export interface CaptionStyle {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
}

const captionStyles: CaptionStyle[] = [
  {
    value: "default",
    label: "Default",
    description: "Classic bottom-centered captions",
    icon: <Film className="h-4 w-4" />,
    preview: "Clean, simple text at the bottom"
  },
  {
    value: "newsbar",
    label: "News Bar",
    description: "Ticker-style scrolling captions",
    icon: <LayoutPanelTop className="h-4 w-4" />,
    preview: "Horizontal scrolling news banner"
  },
  {
    value: "karaoke",
    label: "Karaoke",
    description: "Highlighted text that follows speech",
    icon: <Mic className="h-4 w-4" />,
    preview: "Word-by-word highlighting effect"
  }
];

export interface CaptionStyleSelectorProps {
  value: string;
  onChange: (style: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CaptionStyleSelector({
  value,
  onChange,
  disabled = false,
  className
}: CaptionStyleSelectorProps) {
  const selectedStyle = captionStyles.find(style => style.value === value);

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select caption style" />
        </SelectTrigger>
        <SelectContent>
          {captionStyles.map((style) => (
            <SelectItem key={style.value} value={style.value}>
              <div className="flex items-center space-x-3">
                {style.icon}
                <div className="flex-1">
                  <div className="font-medium">{style.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {style.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Style preview/info */}
      {selectedStyle && (
        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {selectedStyle.icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{selectedStyle.label}</span>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedStyle.description}
              </p>
              <p className="text-xs text-muted-foreground italic">
                {selectedStyle.preview}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual style examples */}
      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Style Examples:</p>

        <div className="space-y-2">
          {captionStyles.map((style) => (
            <div
              key={style.value}
              className={`
                p-2 rounded border text-xs
                ${value === style.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
                }
              `}
            >
              <div className="flex items-center space-x-2 mb-1">
                {style.icon}
                <span className="font-medium">{style.label}</span>
              </div>

              {/* Visual representation of the style */}
              <div className="bg-muted/50 rounded p-2 min-h-[3rem] flex items-center justify-center">
                {style.value === 'default' && (
                  <div className="text-center">
                    <p>&quot;Hello, this is a sample caption&quot;</p>
                  </div>
                )}
                {style.value === 'newsbar' && (
                  <div className="w-full bg-black text-white px-2 py-1 rounded overflow-hidden">
                    <p className="whitespace-nowrap animate-pulse">
                      ► Breaking: This is how news bar captions look like...
                    </p>
                  </div>
                )}
                {style.value === 'karaoke' && (
                  <div className="text-center space-y-1">
                    <p>
                      Hello, this is <span className="bg-primary text-primary-foreground px-1 rounded">a sample</span> caption
                    </p>
                    <div className="h-0.5 bg-muted-foreground/20 w-full">
                      <div className="h-0.5 bg-primary w-1/3"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}