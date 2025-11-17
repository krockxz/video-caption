import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Search, ExternalLink, Clock, Flag } from "lucide-react";
import { useState } from "react";

export interface Caption {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  style: 'default' | 'newsbar' | 'karaoke';
  confidence?: number;
  createdAt: string;
}

export interface CaptionTableProps {
  captions: Caption[];
  selectedId?: string;
  onSelectCaption?: (captionId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function CaptionTable({
  captions,
  selectedId,
  onSelectCaption,
  isLoading = false,
  className
}: CaptionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get duration of a caption
  const getDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    return formatTime(duration);
  };

  // Filter and sort captions
  const filteredCaptions = captions
    .filter(caption => {
      const matchesSearch = caption.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLanguage = filterLanguage === 'all' || caption.language === filterLanguage;
      return matchesSearch && matchesLanguage;
    })
    .sort((a, b) => {
      const comparison = a.startTime - b.startTime;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique languages for filter
  const languages = Array.from(new Set(captions.map(caption => caption.language)));

  // Handle copy to clipboard
  const handleCopyText = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Handle row selection
  const handleRowClick = (captionId: string) => {
    if (onSelectCaption) {
      onSelectCaption(captionId);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading captions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>Captions</span>
            <Badge variant="secondary">{captions.length}</Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search captions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48"
              />
            </div>

            {/* Language filter */}
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              Time {sortOrder === 'asc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredCaptions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterLanguage !== 'all'
                ? 'No captions match your search criteria'
                : 'No captions available'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">#</th>
                  <th className="text-left p-3 font-medium text-sm">Start Time</th>
                  <th className="text-left p-3 font-medium text-sm">End Time</th>
                  <th className="text-left p-3 font-medium text-sm">Duration</th>
                  <th className="text-left p-3 font-medium text-sm">Text</th>
                  <th className="text-left p-3 font-medium text-sm">Language</th>
                  <th className="text-left p-3 font-medium text-sm">Style</th>
                  <th className="text-left p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCaptions.map((caption, index) => (
                  <tr
                    key={caption.id}
                    className={`
                      border-b transition-colors hover:bg-muted/50 cursor-pointer
                      ${selectedId === caption.id ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => handleRowClick(caption.id)}
                  >
                    <td className="p-3 text-sm text-muted-foreground">
                      {index + 1}
                    </td>

                    <td className="p-3 text-sm font-mono">
                      {formatTime(caption.startTime)}
                    </td>

                    <td className="p-3 text-sm font-mono">
                      {formatTime(caption.endTime)}
                    </td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {getDuration(caption.startTime, caption.endTime)}
                    </td>

                    <td className="p-3 text-sm max-w-md">
                      <div className="group relative">
                        <p className="line-clamp-2 pr-6">{caption.text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleCopyText(caption.text, e)}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy text</span>
                        </Button>
                      </div>
                    </td>

                    <td className="p-3 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {caption.language}
                      </Badge>
                    </td>

                    <td className="p-3 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {caption.style}
                      </Badge>
                    </td>

                    <td className="p-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(`${formatTime(caption.startTime)} - ${formatTime(caption.endTime)}: ${caption.text}`, e);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy caption</span>
                        </Button>

                        {caption.confidence && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Flag className="h-3 w-3" />
                            <span>{Math.round(caption.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}