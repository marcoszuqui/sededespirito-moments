import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const [selectedPhoto, setSelectedPhoto] = useState<typeof mockPhotos[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // TODO: Implement AI search using Lovable AI
    // For now, simple filter by description
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const filteredPhotos = searchQuery.trim()
    ? mockPhotos.filter(
        (photo) =>
          photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photo.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : mockPhotos;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Galeria de Fotos</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b bg-card py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar fotos com IA (ex: 'pessoas sorrindo')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-muted-foreground">
              {filteredPhotos.length} foto(s) encontrada(s)
            </p>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="container mx-auto px-4 py-8">
        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Nenhuma foto encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02]"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.description}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm text-white">{photo.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-7xl p-0">
          {selectedPhoto && (
            <div className="relative">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.description}
                className="h-auto w-full max-h-[85vh] object-contain"
              />
              <div className="border-t bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedPhoto.description}</p>
                    <div className="mt-1 flex gap-2">
                      {selectedPhoto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
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
