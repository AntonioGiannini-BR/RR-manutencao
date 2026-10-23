import { Link } from "react-router";
import { PlaneIcon } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="text-center">
        <PlaneIcon className="w-24 h-24 text-amber-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">404 - Página não encontrada</h1>
        <p className="text-stone-400 mb-8">A página que você procura não existe.</p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-amber-900/30"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}