import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ZoomIn } from "lucide-react";
import { useState } from "react";

interface Media {
  url: string;
  media_type: "photo" | "video";
  description: string | null;
}

interface MediaPlayerProps {
  media: Media;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const MediaPlayer = ({
  media,
  onNext,
  onPrev,
  onDownload,
  hasNext,
  hasPrev,
}: MediaPlayerProps) => {
  const [zoom, setZoom] = useState(false);

  if (media.media_type === "video") {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          src={media.url}
          controls
          autoPlay
          className="max-w-full max-h-full"
        />
        
        {/* Navigation Buttons */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
          <Button
            onClick={onPrev}
            disabled={!hasPrev}
            className="pointer-events-auto"
            variant="secondary"
            size="icon"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            onClick={onNext}
            disabled={!hasNext}
            className="pointer-events-auto"
            variant="secondary"
            size="icon"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Download Button */}
        <div className="absolute top-4 right-4">
          <Button onClick={onDownload} variant="secondary" size="icon">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={media.url}
        alt={media.description || ""}
        className={`max-w-full max-h-full transition-transform ${
          zoom ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
        }`}
        onClick={() => setZoom(!zoom)}
      />

      {/* Navigation Buttons */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
        <Button
          onClick={onPrev}
          disabled={!hasPrev}
          variant="secondary"
          size="icon"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasNext}
          variant="secondary"
          size="icon"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          onClick={() => setZoom(!zoom)}
          variant="secondary"
          size="icon"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button onClick={onDownload} variant="secondary" size="icon">
          <Download className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MediaPlayer;