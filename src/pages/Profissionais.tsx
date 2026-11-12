import { useState, useEffect } from 'react';
import { useProfessionalStore } from '../stores/professionalStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Clock,
  Percent,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { formatPhone } from '../utils/format';

export default function Profissionais() {
  const {
    fetchProfessionals,
    professionals,
    openNewProfessionalDrawer,
    openEditProfessionalDrawer,
    toggleProfessionalActive,
    deleteProfessional,
  } = useProfessionalStore();

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Equipe de Profissionais
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gerencie colaboradores, escalas de atendimento, especialidades e comissões.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => openNewProfessionalDrawer()}
          leftIcon={<Plus size={16} />}
          className="shadow-sm shadow-violet-400/20"
        >
          Novo Profissional
        </Button>
      </div>

      {/* Grid */}
      {professionals.length === 0 ? (
        <EmptyState
          icon={<UserCheck size={24} />}
          badge="Equipe & Escalas"
          title="Nenhum profissional cadastrado"
          description="Adicione os profissionais que realizam atendimentos no seu espaço para configurar horários de expediente, especialidades e comissões automáticas."
          actionLabel="Adicionar profissional"
          onAction={() => openNewProfessionalDrawer()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((prof) => (
            <Card
              key={prof.id}
              hoverEffect
              className="flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={prof.avatar_url}
                      name={prof.name}
                      size="lg"
                      className="shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {prof.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {prof.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleProfessionalActive(prof.id)}
                    title={prof.is_active ? 'Profissional Ativo' : 'Profissional Inativo'}
                  >
                    <Badge variant={prof.is_active ? 'success' : 'neutral'} size="sm">
                      {prof.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </button>
                </div>

                {/* Specialties Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {prof.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Contact and Schedule */}
                <div className="space-y-1.5 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
                  {prof.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={13} className="text-violet-500" />
                      {formatPhone(prof.phone)}
                    </p>
                  )}
                  {prof.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-violet-500" />
                      {prof.email}
                    </p>
                  )}
                  {prof.working_hours && (
                    <p className="flex items-center gap-2">
                      <Clock size={13} className="text-violet-500" />
                      {prof.working_hours.start} às {prof.working_hours.end}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer with Commission and Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                  <Percent size={13} className="text-emerald-500" />
                  <span>Comissão: {prof.commission_percentage}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditProfessionalDrawer(prof.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Editar Profissional"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deleteProfessional(prof.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Excluir Profissional"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
