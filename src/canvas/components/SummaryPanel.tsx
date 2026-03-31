import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDietStore } from '../../store/useDietStore';
import { DBService } from '../../services/db';

const NutrientBar = ({ label, value, color, goal }: { label: string, value: number, color: string, goal: number }) => {
  const progress = Math.min((value || 0) / (goal || 1), 1);
  

  const randomDuration = 2.5 + Math.random(); 

  return (
    <div className="v4-nutri-col">
      <span className="v4-nutri-val" style={{ color }}>{value.toFixed(0)}</span>
      <div className="v4-nutri-track">
        <div className="v4-nutri-glass" />
        
        {}
        <svg viewBox="0 0 100 200" className="v4-nutri-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <motion.g
            initial={{ y: 200 }}
            animate={{ y: 200 - (progress * 200) }}
            transition={{ type: "tween", duration: 1, ease: "easeOut" }}
          >
            <motion.path
              d="M 0 0 Q 25 -5 50 0 T 100 0 V 200 H 0 Z"
              fill={`url(#grad-${label})`}
              animate={{ x: [-20, 0, -20] }}
              transition={{ repeat: Infinity, duration: randomDuration, ease: "linear" }}
            />
            <rect y="0" width="100" height="200" fill={`url(#grad-${label})`} />
          </motion.g>
        </svg>

      </div>
      <span className="v4-nutri-label">{label}</span>
    </div>
  );
};


