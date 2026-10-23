import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { PlaneIcon, Package, ArrowLeftRight, LogOut, AlertTriangle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { getCurrentUser, signOut } from "../lib/auth";
import { getParts, getTransactions, Part, Transaction } from "../lib/api";
import { toast } from "sonner";
import logoImage from '@/assets/rr-logo.webp';

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      
      setUser(currentUser);

      const [partsData, transactionsData] = await Promise.all([
        getParts(),
        getTransactions(),
      ]);

      setParts(partsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const totalParts = parts.length;
  const lowStockParts = parts.filter(p => p.quantity <= (p.minQuantity || 5)).length;
  const activeWithdrawals = transactions.filter(t => t.status === 'active').length;
  const totalReturns = transactions.filter(t => t.status === 'returned').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="RR Manutenção de Aeronaves" 
                className="h-12 w-auto"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <p className="text-sm text-stone-400">Bem-vindo,</p>
                  {user?.user_metadata?.isAdmin && (
                    <span className="px-2 py-0.5 bg-amber-600/20 text-amber-500 text-xs font-medium rounded border border-amber-600/30">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-white font-medium">{user?.user_metadata?.name || user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-stone-900/50 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-amber-400 bg-stone-800 rounded-lg font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/parts"
              className="px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              Peças
            </Link>
            <Link
              to="/transactions"
              className="px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              Movimentações
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-600/20 rounded-lg">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-stone-400 text-sm mb-1">Total de Peças</p>
            <p className="text-3xl font-bold text-white">{totalParts}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-600/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-stone-400 text-sm mb-1">Estoque Baixo</p>
            <p className="text-3xl font-bold text-white">{lowStockParts}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <ArrowLeftRight className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-stone-400 text-sm mb-1">Retiradas Ativas</p>
            <p className="text-3xl font-bold text-white">{activeWithdrawals}</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-stone-400 text-sm mb-1">Devoluções Completas</p>
            <p className="text-3xl font-bold text-white">{totalReturns}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Low Stock Parts */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Peças com Estoque Baixo
            </h2>
            <div className="space-y-3">
              {parts
                .filter(p => p.quantity <= (p.minQuantity || 5))
                .slice(0, 5)
                .map(part => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{part.name}</p>
                      <p className="text-sm text-stone-400">{part.partNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-500 font-semibold">{part.quantity}</p>
                      <p className="text-xs text-stone-500">
                        Mín: {part.minQuantity || 5}
                      </p>
                    </div>
                  </div>
                ))}
              {parts.filter(p => p.quantity <= (p.minQuantity || 5)).length === 0 && (
                <p className="text-stone-500 text-center py-8">
                  Nenhuma peça com estoque baixo
                </p>
              )}
            </div>
          </div>

          {/* Recent Withdrawals */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-500" />
              Retiradas Recentes
            </h2>
            <div className="space-y-3">
              {transactions
                .filter(t => t.status === 'active')
                .slice(0, 5)
                .map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{transaction.partName}</p>
                      <p className="text-sm text-stone-400">Mecânico: {transaction.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-500 font-semibold">
                        {transaction.quantity} un.
                      </p>
                      <p className="text-xs text-stone-500">
                        {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              {transactions.filter(t => t.status === 'active').length === 0 && (
                <p className="text-stone-500 text-center py-8">
                  Nenhuma retirada ativa
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link
            to="/parts"
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl p-6 transition-all transform hover:scale-105 flex items-center justify-between shadow-lg shadow-amber-900/30"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">Gerenciar Peças</h3>
              <p className="text-amber-100 text-sm">Adicionar, editar ou visualizar peças</p>
            </div>
            <Package className="w-8 h-8" />
          </Link>

          <Link
            to="/transactions"
            className="bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 rounded-xl p-6 transition-all transform hover:scale-105 flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">Movimentações</h3>
              <p className="text-stone-400 text-sm">Retirar ou devolver peças</p>
            </div>
            <ArrowLeftRight className="w-8 h-8" />
          </Link>
        </div>
      </main>
    </div>
  );
}