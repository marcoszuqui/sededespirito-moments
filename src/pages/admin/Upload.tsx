import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PhotoUpload {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'complete' | 'error';
  error?: string;
  progress: number;
}

export default function AdminUpload() {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoUpload[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const uploadPhoto = async (photo: PhotoUpload, index: number) => {
    try {
      // 1. Upload para storage
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], status: 'uploading', progress: 30 };
        return newPhotos;
      });

      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('baptism-photos')
        .upload(filePath, photo.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('baptism-photos')
        .getPublicUrl(filePath);

      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], progress: 60 };
        return newPhotos;
      });

      // 3. Gerar metadados com IA
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], status: 'analyzing', progress: 70 };
        return newPhotos;
      });

      const { data: metadata, error: metadataError } = await supabase.functions.invoke(
        'generate-photo-metadata',
        { body: { imageUrl: publicUrl } }
      );

      if (metadataError) throw metadataError;

      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], progress: 90 };
        return newPhotos;
      });

      // 4. Salvar no banco
      const tagsArray = manualTags 
        ? manualTags.split(',').map(t => t.trim()).filter(Boolean)
        : metadata.tags;

      const { error: dbError } = await supabase.from('photos').insert({
        url: publicUrl,
        description: manualDescription || null,
        ai_description: metadata.description,
        tags: tagsArray,
        event_date: eventDate || null,
        faces_count: metadata.faces_count,
        setting: metadata.setting,
        uploaded_by: user?.id,
      });

      if (dbError) throw dbError;

      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], status: 'complete', progress: 100 };
        return newPhotos;
      });

    } catch (error: any) {
      console.error('Erro no upload:', error);
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { 
          ...newPhotos[index], 
          status: 'error', 
          error: error.message 
        };
        return newPhotos;
      });
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);

    // Upload com máximo de 3 paralelos
    const batchSize = 3;
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);
      await Promise.all(
        batch.map((photo, batchIndex) => {
          const globalIndex = i + batchIndex;
          if (photo.status === 'pending' || photo.status === 'error') {
            return uploadPhoto(photo, globalIndex);
          }
          return Promise.resolve();
        })
      );
    }

    const successCount = photos.filter(p => p.status === 'complete').length;
    const errorCount = photos.filter(p => p.status === 'error').length;

    toast({
      title: 'Upload finalizado!',
      description: `${successCount} foto(s) enviada(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}`,
    });

    setUploading(false);
  };

  const allComplete = photos.length > 0 && photos.every(p => p.status === 'complete');
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/galeria')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Upload de Fotos - Admin</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Metadados aplicados a todas as fotos (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Data do Evento</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Manual</Label>
                <Textarea
                  id="description"
                  placeholder="Opcional - deixe em branco para usar IA"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  placeholder="batismo, igreja, família"
                  value={manualTags}
                  onChange={(e) => setManualTags(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload e Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Selecionar Fotos</CardTitle>
              <CardDescription>As fotos serão enviadas com qualidade original</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Clique para selecionar fotos</p>
                  <p className="text-sm text-muted-foreground mt-2">ou arraste e solte aqui</p>
                </Label>
              </div>

              {hasPhotos && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        {photo.status !== 'complete' && photo.status !== 'error' && !uploading && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            ×
                          </Button>
                        )}
                        <div className="mt-2">
                          {photo.status === 'pending' && (
                            <p className="text-xs text-muted-foreground">Aguardando...</p>
                          )}
                          {photo.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <p className="text-xs">Enviando...</p>
                            </div>
                          )}
                          {photo.status === 'analyzing' && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <p className="text-xs">Analisando IA...</p>
                            </div>
                          )}
                          {photo.status === 'complete' && (
                            <p className="text-xs text-green-600">✓ Concluído</p>
                          )}
                          {photo.status === 'error' && (
                            <p className="text-xs text-destructive">✗ Erro: {photo.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleUploadAll}
                      disabled={uploading || allComplete}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : allComplete ? (
                        'Todas as fotos enviadas'
                      ) : (
                        `Enviar ${photos.filter(p => p.status === 'pending' || p.status === 'error').length} foto(s)`
                      )}
                    </Button>
                    {allComplete && (
                      <Button variant="outline" onClick={() => navigate('/galeria')}>
                        Ver Galeria
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
