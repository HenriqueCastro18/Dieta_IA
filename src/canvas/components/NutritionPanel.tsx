import React, { useState } from 'react';
import { useDietStore } from '../../store/useDietStore';
import { fetchFoodData } from '../../data/apiService';
import { DBService } from '../../services/db';

interface FoodInfo {
  name: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  sodiumMg?: number;
  fiber?: number;
  sugarTotal?: number;
  conversions?: {
    [key: string]: number;
  };
}

export const NutritionPanel: React.FC<{ user: any }> = ({ user }) => {
  const addFood = useDietStore((state) => state.addFood);
  const [query, setQuery] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [unit, setUnit] = useState<'g' | 'ml' | 'un'>('g');
  const [loading, setLoading] = useState(false);
  
  const [cookingMode, setCookingMode] = useState('natural');
  const [oilOption, setOilOption] = useState('0');
  const [customOil, setCustomOil] = useState<number>(0);
  const [saltOption, setSaltOption] = useState('0');
  const [customSalt, setCustomSalt] = useState<number>(0);

  const [preview, setPreview] = useState<any | null>(null);

  const formatValue = (val: number, decimals: number = 1) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimals });

  const handleCalculate = async () => {
    if (query.length < 2) return;
    setLoading(true);
    
    try {
      let result: FoodInfo | null = null;

      console.log(`Buscando "${query}" no cache do Firebase...`);
      const cachedFood = await DBService.findCustomFood(query, unit);
      if (cachedFood) {
        result = cachedFood as unknown as FoodInfo;
        console.log("Encontrado no Firebase!", result);
      }

      if (!result) {
        console.log(`Solicitando inteligência ao CORE V8 (Groq)... (Unidade: ${unit})`);
        
        result = await fetchFoodData(query, unit) as FoodInfo | null;
        
        if (result) {
          await DBService.saveCustomFood({
            ...result,
            unitGroup: unit,
            searchKey: query.toLowerCase().trim()
          });
        }
      }

      if (result) {
        let effectiveWeight = amount;

        if (unit !== 'g' && result.conversions && result.conversions[unit]) {
          effectiveWeight = amount * result.conversions[unit];
        } else if (unit === 'un' && (!result.conversions || !result.conversions.un)) {
          effectiveWeight = amount * 100; 
        }

        const factor = effectiveWeight / 100;

        let p = (result.proteinPer100g || 0) * factor;
        let c = (result.carbsPer100g || 0) * factor;
        let f = (result.fatsPer100g || 0) * factor;
        let sodium = (result.sodiumMg || 0) * factor;
        let fiber = (result.fiber || 0) * factor;
        let sugar = (result.sugarTotal || 0) * factor;

        if (cookingMode === 'frito' || cookingMode === 'assado') {
          const addedOilMl = oilOption === 'custom' ? customOil : Number(oilOption);
          f += (addedOilMl * 0.92); 
        }

        const addedSaltG = saltOption === 'custom' ? customSalt : Number(saltOption);
        sodium += (addedSaltG * 387.5); 

        const cal = (p * 4) + (c * 4) + (f * 9);

        setPreview({ 
          name: `${result.name} (${cookingMode})`, 
          p, c, f, sodium, fiber, sugar, cal 
        });
      } else {
          alert("Alimento não encontrado ou erro na IA.");
      }
    } catch (error) {
      console.error("Erro no fluxo de cálculo nutricional:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    const uid = user?.uid || user?.id;
    if (!preview || !uid) return;

    setLoading(true);
    try {
      const mealData = {
        name: preview.name,
        calories: Number(preview.cal),
        protein: Number(preview.p),
        carbs: Number(preview.c),
        fat: Number(preview.f),
        sodium: Number(preview.sodium),
        fiber: Number(preview.fiber),
        sugar: Number(preview.sugar),
        amount: Number(amount),
        unit: unit,
        date: new Date().toLocaleDateString('pt-BR')
      };

      await DBService.saveMeal(uid, mealData);
      
      addFood({ 
        ...mealData, 
        proteins: mealData.protein, 
        fats: mealData.fat, 
        timestamp: Date.now() 
      });

      setPreview(null);
      setQuery('');
      alert("Refeição registrada com sucesso!");
    } catch (error) {
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v4-nutri-container">
      <div className="v4-nutri-card">
        
        <div className="v4-nutri-badge">
          <span className="v4-badge-icon">🛡️</span> V4 CORE ENGINE
        </div>
        
        <h2 className="v4-nutri-title">NOVO ALIMENTO V2</h2>
        
        <div className="v4-nutri-form">
          <input 
            type="text" 
            placeholder="Ex: Peito de Frango, Pizza..." 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setPreview(null); }} 
            className="v4-nutri-input-main" 
          />

          <div className="v4-nutri-row">
            <div className="v4-nutri-weight-group">
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))} 
                className="v4-nutri-weight-input" 
              />
            </div>
            <select 
              value={unit} 
              onChange={(e) => { setUnit(e.target.value as any); setPreview(null); }} 
              className="v4-nutri-select v4-select-half"
            >
              <option value="g">Gramas (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="un">Unidade (un)</option>
            </select>
          </div>

          <div className="v4-nutri-section">
            <label className="v4-nutri-label">MÉTODO DE PREPARO</label>
            <select 
              value={cookingMode} 
              onChange={(e) => setCookingMode(e.target.value)} 
              className="v4-nutri-select"
            >
              <option value="natural">Grelhado / Natural / Cru</option>
              <option value="cozido">Cozido em Água</option>
              <option value="assado">Assado</option>
              <option value="frito">Frito / Imersão</option>
            </select>
          </div>

          {(cookingMode === 'frito' || cookingMode === 'assado') && (
            <div className="v4-nutri-section">
              <label className="v4-nutri-label">ADICIONAR ÓLEO (ML)</label>
              <div className="v4-nutri-row-gap">
                <select value={oilOption} onChange={(e) => setOilOption(e.target.value)} className="v4-nutri-select">
                  <option value="0">Sem Óleo</option>
                  <option value="2">2ml (Fio)</option>
                  <option value="5">5ml (1 colher chá)</option>
                  <option value="12">12ml (1 colher sopa)</option>
                  <option value="custom">Outro...</option>
                </select>
                {oilOption === 'custom' && (
                  <input type="number" placeholder="ml" onChange={(e) => setCustomOil(Number(e.target.value))} className="v4-nutri-custom-input" />
                )}
              </div>
            </div>
          )}

          <div className="v4-nutri-section">
            <label className="v4-nutri-label">SAL ADICIONADO (G)</label>
            <div className="v4-nutri-row-gap">
              <select value={saltOption} onChange={(e) => setSaltOption(e.target.value)} className="v4-nutri-select">
                <option value="0">Sem Sal</option>
                <option value="0.5">0.5g (Pitada)</option>
                <option value="1.5">1.5g (Sachê)</option>
                <option value="custom">Outro...</option>
              </select>
              {saltOption === 'custom' && (
                <input type="number" placeholder="g" onChange={(e) => setCustomSalt(Number(e.target.value))} className="v4-nutri-custom-input" />
              )}
            </div>
          </div>

          <button 
            onClick={handleCalculate} 
            disabled={loading || query.length < 2} 
            className="v4-nutri-search-btn"
          >
            {loading ? 'ANALISANDO COM IA...' : 'CALCULAR NUTRIENTES'}
          </button>
        </div>

        {preview && (
          <div className="v4-nutri-preview">
            <p className="v4-preview-title">{preview.name.toUpperCase()}</p>
            
            <div className="v4-macro-grid">
              <div className="v4-macro-item"><span className="v4-color-p">PROT</span><strong className="v4-macro-val">{formatValue(preview.p)}g</strong></div>
              <div className="v4-macro-item"><span className="v4-color-c">CARB</span><strong className="v4-macro-val">{formatValue(preview.c)}g</strong></div>
              <div className="v4-macro-item"><span className="v4-color-f">GORD</span><strong className="v4-macro-val">{formatValue(preview.f)}g</strong></div>
            </div>
            
            <div className="v4-micro-grid">
              <div className="v4-micro-item"><label className="v4-micro-label">Sódio</label><span className="v4-micro-val">{formatValue(preview.sodium, 0)}mg</span></div>
              <div className="v4-micro-item"><label className="v4-micro-label">Fibra</label><span className="v4-micro-val">{formatValue(preview.fiber)}g</span></div>
              <div className="v4-micro-item"><label className="v4-micro-label">Açúcar</label><span className="v4-micro-val">{formatValue(preview.sugar)}g</span></div>
            </div>
            
            <button onClick={handleAddFood} disabled={loading} className="v4-nutri-add-btn">
              {loading ? 'SALVANDO...' : `ADICIONAR ${formatValue(preview.cal, 0)} KCAL`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .v4-nutri-container { display: flex; justify-content: center; padding: 10px; width: 100%; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        .v4-nutri-container * { box-sizing: border-box; }
        
        .v4-nutri-card { 
            background: rgba(13, 13, 13, 0.85); 
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.05); 
            border-radius: 35px; 
            padding: 30px; 
            width: 100%; 
            max-width: 420px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.8); 
            position: relative; 
        }

        .v4-nutri-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.5); color: #00f2fe; padding: 6px 16px; border-radius: 20px; font-size: 9px; font-weight: 900; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; white-space: nowrap; font-family: 'JetBrains Mono', monospace; box-shadow: 0 0 15px rgba(0, 242, 254, 0.15); }
        .v4-badge-icon { font-size: 12px; }
        
        .v4-nutri-title { font-size: 14px; font-weight: 900; margin-bottom: 25px; color: #fff; text-align: center; letter-spacing: 2px; margin-top: 10px; }

        .v4-nutri-form { display: flex; flex-direction: column; gap: 20px; width: 100%; }

        .v4-nutri-input-main { width: 100%; padding: 18px; border-radius: 16px; border: 1px solid #1a1a1a; background: #0a0a0a; color: white; outline: none; font-size: 16px; font-weight: 600; transition: 0.3s; }
        .v4-nutri-input-main:focus { border-color: #00f2fe; box-shadow: 0 0 15px rgba(0, 242, 254, 0.1); }

        .v4-nutri-row { display: flex; gap: 12px; width: 100%; }
        .v4-nutri-weight-group { flex: 1; display: flex; align-items: center; background: #0a0a0a; border-radius: 16px; padding: 0 15px; border: 1px solid #1a1a1a; transition: 0.3s; }
        .v4-nutri-weight-group:focus-within { border-color: #00f2fe; }
        
        .v4-nutri-weight-input { width: 100%; background: transparent; border: none; color: #00f2fe; text-align: center; font-size: 16px; font-weight: 800; outline: none; padding: 16px 0; }
        
        .v4-nutri-select { width: 100%; padding: 16px; border-radius: 16px; background: #0a0a0a; color: #eee; border: 1px solid #1a1a1a; outline: none; cursor: pointer; font-size: 16px; font-weight: 600; transition: 0.3s; appearance: none; }
        .v4-nutri-select:focus { border-color: #00f2fe; }
        .v4-select-half { flex: 1; color: #00f2fe; font-weight: 800; }

        .v4-nutri-section { display: flex; flex-direction: column; gap: 8px; margin-top: 5px; width: 100%; }
        .v4-nutri-label { font-size: 10px; color: #888; font-weight: 900; letter-spacing: 1px; }
        
        .v4-nutri-row-gap { display: flex; gap: 10px; width: 100%; }
        .v4-nutri-custom-input { width: 90px; padding: 16px 12px; border-radius: 16px; background: #0a0a0a; color: #00f2fe; border: 1px solid #1a1a1a; text-align: center; font-weight: 800; font-size: 16px; outline: none; transition: 0.3s; }
        .v4-nutri-custom-input:focus { border-color: #00f2fe; }

        .v4-nutri-search-btn { width: 100%; background: #fff; color: #000; border: none; padding: 18px; border-radius: 18px; font-weight: 950; cursor: pointer; margin-top: 15px; letter-spacing: 1px; font-size: 13px; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .v4-nutri-search-btn:hover { background: #00f2fe; }
        .v4-nutri-search-btn:active { transform: scale(0.96); }
        .v4-nutri-search-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #333; color: #888; }

        .v4-nutri-preview { margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .v4-preview-title { color: #00f2fe; font-weight: 950; font-size: 18px; margin-bottom: 20px; letter-spacing: 1px; }
        
        .v4-macro-grid { display: flex; justify-content: space-around; margin-bottom: 25px; }
        .v4-macro-item { display: flex; flex-direction: column; gap: 6px; }
        .v4-macro-val { color: #fff; font-size: 18px; font-family: 'JetBrains Mono', monospace; font-weight: 800; }
        
        .v4-color-p { color: #4ade80; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
        .v4-color-c { color: #fbbf24; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
        .v4-color-f { color: #f87171; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
        
        .v4-micro-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; background: rgba(0,0,0,0.4); padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .v4-micro-item { display: flex; flex-direction: column; gap: 4px; }
        .v4-micro-label { color: #666; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .v4-micro-val { color: #ddd; font-size: 12px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        
        .v4-nutri-add-btn { width: 100%; padding: 20px; border-radius: 20px; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #000; border: none; cursor: pointer; font-weight: 950; font-size: 13px; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(0,242,254,0.15); transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .v4-nutri-add-btn:active { transform: scale(0.96); }
        .v4-nutri-add-btn:disabled { opacity: 0.5; filter: grayscale(1); cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default NutritionPanel;