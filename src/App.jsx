import { Activity, CheckCircle2, ClipboardList, LayoutDashboard, Timer, User2 } from 'lucide-react'

const items = [
  { title: 'Triagem', description: 'Organize os pacientes conforme prioridade e fluxo clínico.', icon: LayoutDashboard },
  { title: 'Acompanhamento', description: 'Visualize o andamento do atendimento em tempo real.', icon: Activity },
  { title: 'Pacientes', description: 'Gerencie o cadastro e histórico dos pacientes.', icon: User2 },
  { title: 'Relatórios', description: 'Gere métricas de atendimento e produtividade.', icon: ClipboardText },
  { title: 'Perfis', description: 'Defina funções e permissões da equipe de saúde.', icon: CheckCircle2 },
  { title: 'Tempo Médio', description: 'Analise tempos de espera e atendimento por dia.', icon: Timer },
]

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-12 rounded-3xl bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20 ring-1 ring-slate-700/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/90">Sistema UBS</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Gestão de fluxo de atendimento para Unidades Básicas de Saúde
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Monitore prioridades, acompanhe pacientes e otimize a jornada de atendimento com uma interface clara e responsiva.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800/80 p-6 text-slate-200 ring-1 ring-cyan-500/20 sm:w-[28rem]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Resumo rápido</p>
              <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
                <p>• Priorização de triagem com cores e regras de risco.</p>
                <p>• Painel de acompanhamento em tempo real para a equipe.</p>
                <p>• Relatórios rápidos sobre tempo de espera e atendimento.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="group overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-900/70 p-7 shadow-2xl shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900/95">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Componente</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{item.title}</h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300 transition duration-300 group-hover:bg-cyan-500/20">
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-300">{item.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-800/80 p-10 ring-1 ring-slate-700/60">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Visualização</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Fluxo de triagem por status e metas</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Use dashboards e cards de status para garantir que cada paciente seja atendido dentro do tempo esperado e com prioridade correta.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700/50 bg-slate-950/80 p-6 text-slate-200 shadow-inner shadow-slate-950/30">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-900/70 p-4 text-center">
                  <p className="text-4xl font-semibold text-white">78%</p>
                  <p className="mt-2 text-sm text-slate-400">Cumprimento de metas</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-4 text-center">
                  <p className="text-4xl font-semibold text-white">12</p>
                  <p className="mt-2 text-sm text-slate-400">Pacientes na fila</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-4 text-center">
                  <p className="text-4xl font-semibold text-white">4 min</p>
                  <p className="mt-2 text-sm text-slate-400">Tempo médio</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
