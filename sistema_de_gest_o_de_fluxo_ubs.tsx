import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Users, 
  Activity, 
  Printer, 
  ChevronRight, 
  CheckCircle, 
  Clock,
  AlertCircle,
  FileText,
  Stethoscope,
  Pill,
  Syringe,
  Settings
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, kiosk, panel
  const [tickets, setTickets] = useState([]);
  const [ticketCounter, setTicketCounter] = useState(1);
  const [currentCall, setCurrentCall] = useState(null);

  // Definicoes de servicos baseados nas necessidades da UBS
  const services = [
    { id: 'triagem', name: 'Triagem / Acolhimento', icon: Activity, prefix: 'TR' },
    { id: 'consulta', name: 'Consulta Médica', icon: Stethoscope, prefix: 'CM' },
    { id: 'farmacia', name: 'Retirada de Medicamentos', icon: Pill, prefix: 'FA' },
    { id: 'vacina', name: 'Vacinação', icon: Syringe, prefix: 'VA' },
  ];

  // Funcao para gerar nova senha (Totem)
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
      status: 'waiting', // waiting, called, completed
      createdAt: new Date(),
      calledAt: null,
    };

    setTickets([...tickets, newTicket]);
    setTicketCounter(ticketCounter + 1);
    alert(`Senha gerada com sucesso: ${ticketNumber}`);
  };

  // Funcao para chamar o proximo paciente (Dashboard da Equipe)
  const callNext = (serviceId) => {
    const waitingTickets = tickets.filter(t => t.service === serviceId && t.status === 'waiting');
    
    if (waitingTickets.length === 0) {
      alert('Nenhum paciente aguardando para este serviço.');
      return;
    }

    // Prioriza senhas preferenciais e depois por ordem de chegada
    waitingTickets.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.createdAt - b.createdAt;
    });

    const ticketToCall = waitingTickets[0];
    
    const updatedTickets = tickets.map(t => 
      t.id === ticketToCall.id ? { ...t, status: 'called', calledAt: new Date() } : t
    );

    setTickets(updatedTickets);
    setCurrentCall({
      ticket: ticketToCall.number,
      desk: `Guichê / Sala de ${services.find(s => s.id === serviceId).name}`,
      time: new Date()
    });
  };

  // Funcao para finalizar atendimento
  const completeTicket = (ticketId) => {
    const updatedTickets = tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'completed' } : t
    );
    setTickets(updatedTickets);
  };

  // Componente: Navegacao Superior
  const Navigation = () => (
    <nav className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Activity size={24} />
        <h1 className="text-xl font-bold tracking-wide">SUS | Gestão de Fluxo UBS</h1>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveView('kiosk')}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${activeView === 'kiosk' ? 'bg-blue-800 font-bold' : 'hover:bg-blue-600'}`}
        >
          <Printer size={18} /> Autoatendimento
        </button>
        <button 
          onClick={() => setActiveView('panel')}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${activeView === 'panel' ? 'bg-blue-800 font-bold' : 'hover:bg-blue-600'}`}
        >
          <Monitor size={18} /> Painel de Chamada
        </button>
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${activeView === 'dashboard' ? 'bg-blue-800 font-bold' : 'hover:bg-blue-600'}`}
        >
          <Settings size={18} /> Gestão Interna
        </button>
      </div>
    </nav>
  );

  // Componente: Visao do Totem (Kiosk)
  const KioskView = () => (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800">Bem-vindo à Unidade Básica de Saúde</h2>
        <p className="text-gray-500 mt-2 text-lg">Selecione o serviço desejado para retirar sua senha</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-full text-blue-700">
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">{service.name}</h3>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => generateTicket(service.id, false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Senha Normal
                </button>
                <button 
                  onClick={() => generateTicket(service.id, true)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Preferencial
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Componente: Visao do Painel de Espera (Panel)
  const PanelView = () => {
    const calledTickets = tickets.filter(t => t.status === 'called').sort((a, b) => b.calledAt - a.calledAt);
    const lastCalled = currentCall;
    const history = calledTickets.slice(1, 5); // ultimos 4 chamados

    return (
      <div className="h-[calc(100vh-76px)] bg-gray-100 flex p-6 gap-6">
        {/* Chamada Atual */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col justify-center items-center p-10 text-center">
          <h2 className="text-4xl font-bold text-gray-500 mb-8 uppercase tracking-widest">Senha Atual</h2>
          {lastCalled ? (
            <>
              <div className="text-9xl font-black text-blue-700 mb-8 tracking-tighter">
                {lastCalled.ticket}
              </div>
              <div className="text-5xl font-bold text-gray-700 bg-gray-100 py-6 px-12 rounded-2xl w-full">
                Dirija-se à: <br/> <span className="text-blue-600">{lastCalled.desk}</span>
              </div>
            </>
          ) : (
            <div className="text-3xl text-gray-400">Aguardando chamadas...</div>
          )}
        </div>

        {/* Historico */}
        <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4 flex items-center gap-2">
            <Clock size={24} /> Últimas Chamadas
          </h3>
          <div className="flex flex-col gap-4 overflow-y-auto">
            {history.length > 0 ? history.map(ticket => (
              <div key={ticket.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                <span className="text-3xl font-bold text-gray-600">{ticket.number}</span>
                <span className="text-gray-500 font-medium text-right text-sm">
                  {ticket.serviceName}
                </span>
              </div>
            )) : (
              <div className="text-gray-400 text-center mt-10">Nenhum histórico recente.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Componente: Dashboard de Gestao para a Equipe
  const DashboardView = () => {
    // Calculo de gargalos (filas por servico)
    const stats = services.map(service => {
      const waiting = tickets.filter(t => t.service === service.id && t.status === 'waiting');
      const preferencial = waiting.filter(t => t.isPriority).length;
      return {
        ...service,
        waitingTotal: waiting.length,
        waitingPreferencial: preferencial
      };
    });

    const activeAtendimentos = tickets.filter(t => t.status === 'called');

    return (
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Controle de Filas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users size={24} className="text-blue-600"/> 
              Controle de Filas (Gargalos)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map(stat => (
                <div key={stat.id} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-700">{stat.name}</h3>
                    <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                      {stat.waitingTotal} na fila
                    </div>
                  </div>
                  
                  {stat.waitingTotal > 5 && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mb-4 font-medium">
                      <AlertCircle size={14} /> Alto volume detectado
                    </div>
                  )}

                  <div className="text-sm text-gray-500 mb-4">
                    Prioridades aguardando: <span className="font-bold text-yellow-600">{stat.waitingPreferencial}</span>
                  </div>

                  <button 
                    onClick={() => callNext(stat.id)}
                    disabled={stat.waitingTotal === 0}
                    className={`w-full py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors ${stat.waitingTotal === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  >
                    Chamar Próximo <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Em Atendimento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity size={24} className="text-green-600"/> 
            Em Atendimento
          </h2>
          
          <div className="space-y-4">
            {activeAtendimentos.length > 0 ? activeAtendimentos.map(ticket => (
              <div key={ticket.id} className="bg-green-50 border border-green-200 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg text-green-800">{ticket.number}</div>
                  <div className="text-sm text-green-600">{ticket.serviceName}</div>
                </div>
                <button 
                  onClick={() => completeTicket(ticket.id)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full"
                  title="Finalizar Atendimento"
                >
                  <CheckCircle size={20} />
                </button>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-10">Nenhum atendimento em andamento.</div>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navigation />
      <main>
        {activeView === 'kiosk' && <KioskView />}
        {activeView === 'panel' && <PanelView />}
        {activeView === 'dashboard' && <DashboardView />}
      </main>
    </div>
  );
}