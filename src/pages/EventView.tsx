import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MediaPlayer from "@/components/media/MediaPlayer";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
}

interface Media {
  id: string;
  url: string;
  media_type: "photo" | "video";
  thumbnail_url: string | null;
  description: string | null;
  order_index: number;
}

const EventView = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEvent();
      loadMedia();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error("Error loading event:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setMedia((data || []) as Media[]);
    } catch (error) {
      console.error("Error loading media:", error);
    }
  };

  const handleMediaClick = (index: number) => {
    setCurrentIndex(index);
    setShowPlayer(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleDownload = async () => {
    const currentMedia = media[currentIndex];
    if (!currentMedia) return;

    try {
      const bucket = currentMedia.media_type === "video" ? "baptism-videos" : "baptism-photos";
      const filePath = currentMedia.url.split("/").slice(-2).join("/");
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading media:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Evento não encontrado</h2>
          <Link to="/galeria">
            <Button variant="outline">Voltar para Galeria</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentMedia = media[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link to="/galeria">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Galeria
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-foreground">{event.title}</h1>
            <div className="flex items-center gap-6 mt-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", {
                  locale: ptBR,
                })}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {event.location}
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-muted-foreground mt-4 max-w-3xl">{event.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma mídia disponível para este evento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleMediaClick(index)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
              >
                {item.media_type === "video" ? (
                  <div className="relative w-full h-full">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-8 border-l-black border-t-6 border-t-transparent border-b-6 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`${item.url}?width=400&quality=80`}
                    alt={item.description || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Media Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative h-full flex flex-col">
            {/* Player */}
            <div className="flex-1 flex items-center justify-center bg-black">
              {currentMedia && (
                <MediaPlayer
                  media={currentMedia}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onDownload={handleDownload}
                  hasNext={currentIndex < media.length - 1}
                  hasPrev={currentIndex > 0}
                />
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div className="bg-background border-t p-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden ${
                      index === currentIndex ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {item.media_type === "video" ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={`${item.url}?width=200`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventView;