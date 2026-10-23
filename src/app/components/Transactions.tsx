import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { 
  PlaneIcon, 
  LogOut, 
  Plus, 
  Search, 
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Clock
} from "lucide-react";
import { getCurrentUser, signOut } from "../lib/auth";
import { 
  getParts, 
  getTransactions, 
  createTransaction, 
  returnTransaction,
  Part,
  Transaction 
} from "../lib/api";
import { toast } from "sonner";
import logoImage from '@/assets/rr-logo.webp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function Transactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [withdrawFormData, setWithdrawFormData] = useState({
    partId: "",
    quantity: 1,
    notes: "",
  });
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === "all" || transaction.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions, activeTab]);

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
      console.error("Error loading data:", error);
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

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedPart = parts.find((p) => p.id === withdrawFormData.partId);
      if (!selectedPart) {
        throw new Error("Peça não encontrada");
      }

      if (withdrawFormData.quantity > selectedPart.quantity) {
        throw new Error("Quantidade indisponível em estoque");
      }

      await createTransaction({
        partId: selectedPart.id,
        partNumber: selectedPart.partNumber,
        partName: selectedPart.name,
        quantity: withdrawFormData.quantity,
        notes: withdrawFormData.notes,
      });

      toast.success("Retirada registrada com sucesso!");
      setIsWithdrawDialogOpen(false);
      setWithdrawFormData({ partId: "", quantity: 1, notes: "" });
      await loadData();
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      toast.error(error.message || "Erro ao registrar retirada");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedTransaction) {
        throw new Error("Transação não encontrada");
      }

      if (returnQuantity > selectedTransaction.quantity) {
        throw new Error("Quantidade de devolução maior que a retirada");
      }

      await returnTransaction(selectedTransaction.id, returnQuantity);

      toast.success("Devolução registrada com sucesso!");
      setIsReturnDialogOpen(false);
      setSelectedTransaction(null);
      setReturnQuantity(1);
      await loadData();
    } catch (error: any) {
      console.error("Error returning transaction:", error);
      toast.error(error.message || "Erro ao registrar devolução");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReturnDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReturnQuantity(transaction.quantity);
    setIsReturnDialogOpen(true);
  };

  if (loading && transactions.length === 0) {
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
                className="h-10 w-auto"
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
              className="px-4 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
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
              className="px-4 py-2 text-amber-400 bg-stone-800 rounded-lg font-medium"
            >
              Movimentações
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar movimentações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
            />
          </div>
          <button
            onClick={() => setIsWithdrawDialogOpen(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
          >
            <Plus className="w-5 h-5" />
            Nova Retirada
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-stone-900 border border-stone-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-stone-800">
              Ativas
            </TabsTrigger>
            <TabsTrigger value="returned" className="data-[state=active]:bg-stone-800">
              Devolvidas
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-stone-800">
              Todas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transactions List */}
        <div className="grid gap-4">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6 hover:border-amber-600/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    transaction.status === 'active'
                      ? 'bg-yellow-600/20'
                      : 'bg-green-600/20'
                  }`}>
                    {transaction.status === 'active' ? (
                      <ArrowDownToLine className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {transaction.partName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.status === 'active'
                          ? 'bg-yellow-600/20 text-yellow-500'
                          : 'bg-green-600/20 text-green-500'
                      }`}>
                        {transaction.status === 'active' ? 'Ativa' : 'Devolvida'}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mb-2">
                      PN: {transaction.partNumber}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-stone-400">
                        Mecânico: <span className="text-white">{transaction.userName}</span>
                      </span>
                      <span className="text-stone-400">
                        Retirada: <span className="text-white">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                      {transaction.returnedAt && (
                        <span className="text-stone-400">
                          Devolução: <span className="text-white">
                            {new Date(transaction.returnedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-stone-500 mt-2">
                        Obs: {transaction.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-stone-400 mb-1">Quantidade</p>
                    <p className="text-2xl font-bold text-white">
                      {transaction.quantityReturned || transaction.quantity}
                    </p>
                    {transaction.quantityReturned && transaction.quantityReturned !== transaction.quantity && (
                      <p className="text-xs text-stone-500">
                        Retirado: {transaction.quantity}
                      </p>
                    )}
                  </div>

                  {transaction.status === 'active' && (
                    <div className="border-l border-stone-800 pl-4">
                      <button
                        onClick={() => handleOpenReturnDialog(transaction)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ArrowUpFromLine className="w-4 h-4" />
                        Devolver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma movimentação encontrada</p>
            </div>
          )}
        </div>
      </main>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Nova Retirada</DialogTitle>
            <DialogDescription className="text-stone-400">
              Registre a retirada de uma peça
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <Label htmlFor="part">Peça *</Label>
              <Select
                value={withdrawFormData.partId}
                onValueChange={(value) =>
                  setWithdrawFormData({ ...withdrawFormData, partId: value })
                }
              >
                <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                  <SelectValue placeholder="Selecione uma peça" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700 text-white max-h-64">
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} ({part.partNumber}) - Estoque: {part.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                required
                min="1"
                value={withdrawFormData.quantity}
                onChange={(e) =>
                  setWithdrawFormData({
                    ...withdrawFormData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={withdrawFormData.notes}
                onChange={(e) =>
                  setWithdrawFormData({ ...withdrawFormData, notes: e.target.value })
                }
                className="bg-stone-800 border-stone-700 text-white"
                rows={3}
                placeholder="Adicione informações adicionais..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsWithdrawDialogOpen(false)}
                className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 text-white rounded-lg transition-colors"
              >
                {loading ? "Registrando..." : "Registrar Retirada"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
            <DialogDescription className="text-stone-400">
              Devolva a peça retirada
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="bg-stone-800 p-4 rounded-lg">
                <p className="text-sm text-stone-400 mb-1">Peça</p>
                <p className="text-white font-medium">{selectedTransaction.partName}</p>
                <p className="text-sm text-stone-400 mt-2">Quantidade retirada</p>
                <p className="text-white font-medium">{selectedTransaction.quantity}</p>
              </div>

              <div>
                <Label htmlFor="returnQuantity">Quantidade a devolver *</Label>
                <Input
                  id="returnQuantity"
                  type="number"
                  required
                  min="1"
                  max={selectedTransaction.quantity}
                  value={returnQuantity}
                  onChange={(e) =>
                    setReturnQuantity(parseInt(e.target.value) || 1)
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReturnDialogOpen(false)}
                  className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-stone-700 text-white rounded-lg transition-colors"
                >
                  {loading ? "Registrando..." : "Confirmar Devolução"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}