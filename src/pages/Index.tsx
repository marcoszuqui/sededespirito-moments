import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Auth */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto flex justify-end gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/upload")}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Admin Upload
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate("/signup")}
              >
                Criar Conta
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background"></div>
        
        <div className="container relative z-10 text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
            Momentos de
            <span className="block text-primary mt-2">Graça e Fé</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Encontre suas memórias especiais de batismo através de busca inteligente por imagem
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/galeria")}
              className="text-lg px-8 py-6 group"
            >
              Explorar Galeria
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2"></div>
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
