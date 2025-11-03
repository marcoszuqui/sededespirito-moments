import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Images, Video } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  thumbnail_url: string | null;
  photo_count?: number;
  video_count?: number;
}

const Gallery = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;

      // Load media counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: media } = await supabase
            .from("photos")
            .select("media_type")
            .eq("event_id", event.id);

          const photoCount = media?.filter((m) => m.media_type === "photo").length || 0;
          const videoCount = media?.filter((m) => m.media_type === "video").length || 0;

          return { ...event, photo_count: photoCount, video_count: videoCount };
        })
      );

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
        <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
          <div className="h-12 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground">Galeria de Eventos</h1>
          <p className="text-xl text-muted-foreground">
            Reviva os momentos especiais de cada batizado
          </p>
        </div>

        <div className="flex justify-center">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                {searchTerm
                  ? "Nenhum evento encontrado."
                  : "Nenhum evento disponível no momento."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="group hover:shadow-xl transition-all cursor-pointer overflow-hidden border-2 hover:border-primary/20"
                onClick={() => navigate(`/eventos/${event.id}`)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {event.thumbnail_url ? (
                    <img
                      src={event.thumbnail_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Images className="h-16 w-16" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1 text-primary">
                      <Images className="h-4 w-4" />
                      {event.photo_count || 0} fotos
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Video className="h-4 w-4" />
                      {event.video_count || 0} vídeos
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
