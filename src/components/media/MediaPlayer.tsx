import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ZoomIn, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onClose?: () => void;
}

const MediaPlayer = ({
  media,
  onNext,
  onPrev,
  onDownload,
  hasNext,
  hasPrev,
  onClose,
}: MediaPlayerProps) => {
  const [zoom, setZoom] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const isMobile = useIsMobile();

  if (media.media_type === "video") {
    return (
      <div 
        className="relative w-full h-full flex items-center justify-center bg-black"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
      >
        <video
          src={media.url}
          controls
          autoPlay
          className="max-w-full max-h-full"
          controlsList="nodownload"
        />
        
        {/* Close Button (Mobile) */}
        {isMobile && onClose && (
          <div className={`absolute top-4 left-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              onClick={onClose}
              variant="secondary"
              size="icon"
              className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
            >
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            onClick={onPrev}
            disabled={!hasPrev}
            className="pointer-events-auto rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
            variant="secondary"
            size="icon"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>
          <Button
            onClick={onNext}
            disabled={!hasNext}
            className="pointer-events-auto rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
            variant="secondary"
            size="icon"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Download Button */}
        <div className={`absolute top-4 right-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Button 
            onClick={onDownload} 
            variant="secondary" 
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
          >
            <Download className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <img
        src={media.url}
        alt={media.description || ""}
        className={`max-w-full max-h-full transition-transform ${
          zoom ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
        }`}
        onClick={() => setZoom(!zoom)}
      />

      {/* Close Button (Mobile) */}
      {isMobile && onClose && (
        <div className={`absolute top-4 left-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            onClick={onClose}
            variant="secondary"
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <Button
          onClick={onPrev}
          disabled={!hasPrev}
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasNext}
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className={`absolute top-4 right-4 flex gap-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {!isMobile && (
          <Button
            onClick={() => setZoom(!zoom)}
            variant="secondary"
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
          >
            <ZoomIn className="h-5 w-5 text-white" />
          </Button>
        )}
        <Button 
          onClick={onDownload} 
          variant="secondary" 
          size="icon"
          className="rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0"
        >
          <Download className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MediaPlayer;