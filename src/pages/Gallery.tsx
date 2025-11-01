import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageUploadSearch } from "@/components/ImageUploadSearch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock photos - In production, these would come from a database or API
const mockPhotos = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop",
    description: "Momento da cerimônia de batismo",
    tags: ["cerimônia", "batismo", "altar"],
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop",
    description: "Família reunida celebrando",
    tags: ["família", "celebração", "grupo"],
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop",
    description: "Momento de oração",
    tags: ["oração", "mãos", "fé"],
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&auto=format&fit=crop",
    description: "Crianças felizes",
    tags: ["crianças", "alegria", "sorriso"],
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop",
    description: "Casal abençoado",
    tags: ["casal", "benção", "união"],
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop",
    description: "Vista da igreja",
    tags: ["igreja", "arquitetura", "exterior"],
  },
];

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [aiDescription, setAiDescription] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error loading photos:", error);
      // Fallback to mock photos if database is empty
      setPhotos(mockPhotos);
    } else if (data && data.length > 0) {
      setPhotos(data);
    } else {
      // Use mock photos if database is empty
      setPhotos(mockPhotos);
    }
  };

  const handleImageSearchResults = (results: any[], description: string) => {
    setSearchResults(results);
    setAiDescription(description);
    setSearchQuery("");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // TODO: Implement AI search using Lovable AI
    // For now, simple filter by description
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const displayPhotos = searchResults !== null 
    ? searchResults 
    : searchQuery.trim()
    ? photos.filter(
        (photo) =>
          photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photo.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          photo.ai_description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : photos;

  const clearSearch = () => {
    setSearchResults(null);
    setAiDescription("");
    setSearchQuery("");
  };

  const handleDownload = async (photo: any) => {
    try {
      // Extrair path do arquivo da URL completa
      const urlParts = photo.url.split('/public/baptism-photos/');
      if (!urlParts[1]) {
        throw new Error("URL inválida");
      }
      const filePath = urlParts[1];
      
      // Baixar do storage com SDK (garante qualidade original)
      const { data, error } = await supabase.storage
        .from('baptism-photos')
        .download(filePath);
      
      if (error) throw error;
      
      // Criar URL temporária do blob
      const url = URL.createObjectURL(data);
      
      // Criar link e forçar download
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = filePath.split('.').pop() || 'jpg';
      link.download = `batismo-${photo.id || 'foto'}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado!",
        description: "A foto está sendo baixada em qualidade original"
      });
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a foto",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Galeria de Fotos</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Search Section */}
      <div className="border-b bg-card py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <ImageUploadSearch onSearchResults={handleImageSearchResults} />
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                type="text"
                placeholder="Buscar por descrição (ex: 'pessoas sorrindo')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          
          {(searchQuery || searchResults !== null) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {displayPhotos.length} foto(s) encontrada(s)
              </p>
              {(searchResults !== null || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="mr-1 h-4 w-4" />
                  Limpar busca
                </Button>
              )}
            </div>
          )}
          
          {aiDescription && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>IA detectou:</strong> {aiDescription}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="container mx-auto px-4 py-8">
        {displayPhotos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-lg">
              {searchResults !== null || searchQuery 
                ? "Nenhuma foto encontrada para esta busca" 
                : "Nenhuma foto disponível ainda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted transition-all hover:scale-[1.02] hover:shadow-2xl border border-transparent hover:border-primary/20"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={`${photo.url}?width=600&quality=85`}
                  alt={photo.description || "Foto do batismo"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-medium text-white drop-shadow-lg">
                      {photo.description || "Foto do batismo"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-7xl p-0 bg-background">
          {selectedPhoto && (
            <div className="relative">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white transition-colors hover:bg-black/80"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.description || "Foto do batismo"}
                className="h-auto w-full max-h-[85vh] object-contain bg-black/5"
              />
              <div className="border-t bg-background p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-2">
                      {selectedPhoto.description || "Foto do batismo"}
                    </p>
                    {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                    onClick={() => handleDownload(selectedPhoto)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
