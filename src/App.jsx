import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  ClipboardList, 
  LayoutDashboard, 
  Timer, 
  User2,
  Monitor,
  Printer,
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle,
  Stethoscope,
  Pill,
  Syringe
} from 'lucide-react';

// Hook para sincronizar OS DADOS DA FILA entre abas diferentes (Simula um Banco de Dados)
function useSharedState(key, initialValue) {
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setState];
}

// Hook para salvar A FUNÇÃO DA MÁQUINA apenas nesta aba específica
function useSessionState(key, initialValue) {
  const [state, setState] = useState(() => {
    const storedValue = sessionStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  // Estado da Máquina Atual
  const [terminalRole, setTerminalRole] = useSessionState('ubs_terminal_role', null);
  
  // Estados de Autenticação do Técnico
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Estados Globais (Filas)
  const [tickets, setTickets] = useSharedState('ubs_tickets', []);
  const [ticketCounter, setTicketCounter] = useSharedState('ubs_counter', 1);
  const [currentCall, setCurrentCall] = useSharedState('ubs_current_call', null);

  const services = [
    { id: 'triagem', name: 'Triagem / Acolhimento', icon: Activity, prefix: 'TR' },
    { id: 'consulta', name: 'Consulta Médica', icon: Stethoscope, prefix: 'CM' },
    { id: 'farmacia', name: 'Retirada de Medicamentos', icon: Pill, prefix: 'FA' },
    { id: 'vacina', name: 'Vacinação', icon: Syringe, prefix: 'VA' },
  ];

  // --- LÓGICA DE NEGÓCIO ---

  const generateTicket = (serviceId, isPriority) => {
    const service = services.find(s => s.id === serviceId);
    const priorityPrefix = isPriority ? 'P' : 'N';
    const ticketNumber = `${service.prefix}-${priorityPrefix}${String(ticketCounter).padStart(3, '0')}`;
    
    const newTicket = {
      id: Date.now(),
      number: ticketNumber,
      service: serviceId,
      serviceName: service.name,
      isPriority: isPriority,
      status: 'waiting', 
      createdAt: new Date().getTime(),
      calledAt: null,
    };

    setTickets([...tickets, newTicket]);
    setTicketCounter(ticketCounter + 1);
    alert(`Impressão simulada com sucesso!\nSua Senha: ${ticketNumber}`);
  };

  const callNext = (serviceId) => {
    const waitingTickets = tickets.filter(t => t.service === serviceId && t.status === 'waiting');
    if (waitingTickets.length === 0) return;

    // Prioridade baseada no Princípio de Equidade do SUS
    waitingTickets.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.createdAt - b.createdAt;
    });

    const ticketToCall = waitingTickets[0];
    const updatedTickets = tickets.map(t => 
      t.id === ticketToCall.id ? { ...t, status: 'called', calledAt: new Date().getTime() } : t
    );

    setTickets(updatedTickets);
    setCurrentCall({
      ticket: ticketToCall.number,
      desk: `Guichê de ${services.find(s => s.id === serviceId).name}`,
      time: new Date().getTime()
    });
  };

  const completeTicket = (ticketId) => {
    const updatedTickets = tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'completed' } : t
    );
    setTickets(updatedTickets);
  };

  // --- LÓGICA DE AUTENTICAÇÃO DO TÉCNICO ---

  const handleRoleSelection = (role) => {
    setPendingRole(role);
    setIsAuthModalOpen(true);
    setAuthError(false);
    setPasswordInput('');
  };

  const authenticate = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin') { // Senha do sistema
      if (pendingRole === 'logout') {
        setTerminalRole(null);
      } else {
        setTerminalRole(pendingRole);
      }
      setIsAuthModalOpen(false);
    } else {
      setAuthError(true);
    }
  };

  const triggerLogout = () => {
    setPendingRole('logout');
    setIsAuthModalOpen(true);
    setAuthError(false);
    setPasswordInput('');
  };

  // --- COMPONENTES AUXILIARES ---

  const TopBar = ({ title }) => (
    <div className="flex justify-between items-center bg-slate-900/80 p-4 border-b border-slate-700/50 shadow-md backdrop-blur px-8">
      <div className="flex items-center gap-3 text-cyan-300">
        <Activity size={24} />
        <span className="font-semibold tracking-[0.2em] uppercase text-sm">Sistema UBS</span>
      </div>
      <div className="text-slate-200 font-medium">{title}</div>
      <button 
        onClick={triggerLogout}
        className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium"
      >
        <Lock size={16} /> Destravar Máquina
      </button>
    </div>
  );

  const AuthModal = () => {
    if (!isAuthModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6 text-cyan-400">
            <Lock size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Acesso Restrito</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Insira a senha do técnico para configurar esta máquina.</p>
          
          <form onSubmit={authenticate} className="space-y-4">
            <div>
              <input 
                type="password" 
                autoFocus
                placeholder="Senha (dica: admin)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              {authError && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> Senha incorreta.</p>}
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                Autorizar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- TELAS PRINCIPAIS ---

  // TELA 0: Dashboard de Configuração (Baseado no seu design)
  if (!terminalRole) {
    const dashboardItems = [
      { id: 'kiosk', title: 'Totem de Triagem', description: 'Configure esta máquina para emissão de senhas.', icon: Printer },
      { id: 'panel', title: 'Painel de Espera', description: 'Configure esta máquina como monitor visual de chamadas.', icon: Monitor },
      { id: 'reception', title: 'Gestão da Recepção', description: 'Acesso da equipe para controle de filas e atendimento.', icon: LayoutDashboard },
      { id: 'relatorios', title: 'Relatórios Gerais', description: 'Gere métricas de atendimento e produtividade (Bloqueado).', icon: ClipboardList },
      { id: 'perfis', title: 'Perfis de Equipe', description: 'Defina funções e permissões da equipe de saúde (Bloqueado).', icon: CheckCircle2 },
      { id: 'tempo', title: 'Tempo Médio', description: 'Analise tempos de espera e atendimento por dia (Bloqueado).', icon: Timer },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <AuthModal />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-12 rounded-3xl bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20 ring-1 ring-slate-700/40 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/90 flex items-center gap-2">
                  <Unlock size={16} /> SETUP DO TÉCNICO
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Implantação do Sistema UBS
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Selecione o papel que este terminal assumirá. Acesso protegido por senha para evitar alterações por pacientes.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6 text-slate-200 ring-1 ring-cyan-500/20 sm:w-[28rem]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Status Atual da Rede</p>
                <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
                  <p>• Pacientes Aguardando: <strong className="text-white">{tickets.filter(t => t.status === 'waiting').length}</strong></p>
                  <p>• Total de Senhas Emitidas: <strong className="text-white">{ticketCounter - 1}</strong></p>
                  <p>• Sincronização Local: <span className="text-green-400">Ativa e Estável</span></p>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              const isActionable = ['kiosk', 'panel', 'reception'].includes(item.id);
              
              return (
                <article 
                  key={item.id} 
                  onClick={() => isActionable && handleRoleSelection(item.id)}
                  className={`group overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-900/70 p-7 shadow-2xl transition duration-300 
                    ${isActionable ? 'cursor-pointer hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/95 shadow-cyan-900/10' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Instalar Módulo</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">{item.title}</h2>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-3xl transition duration-300
                      ${isActionable ? 'bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-7 text-slate-300">{item.description}</p>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    );
  }

  // TELA 1: Máquina do Totem (Kiosk)
  if (terminalRole === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
        <AuthModal />
        <TopBar title="Totem de Autoatendimento" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white tracking-tight">Bem-vindo(a) à UBS</h2>
            <p className="text-cyan-400 mt-4 text-xl">Toque na opção desejada para retirar sua senha</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div key={service.id} className="bg-slate-900/80 border border-slate-700/50 rounded-[2rem] p-8 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="bg-cyan-500/10 p-4 rounded-full text-cyan-400">
                      <IconComponent size={40} />
                    </div>
                    <h3 className="text-2xl font-semibold text-white">{service.name}</h3>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => generateTicket(service.id, false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-5 rounded-2xl font-semibold text-lg transition-colors border border-slate-700">
                      Normal
                    </button>
                    <button onClick={() => generateTicket(service.id, true)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-5 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-cyan-900/20">
                      Preferencial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: Máquina do Painel (Monitor)
  if (terminalRole === 'panel') {
    const calledTickets = tickets.filter(t => t.status === 'called').sort((a, b) => b.calledAt - a.calledAt);
    const history = calledTickets.slice(1, 5); 

    return (
      <div className="min-h-screen bg-slate-950 font-sans flex flex-col">
        <AuthModal />
        <TopBar title="Monitor da Sala de Espera" />
        <div className="flex-1 flex p-6 gap-6 h-full">
          <div className="flex-1 bg-slate-900/80 rounded-[2rem] shadow-2xl border border-slate-800 flex flex-col justify-center items-center p-10 text-center relative overflow-hidden">
            {/* Efeito visual de fundo */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            
            <h2 className="text-3xl font-bold text-slate-400 mb-8 uppercase tracking-[0.4em]">Senha Atual</h2>
            {currentCall ? (
              <>
                <div className="text-[12rem] leading-none font-black text-white mb-8 tracking-tighter drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  {currentCall.ticket}
                </div>
                <div className="text-5xl font-bold text-slate-300 bg-slate-950 py-8 px-16 rounded-[2rem] w-full border border-slate-800 shadow-inner">
                  Dirija-se à: <br/> <span className="text-cyan-400 mt-4 block">{currentCall.desk}</span>
                </div>
              </>
            ) : (
              <div className="text-4xl text-slate-600">Aguardando chamadas...</div>
            )}
          </div>
          
          <div className="w-1/3 bg-slate-900/80 rounded-[2rem] shadow-2xl border border-slate-800 p-8 flex flex-col">
            <h3 className="text-2xl font-semibold text-white mb-8 border-b border-slate-700/50 pb-6 flex items-center gap-3">
              <Timer className="text-cyan-400" size={28} /> Últimas Chamadas
            </h3>
            <div className="flex flex-col gap-4 overflow-y-auto">
              {history.length > 0 ? history.map(ticket => (
                <div key={ticket.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-4xl font-bold text-slate-200">{ticket.number}</span>
                  <span className="text-slate-400 font-medium text-right text-sm">
                    {ticket.serviceName}
                  </span>
                </div>
              )) : (
                <div className="text-slate-600 text-center mt-10 text-lg">Histórico vazio.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA 3: Máquina da Recepção (Gestão)
  if (terminalRole === 'reception') {
    const stats = services.map(service => {
      const waiting = tickets.filter(t => t.service === service.id && t.status === 'waiting');
      return {
        ...service,
        waitingTotal: waiting.length,
        waitingPreferencial: waiting.filter(t => t.isPriority).length
      };
    });
    const activeAtendimentos = tickets.filter(t => t.status === 'called');

    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <AuthModal />
        <TopBar title="Painel do Profissional - Controle de Fluxo" />
        <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-slate-900/80 p-8 rounded-[2rem] shadow-xl border border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <User2 size={28} className="text-cyan-400"/> Filas de Atendimento
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stats.map(stat => (
                  <div key={stat.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="font-semibold text-slate-200 text-lg">{stat.name}</h3>
                      <div className="bg-slate-800 text-cyan-300 font-bold px-4 py-1.5 rounded-full text-sm border border-slate-700">
                        {stat.waitingTotal} na fila
                      </div>
                    </div>
                    {stat.waitingTotal > 5 && (
                      <div className="text-red-400 text-sm flex items-center gap-1.5 mb-4 font-medium bg-red-400/10 w-fit px-3 py-1 rounded-full border border-red-400/20">
                        <AlertCircle size={14} /> Gargalo identificado
                      </div>
                    )}
                    <div className="text-sm text-slate-400 mb-6 flex items-center justify-between">
                      <span>Prioridades aguardando:</span>
                      <span className="font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">{stat.waitingPreferencial}</span>
                    </div>
                    <button 
                      onClick={() => callNext(stat.id)}
                      disabled={stat.waitingTotal === 0}
                      className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${stat.waitingTotal === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.2)]'}`}
                    >
                      Chamar Próximo <ChevronRight size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-8 rounded-[2rem] shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Activity size={28} className="text-cyan-400"/> Em Atendimento
            </h2>
            <div className="space-y-4">
              {activeAtendimentos.length > 0 ? activeAtendimentos.map(ticket => (
                <div key={ticket.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex justify-between items-center group hover:border-cyan-500/30 transition-colors">
                  <div>
                    <div className="font-bold text-2xl text-white mb-1">{ticket.number}</div>
                    <div className="text-sm text-cyan-400">{ticket.serviceName}</div>
                  </div>
                  <button 
                    onClick={() => completeTicket(ticket.id)} 
                    className="bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 p-3 rounded-full transition-all border border-transparent hover:border-emerald-500/30" 
                    title="Finalizar Atendimento"
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              )) : (
                <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-3">
                  <CheckCircle2 size={40} className="opacity-20"/>
                  <span>Nenhum atendimento ativo.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }
}