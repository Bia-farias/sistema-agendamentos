import React, { useState, useEffect } from 'react';
import {
  Globe,
  Store,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  QrCode,
  Save,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  Share2,
} from 'lucide-react';
import { tenantApiService, MyPageData, UpdateMyPagePayload } from '../services/api/tenantService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';

export default function MinhaPagina() {
  const { tenant, updateTenant } = useAuthStore();
  const { addToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'apresentacao' | 'galeria' | 'horarios' | 'qrcode'>('visual');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);

  // New photo URL input
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Stats
  const [stats, setStats] = useState({
    activeServicesCount: 0,
    activeProfessionalsCount: 0,
    totalAppointmentsCount: 0,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await tenantApiService.getMyPage();
      setName(data.name || '');
      setSlug(data.slug || '');
      setLogoUrl(data.logoUrl || '');
      setCoverUrl(data.coverUrl || '');
      setGalleryUrls(data.galleryUrls || []);
      setDescription(data.description || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setWhatsapp(data.whatsapp || '');
      setInstagram(data.instagram || '');
      setFacebook(data.facebook || '');
      setPrimaryColor(data.primaryColor || '#7c3aed');
      setOpeningTime(data.openingTime || '08:00');
      setClosingTime(data.closingTime || '20:00');
      setIntervalMinutes(data.intervalMinutes || 30);
      setAllowOnlineBooking(data.allowOnlineBooking ?? true);
      setStats({
        activeServicesCount: data.activeServicesCount || 0,
        activeProfessionalsCount: data.activeProfessionalsCount || 0,
        totalAppointmentsCount: data.totalAppointmentsCount || 0,
      });
    } catch (err: any) {
      console.warn('Erro ao carregar dados da página pública:', err);
      // Fallback a partir do tenant do useAuthStore
      if (tenant) {
        setName(tenant.name || '');
        setSlug(tenant.slug || '');
        setLogoUrl(tenant.logo_url || '');
        setCoverUrl(tenant.cover_url || '');
        setGalleryUrls(tenant.gallery_urls || []);
        setDescription(tenant.description || '');
        setPhone(tenant.phone || '');
        setEmail(tenant.email || '');
        setAddress(tenant.address || '');
        setWhatsapp(tenant.whatsapp || '');
        setInstagram(tenant.instagram || '');
        setFacebook(tenant.facebook || '');
        setPrimaryColor(tenant.primary_color || '#7c3aed');
        setOpeningTime(tenant.settings?.opening_time || '08:00');
        setClosingTime(tenant.settings?.closing_time || '20:00');
        setIntervalMinutes(tenant.settings?.interval_minutes || 30);
        setAllowOnlineBooking(tenant.settings?.allow_online_booking ?? true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPublicBaseUrl = () => {
    if (typeof window === 'undefined') return 'https://agendaai.com.br';
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    return `${origin}${pathname}`;
  };

  const fullPublicUrl = `${getPublicBaseUrl()}/#/agendar/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPublicUrl);
    setCopiedLink(true);
    addToast({
      type: 'success',
      title: 'Link Copiado!',
      message: 'O link exclusivo da sua página de agendamento foi copiado para a área de transferência.',
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Olá! Agende seu horário no *${name}* diretamente pela nossa página exclusiva: ${fullPublicUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setGalleryUrls([...galleryUrls, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
    addToast({
      type: 'success',
      title: 'Foto Adicionada',
      message: 'A foto foi adicionada à galeria do seu estabelecimento.',
    });
  };

  const handleRemovePhoto = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpdateMyPagePayload = {
        name,
        slug: slug.toLowerCase().trim(),
        logoUrl: logoUrl.trim() || null,
        coverUrl: coverUrl.trim() || null,
        galleryUrls,
        description: description.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        primaryColor,
        openingTime,
        closingTime,
        intervalMinutes,
        allowOnlineBooking,
      };

      const updated = await tenantApiService.updateMyPage(payload);
      updateTenant({
        name: updated.name,
        slug: updated.slug,
        logo_url: updated.logoUrl || undefined,
        cover_url: updated.coverUrl || undefined,
        gallery_urls: updated.galleryUrls,
        description: updated.description || undefined,
        phone: updated.phone || undefined,
        email: updated.email || undefined,
        address: updated.address || undefined,
        whatsapp: updated.whatsapp || undefined,
        instagram: updated.instagram || undefined,
        facebook: updated.facebook || undefined,
        primary_color: updated.primaryColor || undefined,
        settings: {
          opening_time: updated.openingTime,
          closing_time: updated.closingTime,
          interval_minutes: updated.intervalMinutes,
          allow_online_booking: updated.allowOnlineBooking,
        },
      });

      addToast({
        type: 'success',
        title: 'Página Atualizada!',
        message: 'Todas as personalizações da sua página exclusiva foram salvas com sucesso.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar as alterações da página.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cores pré-definidas para tema
  const presetColors = [
    { name: 'Violeta Royal', hex: '#7c3aed' },
    { name: 'Índigo Moderno', hex: '#4f46e5' },
    { name: 'Esmeralda Beauty', hex: '#059669' },
    { name: 'Rosa Choque & Estética', hex: '#db2777' },
    { name: 'Âmbar Barbearia', hex: '#d97706' },
    { name: 'Ciano & Spa', hex: '#0891b2' },
    { name: 'Preto Elegance', hex: '#18181b' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-zinc-400">Carregando Minha Página de Agendamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header com Banner de Destaque */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-violet-500/20">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-white">
            <Sparkles size={13} />
            Seu Mini-Site Exclusivo
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Minha Página de Agendamento
          </h1>
          <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
            Personalize a vitrine digital do seu estabelecimento com logotipo, fotos, profissionais, serviços e horários. Seus clientes podem agendar diretamente pelo seu link exclusivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={fullPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
          >
            <Eye size={16} />
            Visualizar Página
          </a>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-violet-50 text-violet-700 text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Card de Link Exclusivo & Compartilhamento Rápido */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <LinkIcon size={18} className="text-violet-600" />
              Seu Link Público Exclusivo
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Envie para seus clientes pelo WhatsApp, coloque na bio do Instagram ou imprima em QR Code.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {allowOnlineBooking ? 'Online e Ativo' : 'Agendamento Pausado'}
            </span>
          </div>
        </div>

        {/* Barra de Link com Botões */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
          <div className="flex-1 px-3 py-1.5 font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 truncate select-all">
            {fullPublicUrl}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <a
              href={fullPublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação da Personalização */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        {[
          { id: 'visual', label: 'Identidade & Capa', icon: Palette },
          { id: 'apresentacao', label: 'Sobre & Contato', icon: Store },
          { id: 'galeria', label: 'Fotos do Ambiente', icon: ImageIcon },
          { id: 'horarios', label: 'Horários & Regras', icon: Clock },
          { id: 'qrcode', label: 'QR Code de Balcão', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="space-y-6">
        {/* ABA 1: Identidade Visual & Capa */}
        {activeTab === 'visual' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Seletor de Cores */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Palette size={16} className="text-violet-600" />
                    Cor de Destaque da Sua Marca
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Essa cor será aplicada aos botões, detalhes e badges da sua página pública.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setPrimaryColor(color.hex)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        primaryColor === color.hex
                          ? 'border-zinc-900 dark:border-white shadow-xs scale-105'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shadow-xs shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">{color.name}</span>
                    </button>
                  ))}

                  {/* Custom color input */}
                  <div className="flex items-center gap-2 pl-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-mono text-xs text-zinc-500">{primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Logotipo e Foto de Capa */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <ImageIcon size={16} className="text-violet-600" />
                  Imagens Principais (Logo e Capa)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      URL do Logotipo da Empresa
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemplo.com/meu-logo.png"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Recomendado: imagem quadrada (ex: 400x400) com fundo transparente ou branco.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      URL da Foto de Capa / Banner (Topo da Página)
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Recomendado: foto panorâmica em alta resolução do seu espaço ou decoração (ex: 1920x600).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pré-visualização do Topo do Mini-Site */}
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} />
                  Prévia do Topo da Página
                </h4>

                <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
                  {/* Capa */}
                  <div
                    className="h-28 w-full bg-cover bg-center relative"
                    style={{
                      backgroundImage: coverUrl
                        ? `url("${coverUrl}")`
                        : `linear-gradient(135deg, ${primaryColor}, #4c1d95)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" />
                  </div>

                  {/* Perfil e Nome */}
                  <div className="p-4 pt-0 relative bg-white dark:bg-[#18181b] space-y-2">
                    <div className="flex items-end justify-between -mt-8 mb-2">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 p-1 shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-xl"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {name ? name.substring(0, 1).toUpperCase() : 'A'}
                          </div>
                        )}
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Agendar Horário
                      </span>
                    </div>

                    <h5 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {name || 'Nome do Estabelecimento'}
                    </h5>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {description || 'Apresentação e especialidades do seu espaço para os clientes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: Sobre & Contato */}
        {activeTab === 'apresentacao' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Store size={16} className="text-violet-600" />
                Dados do Estabelecimento & Link Exclusivo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Configure o nome, o link amigável e as informações de contato para seus clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Studio Prime & Estética"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Link Exclusivo (Slug) *
                </label>
                <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                  <span className="px-3 py-2.5 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 border-r border-zinc-200 dark:border-zinc-800 select-none">
                    agendaai.com.br/#/agendar/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="studio-prime"
                    className="flex-1 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Apenas letras minúsculas, números e hífens.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Descrição e Apresentação da Empresa
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte sobre seu espaço, sua história, experiência da equipe e diferenciais..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-500" />
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-emerald-500" />
                  WhatsApp para Dúvidas e Atendimento
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Instagram size={14} className="text-pink-500" />
                  Instagram (@ ou link)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@studioprime ou link do perfil"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Facebook size={14} className="text-blue-500" />
                  Facebook (link da página)
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/minhapagina"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: Galeria de Fotos do Estabelecimento */}
        {activeTab === 'galeria' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ImageIcon size={16} className="text-violet-600" />
                Carrossel de Fotos do Ambiente & Espaço
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Adicione fotos do seu espaço, cadeiras de atendimento, recepção e estrutura para encantar seus clientes no mini-site.
              </p>
            </div>

            {/* Input para adicionar nova foto */}
            <div className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Cole a URL da foto (ex: https://images.unsplash.com/...)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Adicionar Foto
              </button>
            </div>

            {/* Grid de fotos adicionadas */}
            {galleryUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video bg-zinc-100 dark:bg-zinc-900 shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Ambiente ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Remover foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                <ImageIcon size={32} className="mx-auto text-zinc-400" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  Nenhuma foto na galeria ainda
                </p>
                <p className="text-[11px] text-zinc-400">
                  Adicione fotos do seu estabelecimento para criar um carrossel atraente no topo da página.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ABA 4: Horários & Regras */}
        {activeTab === 'horarios' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Clock size={16} className="text-violet-600" />
                Horários de Atendimento & Regras do Agendamento
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Defina o funcionamento da agenda para seus clientes escolherem horários válidos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Horário de Abertura Geral
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Horário de Fechamento Geral
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Intervalo entre Slots
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value={15}>A cada 15 minutos</option>
                  <option value={30}>A cada 30 minutos (Padrão)</option>
                  <option value={45}>A cada 45 minutos</option>
                  <option value={60}>A cada 1 hora</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      Permitir Agendamentos Online
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Quando desativado, o link público exibirá um aviso de que os agendamentos online estão temporariamente suspensos.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={allowOnlineBooking}
                    onChange={(e) => setAllowOnlineBooking(e.target.checked)}
                    className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: QR Code & Material de Divulgação */}
        {activeTab === 'qrcode' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <QrCode size={16} className="text-violet-600" />
                QR Code para Balcão, Cartões e Espelhos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Imprima este QR Code e coloque na recepção, nas mesas de atendimento ou no balcão para que os clientes agendem diretamente pela câmera do celular.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 max-w-xl mx-auto text-center sm:text-left">
              <div className="p-4 bg-white rounded-3xl shadow-md border border-zinc-200 shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    fullPublicUrl
                  )}`}
                  alt="QR Code da Página de Agendamento"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    {name || 'Seu Estabelecimento'}
                  </h4>
                  <p className="font-mono text-xs text-violet-600 dark:text-violet-400 break-all">
                    agendaai.com.br/#/agendar/{slug}
                  </p>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Aponte a câmera do celular para abrir o site de agendamento online e escolher profissional e horário.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Imprimir Cartaz
                  </button>

                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                      fullPublicUrl
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`qrcode-${slug}.png`}
                    className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all"
                  >
                    Baixar Imagem PNG
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

