import React, { useState, useEffect, useRef } from 'react';
import { NutritionPanel } from './canvas/components/NutritionPanel';
import { SummaryPanel } from './canvas/components/SummaryPanel';
import AuthPanel from './canvas/components/Auth/AuthPanel';
import { ProfilePanel } from './canvas/components/Auth/ProfilePanel';
import { HistoryPanel } from './canvas/components/HistoryPanel';
import { WaterPanel } from './canvas/components/WaterPanel'; 
import { CompetitivePanel } from './canvas/components/CompetitivePanel';

// Chave para o LocalStorage
const STORAGE_KEY = '@DietaFacil:userData';

function App() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'history' | 'water' | 'performance'>('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  // EFEITO INICIAL: Carrega dados salvos do navegador
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage", e);
      }
    }
    setReady(true);
  }, []);

  // Função para scroll suave no menu mobile
  const handleNavClick = (view: any, e: React.MouseEvent) => {
    setCurrentView(view);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  // Persiste os dados no localStorage sempre que o usuário for atualizado
  const updateUserData = (newData: any) => {
    setUser(newData);
    if (newData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSaveProfile = (updatedData: any) => {
    updateUserData(updatedData);
    setCurrentView('home');
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair? Seus dados locais serão mantidos neste navegador.")) {
      setUser(null);
    }
  };

  if (!ready) return null;

  const isProfileIncomplete = user && (!user.name || !user.weight || user.weight <= 0);

  return (
    <div style={mainContainerStyle}>
      <div style={auroraBackground}>
        <div style={{ ...auroraLight, ...light1 }}></div>
        <div style={{ ...auroraLight, ...light2 }}></div>
        <div style={{ ...auroraLight, ...light3 }}></div>
      </div>

      <div style={uiWrapperStyle}>
        {!user ? (
          <AuthPanel onLogin={(userData) => updateUserData(userData)} />
        ) : isProfileIncomplete ? (
          <ProfilePanel 
            user={user} 
            isFirstLogin={true} 
            onSave={handleSaveProfile} 
            onCancel={() => updateUserData(null)} 
          />
        ) : (
          <div className="app-layout">
            
            <nav className="nav-menu">
              <div className="nav-logo">DF</div>
              <div className="nav-scroll-container" ref={scrollRef}>
                <div className="nav-items">
                  <div 
                    className={`nav-item ${currentView === 'home' ? 'active' : ''}`} 
                    onClick={(e) => handleNavClick('home', e)}
                  >
                    <span className="icon">🏠</span> 
                    <p>Início</p>
                  </div>

                  <div 
                    className={`nav-item ${currentView === 'water' ? 'active' : ''}`} 
                    onClick={(e) => handleNavClick('water', e)}
                  >
                    <span className="icon">💧</span> 
                    <p>Água</p>
                  </div>

                  <div 
                    className={`nav-item ${currentView === 'performance' ? 'active' : ''}`} 
                    onClick={(e) => handleNavClick('performance', e)}
                  >
                    <span className="icon">🏆</span> 
                    <p>Ranking</p>
                  </div>

                  <div 
                    className={`nav-item ${currentView === 'history' ? 'active' : ''}`} 
                    onClick={(e) => handleNavClick('history', e)}
                  >
                    <span className="icon">📅</span> 
                    <p>Histórico</p>
                  </div>
                  
                  <div 
                    className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} 
                    onClick={(e) => handleNavClick('profile', e)}
                  >
                    <span className="icon">📊</span> 
                    <p>Dados</p>
                  </div>

                  <div className="nav-item logout" onClick={handleLogout}>
                    <span className="icon">🚪</span> 
                    <p>Sair</p>
                  </div>
                </div>
              </div>
              <div className="nav-fade-right"></div>
            </nav>

            <main className="main-content">
              <header style={contentHeaderStyle}>
                <h2 style={brandTitle}>
                  {currentView === 'home' && "DIETA FÁCIL"}
                  {currentView === 'water' && "HIDRATAÇÃO"}
                  {currentView === 'history' && "MEU RENDIMENTO"}
                  {currentView === 'profile' && "MEU PERFIL"}
                  {currentView === 'performance' && "ARENA DE PERFORMANCE"}
                </h2>
                <div style={userBadgeStyle} onClick={() => setCurrentView('profile')}>
                  {user.name?.[0].toUpperCase() || 'H'}
                </div>
              </header>

              {currentView === 'profile' && (
                <ProfilePanel 
                  user={user} 
                  onSave={handleSaveProfile} 
                  onCancel={() => setCurrentView('home')} 
                />
              )}

              {(currentView === 'history' || currentView === 'water' || currentView === 'performance') && (
                <div className="panel-container central-panel">
                   {currentView === 'history' && <HistoryPanel user={user} />}
                   {currentView === 'water' && <WaterPanel user={user} />}
                   {currentView === 'performance' && <CompetitivePanel user={user} onUpdateUser={updateUserData} />}
                </div>
              )}

              {currentView === 'home' && (
                <div className="dashboard-grid">
                  <section className="panel-container">
                    <NutritionPanel />
                  </section>
                  <section className="panel-container">
                    <SummaryPanel user={user} />
                  </section>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      <style>
        {`
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body, html { 
            width: 100%; 
            height: 100%; 
            overflow: hidden; 
            background: #000;
            /* Garante que o conteúdo respeite a área do "notch" e botões virtuais */
            padding-bottom: env(safe-area-inset-bottom);
          }

          .app-layout {
            display: flex;
            width: 100%;
            height: 100dvh; /* Dynamic VH para mobile */
            flex-direction: column-reverse;
          }

          .nav-menu {
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(30px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 100;
            /* Adiciona espaço extra no fundo para celulares modernos */
            padding-bottom: calc(10px + env(safe-area-inset-bottom));
            display: flex;
            align-items: center;
          }

          .nav-scroll-container {
            overflow-x: auto;
            display: flex;
            width: 100%;
            padding: 5px 15px;
            scrollbar-width: none; 
          }

          .nav-scroll-container::-webkit-scrollbar { display: none; }

          .nav-items { 
            display: flex; 
            gap: 12px;
            padding-right: 20px; 
          }

          .nav-item { 
            min-width: 70px; 
            color: #555; 
            text-align: center; 
            cursor: pointer; 
            font-size: 8px; 
            font-weight: 800;
            text-transform: uppercase; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 8px 5px; 
            border-radius: 15px;
            flex-shrink: 0;
          }

          .nav-item .icon { font-size: 18px; margin-bottom: 4px; filter: grayscale(1); opacity: 0.5; transition: 0.3s; }
          
          .nav-item.active { color: #fff; background: rgba(255, 255, 255, 0.08); }
          .nav-item.active .icon { 
            filter: grayscale(0); 
            opacity: 1; 
            text-shadow: 0 0 10px #00f2fe;
          }

          .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            padding-top: env(safe-area-inset-top); /* Respeita o notch no topo */
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          @media (min-width: 1024px) {
            .app-layout { flex-direction: row; height: 100vh; }
            .nav-menu { 
              flex-direction: column; 
              width: 100px; 
              height: calc(100vh - 40px); 
              margin: 20px; 
              border-radius: 30px; 
              padding: 30px 0;
              padding-bottom: 30px; /* Reseta o padding de mobile no desktop */
              border: 1px solid rgba(255,255,255,0.1);
            }
            .nav-scroll-container { flex-direction: column; overflow-x: hidden; padding: 0; }
            .nav-items { 
              flex-direction: column; 
              gap: 25px; 
              padding-right: 0;
              width: 100%;
              align-items: center;
            }
            .nav-logo { display: block; margin-bottom: 40px; font-size: 20px; color: #00f2fe; font-weight: 950; }
            .nav-item { min-width: 80%; font-size: 9px; }
            .nav-fade-right { display: none; }
            .dashboard-grid { 
              display: grid;
              grid-template-columns: 1.2fr 0.8fr; 
              gap: 20px;
              padding: 20px 0; 
            }
          }
        `}
      </style>
    </div>
  );
}

// Estilos auxiliares mantidos...
const mainContainerStyle: React.CSSProperties = { width: '100vw', height: '100dvh', position: 'fixed', top: 0, left: 0, background: '#000', overflow: 'hidden' };
const auroraBackground: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' };
const auroraLight: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15 };
const light1: React.CSSProperties = { top: '-10%', left: '-5%', width: '50vw', height: '60vh', background: 'radial-gradient(circle, #00f2fe 0%, #4facfe 100%)' };
const light2: React.CSSProperties = { bottom: '-20%', right: '-10%', width: '60vw', height: '70vh', background: 'radial-gradient(circle, #7028e4 0%, #e5b2ca 100%)' };
const light3: React.CSSProperties = { top: '20%', right: '15%', width: '30vw', height: '30vh', background: '#4facfe' };
const uiWrapperStyle: React.CSSProperties = { position: 'relative', zIndex: 10, width: '100%', height: '100%' };
const brandTitle: React.CSSProperties = { color: '#00f2fe', letterSpacing: '3px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' };

const contentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 5px 15px 5px'
};

const userBadgeStyle: React.CSSProperties = { 
  width: '36px', 
  height: '36px', 
  borderRadius: '50%', 
  background: 'rgba(255,255,255,0.05)', 
  color: '#fff', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  border: '1px solid rgba(255,255,255,0.1)', 
  cursor: 'pointer', 
  fontWeight: '900'
};

export default App;