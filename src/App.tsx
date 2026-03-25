import React, { useState, useEffect, useRef } from 'react';
import { NutritionPanel } from './canvas/components/NutritionPanel';
import { SummaryPanel } from './canvas/components/SummaryPanel';
import AuthPanel from './canvas/components/Auth/AuthPanel';
import { ProfilePanel } from './canvas/components/Auth/ProfilePanel';
import { HistoryPanel } from './canvas/components/HistoryPanel';
import { WaterPanel } from './canvas/components/WaterPanel'; 
import { CompetitivePanel } from './canvas/components/CompetitivePanel';
import { MFAOverlay } from './canvas/components/Auth/MFAOverlay'; 
import { AuthService } from './services/auth'; 
import { DBService } from './services/db'; 

function App() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [isMFAVerified, setIsMFAVerified] = useState(false); 
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'history' | 'water' | 'performance'>('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  // EFEITO DE AUTENTICAÇÃO E RECUPERAÇÃO DE DADOS (FIRESTORE)
  useEffect(() => {
    const unsubscribe = AuthService.onUserChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const fullUserData = await DBService.getUserData(firebaseUser.uid);
          
          if (fullUserData) {
            setUser(fullUserData);
          } else {
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Erro ao sincronizar dados do perfil:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setIsMFAVerified(false); 
      }
      setReady(true); 
    });

    return () => unsubscribe();
  }, []);

  const handleNavClick = (view: any, e: React.MouseEvent) => {
    setCurrentView(view);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair do Dieta Fácil?")) {
      await AuthService.logout();
      setUser(null);
      setIsMFAVerified(false);
      setCurrentView('home');
    }
  };

  if (!ready) {
    return (
      <div style={loadingOverlay}>
        <div className="spinner"></div>
        <p style={{ marginTop: '15px', letterSpacing: '3px', fontSize: '10px' }}>SINCRONIZANDO...</p>
      </div>
    );
  }

  const isProfileIncomplete = user && (!user.weight || user.weight <= 0);
  const needsMFA = user && user.mfaEnabled && !isMFAVerified && !isProfileIncomplete;

  return (
    <div style={mainContainerStyle}>
      <div style={auroraBackground}>
        <div style={{ ...auroraLight, ...light1 }}></div>
        <div style={{ ...auroraLight, ...light2 }}></div>
        <div style={{ ...auroraLight, ...light3 }}></div>
      </div>

      <div style={uiWrapperStyle}>
        {!user ? (
          <AuthPanel onLogin={(userData) => setUser(userData)} />
        ) : needsMFA ? (
          <MFAOverlay 
            user={user} 
            onSuccess={() => setIsMFAVerified(true)} 
            onCancel={() => handleLogout()} 
          />
        ) : isProfileIncomplete ? (
          <ProfilePanel 
            user={user} 
            isFirstLogin={true} 
            onSave={(updated) => { setUser(updated); setCurrentView('home'); }} 
            onCancel={() => AuthService.logout()} 
          />
        ) : (
          <div className="app-layout">
            <nav className="nav-menu">
              <div className="nav-logo">DF</div>
              <div className="nav-scroll-container" ref={scrollRef}>
                <div className="nav-items">
                  <NavItem id="home" active={currentView === 'home'} icon="🏠" label="Início" onClick={handleNavClick} />
                  <NavItem id="water" active={currentView === 'water'} icon="💧" label="Água" onClick={handleNavClick} />
                  <NavItem id="performance" active={currentView === 'performance'} icon="🏆" label="Ranking" onClick={handleNavClick} />
                  <NavItem id="history" active={currentView === 'history'} icon="📅" label="Histórico" onClick={handleNavClick} />
                  <NavItem id="profile" active={currentView === 'profile'} icon="📊" label="Dados" onClick={handleNavClick} />
                  
                  <div className="nav-item logout" onClick={handleLogout}>
                    <span className="icon">🚪</span> 
                    <p>Sair</p>
                  </div>
                </div>
              </div>
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

              <div className="view-transition-container">
                {currentView === 'profile' && (
                  <ProfilePanel 
                    user={user} 
                    onSave={(updated) => { setUser(updated); setCurrentView('home'); }} 
                    onCancel={() => setCurrentView('home')} 
                  />
                )}

                {(currentView === 'history' || currentView === 'water' || currentView === 'performance') && (
                  <div className="panel-container central-panel">
                     {currentView === 'history' && <HistoryPanel user={user} />}
                     {currentView === 'water' && <WaterPanel user={user} />}
                     {currentView === 'performance' && <CompetitivePanel user={user} onUpdateUser={setUser} />}
                  </div>
                )}

                {currentView === 'home' && (
                  <div className="dashboard-grid">
                    {/* CORREÇÃO AQUI: Passando o user para o NutritionPanel */}
                    <NutritionPanel user={user} />
                    <SummaryPanel user={user} />
                  </div>
                )}
              </div>
            </main>
          </div>
        )}
      </div>

      <style>
        {`
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
          body, html { width: 100%; height: 100%; overflow: hidden; background: #000; padding-bottom: env(safe-area-inset-bottom); }

          .app-layout { display: flex; width: 100%; height: 100dvh; flex-direction: column-reverse; }

          .nav-menu {
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(30px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 100;
            padding-bottom: calc(10px + env(safe-area-inset-bottom));
            display: flex;
            align-items: center;
          }

          .nav-scroll-container { overflow-x: auto; display: flex; width: 100%; padding: 5px 15px; scrollbar-width: none; }
          .nav-scroll-container::-webkit-scrollbar { display: none; }
          .nav-items { display: flex; gap: 12px; padding-right: 20px; }

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
            transition: all 0.3s;
            padding: 8px 5px; 
            border-radius: 15px;
            flex-shrink: 0;
          }

          .nav-item .icon { font-size: 18px; margin-bottom: 4px; opacity: 0.5; transition: 0.3s; }
          .nav-item.active { color: #fff; background: rgba(255, 255, 255, 0.08); }
          .nav-item.active .icon { opacity: 1; text-shadow: 0 0 10px #00f2fe; }
          .nav-item.logout { color: #ff4b4b; }

          .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            padding-top: env(safe-area-inset-top);
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .spinner {
            width: 30px;
            height: 30px;
            border: 2px solid rgba(0, 242, 254, 0.1);
            border-top: 2px solid #00f2fe;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }

          @media (min-width: 1024px) {
            .app-layout { flex-direction: row; height: 100vh; }
            .nav-menu { 
              flex-direction: column; 
              width: 100px; 
              height: calc(100vh - 40px); 
              margin: 20px; 
              border-radius: 30px; 
              padding: 30px 0;
              border: 1px solid rgba(255,255,255,0.1);
            }
            .nav-scroll-container { flex-direction: column; overflow-x: hidden; padding: 0; }
            .nav-items { flex-direction: column; gap: 25px; padding-right: 0; width: 100%; align-items: center; }
            .nav-logo { display: block; margin-bottom: 40px; font-size: 20px; color: #00f2fe; font-weight: 950; text-align: center; }
            .nav-item { min-width: 80%; font-size: 9px; }
            .dashboard-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; width: 100%; }
          }

          .view-transition-container { animation: fadeIn 0.4s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
    </div>
  );
}

const NavItem = ({ id, active, icon, label, onClick }: any) => (
  <div className={`nav-item ${active ? 'active' : ''}`} onClick={(e) => onClick(id, e)}>
    <span className="icon">{icon}</span>
    <p>{label}</p>
  </div>
);

const loadingOverlay: React.CSSProperties = {
  width: '100vw', height: '100vh', background: '#000', display: 'flex', 
  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00f2fe'
};

const mainContainerStyle: React.CSSProperties = { width: '100vw', height: '100dvh', position: 'fixed', top: 0, left: 0, background: '#000', overflow: 'hidden' };
const auroraBackground: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' };
const auroraLight: React.CSSProperties = { position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15 };
const light1: React.CSSProperties = { top: '-10%', left: '-5%', width: '50vw', height: '60vh', background: 'radial-gradient(circle, #00f2fe 0%, #4facfe 100%)' };
const light2: React.CSSProperties = { bottom: '-20%', right: '-10%', width: '60vw', height: '70vh', background: 'radial-gradient(circle, #7028e4 0%, #e5b2ca 100%)' };
const light3: React.CSSProperties = { top: '20%', right: '15%', width: '30vw', height: '30vh', background: '#4facfe' };
const uiWrapperStyle: React.CSSProperties = { position: 'relative', zIndex: 10, width: '100%', height: '100%' };
const brandTitle: React.CSSProperties = { color: '#00f2fe', letterSpacing: '3px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' };
const contentHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 5px 15px 5px' };
const userBadgeStyle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: '900' };

export default App;