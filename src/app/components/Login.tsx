import { useState } from "react";
import { useNavigate } from "react-router";
import { PlaneIcon, Mail, Lock, User } from "lucide-react";
import { signIn, signUp } from "../lib/auth";
import { toast } from "sonner";
import logoImage from '@/assets/rr-logo.webp';

export function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        try {
          await signUp(formData.email, formData.password, formData.name);
          toast.success("Conta criada com sucesso!");
          
          // Auto sign in after signup
          await signIn(formData.email, formData.password);
          toast.success("Login realizado com sucesso!");
          navigate("/dashboard");
        } catch (signUpError: any) {
          // If user already exists, try to sign in instead
          if (signUpError.message?.includes("já está cadastrado")) {
            toast.info("Email já cadastrado. Tentando fazer login...", { duration: 2000 });
            
            try {
              await signIn(formData.email, formData.password);
              toast.success("Login realizado com sucesso!");
              navigate("/dashboard");
            } catch (signInError: any) {
              toast.error("Senha incorreta. Por favor, verifique sua senha.", { duration: 5000 });
            }
          } else {
            throw signUpError;
          }
        }
      } else {
        await signIn(formData.email, formData.password);
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={logoImage} 
              alt="RR Manutenção de Aeronaves" 
              className="w-80 h-auto"
            />
          </div>
          <p className="text-stone-400">
            {isSignUp ? "Criar nova conta" : "Entre na sua conta"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-300">
                  A primeira conta cadastrada recebe acesso de administrador; as próximas entram como equipe.
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg shadow-amber-900/30"
            >
              {loading
                ? "Processando..."
                : isSignUp
                ? "Criar Conta"
                : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-stone-400 hover:text-amber-500 transition-colors text-sm"
            >
              {isSignUp
                ? "Já tem uma conta? Entre aqui"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-stone-500 hover:text-stone-400 transition-colors text-sm"
          >
            ← Voltar para o início
          </button>
        </div>
      </div>
    </div>
  );
}