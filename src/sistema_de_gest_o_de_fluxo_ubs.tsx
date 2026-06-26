import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, LayoutDashboard, Timer, User2,
  Monitor, Printer, ChevronRight, Lock, Unlock, AlertCircle,
  Stethoscope, Pill, Syringe, MessageCircle, Smartphone, Loader2
} from 'lucide-react';

export type ServiceId = 'triagem' | 'consulta' | 'farmacia' | 'vacina';
export type TerminalRole = 'kiosk' | 'panel' | 'reception' | null;

export type Service = {
  id: ServiceId;
  name: string;
  icon: React.ElementType;
  prefix: string;
};

export type Ticket = {
  id: number;
  number: string;
  service: ServiceId;
  serviceName: string;
  isPriority: boolean;
  source: 'totem' | 'whatsapp';
  status: 'waiting' | 'called' | 'completed';
  createdAt: number;
  calledAt: number | null;
};

export type WhatsappAppointment = {
  id: number;
  phone: string;
  service: ServiceId;
  checkedIn: boolean;
};

export type CurrentCall = {
  ticket: string;
  desk: string;
  time: number;
};

export type MessageBoxState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: ((val?: string) => void) | null;
  isPrompt: boolean;
  promptValue: string;
};

function useSharedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setState];
}

function useSessionState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const storedValue = sessionStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  const [terminalRole, setTerminalRole] = useSessionState<TerminalRole>('ubs_terminal_role', null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingRole, setPendingRole] = useState<TerminalRole | 'logout'>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<boolean>(false);
  
  const [isProcessing, setIsProcessing] = useState<{show: boolean, text: string}>({show: false, text: ''});
  
  const [messageBox, setMessageBox] = useState<MessageBoxState>({ 
    isOpen: false, title: '', message: '', onConfirm: null, isPrompt: false, promptValue: '' 
  });

  const [tickets, setTickets] = useSharedState<Ticket[]>('ubs_tickets', []);
  const [ticketCounter, setTicketCounter] = useSharedState<number>('ubs_counter', 1);
  const [currentCall, setCurrentCall] = useSharedState<CurrentCall | null>('ubs_current_call', null);
  const [whatsappAppointments, setWhatsappAppointments] = useSharedState<WhatsappAppointment[]>('ubs_whatsapp', []);

  // Diagnóstico de Estado (Visível no Console do Navegador)
  useEffect(() => {
    console.log(`[STATE DIAGNOSTIC] Terminal Role: ${terminalRole}`);
  }, [terminalRole]);

  useEffect(() => {
    if (messageBox.isOpen) {
      console.log(`[STATE DIAGNOSTIC] Modal Aberto. Tipo: ${messageBox.isPrompt ? 'Teclado Virtual (Prompt)' : 'Aviso (Alert)'}`);
    }
  }, [messageBox.isOpen, messageBox.isPrompt]);

  const services: Service[] = [
    { id: 'triagem', name: 'Triagem / Acolhimento', icon: Activity, prefix: 'TR' },
    { id: 'consulta', name: 'Consulta Médica', icon: Stethoscope, prefix: 'CM' },
    { id: 'farmacia', name: 'Retirada de Medicamentos', icon: Pill, prefix: 'FA' },
    { id: 'vacina', name: 'Vacinação', icon: Syringe, prefix: 'VA' },
  ];

  const showMessage = (title: string, message: string, onConfirm: (() => void) | null = null) => {
    setMessageBox({ isOpen: true, title, message, onConfirm, isPrompt: false, promptValue: '' });
  };

  const showPrompt = (title: string, message: string, onConfirm: (val: string) => void) => {
    setMessageBox({
      isOpen: true,
      title,
      message,
      onConfirm: (value?: string) => onConfirm(value ?? ''),
      isPrompt: true,
      promptValue: ''
    });
  };

  const closeMessageBox = () => {
    setMessageBox({ isOpen: false, title: '', message: '', onConfirm: null, isPrompt: false, promptValue: '' });
  };

  const processTicketGeneration = (serviceId: ServiceId, isPriority: boolean, source: 'totem' | 'whatsapp') => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const priorityPrefix = isPriority ? 'P' : 'N';
    const sourcePrefix = source === 'whatsapp' ? 'W' : ''; 
    const ticketNumber = `${service.prefix}-${sourcePrefix}${priorityPrefix}${String(ticketCounter).padStart(3, '0')}`;
    
    const ticketStatus: 'waiting' = 'waiting';
    
    const newTicket: Ticket = {
      id: Date.now(),
      number: ticketNumber,
      service: serviceId,
      serviceName: service.name,
      isPriority: isPriority || source === 'whatsapp', 
      source: source,
      status: ticketStatus, 
      createdAt: new Date().getTime(),
      calledAt: null,
    };

    setTickets(prev => [...prev, newTicket]);
    setTicketCounter(prev => prev + 1);
    
    if(source === 'totem') {
      showMessage("Sucesso!", `Impressão simulada com sucesso!\nSua Senha: ${ticketNumber}`);
    } else {
      showMessage("Guichê Cadastrado!", `Agendamento localizado no sistema.\nCheck-in realizado com sucesso!\nSua Senha: ${ticketNumber}`);
    }
  };

  const generateTicket = (serviceId: ServiceId, isPriority: boolean, source: 'totem' | 'whatsapp' = 'totem') => {
    setIsProcessing({ show: true, text: 'Imprimindo sua senha...' });
    
    setTimeout(() => {
      setIsProcessing({ show: false, text: '' });
      processTicketGeneration(serviceId, isPriority, source);
    }, 1500);
  };

  const callNext = (serviceId: ServiceId) => {
    const waitingTickets = tickets.filter((t: Ticket) => t.service === serviceId && t.status === 'waiting');
    if (waitingTickets.length === 0) return;

    waitingTickets.sort((a: Ticket, b: Ticket) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.createdAt - b.createdAt;
    });

    const ticketToCall = waitingTickets[0];
    const updatedTickets: Ticket[] = tickets.map((t: Ticket) => {
      if (t.id !== ticketToCall.id) return t;
      return { ...t, status: 'called', calledAt: new Date().getTime() };
    });

    setTickets(updatedTickets);
    const serviceDef = services.find(s => s.id === serviceId);
    
    setCurrentCall({
      ticket: ticketToCall.number,
      desk: `Guichê de ${serviceDef ? serviceDef.name : 'Atendimento'}`,
      time: new Date().getTime()
    });
  };

  const completeTicket = (ticketId: number) => {
    const updatedTickets: Ticket[] = tickets.map((t: Ticket) => {
      if (t.id !== ticketId) return t;
      return { ...t, status: 'completed' };
    });
    setTickets(updatedTickets);
  };

  const simulateWhatsappBooking = () => {
    const fakePhone = `(41) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newApt: WhatsappAppointment = { id: Date.now(), phone: fakePhone, service: 'consulta', checkedIn: false };
    setWhatsappAppointments([...whatsappAppointments, newApt]);
    showMessage("Simulação Concluída", `Mensagem simulada do Agente de Saúde!\nPaciente cadastrado: ${fakePhone}`);
  };

  const checkInWhatsapp = () => {
    console.log("[ACTION] Usuário solicitou check-in via WhatsApp no Totem.");
    showPrompt("Check-in via WhatsApp", "Digite o número de celular fornecido pelo seu Agente de Saúde:", (phoneToFind: string) => {
      if (!phoneToFind) return;

      setIsProcessing({ show: true, text: 'Consultando a base de dados central...' });
      
      setTimeout(() => {
        setIsProcessing({ show: false, text: '' });
        
        const cleanPhoneInput = phoneToFind.replace(/\D/g, '');
        
        const aptIndex = whatsappAppointments.findIndex((a: WhatsappAppointment) => {
          const cleanDatabasePhone = a.phone.replace(/\D/g, '');
          return cleanDatabasePhone === cleanPhoneInput;
        });
        
        if (aptIndex === -1) {
          showMessage("Não Encontrado", "Este número de celular não consta em nossos registros de agendamento. Dirija-se à recepção ou retire uma senha comum.");
          return;
        }

        if (whatsappAppointments[aptIndex].checkedIn) {
          showMessage("Atenção", "O check-in para este número já foi processado anteriormente. Caso tenha perdido sua senha, procure um funcionário.");
          return;
        }

        const updatedApts = [...whatsappAppointments];
        updatedApts[aptIndex].checkedIn = true;
        setWhatsappAppointments(updatedApts);
        
        processTicketGeneration(updatedApts[aptIndex].service, true, 'whatsapp');
      }, 2000);
    });
  };

  const handleRoleSelection = (role: TerminalRole) => {
    setPendingRole(role);
    setIsAuthModalOpen(true);
    setAuthError(false);
    setPasswordInput('');
  };

  const authenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin') {
      setTerminalRole(pendingRole === 'logout' ? null : pendingRole as TerminalRole);
      setIsAuthModalOpen(false);
      setPasswordInput(''); 
    } else {
      setAuthError(true);
      setPasswordInput(''); 
    }
  };

  const TopBar = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center bg-slate-900/90 p-5 border-b border-slate-700/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur px-8 relative z-40">
      <div className="flex items-center gap-4 text-cyan-300">
        <Activity size={28} className="animate-pulse duration-3000" />
        <span className="font-bold tracking-[0.25em] uppercase text-sm">Sistema SUS</span>
      </div>
      <div className="text-slate-100 font-semibold text-lg tracking-wide">{title}</div>
      <button onClick={() => { 
        setPendingRole('logout'); 
        setPasswordInput(''); 
        setAuthError(false);
        setIsAuthModalOpen(true); 
      }} className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium border border-transparent hover:border-rose-400/30 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-rose-400/10">
        <Lock size={16} /> Manutenção da Máquina
      </button>
    </div>
  );

  const AuthModal = () => {
    if (!isAuthModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] transform scale-100">
          <div className="flex justify-center mb-6 text-cyan-500"><Lock size={56} /></div>
          <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Área Restrita</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Autenticação necessária para alteração de parâmetros do terminal.</p>
          <form onSubmit={authenticate} className="space-y-4">
            <input type="password" autoFocus placeholder="Senha de Acesso" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-950/50 border-2 border-slate-700 rounded-xl px-5 py-4 text-white text-lg tracking-widest text-center focus:outline-none focus:border-cyan-500 transition-colors" />
            {authError && <p className="text-rose-400 text-sm mt-2 flex items-center justify-center gap-1 font-medium"><AlertCircle size={16}/> Credenciais Inválidas.</p>}
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => {
                setIsAuthModalOpen(false);
                setPasswordInput(''); 
              }} className="flex-1 py-4 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-4 px-4 rounded-xl font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">Autorizar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProcessingModal = () => {
    if (!isProcessing.show) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-[90] p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-12 max-w-md w-full shadow-2xl flex flex-col items-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-cyan-400 relative z-10" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center tracking-wide">{isProcessing.text}</h2>
          <p className="text-slate-400 mt-3 text-sm text-center">Por favor, aguarde um momento. Não feche esta tela.</p>
        </div>
      </div>
    );
  };

  const MessageBox = () => {
    if (!messageBox.isOpen) return null;

    const formatPhoneNumber = (value: string) => {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleVirtualKeypress = (key: string) => {
      const currentVal = messageBox.promptValue.replace(/\D/g, '');
      
      if (key === 'BACKSPACE') {
        const newVal = currentVal.slice(0, -1);
        setMessageBox({ ...messageBox, promptValue: formatPhoneNumber(newVal) });
      } else if (currentVal.length < 11) { 
        const newVal = currentVal + key;
        setMessageBox({ ...messageBox, promptValue: formatPhoneNumber(newVal) });
      }
    };

    return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 border-2 border-slate-700/80 rounded-[2.5rem] p-8 max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white text-center tracking-tight">{messageBox.title}</h2>
            <p className="text-slate-400 text-center mt-3 text-base leading-relaxed whitespace-pre-line">{messageBox.message}</p>
          </div>
          
          {messageBox.isPrompt ? (
            <div className="space-y-6">
              {/* Viseira do Teclado - Display do Número */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-md group-focus-within:bg-cyan-500/20 transition-all"></div>
                <input
                  type="text"
                  readOnly
                  placeholder="(00) 00000-0000"
                  className="relative w-full bg-slate-950/80 border-2 border-slate-600 rounded-2xl px-4 py-5 text-center text-3xl font-bold tracking-[0.1em] text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                  value={messageBox.promptValue}
                />
              </div>

              {/* Matriz do Teclado Touchscreen Alta Fidelidade */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800 shadow-inner">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleVirtualKeypress(num)}
                    className="h-[4.5rem] rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 active:scale-95 text-slate-100 text-3xl font-bold transition-all duration-75 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md select-none touch-manipulation"
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={() => handleVirtualKeypress('BACKSPACE')}
                  className="h-[4.5rem] rounded-2xl bg-rose-950/30 hover:bg-rose-900/50 active:bg-rose-600 active:text-white active:scale-95 text-rose-400 text-lg font-bold transition-all duration-75 border-b-4 border-rose-950/50 active:border-b-0 active:translate-y-1 shadow-md select-none touch-manipulation flex items-center justify-center uppercase tracking-wider"
                >
                  Apagar
                </button>

                <button
                  type="button"
                  onClick={() => handleVirtualKeypress('0')}
                  className="h-[4.5rem] rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 active:scale-95 text-slate-100 text-3xl font-bold transition-all duration-75 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md select-none touch-manipulation"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={messageBox.promptValue.replace(/\D/g, '').length < 10}
                  onClick={() => {
                    const fn = messageBox.onConfirm;
                    const val = messageBox.promptValue;
                    closeMessageBox();
                    if (fn) {
                      setTimeout(() => {
                        fn(val);
                      }, 50);
                    }
                  }}
                  className={`h-[4.5rem] rounded-2xl text-lg font-bold transition-all duration-75 border-b-4 shadow-md flex items-center justify-center select-none touch-manipulation uppercase tracking-wider
                    ${messageBox.promptValue.replace(/\D/g, '').length < 10 
                      ? 'bg-slate-800/30 border-slate-800/50 text-slate-600 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 border-emerald-800 active:border-b-0 active:translate-y-1 active:scale-95 text-white'}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          ) : null}

          {!messageBox.isPrompt && (
            <div className="flex justify-center mt-8">
              <button onClick={() => {
                const fn = messageBox.onConfirm;
                closeMessageBox();
                if (fn) {
                  setTimeout(() => {
                    (fn as () => void)();
                  }, 50);
                }
              }} className="w-full py-5 px-6 rounded-2xl font-black text-xl tracking-wide text-slate-950 bg-cyan-500 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95">
                COMPREENDIDO
              </button>
            </div>
          )}

          {messageBox.isPrompt && (
            <div className="flex justify-center mt-6">
              <button 
                type="button" 
                onClick={closeMessageBox} 
                className="text-slate-500 hover:text-slate-300 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <ChevronRight className="rotate-180" size={16} /> Cancelar Operação
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!terminalRole) {
    const dashboardItems = [
      { id: 'kiosk' as TerminalRole, title: 'Totem de Triagem', desc: 'Interface de autoatendimento para pacientes. Configuração Touchscreen.', icon: Printer },
      { id: 'panel' as TerminalRole, title: 'Painel de Espera', desc: 'Monitor visual de chamadas corporativo. Configuração TV/HDMI.', icon: Monitor },
      { id: 'reception' as TerminalRole, title: 'Gestão da Recepção', desc: 'Controle centralizado de filas, fluxos e emissão remota.', icon: LayoutDashboard },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
        <AuthModal />
        <ProcessingModal />
        <MessageBox />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-14 rounded-[2.5rem] bg-slate-900/60 p-10 shadow-2xl border border-slate-700/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="flex flex-col xl:flex-row justify-between relative z-10 gap-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 mb-6">
                  <Unlock size={14} className="text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Modo de Implementação (TI)</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tight leading-tight">Configuração de Rede SUS</h1>
                <p className="mt-5 text-xl leading-relaxed text-slate-400">Atribua a função estrutural deste terminal físico. Todas as máquinas sincronizam os protocolos de fila de forma instantânea via rede descentralizada.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/50 p-8 border border-emerald-500/20 shadow-inner xl:w-[450px] shrink-0">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 flex items-center gap-3">
                  <Activity size={18} className="animate-pulse" /> Servidor WhatsApp
                </p>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">Simulador de ambiente de dados: Injeta requisições assíncronas do Agente Comunitário de Saúde no banco de dados, protegidos sob a LGPD.</p>
                <button onClick={simulateWhatsappBooking} className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-[0_0_15px_rgba(5,150,105,0.1)] hover:shadow-[0_0_25px_rgba(5,150,105,0.4)]">
                  <MessageCircle size={20} /> Simular Requisição Externa
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-8 md:grid-cols-3">
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} onClick={() => handleRoleSelection(item.id)} className="cursor-pointer group rounded-[2.5rem] border border-slate-800 bg-slate-900/50 p-8 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-2 shadow-lg hover:shadow-cyan-500/10">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors duration-300 shadow-inner">
                        <Icon className="h-8 w-8" />
                      </div>
                      <ChevronRight className="text-slate-600 group-hover:text-cyan-400 transition-colors" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-200 group-hover:text-white transition-colors">{item.title}</h2>
                      <p className="mt-3 text-base text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    );
  }

  if (terminalRole === 'kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-transparent">
        <AuthModal />
        <ProcessingModal />
        <MessageBox />
        <TopBar title="Interface de Usuário (Totem)" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-5xl font-black text-white tracking-tight mb-4">Bem-vindo(a) à UBS</h2>
            <p className="text-xl text-cyan-400 font-medium">Toque firmemente nas opções para atendimento</p>
          </div>
          
          <div className="w-full max-w-6xl mb-10 relative z-10">
             <button onClick={checkInWhatsapp} className="w-full bg-slate-900 border-2 border-emerald-500/40 rounded-[2.5rem] p-8 flex items-center justify-center gap-6 transition-all group hover:bg-emerald-950/30 active:scale-[0.98] shadow-2xl">
                <div className="bg-emerald-500/20 p-5 rounded-3xl text-emerald-400 group-hover:scale-110 transition-transform">
                  <Smartphone size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-black text-white tracking-tight mb-2 group-hover:text-emerald-300 transition-colors">Agendamento Rápido via WhatsApp</h3>
                  <p className="text-emerald-500/80 text-lg font-medium">Realize o check-in digital utilizando o seu número de celular</p>
                </div>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl relative z-10">
            {services.map((service: Service) => (
                <div key={service.id} className="bg-slate-900/90 border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="bg-slate-800 p-4 rounded-2xl text-cyan-400"><service.icon size={40} /></div>
                    <h3 className="text-2xl font-bold text-white tracking-wide">{service.name}</h3>
                  </div>
                  <div className="flex gap-5">
                    <button onClick={() => generateTicket(service.id, false)} className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 py-6 rounded-2xl font-bold text-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all touch-manipulation shadow-md">
                      NORMAL
                    </button>
                    <button onClick={() => generateTicket(service.id, true)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 active:scale-95 text-slate-950 py-6 rounded-2xl font-black text-xl border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1 transition-all touch-manipulation shadow-md shadow-cyan-500/20">
                      PREFERENCIAL
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (terminalRole === 'panel') {
    const calledTickets = tickets.filter((t: Ticket) => t.status === 'called').sort((a: Ticket, b: Ticket) => (b.calledAt || 0) - (a.calledAt || 0));
    return (
      <div className="min-h-screen bg-slate-950 font-sans flex flex-col">
        <AuthModal />
        <TopBar title="Monitor Geral" />
        <div className="flex-1 flex p-8 gap-8 h-full">
          <div className="flex-1 bg-slate-900/60 rounded-[3rem] shadow-2xl border border-slate-800/80 flex flex-col justify-center items-center p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-950/10 to-transparent pointer-events-none"></div>
            
            <h2 className="text-4xl font-black text-cyan-500/50 mb-10 uppercase tracking-[0.5em] relative z-10">Paciente Atual</h2>
            
            {currentCall ? (
              <div className="relative z-10 w-full animate-in zoom-in-95 duration-500">
                <div className="text-[12rem] leading-none font-black text-white mb-10 tracking-tighter drop-shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                  {currentCall.ticket}
                </div>
                <div className="bg-slate-950/80 border-2 border-cyan-900/30 py-10 px-20 rounded-[3rem] w-full shadow-inner inline-block">
                  <span className="text-4xl font-bold text-slate-400 uppercase tracking-widest">Dirija-se ao local:</span>
                  <br/> 
                  <span className="text-6xl font-black text-cyan-400 mt-6 block tracking-tight">{currentCall.desk}</span>
                </div>
              </div>
            ) : (
              <div className="text-5xl font-bold text-slate-700/50 relative z-10 uppercase tracking-widest">Aguardando Chamada</div>
            )}
          </div>
          
          <div className="w-[450px] bg-slate-900/60 rounded-[3rem] border border-slate-800/80 p-10 flex flex-col shadow-2xl relative z-10">
            <h3 className="text-3xl font-black text-white mb-10 border-b border-slate-800 pb-8 flex items-center gap-4">
              <Timer className="text-cyan-500" size={36} /> Histórico
            </h3>
            <div className="flex flex-col gap-5 overflow-y-auto pr-2">
              {calledTickets.slice(1, 6).map((ticket: Ticket) => (
                <div key={ticket.id} className="bg-slate-950/80 p-7 rounded-[2rem] border border-slate-800 flex flex-col gap-2">
                  <span className="text-4xl font-black text-slate-200 tracking-tight">{ticket.number}</span>
                  <span className="text-slate-500 text-base font-semibold uppercase tracking-wider">{ticket.serviceName}</span>
                </div>
              ))}
              {calledTickets.length <= 1 && (
                <div className="text-slate-600 text-center mt-12 font-medium text-lg">O histórico de chamadas recentes aparecerá aqui.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (terminalRole === 'reception') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <AuthModal />
        <ProcessingModal />
        <MessageBox />
        <TopBar title="Terminal de Gestão Operacional" />
        <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-[2rem] p-8 flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-6">
                 <div className="bg-emerald-500/10 p-4 rounded-2xl">
                   <MessageCircle className="text-emerald-400" size={36} />
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-2xl tracking-wide mb-1">Módulo WhatsApp Integrado</h3>
                   <p className="text-emerald-400/80 text-base">Atendimentos pré-agendados aguardando check-in no totem: <strong className="text-emerald-300 text-lg ml-1">{whatsappAppointments.filter((a: WhatsappAppointment) => !a.checkedIn).length}</strong></p>
                 </div>
               </div>
            </div>

            <div className="bg-slate-900/60 p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/80">
              <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4 border-b border-slate-800 pb-6"><User2 size={32} className="text-cyan-400"/> Fila Estratégica de Espera</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service: Service) => {
                  const waiting = tickets.filter((t: Ticket) => t.service === service.id && t.status === 'waiting');
                  const priorityCount = waiting.filter((t: Ticket) => t.isPriority).length;
                  return (
                    <div key={service.id} className="bg-slate-950/80 border border-slate-800 rounded-[2rem] p-8 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start mb-8">
                        <h3 className="font-bold text-slate-100 text-xl">{service.name}</h3>
                        <div className="bg-slate-800 text-cyan-400 font-black px-5 py-2 rounded-full text-sm tracking-widest">{waiting.length} VOLUME</div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Atenção Prioritária:</span>
                        <span className={`font-black text-lg px-3 py-1 rounded-xl ${priorityCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'text-slate-600'}`}>
                          {priorityCount}
                        </span>
                      </div>

                      <button onClick={() => callNext(service.id)} disabled={waiting.length === 0} className={`w-full py-5 rounded-2xl font-black text-lg tracking-wide flex items-center justify-center gap-3 transition-all ${waiting.length === 0 ? 'bg-slate-900 border-2 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.15)]'}`}>
                        Próximo Atendimento <ChevronRight size={24} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/80 h-fit">
            <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4 border-b border-slate-800 pb-6"><Activity size={32} className="text-cyan-400"/> Guichês Ocupados</h2>
            <div className="space-y-5">
              {tickets.filter((t: Ticket) => t.status === 'called').map((ticket: Ticket) => (
                <div key={ticket.id} className="bg-slate-950/80 border border-slate-800 p-6 rounded-[2rem] flex justify-between items-center group hover:border-cyan-900/50 transition-colors">
                  <div>
                    <div className="font-black text-3xl text-white mb-2 flex items-center gap-3 tracking-tight">
                      {ticket.number} 
                      {ticket.source === 'whatsapp' && <span className="bg-emerald-500/20 p-1.5 rounded-lg"><Smartphone size={20} className="text-emerald-400" /></span>}
                    </div>
                    <div className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest">{ticket.serviceName}</div>
                  </div>
                  <button onClick={() => completeTicket(ticket.id)} className="bg-slate-900 border border-slate-700 hover:bg-emerald-950 hover:border-emerald-500/50 active:scale-90 text-slate-400 hover:text-emerald-400 p-4 rounded-2xl transition-all shadow-sm" title="Liberar Guichê">
                    <CheckCircle2 size={28} />
                  </button>
                </div>
              ))}
              {tickets.filter((t: Ticket) => t.status === 'called').length === 0 && (
                <div className="text-slate-600/50 font-bold text-xl text-center py-16">
                  Nenhum atendimento em curso.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}