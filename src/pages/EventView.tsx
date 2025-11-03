import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Download, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MediaPlayer from "@/components/media/MediaPlayer";
import { toast } from "sonner";

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

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
      toast.error("Erro ao baixar mídia");
    }
  };

  const toggleSelection = (mediaId: string) => {
    setSelectedMedia((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleBulkDownload = async () => {
    if (selectedMedia.size === 0) return;

    setDownloading(true);
    toast.info(`Baixando ${selectedMedia.size} arquivo(s)...`);

    try {
      const selectedItems = media.filter((m) => selectedMedia.has(m.id));
      
      for (const item of selectedItems) {
        const bucket = item.media_type === "video" ? "baptism-videos" : "baptism-photos";
        const filePath = item.url.split("/").slice(-2).join("/");
        
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

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast.success(`${selectedMedia.size} arquivo(s) baixado(s)!`);
      setSelectedMedia(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error downloading media:", error);
      toast.error("Erro ao baixar arquivos");
    } finally {
      setDownloading(false);
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/galeria">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar para Galeria</span>
              </Button>
            </Link>
            
            {/* Selection Controls */}
            {media.length > 0 && (
              <div className="flex gap-2">
                {!selectionMode ? (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setSelectionMode(true)}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Selecionar</span>
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedMedia(new Set());
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleBulkDownload}
                      disabled={selectedMedia.size === 0 || downloading}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "Baixando..." : `Baixar (${selectedMedia.size})`}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">{event.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3 text-sm md:text-base text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", {
                  locale: ptBR,
                })}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  {event.location}
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-muted-foreground mt-4 max-w-3xl text-sm md:text-base">{event.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma mídia disponível para este evento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => selectionMode ? toggleSelection(item.id) : handleMediaClick(index)}
                className={`group relative aspect-square rounded-lg overflow-hidden bg-muted transition-all ${
                  selectionMode 
                    ? selectedMedia.has(item.id) 
                      ? "ring-4 ring-primary" 
                      : "ring-2 ring-muted-foreground/20"
                    : "hover:ring-2 hover:ring-primary"
                }`}
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedMedia.has(item.id) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background/80 backdrop-blur-sm"
                    }`}>
                      {selectedMedia.has(item.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                )}

                {item.media_type === "video" ? (
                  <div className="relative w-full h-full">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] md:border-l-8 border-l-black border-t-[5px] md:border-t-6 border-t-transparent border-b-[5px] md:border-b-6 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`${item.url}?width=400&quality=80`}
                    alt={item.description || ""}
                    className={`w-full h-full object-cover transition-transform ${
                      !selectionMode && "group-hover:scale-105"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Media Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-full max-h-full w-full h-full md:max-w-7xl md:h-[90vh] p-0 border-0">
          <div className="relative h-full flex flex-col">
            {/* Player */}
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
              {currentMedia && (
                <MediaPlayer
                  media={currentMedia}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onDownload={handleDownload}
                  hasNext={currentIndex < media.length - 1}
                  hasPrev={currentIndex > 0}
                  onClose={() => setShowPlayer(false)}
                />
              )}
            </div>

            {/* Thumbnail Navigation - Hidden on mobile */}
            <div className="hidden md:block bg-background border-t p-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                      index === currentIndex ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
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