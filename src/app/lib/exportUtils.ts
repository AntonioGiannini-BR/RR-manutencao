import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Part, Transaction } from './api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  parts: Part[];
  transactions: Transaction[];
}

export function exportToExcel(data: ExportData) {
  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Peças
  const partsData = data.parts.map(part => ({
    'Número da Peça': part.partNumber,
    'Nome': part.name,
    'Descrição': part.description || '-',
    'Categoria': part.category,
    'Fabricante': part.manufacturer || '-',
    'Quantidade em Estoque': part.quantity,
    'Quantidade Mínima': part.minQuantity || 5,
    'Localização': part.location || '-',
    'Preço (R$)': part.price ? `R$ ${part.price.toFixed(2)}` : '-',
    'Status': part.quantity <= (part.minQuantity || 5) ? 'CRÍTICO' : 'OK',
  }));

  const partsSheet = XLSX.utils.json_to_sheet(partsData);
  XLSX.utils.book_append_sheet(workbook, partsSheet, 'Peças');

  // Sheet 2: Movimentações
  const transactionsData = data.transactions.map(transaction => {
    const part = data.parts.find(p => p.id === transaction.partId);
    return {
      'Data/Hora Retirada': format(new Date(transaction.withdrawnAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Peça (PN)': part?.partNumber || '-',
      'Nome da Peça': part?.name || '-',
      'Mecânico': transaction.mechanicName,
      'Quantidade Retirada': transaction.quantity,
      'Quantidade Devolvida': transaction.returnedQuantity || 0,
      'Data/Hora Devolução': transaction.returnedAt 
        ? format(new Date(transaction.returnedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
        : 'Não devolvido',
      'Status': transaction.returnedAt ? 'Devolvido' : 'Em uso',
      'Observações': transaction.notes || '-',
    };
  });

  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Movimentações');

  // Sheet 3: Resumo
  const totalParts = data.parts.length;
  const criticalParts = data.parts.filter(p => p.quantity <= (p.minQuantity || 5)).length;
  const totalTransactions = data.transactions.length;
  const pendingReturns = data.transactions.filter(t => !t.returnedAt).length;
  const totalValue = data.parts.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);

  const summaryData = [
    { 'Indicador': 'Total de Peças Cadastradas', 'Valor': totalParts },
    { 'Indicador': 'Peças em Estoque Crítico', 'Valor': criticalParts },
    { 'Indicador': 'Total de Movimentações', 'Valor': totalTransactions },
    { 'Indicador': 'Devoluções Pendentes', 'Valor': pendingReturns },
    { 'Indicador': 'Valor Total do Estoque (R$)', 'Valor': `R$ ${totalValue.toFixed(2)}` },
    { 'Indicador': 'Data da Exportação', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Gerar arquivo
  const fileName = `RR_Inventario_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para mais espaço

  // Título
  doc.setFontSize(18);
  doc.text('RR Manutenção de Aeronaves', 14, 15);
  doc.setFontSize(14);
  doc.text('Relatório Completo de Inventário', 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 28);

  // Resumo
  doc.setFontSize(12);
  doc.text('Resumo do Estoque', 14, 38);
  
  const totalParts = data.parts.length;
  const criticalParts = data.parts.filter(p => p.quantity <= (p.minQuantity || 5)).length;
  const totalTransactions = data.transactions.length;
  const pendingReturns = data.transactions.filter(t => !t.returnedAt).length;
  const totalValue = data.parts.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);

  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Peças Cadastradas', totalParts.toString()],
      ['Peças em Estoque Crítico', criticalParts.toString()],
      ['Total de Movimentações', totalTransactions.toString()],
      ['Devoluções Pendentes', pendingReturns.toString()],
      ['Valor Total do Estoque', `R$ ${totalValue.toFixed(2)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9] }, // amber-700
    margin: { left: 14 },
  });

  // Peças
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Lista de Peças', 14, 15);

  const partsTableData = data.parts.map(part => [
    part.partNumber,
    part.name,
    part.category,
    part.manufacturer || '-',
    part.quantity.toString(),
    (part.minQuantity || 5).toString(),
    part.location || '-',
    part.price ? `R$ ${part.price.toFixed(2)}` : '-',
    part.quantity <= (part.minQuantity || 5) ? 'CRÍTICO' : 'OK',
  ]);

  autoTable(doc, {
    startY: 20,
    head: [['PN', 'Nome', 'Categoria', 'Fabricante', 'Qtd', 'Mín', 'Local', 'Preço', 'Status']],
    body: partsTableData,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 30 },
      7: { cellWidth: 20 },
      8: { cellWidth: 20 },
    },
  });

  // Movimentações
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Histórico de Movimentações', 14, 15);

  const transactionsTableData = data.transactions.map(transaction => {
    const part = data.parts.find(p => p.id === transaction.partId);
    return [
      format(new Date(transaction.withdrawnAt), 'dd/MM/yy HH:mm', { locale: ptBR }),
      part?.partNumber || '-',
      part?.name || '-',
      transaction.mechanicName,
      transaction.quantity.toString(),
      transaction.returnedQuantity?.toString() || '0',
      transaction.returnedAt 
        ? format(new Date(transaction.returnedAt), 'dd/MM/yy HH:mm', { locale: ptBR })
        : 'Pendente',
      transaction.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 20,
    head: [['Retirada', 'PN', 'Peça', 'Mecânico', 'Qtd Ret.', 'Qtd Dev.', 'Devolução', 'Obs.']],
    body: transactionsTableData,
    theme: 'grid',
    headStyles: { fillColor: [180, 83, 9] },
    styles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
      7: { cellWidth: 40 },
    },
  });

  // Salvar PDF
  const fileName = `RR_Inventario_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  doc.save(fileName);
}