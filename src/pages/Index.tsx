import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden py-20 px-4" style={{ background: 'var(--gradient-light)' }}>
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(192, 100%, 40%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(190, 75%, 47%) 0%, transparent 50%)',
        }} />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6 backdrop-blur-sm border border-primary/20">
              <ImageIcon className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-5xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl drop-shadow-sm">
            Batismo 2025
          </h1>
          <p className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            Ministério Sede do Espírito
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Reviva os momentos especiais deste dia abençoado através das nossas fotos
          </p>
          
          {/* Search Bar */}
          <div className="mx-auto max-w-2xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <Input
                type="text"
                placeholder="Buscar fotos por descrição (ex: 'família sorrindo')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-7 text-lg border-2 border-primary/20 focus:border-primary shadow-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/galeria">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform">
                Ver Galeria Completa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg">
                <ImageIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Galeria Completa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Todas as fotos do evento organizadas e fáceis de navegar
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Busca por Imagem</h3>
              <p className="text-muted-foreground leading-relaxed">
                Faça upload de uma foto e encontre fotos similares com IA
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-shadow">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Mobile-First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Acesse de qualquer dispositivo, otimizado para celular
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>Ministério Sede do Espírito • Batismo 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
