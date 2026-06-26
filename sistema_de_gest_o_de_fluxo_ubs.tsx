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
    
    // Explicitly defining the types here fixes the string inference errors
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

      const updatedTicket: Ticket = {
        ...t,
        status: 'called',
        calledAt: new Date().getTime()
      };

      return updatedTicket;
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

      const updatedTicket: Ticket = {
        ...t,
        status: 'completed'
      };

      return updatedTicket;
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
    showPrompt("Check-in WhatsApp", "Digite o celular cadastrado pelo agente:", (phoneToFind: string) => {
      if (!phoneToFind) return;

      setIsProcessing({ show: true, text: 'Buscando agendamento e emitindo senha...' });
      
      setTimeout(() => {
        setIsProcessing({ show: false, text: '' });
        
        // Remove formatações para fazer comparação limpa
        const cleanPhoneInput = phoneToFind.replace(/\D/g, '');
        
        const aptIndex = whatsappAppointments.findIndex((a: WhatsappAppointment) => {
          const cleanDatabasePhone = a.phone.replace(/\D/g, '');
          return cleanDatabasePhone === cleanPhoneInput;
        });
        
        if (aptIndex === -1) {
          showMessage("Número Não Encontrado", "Este número de celular não existe nos registros de agendamento do sistema. Verifique o número ou retire uma senha normal.");
          return;
        }

        if (whatsappAppointments[aptIndex].checkedIn) {
          showMessage("Atenção", "Este número existe no sistema, mas o check-in já foi realizado anteriormente e a senha já foi emitida.");
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
    <div className="flex justify-between items-center bg-slate-900/80 p-4 border-b border-slate-700/50 shadow-md backdrop-blur px-8">
      <div className="flex items-center gap-3 text-cyan-300">
        <Activity size={24} />
        <span className="font-semibold tracking-[0.2em] uppercase text-sm">Sistema UBS</span>
      </div>
      <div className="text-slate-200 font-medium">{title}</div>
      <button onClick={() => { 
        setPendingRole('logout'); 
        setPasswordInput(''); 
        setAuthError(false);
        setIsAuthModalOpen(true); 
      }} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium">
        <Lock size={16} /> Destravar Máquina
      </button>
    </div>
  );

  const AuthModal = () => {
    if (!isAuthModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6 text-cyan-400"><Lock size={48} /></div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Acesso Restrito</h2>
          <form onSubmit={authenticate} className="space-y-4">
            <input type="password" autoFocus placeholder="Senha (admin)" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
            {authError && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> Senha incorreta.</p>}
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => {
                setIsAuthModalOpen(false);
                setPasswordInput(''); 
              }} className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700">Cancelar</button>
              <button type="submit" className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300">Autorizar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProcessingModal = () => {
    if (!isProcessing.show) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 max-w-sm w-full shadow-2xl flex flex-col items-center">
          <Loader2 className="animate-spin text-cyan-400 mb-6" size={56} />
          <h2 className="text-xl font-bold text-white text-center">{isProcessing.text}</h2>
        </div>
      </div>
    );
  };

  const MessageBox = () => {
    if (!messageBox.isOpen) return null;

    // Mascara simples para telefone celular brasileiro: (XX) XXXXX-XXXX
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
      } else if (currentVal.length < 11) { // Limite padrão de celular com DDD
        const newVal = currentVal + key;
        setMessageBox({ ...messageBox, promptValue: formatPhoneNumber(newVal) });
      }
    };

    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-2">{messageBox.title}</h2>
          <p className="text-slate-400 text-center mb-6 text-sm whitespace-pre-line">{messageBox.message}</p>
          
          {messageBox.isPrompt ? (
            <div className="space-y-6">
              {/* Campo de Input formatado */}
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-4 text-center text-2xl font-semibold tracking-wide text-cyan-300 focus:outline-none focus:border-cyan-500"
                  value={messageBox.promptValue}
                />
              </div>

              {/* Grid do Teclado Virtual Touchscreen */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleVirtualKeypress(num)}
                    className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 text-white text-2xl font-bold transition-all border border-slate-800 shadow-md"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Botão de Apagar */}
                <button
                  type="button"
                  onClick={() => handleVirtualKeypress('BACKSPACE')}
                  className="h-16 rounded-2xl bg-red-950/40 hover:bg-red-900/60 active:bg-red-500 text-red-400 active:text-white text-lg font-bold transition-all border border-red-900/30 shadow-md"
                >
                  Apagar
                </button>

                <button
                  type="button"
                  onClick={() => handleVirtualKeypress('0')}
                  className="h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 text-white text-2xl font-bold transition-all border border-slate-800 shadow-md"
                >
                  0
                </button>

                {/* Confirmar Teclado */}
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
                      }, 10);
                    }
                  }}
                  className={`h-16 rounded-2xl text-lg font-bold transition-all border shadow-md flex items-center justify-center
                    ${messageBox.promptValue.replace(/\D/g, '').length < 10 
                      ? 'bg-slate-850 border-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 border-cyan-500 text-slate-950'}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          ) : null}

          {/* Botões de Ação para Mensagens Comuns (Ok / Cancelar fora do prompt) */}
          {!messageBox.isPrompt && (
            <div className="flex gap-3 mt-4">
              <button onClick={() => {
                const fn = messageBox.onConfirm;
                closeMessageBox();
                if (fn) {
                  setTimeout(() => {
                    (fn as () => void)();
                  }, 10);
                }
              }} className="flex-1 py-4 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md">
                Ok
              </button>
            </div>
          )}

          {messageBox.isPrompt && (
            <div className="flex justify-center mt-4">
              <button 
                type="button" 
                onClick={closeMessageBox} 
                className="text-slate-400 hover:text-white text-sm font-semibold hover:underline"
              >
                Voltar ao Menu Principal
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!terminalRole) {
    const dashboardItems = [
      { id: 'kiosk' as TerminalRole, title: 'Totem de Triagem', desc: 'Autoatendimento do paciente.', icon: Printer },
      { id: 'panel' as TerminalRole, title: 'Painel de Espera', desc: 'Monitor visual de chamadas.', icon: Monitor },
      { id: 'reception' as TerminalRole, title: 'Gestão da Recepção', desc: 'Controle de filas e atendimento.', icon: LayoutDashboard },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <AuthModal />
        <ProcessingModal />
        <MessageBox />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-12 rounded-3xl bg-slate-900/80 p-8 shadow-xl border border-slate-700/40">
            <div className="flex flex-col lg:flex-row justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/90 flex items-center gap-2"><Unlock size={16} /> SETUP DO TÉCNICO</p>
                <h1 className="mt-4 text-4xl font-semibold text-white">Implantação do Sistema UBS</h1>
                <p className="mt-4 max-w-2xl text-slate-300">Selecione o papel deste terminal. Acesso protegido por senha.</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 p-6 text-slate-200 border border-cyan-500/20 mt-6 lg:mt-0">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Integração WhatsApp</p>
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-3">LGPD: Dados capturados sob o Art. 7, VIII.</p>
                  <button onClick={simulateWhatsappBooking} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors">
                    <MessageCircle size={18} /> Simular Agendamento Remoto
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-3">
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} onClick={() => handleRoleSelection(item.id)} className="cursor-pointer group rounded-[2rem] border border-slate-700/50 bg-slate-900/70 p-7 hover:border-cyan-400/40 transition duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20"><Icon className="h-7 w-7" /></div>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">{item.desc}</p>
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
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
        <AuthModal />
        <ProcessingModal />
        <MessageBox />
        <TopBar title="Totem de Autoatendimento" />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white tracking-tight">Bem-vindo(a) à UBS</h2>
          </div>
          
          <div className="w-full max-w-5xl mb-8">
             <button onClick={checkInWhatsapp} className="w-full bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-500/30 rounded-3xl p-6 flex items-center justify-center gap-4 transition-all group">
                <div className="bg-emerald-50/10 p-4 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
                  <Smartphone size={32} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-emerald-50">Já tenho agendamento no WhatsApp</h3>
                  <p className="text-emerald-400">Clique aqui para fazer o check-in e retirar sua senha sem fila</p>
                </div>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
            {services.map((service: Service) => (
                <div key={service.id} className="bg-slate-900/80 border border-slate-700/50 rounded-[2rem] p-8">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="text-cyan-400"><service.icon size={36} /></div>
                    <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => generateTicket(service.id, false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-4 rounded-xl font-semibold border border-slate-700">Normal</button>
                    <button onClick={() => generateTicket(service.id, true)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 py-4 rounded-xl font-bold">Preferencial</button>
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
        <TopBar title="Monitor da Sala de Espera" />
        <div className="flex-1 flex p-6 gap-6 h-full">
          <div className="flex-1 bg-slate-900/80 rounded-[2rem] shadow-2xl border border-slate-800 flex flex-col justify-center items-center p-10 text-center relative overflow-hidden">
            <h2 className="text-3xl font-bold text-slate-400 mb-8 uppercase tracking-[0.4em]">Senha Atual</h2>
            {currentCall ? (
              <>
                <div className="text-[10rem] leading-none font-black text-white mb-8 drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">{currentCall.ticket}</div>
                <div className="text-5xl font-bold text-slate-300 bg-slate-950 py-8 px-16 rounded-[2rem] w-full border border-slate-800">Dirija-se à: <br/> <span className="text-cyan-400 mt-4 block">{currentCall.desk}</span></div>
              </>
            ) : (<div className="text-4xl text-slate-600">Aguardando chamadas...</div>)}
          </div>
          <div className="w-1/3 bg-slate-900/80 rounded-[2rem] border border-slate-800 p-8 flex flex-col">
            <h3 className="text-2xl font-semibold text-white mb-8 border-b border-slate-700/50 pb-6 flex items-center gap-3"><Timer className="text-cyan-400" size={28} /> Últimas Chamadas</h3>
            <div className="flex flex-col gap-4 overflow-y-auto">
              {calledTickets.slice(1, 5).map((ticket: Ticket) => (
                <div key={ticket.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-3xl font-bold text-slate-200">{ticket.number}</span>
                  <span className="text-slate-400 text-sm">{ticket.serviceName}</span>
                </div>
              ))}
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
        <TopBar title="Painel do Profissional - Controle de Fluxo" />
        <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <MessageCircle className="text-emerald-400" size={32} />
                 <div>
                   <h3 className="text-emerald-50 font-bold text-lg">Integração WhatsApp Online</h3>
                   <p className="text-emerald-400/80 text-sm">Pacientes agendados via Agente de Saúde que ainda não chegaram: {whatsappAppointments.filter((a: WhatsappAppointment) => !a.checkedIn).length}</p>
                 </div>
               </div>
            </div>

            <div className="bg-slate-900/80 p-8 rounded-[2rem] shadow-xl border border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3"><User2 size={28} className="text-cyan-400"/> Filas de Atendimento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service: Service) => {
                  const waiting = tickets.filter((t: Ticket) => t.service === service.id && t.status === 'waiting');
                  return (
                    <div key={service.id} className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-slate-200 text-lg">{service.name}</h3>
                        <div className="bg-slate-800 text-cyan-300 font-bold px-4 py-1.5 rounded-full text-sm">{waiting.length} na fila</div>
                      </div>
                      <div className="text-sm text-slate-400 mb-6 flex items-center justify-between">
                        <span>Prioridades/Agendados:</span>
                        <span className="font-bold text-yellow-500">{waiting.filter((t: Ticket) => t.isPriority).length}</span>
                      </div>
                      <button onClick={() => callNext(service.id)} disabled={waiting.length === 0} className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${waiting.length === 0 ? 'bg-slate-800 text-slate-600' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'}`}>
                        Chamar Próximo <ChevronRight size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-8 rounded-[2rem] shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3"><Activity size={28} className="text-cyan-400"/> Em Atendimento</h2>
            <div className="space-y-4">
              {tickets.filter((t: Ticket) => t.status === 'called').map((ticket: Ticket) => (
                <div key={ticket.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex justify-between items-center group">
                  <div>
                    <div className="font-bold text-2xl text-white mb-1 flex items-center gap-2">
                      {ticket.number} 
                      {ticket.source === 'whatsapp' && <Smartphone size={16} className="text-emerald-400" aria-label="Origem: WhatsApp" />}
                    </div>
                    <div className="text-sm text-cyan-400">{ticket.serviceName}</div>
                  </div>
                  <button onClick={() => completeTicket(ticket.id)} className="bg-slate-800 hover:text-emerald-400 text-slate-400 p-3 rounded-full border border-transparent hover:border-emerald-500/30"><CheckCircle2 size={24} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}