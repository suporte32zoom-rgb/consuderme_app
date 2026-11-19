import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Share, 
  PlusSquare, 
  Zap, 
  ShieldCheck, 
  Layers
} from 'lucide-react';

interface PWAInstallBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  onInstall: () => Promise<boolean>;
  onUpdate: () => void;
  isOpenModal: boolean;
  onCloseModal: () => void;
}

export function PWAInstallBanner({
  isInstallable,
  isInstalled,
  isOffline,
  hasUpdate,
  onInstall,
  onUpdate,
  isOpenModal,
  onCloseModal
}: PWAInstallBannerProps) {
  const [activeDeviceTab, setActiveDeviceTab] = useState<'desktop' | 'ios' | 'android'>('desktop');
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleDirectInstall = async () => {
    const success = await onInstall();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onCloseModal();
      }, 2500);
    }
  };

  return (
    <>
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center space-x-2.5 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-medium">
              <strong>Modo Offline Ativado:</strong> O ConsuDerme está operando com banco de dados local e algoritmos clínicos de segurança. Todas as alterações serão mantidas no dispositivo.
            </span>
          </div>
        </div>
      )}

      {/* Update Available Toast Banner */}
      {hasUpdate && (
        <div className="fixed bottom-20 left-6 z-50 max-w-sm bg-slate-900 border border-teal-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-white animate-bounce">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-teal-300">Nova versão do ConsuDerme</p>
              <p className="text-slate-300">Atualização do aplicativo disponível com melhorias de velocidade e segurança.</p>
              <div className="pt-2">
                <button
                  onClick={onUpdate}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition text-[11px]"
                >
                  Atualizar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Installation Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Instalar ConsuDerme PWA
                    <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">
                      App Nativo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Transforme o consultório em um aplicativo no seu computador ou celular</p>
                </div>
              </div>
              <button
                onClick={onCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PWA Advantages Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1">
                <Zap className="w-4 h-4 text-amber-400 mx-auto" />
                <p className="font-bold text-slate-200 text-[11px]">Alta Velocidade</p>
                <p className="text-[10px] text-slate-400">Abre em tela cheia sem abas</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1">
                <Wifi className="w-4 h-4 text-teal-400 mx-auto" />
                <p className="font-bold text-slate-200 text-[11px]">Suporte Offline</p>
                <p className="text-[10px] text-slate-400">Prontuário sem internet</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
                <p className="font-bold text-slate-200 text-[11px]">LGPD & CFM</p>
                <p className="text-[10px] text-slate-400">Segurança local de dados</p>
              </div>
            </div>

            {/* Direct 1-Click Install Button if supported */}
            {isInstallable && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-800 to-emerald-950 border border-teal-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Instalação Direta Pronta</h4>
                    <p className="text-[11px] text-slate-300">Seu navegador oferece suporte à instalação imediata em 1 clique.</p>
                  </div>
                </div>

                <button
                  onClick={handleDirectInstall}
                  disabled={installSuccess}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-80"
                >
                  {installSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                      <span>Instalação Iniciada com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Instalar ConsuDerme Agora</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {isInstalled && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O ConsuDerme já está instalado e configurado como aplicativo neste ambiente!</span>
              </div>
            )}

            {/* Manual Instructions by Device */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-slate-300">Instruções por Dispositivo:</span>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveDeviceTab('desktop')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeDeviceTab === 'desktop' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setActiveDeviceTab('ios')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeDeviceTab === 'ios' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    iOS (iPhone/iPad)
                  </button>
                  <button
                    onClick={() => setActiveDeviceTab('android')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeDeviceTab === 'android' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Android
                  </button>
                </div>
              </div>

              {activeDeviceTab === 'desktop' && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Monitor className="w-4 h-4 text-teal-400" />
                    <span>No Computador (Chrome / Edge / Safari / Brave)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pl-1">
                    <li>Clique no ícone de <strong>Instalar</strong> <Download className="w-3 h-3 inline mx-1 text-teal-400" /> na barra de endereço (lado direito da URL).</li>
                    <li>Ou clique no menu do navegador (<strong>⋮</strong>) &gt; <strong>Salvar e Compartilhar</strong> &gt; <strong>Instalar ConsuDerme</strong>.</li>
                    <li>O aplicativo será adicionado à sua área de trabalho e barra de tarefas.</li>
                  </ol>
                </div>
              )}

              {activeDeviceTab === 'ios' && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span>No iPhone ou iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pl-1">
                    <li>Abra o ConsuDerme no <strong>Safari</strong>.</li>
                    <li>Toque no botão de <strong>Compartilhar</strong> <Share className="w-3 h-3 inline mx-1 text-sky-400" /> na barra inferior do Safari.</li>
                    <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3 h-3 inline mx-1 text-teal-400" />.</li>
                    <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                  </ol>
                </div>
              )}

              {activeDeviceTab === 'android' && (
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>No Celular ou Tablet Android (Chrome)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 pl-1">
                    <li>Toque no menu (<strong>⋮</strong>) no canto superior direito do Chrome.</li>
                    <li>Toque na opção <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                    <li>Confirme tocando em <strong>Instalar</strong>.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
