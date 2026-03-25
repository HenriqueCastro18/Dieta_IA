import React, { useState } from 'react';
import { useDietStore } from '../../store/useDietStore';
import { fetchFoodData } from '../../data/apiService';
import { DBService } from '../../services/db';
import { GeminiService } from '../../services/gemini';

// Interface robusta para garantir Type-Safety no fluxo de dados
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
  
  // Estados para processamento culinário (Arquitetura de Cálculo)
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
      // 1. BUSCA LOCAL (JSON Estático)
      let result = await fetchFoodData(query, unit) as FoodInfo | null;
      
      // 2. BUSCA NO FIREBASE (Itens aprendidos/Cache)
      if (!result) {
        console.log(`Buscando "${query}" no cache do Firebase...`);
        // O cast duplo resolve o conflito de DocumentData do Firebase SDK
        const cachedFood = await DBService.findCustomFood(query, unit);
        result = cachedFood ? (cachedFood as unknown as FoodInfo) : null;
      }

      // 3. INTEGRAÇÃO GEMINI 2.0 FLASH (IA Generativa)
      if (!result) {
        console.log("Solicitando inteligência ao Gemini 2.0 Flash...");
        result = await GeminiService.fetchNutrition(query) as FoodInfo | null;
        
        if (result) {
          // Salva para evitar chamadas repetidas à API (Otimização de Cota)
          await DBService.saveCustomFood({
            ...result,
            unitGroup: unit,
            searchKey: query.toLowerCase().trim()
          });
        }
      }

      if (result) {
        let effectiveWeight = amount;

        // Lógica de conversão de unidades
        if (unit !== 'g' && result.conversions && result.conversions[unit]) {
          effectiveWeight = amount * result.conversions[unit];
        } else if (unit === 'un' && (!result.conversions || !result.conversions.un)) {
          effectiveWeight = amount * 100; // Fallback padrão para unidades
        }

        const factor = effectiveWeight / 100;

        // Cálculo Base
        let p = (result.proteinPer100g || 0) * factor;
        let c = (result.carbsPer100g || 0) * factor;
        let f = (result.fatsPer100g || 0) * factor;
        let sodium = (result.sodiumMg || 0) * factor;
        let fiber = (result.fiber || 0) * factor;
        let sugar = (result.sugarTotal || 0) * factor;

        // Lógica de Adição de Lipídios (Óleos)
        if (cookingMode === 'frito' || cookingMode === 'assado') {
          const addedOilMl = oilOption === 'custom' ? customOil : Number(oilOption);
          f += (addedOilMl * 0.92); 
        }

        // Lógica de Adição de Sódio (Sal)
        const addedSaltG = saltOption === 'custom' ? customSalt : Number(saltOption);
        sodium += (addedSaltG * 387.5); 

        const cal = (p * 4) + (c * 4) + (f * 9);

        setPreview({ 
          name: `${result.name} (${cookingMode})`, 
          p, c, f, sodium, fiber, sugar, cal 
        });
      } else {
          alert("Alimento não encontrado. Tente ser mais específico para a IA.");
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

      // Persistência no Histórico do Usuário
      await DBService.saveMeal(uid, mealData);
      
      // Sincronização com o Estado Global (Zustand)
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
    <div style={containerStyle}>
      <div style={glassCardStyle}>
        <div style={badgeStyle}>
          <span style={badgeIcon}>🛡️</span> SEGURANÇA ATIVA (BCRYPT)
        </div>
        
        <h2 style={cardTitleStyle}>NOVO ALIMENTO V2</h2>
        
        <div style={formVertical}>
          <input 
            type="text" 
            placeholder="Ex: Peito de Frango, Pizza, Whey..." 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setPreview(null); }} 
            style={mainInputStyle} 
          />

          <div style={responsiveRow}>
            <div style={weightInputGroup}>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))} 
                style={weightInputStyle} 
              />
            </div>
            <select value={unit} onChange={(e) => { setUnit(e.target.value as any); setPreview(null); }} style={unitSelectStyle}>
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="un">Unidade (un)</option>
            </select>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>MÉTODO DE PREPARO</label>
            <select value={cookingMode} onChange={(e) => setCookingMode(e.target.value)} style={selectStyle}>
              <option value="natural">Grelhado / Natural / Cru</option>
              <option value="cozido">Cozido em Água</option>
              <option value="assado">Assado</option>
              <option value="frito">Frito / Imersão</option>
            </select>
          </div>

          {(cookingMode === 'frito' || cookingMode === 'assado') && (
            <div style={sectionStyle}>
              <label style={labelStyle}>ADICIONAR ÓLEO (ML)</label>
              <div style={formGroup}>
                <select value={oilOption} onChange={(e) => setOilOption(e.target.value)} style={selectStyle}>
                  <option value="0">Sem Óleo</option>
                  <option value="2">2ml (Fio)</option>
                  <option value="5">5ml (1 colher chá)</option>
                  <option value="12">12ml (1 colher sopa)</option>
                  <option value="custom">Outro...</option>
                </select>
                {oilOption === 'custom' && (
                  <input type="number" placeholder="ml" onChange={(e) => setCustomOil(Number(e.target.value))} style={customInput} />
                )}
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <label style={labelStyle}>SAL ADICIONADO (G)</label>
            <div style={formGroup}>
              <select value={saltOption} onChange={(e) => setSaltOption(e.target.value)} style={selectStyle}>
                <option value="0">Sem Sal</option>
                <option value="0.5">0.5g (Pitada)</option>
                <option value="1.5">1.5g (Sachê)</option>
                <option value="custom">Outro...</option>
              </select>
              {saltOption === 'custom' && (
                <input type="number" placeholder="g" onChange={(e) => setCustomSalt(Number(e.target.value))} style={customInput} />
              )}
            </div>
          </div>

          <button onClick={handleCalculate} disabled={loading || query.length < 2} style={searchButton}>
            {loading ? 'ANALISANDO COM IA...' : 'CALCULAR NUTRIENTES'}
          </button>
        </div>

        {preview && (
          <div style={previewArea}>
            <p style={foodTitle}>{preview.name.toUpperCase()}</p>
            <div style={macroGrid}>
              <div style={macroItem}><span style={pColor}>PROT</span><strong style={macroValue}>{formatValue(preview.p)}g</strong></div>
              <div style={macroItem}><span style={cColor}>CARB</span><strong style={macroValue}>{formatValue(preview.c)}g</strong></div>
              <div style={macroItem}><span style={fColor}>GORD</span><strong style={macroValue}>{formatValue(preview.f)}g</strong></div>
            </div>
            <div style={microGrid}>
              <div style={microItem}><label style={microLabel}>Sódio</label><span style={microValue}>{formatValue(preview.sodium, 0)}mg</span></div>
              <div style={microItem}><label style={microLabel}>Fibra</label><span style={microValue}>{formatValue(preview.fiber)}g</span></div>
              <div style={microItem}><label style={microLabel}>Açúcar</label><span style={microValue}>{formatValue(preview.sugar)}g</span></div>
            </div>
            <button onClick={handleAddFood} disabled={loading} style={addButton}>
              {loading ? 'SALVANDO...' : `ADICIONAR ${formatValue(preview.cal, 0)} KCAL`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS (Mantendo sua identidade visual Dark/Cyber) ---
const containerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', padding: '10px', width: '100%', boxSizing: 'border-box' };
const glassCardStyle: React.CSSProperties = { background: '#050505', border: '1px solid #111', borderRadius: '35px', padding: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', position: 'relative' };
const badgeStyle: React.CSSProperties = { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#00f2fe15', border: '1px solid #00f2fe', color: '#00f2fe', padding: '5px 15px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' };
const badgeIcon: React.CSSProperties = { fontSize: '12px' };
const cardTitleStyle: React.CSSProperties = { fontSize: '14px', fontWeight: '900', marginBottom: '25px', color: '#fff', textAlign: 'center', letterSpacing: '2px', marginTop: '10px' };
const formVertical: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const responsiveRow: React.CSSProperties = { display: 'flex', gap: '12px' };
const mainInputStyle: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '15px', border: '1px solid #1a1a1a', background: '#0a0a0a', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const weightInputGroup: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', background: '#0a0a0a', borderRadius: '15px', padding: '0 15px', border: '1px solid #1a1a1a' };
const weightInputStyle: React.CSSProperties = { width: '100%', background: 'transparent', border: 'none', color: '#00f2fe', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', outline: 'none' };
const unitSelectStyle: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '15px', background: '#0a0a0a', color: '#00f2fe', border: '1px solid #1a1a1a', fontWeight: 'bold', outline: 'none', cursor: 'pointer' };
const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '10px', color: '#888', fontWeight: '900', letterSpacing: '1px' };
const selectStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '15px', background: '#0a0a0a', color: '#eee', border: '1px solid #1a1a1a', outline: 'none', cursor: 'pointer' };
const formGroup: React.CSSProperties = { display: 'flex', gap: '10px' };
const customInput: React.CSSProperties = { width: '80px', padding: '12px', borderRadius: '12px', background: '#0a0a0a', color: '#00f2fe', border: '1px solid #1a1a1a', textAlign: 'center', fontWeight: 'bold' };
const searchButton: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px', fontSize: '13px' };
const previewArea: React.CSSProperties = { marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #111', textAlign: 'center' };
const foodTitle: React.CSSProperties = { color: '#00f2fe', fontWeight: '950', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px' };
const macroGrid: React.CSSProperties = { display: 'flex', justifyContent: 'space-around', marginBottom: '25px' };
const macroItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' };
const macroValue: React.CSSProperties = { color: '#fff', fontSize: '16px' };
const pColor: React.CSSProperties = { color: '#4ade80', fontSize: '10px', fontWeight: '900' };
const cColor: React.CSSProperties = { color: '#fbbf24', fontSize: '10px', fontWeight: '900' };
const fColor: React.CSSProperties = { color: '#f87171', fontSize: '10px', fontWeight: '900' };
const microGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px', background: '#030303', padding: '15px', borderRadius: '20px', border: '1px solid #0f0f0f' };
const microItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
const microLabel: React.CSSProperties = { color: '#666', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' };
const microValue: React.CSSProperties = { color: '#ddd', fontSize: '12px', fontWeight: '700' };
const addButton: React.CSSProperties = { width: '100%', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '950', fontSize: '14px' };

export default NutritionPanel;