import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { 
  PlaneIcon, 
  LogOut, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { getCurrentUser, signOut } from "../lib/auth";
import { getParts, createPart, updatePart, deletePart, Part, getTransactions, Transaction } from "../lib/api";
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
import { exportToExcel, exportToPDF } from "../lib/exportUtils";

export function Parts() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    partNumber: "",
    name: "",
    description: "",
    category: "",
    quantity: 0,
    minQuantity: 5,
    location: "",
    manufacturer: "",
    price: 0,
  });

  const loadParts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);

      const data = await getParts();
      setParts(data);
    } catch (error) {
      console.error("Error loading parts:", error);
      toast.error("Erro ao carregar peças");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    const filtered = parts.filter(
      (part) =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredParts(filtered);
  }, [searchTerm, parts]);

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

  const handleOpenDialog = (part?: Part) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        partNumber: part.partNumber,
        name: part.name,
        description: part.description || "",
        category: part.category,
        quantity: part.quantity,
        minQuantity: part.minQuantity || 5,
        location: part.location || "",
        manufacturer: part.manufacturer || "",
        price: part.price || 0,
      });
    } else {
      setEditingPart(null);
      setFormData({
        partNumber: "",
        name: "",
        description: "",
        category: "",
        quantity: 0,
        minQuantity: 5,
        location: "",
        manufacturer: "",
        price: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPart) {
        await updatePart(editingPart.id, formData);
        toast.success("Peça atualizada com sucesso!");
      } else {
        await createPart(formData);
        toast.success("Peça criada com sucesso!");
      }

      setIsDialogOpen(false);
      await loadParts();
    } catch (error: any) {
      console.error("Error saving part:", error);
      toast.error(error.message || "Erro ao salvar peça");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta peça?")) {
      return;
    }

    try {
      await deletePart(id);
      toast.success("Peça excluída com sucesso!");
      await loadParts();
    } catch (error: any) {
      console.error("Error deleting part:", error);
      toast.error(error.message || "Erro ao excluir peça");
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading("Gerando arquivo Excel...");
      const transactions = await getTransactions();
      exportToExcel({ parts, transactions });
      toast.dismiss();
      toast.success("Arquivo Excel gerado com sucesso!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.dismiss();
      toast.error("Erro ao gerar arquivo Excel");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Gerando arquivo PDF...");
      const transactions = await getTransactions();
      exportToPDF({ parts, transactions });
      toast.dismiss();
      toast.success("Arquivo PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.dismiss();
      toast.error("Erro ao gerar arquivo PDF");
    }
  };

  if (loading && parts.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const isAdmin = user?.user_metadata?.isAdmin === true;

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
              className="px-4 py-2 text-amber-400 bg-stone-800 rounded-lg font-medium"
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
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
              <input
                type="text"
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition-all"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => handleOpenDialog()}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
              >
                <Plus className="w-5 h-5" />
                Nova Peça
              </button>
            )}
          </div>

          {/* Export Buttons - Only for Admin */}
          {isAdmin && (
            <div className="flex gap-3 items-center bg-stone-900/50 border border-stone-800 rounded-lg p-4">
              <span className="text-sm text-stone-400 font-medium">Exportar Relatório:</span>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <span className="text-xs text-stone-500 ml-auto">
                Inclui todas as peças e movimentações completas
              </span>
            </div>
          )}
        </div>

        {/* Parts Grid */}
        <div className="grid gap-4">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6 hover:border-amber-600/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-600/20 rounded-lg">
                    <Package className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{part.name}</h3>
                      {part.quantity <= (part.minQuantity || 5) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-stone-400 mb-2">PN: {part.partNumber}</p>
                    {part.description && (
                      <p className="text-sm text-stone-500 mb-2">{part.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-stone-400">
                        Categoria: <span className="text-white">{part.category}</span>
                      </span>
                      {part.manufacturer && (
                        <span className="text-stone-400">
                          Fabricante: <span className="text-white">{part.manufacturer}</span>
                        </span>
                      )}
                      {part.location && (
                        <span className="text-stone-400">
                          Local: <span className="text-white">{part.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-stone-400 mb-1">Estoque</p>
                    <p className={`text-2xl font-bold ${
                      part.quantity <= (part.minQuantity || 5)
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`}>
                      {part.quantity}
                    </p>
                    <p className="text-xs text-stone-500">Mín: {part.minQuantity || 5}</p>
                  </div>

                  {part.price && part.price > 0 && (
                    <div className="text-right border-l border-stone-800 pl-4">
                      <p className="text-sm text-stone-400 mb-1">Valor Unit.</p>
                      <p className="text-lg font-semibold text-white">
                        R$ {part.price.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-2 border-l border-stone-800 pl-4">
                      <button
                        onClick={() => handleOpenDialog(part)}
                        className="p-2 text-stone-400 hover:text-blue-400 hover:bg-stone-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(part.id)}
                        className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredParts.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma peça encontrada</p>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? "Editar Peça" : "Nova Peça"}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {editingPart
                ? "Atualize as informações da peça"
                : "Preencha os dados da nova peça"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partNumber">Número da Peça *</Label>
                <Input
                  id="partNumber"
                  required
                  value={formData.partNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, partNumber: e.target.value })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-stone-800 border-stone-700 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700 text-white">
                    <SelectItem value="Motor">Motor</SelectItem>
                    <SelectItem value="Fuselagem">Fuselagem</SelectItem>
                    <SelectItem value="Trem de Pouso">Trem de Pouso</SelectItem>
                    <SelectItem value="Aviônica">Aviônica</SelectItem>
                    <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                    <SelectItem value="Elétrica">Elétrica</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="minQuantity">Qtd. Mínima</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="bg-stone-800 border-stone-700 text-white"
                placeholder="ex: Prateleira A3, Caixa 12"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 text-white rounded-lg transition-colors"
              >
                {loading ? "Salvando..." : editingPart ? "Atualizar" : "Criar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}