import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { PlaneIcon, Wrench, PackageIcon, ArrowRight } from "lucide-react";
import { getCurrentUser } from "../lib/auth";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImage from '@/assets/rr-logo.webp';

export function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Section with Background Image */}
      <div className="relative h-screen">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1773213165821-e12923fa36e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJjcmFmdCUyMG1haW50ZW5hbmNlJTIwaGFuZ2FyfGVufDF8fHx8MTc3Mzc4NTM2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Aircraft Maintenance Hangar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/60 to-stone-950"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          {/* Logo */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <img 
                src={logoImage} 
                alt="RR Manutenção de Aeronaves" 
                className="w-96 h-auto"
              />
            </div>
          </div>

          <p className="text-lg md:text-xl text-stone-300 max-w-2xl mb-12 animate-fade-in-delay-1">
            Sistema completo de gerenciamento de peças e produtos para manutenção de aeronaves
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
            <button
              onClick={() => navigate("/login")}
              className="group px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/50"
            >
              Acessar Sistema
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-4 bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Recursos do Sistema
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-xl border border-stone-700 hover:border-amber-600 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-amber-600/20 rounded-lg flex items-center justify-center mb-6">
                <PackageIcon className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Gestão de Peças
              </h3>
              <p className="text-stone-400">
                Cadastre e controle todas as peças do seu inventário com informações detalhadas, categorias e níveis de estoque.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-xl border border-stone-700 hover:border-amber-600 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-amber-600/20 rounded-lg flex items-center justify-center mb-6">
                <Wrench className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Controle de Retiradas
              </h3>
              <p className="text-stone-400">
                Rastreie todas as peças retiradas pelos mecânicos com histórico completo de movimentações e devoluções.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-stone-800/50 backdrop-blur-sm p-8 rounded-xl border border-stone-700 hover:border-amber-600 transition-all hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-amber-600/20 rounded-lg flex items-center justify-center mb-6">
                <PlaneIcon className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Especializado em Aviação
              </h3>
              <p className="text-stone-400">
                Sistema desenvolvido especificamente para as necessidades de oficinas de manutenção de aeronaves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aircraft Images Gallery */}
      <div className="py-24 px-4 bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Nossa Experiência
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-80 rounded-xl overflow-hidden group">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1770701502608-f7d49a1134ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwYWlycGxhbmUlMjBmbGlnaHR8ZW58MXx8fHwxNzczNzI4MDQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Commercial Aircraft"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent flex items-end p-6">
                <p className="text-white font-semibold text-lg">Aviação Comercial</p>
              </div>
            </div>

            <div className="relative h-80 rounded-xl overflow-hidden group">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1566827267844-39de9bcad5ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwamV0JTIwYXZpYXRpb258ZW58MXx8fHwxNzczNzU0MTI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Private Aviation"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent flex items-end p-6">
                <p className="text-white font-semibold text-lg">Jatos Executivos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 bg-stone-900 border-t border-stone-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={logoImage} 
              alt="RR Manutenção de Aeronaves" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-stone-400">
            © 2026 RR Manutenção de Aeronaves. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay-1 {
          animation: fade-in 1s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
}