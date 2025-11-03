import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Image as ImageIcon, Video as VideoIcon, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

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
  file_size: number | null;
  order_index: number;
}

interface UploadItem {
  file: File;
  preview: string;
  type: "photo" | "video";
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  error?: string;
}

const EventMedia = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      toast({
        title: "Erro ao carregar evento",
        variant: "destructive",
      });
      navigate("/admin/events");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUploads: UploadItem[] = [];

    files.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isPhoto = file.type.startsWith("image/");
      
      if (!isVideo && !isPhoto) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma foto ou vídeo válido.`,
          variant: "destructive",
        });
        return;
      }

      const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de ${isVideo ? "500MB" : "50MB"}.`,
          variant: "destructive",
        });
        return;
      }

      newUploads.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : "photo",
        status: "pending",
        progress: 0,
      });
    });

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const uploadMedia = async (item: UploadItem, index: number) => {
    try {
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: "uploading", progress: 0 } : u))
      );

      const bucket = item.type === "video" ? "baptism-videos" : "baptism-photos";
      const fileExt = item.file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, item.file);

      if (uploadError) throw uploadError;

      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, progress: 50, status: "processing" } : u))
      );

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Generate metadata
      const functionName = item.type === "video" 
        ? "generate-video-metadata" 
        : "generate-photo-metadata";
      
      const { data: metadata } = await supabase.functions.invoke(functionName, {
        body: { [item.type === "video" ? "videoUrl" : "imageUrl"]: publicUrl },
      });

      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, progress: 75 } : u))
      );

      // Save to database
      const { error: dbError } = await supabase.from("photos").insert({
        event_id: id,
        url: publicUrl,
        media_type: item.type,
        description: metadata?.description,
        ai_description: metadata?.description,
        tags: metadata?.tags || [],
        setting: metadata?.setting,
        thumbnail_url: metadata?.thumbnail_url,
        file_size: item.file.size,
        order_index: media.length + index,
      });

      if (dbError) throw dbError;

      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, progress: 100, status: "complete" } : u))
      );
    } catch (error) {
      console.error("Upload error:", error);
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index
            ? { ...u, status: "error", error: "Erro ao fazer upload" }
            : u
        )
      );
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    const pendingUploads = uploads.filter((u) => u.status === "pending");
    
    // Process 3 at a time
    for (let i = 0; i < pendingUploads.length; i += 3) {
      const batch = pendingUploads.slice(i, i + 3);
      await Promise.all(
        batch.map((item) => {
          const index = uploads.findIndex((u) => u === item);
          return uploadMedia(item, index);
        })
      );
    }

    setUploading(false);
    loadMedia();
    
    const completed = uploads.filter((u) => u.status === "complete").length;
    toast({
      title: "Upload concluído",
      description: `${completed} ${completed === 1 ? "arquivo enviado" : "arquivos enviados"} com sucesso.`,
    });

    setUploads([]);
  };

  const handleDeleteMedia = async (mediaId: string, mediaUrl: string, mediaType: string) => {
    try {
      const bucket = mediaType === "video" ? "baptism-videos" : "baptism-photos";
      const filePath = mediaUrl.split("/").slice(-2).join("/");

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", mediaId);

      if (dbError) throw dbError;

      toast({
        title: "Mídia deletada",
        description: "A mídia foi removida com sucesso.",
      });

      loadMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: "Erro ao deletar mídia",
        variant: "destructive",
      });
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

  if (!event) return null;

  const photoCount = media.filter((m) => m.media_type === "photo").length;
  const videoCount = media.filter((m) => m.media_type === "video").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/events")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Eventos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Informações do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.event_date), "dd 'de' MMMM, yyyy", {
                    locale: ptBR,
                  })}
                </p>
                {event.location && (
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                )}
              </div>
              
              {event.description && (
                <p className="text-sm">{event.description}</p>
              )}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fotos</span>
                  <span className="font-semibold">{photoCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vídeos</span>
                  <span className="font-semibold">{videoCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload & Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload de Mídias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste fotos e vídeos ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="media-upload" className="cursor-pointer">
                      Selecionar Arquivos
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Fotos: até 50MB | Vídeos: até 500MB
                  </p>
                </div>

                {/* Upload Queue */}
                {uploads.length > 0 && (
                  <div className="space-y-4">
                    {uploads.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                            {item.type === "video" ? (
                              <video src={item.preview} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.preview} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.type === "video" ? (
                                <VideoIcon className="h-4 w-4" />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                              <p className="text-sm font-medium truncate">
                                {item.file.name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {(item.file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                            {item.status !== "pending" && (
                              <Progress value={item.progress} className="mt-2" />
                            )}
                            {item.error && (
                              <p className="text-xs text-destructive mt-1">{item.error}</p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.status === "pending" && "Aguardando"}
                            {item.status === "uploading" && "Enviando..."}
                            {item.status === "processing" && "Processando..."}
                            {item.status === "complete" && "Concluído"}
                            {item.status === "error" && "Erro"}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={handleUploadAll}
                      disabled={uploading || uploads.every((u) => u.status !== "pending")}
                      className="w-full"
                    >
                      {uploading ? "Enviando..." : "Enviar Todos"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Grid */}
            {media.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mídias do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {media.map((item) => (
                      <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {item.media_type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2">
                          {item.media_type === "video" ? (
                            <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <VideoIcon className="h-3 w-3" />
                              Vídeo
                            </div>
                          ) : (
                            <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              Foto
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMedia(item.id, item.url, item.media_type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventMedia;