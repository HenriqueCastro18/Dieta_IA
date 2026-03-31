import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DBService } from '../../services/db'; 

export const WaterPanel: React.FC<{ user: any }> = ({ user }) => {
  const [currentIntake, setCurrentIntake] = useState(0);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  const todayDate = new Date().toLocaleDateString('pt-BR');

  const goalML = useMemo(() => {
    const rawGoal = user?.goalWater;
    if (!rawGoal) return 3500;
    const parsed = typeof rawGoal === 'string' ? parseFloat(rawGoal.replace(',', '.')) : rawGoal;
    return parsed < 100 ? parsed * 1000 : parsed; 
  }, [user]);

  const progress = Math.min(currentIntake / goalML, 1);

  useEffect(() => {
    const fetchWater = async () => {
      const uid = user?.uid || user?.id;
      if (uid) {
        try {
          const saved = await DBService.getWaterHistory(uid, todayDate);
          if (saved && saved.amount) {
            setCurrentIntake(Number(saved.amount));
          }
        } catch (e) {
          console.error("Erro ao carregar água:", e);
        }
      }
    };
    fetchWater();
  }, [user, todayDate]);

  const addWater = (amount?: number) => {
    const value = amount || parseInt(inputAmount);
    if (isNaN(value) || value <= 0) return;
    setCurrentIntake(prev => prev + value);
    setInputAmount('');
  };

  const handleSaveToDB = async () => {
    const uid = user?.uid || user?.id;
    
    if (!uid) {
      alert("Erro: Usuário não autenticado.");
      return;
    }

    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await DBService.saveWater(uid, Number(currentIntake), todayDate);
      
      setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
      alert("Erro ao sincronizar. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="v4-water-container">
      <div className="v4-water-card">
        
        <div className="v4-water-ui">
          <header className="v4-water-header">
            <span className="v4-water-date">{todayDate.toUpperCase()}</span>
            <h1 className="v4-water-title">HIDRATAÇÃO</h1>
          </header>

          <div className="v4-water-display">
            <div className="v4-water-ml">
              {currentIntake}<small>ml</small>
            </div>
            <p className="v4-water-goal">META DIÁRIA: {goalML}ml</p>
          </div>

          <div className="v4-water-quick-add">
            <button className="v4-quick-btn" onClick={() => addWater(250)}>+250ml</button>
            <button className="v4-quick-btn" onClick={() => addWater(500)}>+500ml</button>
          </div>

          <div className="v4-water-custom-add">
            <input 
              type="number" 
              placeholder="Outra quantidade..." 
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="v4-water-input"
            />
            <button className="v4-water-add-btn" onClick={() => addWater()}>
              ADICIONAR
            </button>
          </div>

          <div className="v4-water-footer">
             <button className="v4-water-reset" onClick={() => setCurrentIntake(0)}>ZERAR HOJE</button>
             {lastSync && <span className="v4-water-sync">Sincronizado às {lastSync}</span>}
          </div>
        </div>

        <div className="v4-water-visual">
          <div className="v4-water-badge">{Math.round(progress * 100)}%</div>
          
          <div className="v4-bottle-section">
            <div className="v4-bottle-container">
              <svg viewBox="0 0 100 200" className="v4-bottle-svg">
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#4facfe" />
                  </linearGradient>
                  <clipPath id="bottleClip">
                    <rect x="10" y="5" width="80" height="190" rx="25" />
                  </clipPath>
                </defs>
                <rect x="10" y="5" width="80" height="190" rx="25" fill="#050505" stroke="#1a1a1a" strokeWidth="3" />
                <g clipPath="url(#bottleClip)">
                  
                  <motion.g
                    initial={{ y: 200 }}
                    animate={{ y: 200 - (progress * 190) }}
                    transition={{ type: "tween", duration: 0.8, ease: "easeInOut" }}
                  >
                    <motion.path
                      d="M 0 0 Q 25 -10 50 0 T 100 0 V 200 H 0 Z"
                      fill="url(#waterGrad)"
                      animate={{ x: [-20, 0, -20] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                    <rect y="0" width="100" height="200" fill="url(#waterGrad)" />
                  </motion.g>
                </g>
              </svg>
            </div>

            <button 
              className={`v4-save-db-btn ${isSaving ? 'is-saving' : ''}`}
              onClick={handleSaveToDB}
              disabled={isSaving}
            >
              {isSaving ? 'SINCRONIZANDO...' : 'SALVAR NO CLOUD'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .v4-water-container { width: 100%; max-width: 900px; margin: 20px auto; padding: 0 15px; }
        
        .v4-water-card { 
            background: rgba(13, 13, 13, 0.6); 
            backdrop-filter: blur(15px); 
            -webkit-backdrop-filter: blur(15px);
            border-radius: 40px; 
            border: 1px solid rgba(255, 255, 255, 0.05); 
            display: flex; 
            min-height: 550px; 
            overflow: hidden; 
            box-shadow: 0 30px 60px rgba(0,0,0,0.5); 
        }

        .v4-water-ui { flex: 1.2; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; min-width: 300px; }
        
        .v4-water-header { margin-bottom: 20px; }
        .v4-water-date { font-size: 10px; color: #555; font-weight: 900; letter-spacing: 3px; font-family: 'JetBrains Mono', monospace; }
        .v4-water-title { color: #fff; font-size: 32px; font-weight: 950; margin: 5px 0 0 0; letter-spacing: -1px; }

        .v4-water-display { background: #080808; padding: 30px 20px; border-radius: 30px; border: 1px solid #151515; text-align: center; margin-bottom: 25px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
        .v4-water-ml { font-size: 64px; font-weight: 950; color: #fff; line-height: 1; font-family: 'JetBrains Mono', monospace; }
        .v4-water-ml small { font-size: 18px; color: #00f2fe; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif; }
        .v4-water-goal { font-size: 10px; color: #444; font-weight: 900; margin-top: 15px; letter-spacing: 1.5px; }

        .v4-water-quick-add { display: flex; gap: 10px; margin-bottom: 15px; }
        .v4-quick-btn { flex: 1; background: #111; border: 1px solid #1a1a1a; color: #fff; padding: 16px; border-radius: 18px; font-size: 12px; font-weight: 900; cursor: pointer; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .v4-quick-btn:hover { background: rgba(0, 242, 254, 0.1); border-color: #00f2fe; color: #00f2fe; }
        .v4-quick-btn:active { transform: scale(0.95); }

        .v4-water-custom-add { display: flex; gap: 10px; }
        .v4-water-input { flex: 1; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 18px; padding: 16px; color: #fff; font-size: 14px; outline: none; text-align: center; font-weight: 800; transition: 0.3s; }
        .v4-water-input:focus { border-color: #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.1); }
        .v4-water-add-btn { background: #fff; color: #000; padding: 16px 24px; border-radius: 18px; border: none; font-size: 11px; cursor: pointer; font-weight: 950; letter-spacing: 1px; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .v4-water-add-btn:hover { background: #00f2fe; }
        .v4-water-add-btn:active { transform: scale(0.95); }

        .v4-water-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; }
        .v4-water-reset { background: none; border: none; color: #333; font-size: 10px; font-weight: 900; cursor: pointer; letter-spacing: 1px; transition: 0.2s; }
        .v4-water-reset:hover { color: #ff3e3e; }
        .v4-water-sync { font-size: 10px; color: #00f2fe; font-weight: bold; font-family: 'JetBrains Mono', monospace; }

        .v4-water-visual { flex: 0.8; background: #050505; border-left: 1px solid #111; position: relative; display: flex; flex-direction: column; alignItems: center; justify-content: center; padding: 40px; min-width: 280px; }
        
        .v4-water-badge { position: absolute; top: 30px; right: 30px; background: rgba(0, 242, 254, 0.1); color: #00f2fe; border: 1px solid #00f2fe; padding: 8px 16px; border-radius: 12px; font-weight: 950; font-size: 14px; font-family: 'JetBrains Mono', monospace; box-shadow: 0 0 20px rgba(0, 242, 254, 0.2); }
        
        .v4-bottle-section { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; width: 100%; height: 100%; }
        .v4-bottle-container { width: 140px; height: 280px; }
        .v4-bottle-svg { width: 100%; height: 100%; filter: drop-shadow(0 0 25px rgba(0,242,254,0.15)); }
        
        .v4-save-db-btn { width: 100%; max-width: 220px; border: none; padding: 18px; border-radius: 20px; font-weight: 950; font-size: 11px; letter-spacing: 1.5px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #00f2fe; color: #000; cursor: pointer; }
        .v4-save-db-btn:hover { background: #4facfe; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3); }
        .v4-save-db-btn:active { transform: translateY(0) scale(0.96); }
        .v4-save-db-btn.is-saving { background: #111; color: #444; cursor: not-allowed; box-shadow: none; transform: none; }

        @media (max-width: 768px) {
            .v4-water-card { flex-direction: column; border-radius: 30px; }
            .v4-water-visual { border-left: none; border-top: 1px solid #111; padding: 40px 20px; }
            .v4-water-custom-add { flex-direction: column; }
            .v4-water-ui { padding: 30px 20px; }
        }
      `}</style>
    </section>
  );
};

export default WaterPanel;