export const SummaryPanel: React.FC<{ user: any }> = ({ user }) => {
  const { foods, totalMacros, removeFood, clearFoods } = useDietStore();
  const [isNaming, setIsNaming] = useState(false);
  const [mealName, setMealName] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const userId = user?.uid || user?.id;

  const goals = {
    p: Number(user?.goalProtein) || 160,
    c: Number(user?.goalCarbs) || 200,
    g: Number(user?.goalFat) || 70,
    cal: Number(user?.goalCalories) || 2000
  };

  const handleFinishMeal = () => {
    if (foods.length === 0) return;
    setIsNaming(true);
  };

  const confirmAndSave = async () => {
    if (isSaving || !userId) {
        console.error("ID do usuário não encontrado ou salvamento em curso.");
        return;
    }

    setIsSaving(true);
    const now = new Date();

    const mealData = {
      timestamp: Date.now(),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('pt-BR'),
      name: mealName.trim() || `Refeição das ${now.getHours()}h`,
      macros: JSON.parse(JSON.stringify(totalMacros)),
      items: JSON.parse(JSON.stringify(foods))
    };

    try {
      await DBService.saveMeal(userId, mealData);
      
      if (typeof clearFoods === 'function') clearFoods();
      setIsNaming(false);
      setMealName('');
    } catch (e) {
      console.error("Erro crítico ao salvar:", e);
      alert("Erro ao salvar no banco de dados. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="v4-summary-container">
      <div className="v4-summary-card">
        
        <header className="v4-summary-header">
          <div>
            <h3 className="v4-summary-title">RESUMO ATUAL</h3>
            <div className="v4-summary-date">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}
            </div>
          </div>
          <div className="v4-total-pill">{totalMacros.calories.toFixed(0)} KCAL</div>
        </header>
        
        <div className="v4-scroll-list">
          {foods.length === 0 ? (
            <div className="v4-empty-state">LISTA VAZIA. ADICIONE ALIMENTOS.</div>
          ) : (
            foods.map((food) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                key={food.timestamp} 
                className="v4-food-item"
              >
                <div style={{ flex: 1 }}>
                  <div className="v4-food-name">{food.name.toUpperCase()}</div>
                  <div className="v4-food-meta">
                    P {food.proteins.toFixed(0)}g • C {food.carbs.toFixed(0)}g • G {food.fats.toFixed(0)}g
                  </div>
                </div>
                <button onClick={() => removeFood(food.timestamp)} className="v4-delete-btn">✕</button>
              </motion.div>
            ))
          )}
        </div>

        <section className="v4-chart-area">
          <div className="v4-bar-grid">
            <NutrientBar label="PROT" value={totalMacros.proteins} color="#4ade80" goal={goals.p} />
            <NutrientBar label="CARB" value={totalMacros.carbs} color="#fbbf24" goal={goals.c} />
            <NutrientBar label="GORD" value={totalMacros.fats} color="#f87171" goal={goals.g} />
            <NutrientBar label="SÓD" value={totalMacros.sodium} color="#a78bfa" goal={2300} />
            <NutrientBar label="FIBRA" value={totalMacros.fiber} color="#2dd4bf" goal={30} />
            <NutrientBar label="AÇÚC" value={totalMacros.sugar} color="#60a5fa" goal={50} />
          </div>
        </section>

        <button 
          onClick={handleFinishMeal} 
          disabled={foods.length === 0}
          className={`v4-finish-btn ${foods.length === 0 ? 'is-disabled' : ''}`}
        >
          FINALIZAR E SALVAR REFEIÇÃO
        </button>
      </div>

      {}
      <AnimatePresence>
        {isNaming && (
          <div className="v4-modal-overlay">
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.95 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="v4-name-modal"
            >
              <h4 className="v4-modal-title">IDENTIFICAÇÃO DA REFEIÇÃO</h4>
              <input 
                autoFocus
                className="v4-modal-input"
                placeholder="Ex: Almoço Pós-Treino"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
              <div className="v4-modal-actions">
                <button onClick={() => setIsNaming(false)} className="v4-btn-cancel">VOLTAR</button>
                <button onClick={confirmAndSave} disabled={isSaving} className="v4-btn-confirm">
                  {isSaving ? 'SALVANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .v4-summary-container { display: flex; width: 100%; padding: 10px; justify-content: center; font-family: 'Outfit', sans-serif; }
        
        .v4-summary-card { 
            background: rgba(13, 13, 13, 0.8); 
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            width: 100%; 
            max-width: 420px; 
            border-radius: 35px; 
            padding: 25px; 
            border: 1px solid rgba(255,255,255,0.05); 
            box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
        }

        .v4-summary-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
        .v4-summary-title { font-size: 10px; font-weight: 900; color: #555; letter-spacing: 2px; margin: 0 0 4px 0; }
        .v4-summary-date { font-size: 20px; color: #fff; font-weight: 950; letter-spacing: -0.5px; }
        
        .v4-total-pill { background: rgba(0, 242, 254, 0.1); color: #00f2fe; padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 900; border: 1px solid rgba(0, 242, 254, 0.2); font-family: 'JetBrains Mono', monospace; }

        .v4-scroll-list { height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px; padding-right: 5px; }
        .v4-scroll-list::-webkit-scrollbar { width: 4px; }
        .v4-scroll-list::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }

        .v4-empty-state { text-align: center; color: #333; font-size: 10px; font-weight: 900; padding: 40px; letter-spacing: 1px; }

        .v4-food-item { background: #080808; padding: 16px; border-radius: 20px; border: 1px solid #151515; display: flex; align-items: center; transition: 0.2s; }
        .v4-food-item:hover { border-color: #333; }
        .v4-food-name { color: #efefef; font-size: 12px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 4px; }
        .v4-food-meta { color: #666; font-size: 10px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        
        .v4-delete-btn { background: rgba(255, 62, 62, 0.05); border: 1px solid transparent; color: #ff3e3e; font-size: 12px; cursor: pointer; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; transition: 0.2s; }
        .v4-delete-btn:hover { background: rgba(255, 62, 62, 0.15); border-color: #ff3e3e; }
        .v4-delete-btn:active { transform: scale(0.85); }

        .v4-chart-area { background: #030303; padding: 25px 20px; border-radius: 28px; border: 1px solid #0f0f0f; margin-bottom: 25px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
        .v4-bar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; height: 160px; }
        
        .v4-nutri-col { display: flex; flex-direction: column; align-items: center; }
        .v4-nutri-val { font-size: 10px; font-weight: 900; margin-bottom: 10px; font-family: 'JetBrains Mono', monospace; }
        .v4-nutri-track { flex: 1; width: 100%; max-width: 32px; background: #000; border-radius: 16px; position: relative; border: 1px solid #151515; overflow: hidden; }
        .v4-nutri-glass { position: absolute; inset: 0; z-index: 2; background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, transparent 40%); pointer-events: none; }
        .v4-nutri-svg { width: 100%; height: 100%; position: absolute; bottom: 0; left: 0; z-index: 1; }
        .v4-nutri-label { font-size: 8px; font-weight: 900; color: #444; margin-top: 12px; letter-spacing: 0.5px; }

        .v4-finish-btn { width: 100%; padding: 20px; border-radius: 20px; border: none; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #000; font-weight: 950; font-size: 12px; letter-spacing: 1px; cursor: pointer; box-shadow: 0 10px 20px rgba(0,242,254,0.15); transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .v4-finish-btn:active { transform: scale(0.97); }
        .v4-finish-btn.is-disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
        .v4-finish-btn.is-disabled:active { transform: none; }

        .v4-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .v4-name-modal { background: #080808; border: 1px solid #1a1a1a; border-radius: 35px; padding: 35px; width: 100%; max-width: 340px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
        .v4-modal-title { font-size: 10px; font-weight: 900; color: #00f2fe; margin: 0 0 25px 0; letter-spacing: 2px; }
        
        .v4-modal-input { background: #000; border: 1px solid #1a1a1a; border-radius: 18px; padding: 18px; color: #fff; width: 100%; margin-bottom: 25px; outline: none; font-size: 16px; text-align: center; font-weight: 800; transition: 0.3s; }
        .v4-modal-input:focus { border-color: #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.1); }
        
        .v4-modal-actions { display: flex; gap: 12px; }
        .v4-btn-cancel { flex: 1; background: #111; color: #666; border: 1px solid #1a1a1a; padding: 18px; border-radius: 16px; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .v4-btn-cancel:hover { color: #fff; background: #1a1a1a; }
        .v4-btn-cancel:active { transform: scale(0.95); }
        
        .v4-btn-confirm { flex: 1.5; background: #fff; color: #000; border: none; padding: 18px; border-radius: 16px; font-weight: 950; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: 0.2s; }
        .v4-btn-confirm:hover { background: #00f2fe; }
        .v4-btn-confirm:active { transform: scale(0.95); }
        .v4-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default SummaryPanel;