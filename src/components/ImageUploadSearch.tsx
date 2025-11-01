import { useState, useRef } from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadSearchProps {
  onSearchResults: (photos: any[], description: string) => void;
}

export const ImageUploadSearch = ({ onSearchResults }: ImageUploadSearchProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-by-image", {
        body: { imageBase64: selectedImage },
      });

      if (error) {
        console.error("Search error:", error);
        
        if (error.message?.includes("429")) {
          toast({
            title: "Limite excedido",
            description: "Muitas requisições. Tente novamente em alguns instantes.",
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: "Créditos insuficientes",
            description: "Por favor, adicione créditos ao workspace do Lovable AI.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro na busca",
            description: "Não foi possível buscar fotos similares. Tente novamente.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.results) {
        onSearchResults(data.results, data.description);
        toast({
          title: "Busca concluída!",
          description: `${data.results.length} foto(s) similar(es) encontrada(s)`,
        });
      } else if (data?.message) {
        toast({
          title: "Nenhum resultado",
          description: data.message,
        });
        onSearchResults([], data.description || "");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar a busca",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mb-6">
      {!selectedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-105"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Buscar por Imagem</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste uma foto aqui ou clique para selecionar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Selecionar Foto
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl p-4 bg-card">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Imagem selecionada</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em buscar para encontrar fotos similares usando IA
              </p>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full sm:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Buscar Fotos Similares
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
