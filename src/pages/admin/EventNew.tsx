import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EventNew = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !eventDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e a data do evento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let thumbnailUrl = null;

      // Upload thumbnail if provided
      if (thumbnail) {
        const fileExt = thumbnail.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `event-thumbnails/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("baptism-photos")
          .upload(filePath, thumbnail);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("baptism-photos")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrl;
      }

      // Create event
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          title,
          description: description || null,
          event_date: eventDate,
          location: location || null,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Evento criado",
        description: "Agora você pode adicionar fotos e vídeos ao evento.",
      });

      navigate(`/admin/events/${event.id}/media`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro ao criar evento",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/events")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Eventos
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Novo Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Batizado da Maria"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Data do Evento *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Igreja Nossa Senhora"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uma breve descrição do evento..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Foto de Capa</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/events")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Criando..." : "Criar Evento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventNew;