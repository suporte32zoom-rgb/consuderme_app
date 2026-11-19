import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Printer, 
  FileSpreadsheet, 
  PieChart, 
  Receipt, 
  AlertCircle, 
  Tag, 
  ChevronRight, 
  Trash2, 
  Filter, 
  Building2, 
  Sparkles,
  Search,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { DoctorProfile, FinancialTransaction, TransactionType, PaymentMethod, PaymentStatus, FinancialCategory } from '../types';
import { safeArray, safeNumber, safeStorageGet, safeStorageSet, safeString } from '../utils/safeHelpers';

interface FinancialCashFlowModuleProps {
  doctorProfile: DoctorProfile;
}

const CATEGORY_MAP: Record<FinancialCategory, { label: string; type: TransactionType; color: string }> = {
  consultation: { label: 'Consulta Clínica Dermatológica', type: 'income', color: 'text-teal-400' },
  procedure_botox: { label: 'Toxina Botulínica (Botox)', type: 'income', color: 'text-emerald-400' },
  procedure_filler: { label: 'Preenchimento com Ácido Hialurônico', type: 'income', color: 'text-cyan-400' },
  procedure_biostimulator: { label: 'Bioestimulador de Colágeno (PLLA/CaHA)', type: 'income', color: 'text-blue-400' },
  procedure_peeling: { label: 'Peeling Químico / Clareamento', type: 'income', color: 'text-indigo-400' },
  procedure_surgery: { label: 'Pequena Cirurgia / Biópsia Cutânea', type: 'income', color: 'text-purple-400' },
  procedure_laser: { label: 'Laser / Eletrocautério / Tecnologias', type: 'income', color: 'text-fuchsia-400' },
  other_procedure: { label: 'Outros Procedimentos Médicos', type: 'income', color: 'text-slate-300' },
  supplies_injectables: { label: 'Compra de Injetáveis (Toxinas, AH, Bioestimuladores)', type: 'expense', color: 'text-amber-400' },
  supplies_cosmetics: { label: 'Produtos de Cabine & Skincare', type: 'expense', color: 'text-orange-400' },
  supplies_disposables: { label: 'Descartáveis (Seringas, Agulhas, Luvas, Gazes)', type: 'expense', color: 'text-rose-400' },
  clinic_rent: { label: 'Aluguel / Condomínio do Consultório', type: 'expense', color: 'text-red-400' },
  utilities: { label: 'Luz, Água, Internet e Telefonia', type: 'expense', color: 'text-red-300' },
  staff_salary: { label: 'Equipe / Secretária / Recepção', type: 'expense', color: 'text-rose-300' },
  software_systems: { label: 'Sistemas Médicos, Assinaturas & Nuvem', type: 'expense', color: 'text-pink-400' },
  marketing: { label: 'Marketing Médico, Tráfego & Website', type: 'expense', color: 'text-purple-300' },
  taxes_anuidade: { label: 'Impostos (Simples/Carnê-Leão) & CRM/SBD', type: 'expense', color: 'text-amber-300' },
  equipment: { label: 'Manutenção / Aquisição de Equipamentos', type: 'expense', color: 'text-yellow-400' },
  other_expense: { label: 'Outras Despesas Operacionais', type: 'expense', color: 'text-slate-400' }
};

const PAYMENT_METHOD_MAP: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  pix: { label: 'PIX (Instantâneo)', icon: <QrCode className="w-3.5 h-3.5 text-teal-400" /> },
  credit_card: { label: 'Cartão de Crédito', icon: <CreditCard className="w-3.5 h-3.5 text-blue-400" /> },
  debit_card: { label: 'Cartão de Débito', icon: <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> },
  cash: { label: 'Dinheiro Espécie', icon: <Banknote className="w-3.5 h-3.5 text-emerald-400" /> },
  bank_slip: { label: 'Boleto Bancário', icon: <Receipt className="w-3.5 h-3.5 text-amber-400" /> },
  bank_transfer: { label: 'Transferência / TED', icon: <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" /> }
};

export const FinancialCashFlowModule: React.FC<FinancialCashFlowModuleProps> = ({ doctorProfile }) => {
  // Real storage: initialize 100% clean if empty
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const loaded = safeStorageGet<FinancialTransaction[]>('consuderme_financial_transactions', []);
    return safeArray<FinancialTransaction>(loaded);
  });

  // Active view tab inside financial module
  const [activeSubTab, setActiveSubTab] = useState<'flow' | 'dre' | 'new_transaction' | 'unit_margin'>('flow');
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'received' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal / Form state
  const [newType, setNewType] = useState<TransactionType>('income');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<FinancialCategory>('procedure_botox');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCostOfGoods, setNewCostOfGoods] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('pix');
  const [newInstallments, setNewInstallments] = useState<number>(1);
  const [newStatus, setNewStatus] = useState<PaymentStatus>('received');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  // Save to local storage
  useEffect(() => {
    safeStorageSet('consuderme_financial_transactions', safeArray(transactions));
  }, [transactions]);

  // Handle transaction creation
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amountNum = safeNumber(newAmount, 0);
    if (amountNum <= 0) {
      setFormError('Por favor, informe um valor monetário válido maior que zero.');
      return;
    }

    const costNum = safeNumber(newCostOfGoods, 0);
    const catMeta = CATEGORY_MAP[newCategory] || { label: 'Lançamento Financeiro', type: newType, color: 'text-slate-300' };

    const newTx: FinancialTransaction = {
      id: Date.now().toString(),
      type: newType,
      description: safeString(newDesc).trim() || catMeta.label,
      category: newCategory,
      categoryLabel: catMeta.label,
      amount: amountNum,
      costOfGoods: costNum,
      date: safeString(newDate) || new Date().toISOString().split('T')[0],
      paymentMethod: newPaymentMethod,
      installments: safeNumber(newInstallments, 1),
      status: newStatus,
      patientName: safeString(newPatientName).trim() || '',
      notes: safeString(newNotes).trim() || '',
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...safeArray<FinancialTransaction>(prev)]);

    // Reset Form
    setNewDesc('');
    setNewAmount('');
    setNewCostOfGoods('');
    setNewPatientName('');
    setNewNotes('');
    setActiveSubTab('flow');
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => safeArray<FinancialTransaction>(prev).filter(t => t.id !== id));
    setPendingDeleteId(null);
  };

  // Toggle status
  const handleToggleStatus = (id: string) => {
    setTransactions(prev => safeArray<FinancialTransaction>(prev).map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'received' ? 'pending' : 'received'
        };
      }
      return t;
    }));
  };

  const safeTxList = safeArray<FinancialTransaction>(transactions);

  // KPI Calculations
  const totalIncomeReceived = safeTxList
    .filter(t => t?.type === 'income' && t?.status === 'received')
    .reduce((acc, curr) => acc + safeNumber(curr?.amount, 0), 0);

  const totalIncomePending = safeTxList
    .filter(t => t?.type === 'income' && t?.status === 'pending')
    .reduce((acc, curr) => acc + safeNumber(curr?.amount, 0), 0);

  const totalExpensePaid = safeTxList
    .filter(t => t?.type === 'expense' && t?.status === 'received')
    .reduce((acc, curr) => acc + safeNumber(curr?.amount, 0), 0);

  const totalExpensePending = safeTxList
    .filter(t => t?.type === 'expense' && t?.status === 'pending')
    .reduce((acc, curr) => acc + safeNumber(curr?.amount, 0), 0);

  const netBalance = totalIncomeReceived - totalExpensePaid;
  const netMargin = totalIncomeReceived > 0 ? (netBalance / totalIncomeReceived) * 100 : 0;

  const totalProceduresCount = safeTxList.filter(t => t?.type === 'income').length;
  const averageTicket = totalProceduresCount > 0 ? totalIncomeReceived / totalProceduresCount : 0;

  // Filtered transactions
  const filteredTransactions = safeTxList.filter(t => {
    if (!t) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchTerm) {
      const term = safeString(searchTerm).toLowerCase();
      const matchDesc = safeString(t.description).toLowerCase().includes(term);
      const matchPatient = safeString(t.patientName).toLowerCase().includes(term);
      const matchCat = safeString(t.categoryLabel).toLowerCase().includes(term);
      if (!matchDesc && !matchPatient && !matchCat) return false;
    }
    return true;
  });

  // Format Currency
  const formatBRL = (value: number) => {
    return safeNumber(value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>GESTÃO FINANCEIRA & FLUXO DE CAIXA REAL</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Fluxo de Caixa do Consultório
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Controle completo de entradas por procedimentos, consultas, custos diretos de insumos farmacológicos e despesas operacionais do consultório de <strong className="text-teal-300">{doctorProfile.name || 'Dermatologia'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-new-transaction"
              onClick={() => setActiveSubTab('new_transaction')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
              title="Imprimir Relatório Financeiro"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir DRE</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas Realizadas */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Receitas Realizadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {formatBRL(totalIncomeReceived)}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-400">
              <span>{transactions.filter(t => t.type === 'income' && t.status === 'received').length} atendimentos recebidos</span>
            </div>
          </div>
        </div>

        {/* Despesas Pagas */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Despesas & Insumos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 font-mono">
              {formatBRL(totalExpensePaid)}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
              <span>{transactions.filter(t => t.type === 'expense' && t.status === 'received').length} pagamentos realizados</span>
            </div>
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Saldo / Lucro Líquido</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${netBalance >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {formatBRL(netBalance)}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-300">
              <span>Margem Líquida: <strong>{netMargin.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Previsão a Receber */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Contas a Receber (Pendente)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono">
              {formatBRL(totalIncomePending)}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
              <span>Ticket Médio: <strong>{formatBRL(averageTicket)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('flow')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'flow'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Extrato de Movimentações ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dre')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'dre'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>DRE do Consultório</span>
        </button>

        <button
          onClick={() => setActiveSubTab('new_transaction')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'new_transaction'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* VIEW: EXTRATO / FLUXO DE CAIXA */}
      {activeSubTab === 'flow' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por paciente, procedimento..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition ${filterType === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-2.5 py-1 rounded-md transition ${filterType === 'income' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Receitas (+)
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-2.5 py-1 rounded-md transition ${filterType === 'expense' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Despesas (-)
                </button>
              </div>

              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-md transition ${filterStatus === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Status: Todos
                </button>
                <button
                  onClick={() => setFilterStatus('received')}
                  className={`px-2.5 py-1 rounded-md transition ${filterStatus === 'received' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Quitados
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2.5 py-1 rounded-md transition ${filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Pendentes
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List / Clean State */}
          {transactions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  Ambiente 100% Limpo e Pronto para o Primeiro Paciente
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nenhum lançamento fictício registrado. O fluxo de caixa real será alimentado conforme você registrar seus primeiros atendimentos, procedimentos ou lançar despesas fixas.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveSubTab('new_transaction')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 hover:opacity-90 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Primeiro Atendimento / Lançamento</span>
                </button>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              Nenhuma movimentação corresponde aos filtros selecionados.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição / Categoria</th>
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Forma de Pagamento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const isReceived = tx.status === 'received';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/60 transition-colors">
                          {/* Data */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </td>

                          {/* Descrição & Categoria */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span>{tx.description}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {tx.categoryLabel}
                            </div>
                          </td>

                          {/* Paciente */}
                          <td className="py-3 px-4 text-slate-300">
                            {tx.patientName ? (
                              <span className="font-medium text-slate-200">{tx.patientName}</span>
                            ) : (
                              <span className="text-slate-500 italic">Despesa Geral</span>
                            )}
                          </td>

                          {/* Forma de Pagamento */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              {PAYMENT_METHOD_MAP[tx.paymentMethod]?.icon}
                              <span>{PAYMENT_METHOD_MAP[tx.paymentMethod]?.label}</span>
                              {tx.installments && tx.installments > 1 && (
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                                  {tx.installments}x
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(tx.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                isReceived
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              }`}
                              title="Clique para alternar entre Pago e Pendente"
                            >
                              {isReceived ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>{isIncome ? 'Recebido' : 'Pago'}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Pendente</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Valor */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className={`font-bold font-mono text-sm ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isIncome ? '+' : '-'} {formatBRL(tx.amount)}
                            </span>
                            {tx.costOfGoods && tx.costOfGoods > 0 && isIncome && (
                              <div className="text-[10px] text-slate-400">
                                Insumos: -{formatBRL(tx.costOfGoods)}
                              </div>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {pendingDeleteId === tx.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded hover:bg-rose-700 transition"
                                >
                                  Excluir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2 py-0.5 bg-slate-700 text-slate-200 text-[10px] rounded hover:bg-slate-600 transition"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(tx.id)}
                                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DRE DO CONSULTÓRIO (DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO) */}
      {activeSubTab === 'dre' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Demonstrativo do Resultado do Exercício (DRE)
              </h2>
              <p className="text-xs text-slate-400">Visão gerencial consolidada de margens, insumos e lucro operacional do consultório</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">Consultório:</span>
              <div className="font-bold text-white text-xs">{doctorProfile.clinicName || 'Consultório Dermatológico'}</div>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* 1. Receita Bruta */}
            <div className="p-3 bg-slate-850 rounded-xl flex items-center justify-between border border-slate-750">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">1</span>
                <span className="font-bold text-white uppercase">(+) Receita Bruta de Procedimentos & Consultas</span>
              </div>
              <span className="font-black text-emerald-400 text-sm">{formatBRL(totalIncomeReceived)}</span>
            </div>

            {/* 2. Custos Diretos de Insumos */}
            <div className="p-3 bg-slate-850/70 rounded-xl flex items-center justify-between border border-slate-800 text-slate-300">
              <div className="flex items-center space-x-2 pl-4">
                <span className="text-slate-500">•</span>
                <span>(-) Custos de Insumos Injetáveis (Toxina, AH, Bioestimuladores)</span>
              </div>
              <span className="text-rose-400">
                -{formatBRL(
                  transactions
                    .filter(t => t.type === 'expense' && (t.category === 'supplies_injectables' || t.category === 'supplies_disposables'))
                    .reduce((acc, curr) => acc + curr.amount, 0)
                )}
              </span>
            </div>

            {/* 3. Margem de Contribuição Bruta */}
            <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-[10px]">2</span>
                <span className="font-bold text-white">(=) Margem de Contribuição / Lucro Bruto</span>
              </div>
              <span className="font-bold text-teal-300">
                {formatBRL(
                  totalIncomeReceived -
                  transactions
                    .filter(t => t.type === 'expense' && (t.category === 'supplies_injectables' || t.category === 'supplies_disposables'))
                    .reduce((acc, curr) => acc + curr.amount, 0)
                )}
              </span>
            </div>

            {/* 4. Despesas Fixas e Administrativas */}
            <div className="p-3 bg-slate-850/70 rounded-xl flex items-center justify-between border border-slate-800 text-slate-300">
              <div className="flex items-center space-x-2 pl-4">
                <span className="text-slate-500">•</span>
                <span>(-) Despesas Fixas (Aluguel, Equipe, Software, Luz, Anuidade CRM)</span>
              </div>
              <span className="text-rose-400">
                -{formatBRL(
                  transactions
                    .filter(t => t.type === 'expense' && t.category !== 'supplies_injectables' && t.category !== 'supplies_disposables')
                    .reduce((acc, curr) => acc + curr.amount, 0)
                )}
              </span>
            </div>

            {/* 5. Lucro Operacional Líquido */}
            <div className="p-4 bg-gradient-to-r from-teal-950 to-slate-900 rounded-xl flex items-center justify-between border border-teal-500/50 shadow-md">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-teal-500 text-slate-950 font-black flex items-center justify-center text-[10px]">3</span>
                <div>
                  <div className="font-black text-white text-sm">(=) RESULTADO LÍQUIDO DO CONSULTÓRIO</div>
                  <div className="text-[10px] text-teal-300">Margem Líquida Real: {netMargin.toFixed(1)}%</div>
                </div>
              </div>
              <span className={`font-black text-lg ${netBalance >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
                {formatBRL(netBalance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: NOVO LANÇAMENTO FORM */}
      {activeSubTab === 'new_transaction' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Cadastrar Lançamento Financeiro</h2>
                <p className="text-xs text-slate-400">Registre entradas por atendimentos ou saídas de despesas do consultório</p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('flow')}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {/* Tipo de Transação */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Tipo de Lançamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewType('income');
                    setNewCategory('procedure_botox');
                  }}
                  className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    newType === 'income'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Receita / Entrada (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewType('expense');
                    setNewCategory('supplies_injectables');
                  }}
                  className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                    newType === 'expense'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/10'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                  <span>Despesa / Saída (-)</span>
                </button>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as FinancialCategory)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(CATEGORY_MAP)
                  .filter(([_, cat]) => cat.type === newType)
                  .map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Descrição & Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição do Lançamento</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Toxina Botulínica Terço Superior (50 UI)"
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome do Paciente (Opcional)</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Ex: Maria Clara Souza"
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Valor {newType === 'income' ? 'Cobrado do Paciente (R$)' : 'da Despesa (R$)'} *
                </label>
                <input
                  type="text"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="1200,00"
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {newType === 'income' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Custo de Insumos Diretos (R$ - opcional)
                  </label>
                  <input
                    type="text"
                    value={newCostOfGoods}
                    onChange={(e) => setNewCostOfGoods(e.target.value)}
                    placeholder="420,00"
                    className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-rose-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Usado para calcular a margem de lucro líquida do procedimento</span>
                </div>
              )}
            </div>

            {/* Forma de Pagamento & Parcelas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Forma de Pagamento</label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(PAYMENT_METHOD_MAP).map(([key, method]) => (
                    <option key={key} value={key}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Parcelamento</label>
                <select
                  value={newInstallments}
                  onChange={(e) => setNewInstallments(parseInt(e.target.value))}
                  disabled={newPaymentMethod !== 'credit_card'}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value={1}>À vista (1x)</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                  <option value={5}>5x</option>
                  <option value={6}>6x</option>
                  <option value={10}>10x</option>
                  <option value={12}>12x</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="received">{newType === 'income' ? 'Recebido / Quitado' : 'Pago'}</option>
                  <option value="pending">Pendente / A Receber</option>
                </select>
              </div>
            </div>

            {/* Data e Notas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Observações Internas</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Retorno agendado para 15 dias"
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('flow')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition"
              >
                Salvar Lançamento no Fluxo de Caixa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
