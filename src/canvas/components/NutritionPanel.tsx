import React, { useState } from 'react';
import { useDietStore } from '../../store/useDietStore';
import { fetchFoodData } from '../../data/apiService';

export const NutritionPanel: React.FC = () => {
  const addFood = useDietStore((state) => state.addFood);
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState<number>(100);
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
    const result = await fetchFoodData(query);
    
    if (result) {
      const factor = grams / 100;
      let p = result.proteinPer100g * factor;
      let c = result.carbsPer100g * factor;
      let f = result.fatsPer100g * factor;
      let sodium = result.sodiumMg * factor;
      let fiber = result.fiber * factor;
      let sugar = result.sugarTotal * factor;

      if (cookingMode === 'frito' || cookingMode === 'assado') {
        const addedOil = oilOption === 'custom' ? customOil : Number(oilOption);
        f += addedOil; 
      }

      const addedSalt = saltOption === 'custom' ? customSalt : Number(saltOption);
      sodium += (addedSalt * 387.58); 

      const cal = (p * 4) + (c * 4) + (f * 9);

      setPreview({ 
        name: `${result.name} (${cookingMode})`, 
        p, c, f, sodium, fiber, sugar, cal 
      });
    }
    setLoading(false);
  };

  const handleAddFood = () => {
    if (!preview) return;

    // Envia o objeto com os nomes de propriedades que o Store/Summary esperam
    addFood({
      name: preview.name,
      proteins: preview.p,
      carbs: preview.c,
      fats: preview.f,
      calories: preview.cal,
      sodium: preview.sodium,
      fiber: preview.fiber,
      sugar: preview.sugar,
      timestamp: Date.now()
    });

    setPreview(null);
    setQuery('');
  };

  return (
    <div style={containerStyle}>
      <div style={glassCardStyle}>
        <h2 style={cardTitleStyle}>Novo Alimento</h2>
        
        <div style={formVertical}>
          <div style={responsiveRow}>
            <input 
              type="text" 
              placeholder="Ex: Frango Grelhado..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={mainInputStyle} 
            />
            <div style={weightInputGroup}>
              <input 
                type="number" 
                value={grams} 
                onChange={(e) => setGrams(Number(e.target.value))} 
                style={weightInputStyle} 
              />
              <span style={unitLabel}>g</span>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>MODO DE PREPARO</label>
            <select value={cookingMode} onChange={(e) => setCookingMode(e.target.value)} style={selectStyle}>
              <option value="natural">Grelhado / Natural / Cru</option>
              <option value="cozido">Cozido em Água</option>
              <option value="assado">Assado</option>
              <option value="frito">Frito</option>
            </select>
          </div>

          {(cookingMode === 'frito' || cookingMode === 'assado') && (
            <div style={sectionStyle}>
              <label style={labelStyle}>ADICIONAR ÓLEO (ML)</label>
              <div style={formGroup}>
                <select value={oilOption} onChange={(e) => setOilOption(e.target.value)} style={selectStyle}>
                  <option value="0">Sem Óleo</option>
                  <option value="2">2ml (Pouco)</option>
                  <option value="5">5ml (Médio)</option>
                  <option value="custom">Personalizado...</option>
                </select>
                {oilOption === 'custom' && <input type="number" placeholder="ml" onChange={(e) => setCustomOil(Number(e.target.value))} style={customInput} />}
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <label style={labelStyle}>ADICIONAR SAL (G)</label>
            <div style={formGroup}>
              <select value={saltOption} onChange={(e) => setSaltOption(e.target.value)} style={selectStyle}>
                <option value="0">Sem Sal</option>
                <option value="0.5">0.5g (Pitada)</option>
                <option value="1.5">1.5g (Médio)</option>
                <option value="custom">Personalizado...</option>
              </select>
              {saltOption === 'custom' && <input type="number" placeholder="g" onChange={(e) => setCustomSalt(Number(e.target.value))} style={customInput} />}
            </div>
          </div>

          <button onClick={handleCalculate} disabled={loading} style={searchButton}>
            {loading ? 'Calculando...' : 'Calcular Nutrientes'}
          </button>
        </div>

        {preview && (
          <div style={previewArea}>
            <p style={foodTitle}>{preview.name}</p>
            
            <div style={macroGrid}>
              <div style={macroItem}><span style={pColor}>P</span><strong>{formatValue(preview.p)}g</strong></div>
              <div style={macroItem}><span style={cColor}>C</span><strong>{formatValue(preview.c)}g</strong></div>
              <div style={macroItem}><span style={fColor}>G</span><strong>{formatValue(preview.f)}g</strong></div>
            </div>

            <div style={microGrid}>
              <div style={microItem}><label style={microLabel}>Sódio</label><span>{formatValue(preview.sodium, 0)}mg</span></div>
              <div style={microItem}><label style={microLabel}>Fibra</label><span>{formatValue(preview.fiber)}g</span></div>
              <div style={microItem}><label style={microLabel}>Açúcar</label><span>{formatValue(preview.sugar)}g</span></div>
            </div>

            <button onClick={handleAddFood} style={addButton}>
              Adicionar {formatValue(preview.cal, 0)} kcal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Estilos mantidos do seu original
const containerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', padding: '20px', width: '100%', boxSizing: 'border-box' };
const glassCardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #333', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const cardTitleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#eee', textAlign: 'center' };
const formVertical: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
const responsiveRow: React.CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap' };
const mainInputStyle: React.CSSProperties = { flex: '2 1 180px', padding: '14px', borderRadius: '12px', border: '1px solid #333', background: '#1a1a1a', color: 'white', outline: 'none' };
const weightInputGroup: React.CSSProperties = { flex: '1 1 80px', display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: '12px', padding: '0 12px', border: '1px solid #333' };
const weightInputStyle: React.CSSProperties = { width: '100%', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '16px', outline: 'none' };
const unitLabel: React.CSSProperties = { color: '#666', fontSize: '14px' };
const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#888', fontWeight: 'bold', letterSpacing: '0.5px' };
const selectStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '12px', background: '#1a1a1a', color: 'white', border: '1px solid #333', appearance: 'none' };
const formGroup: React.CSSProperties = { display: 'flex', gap: '10px' };
const customInput: React.CSSProperties = { width: '70px', padding: '10px', borderRadius: '10px', background: '#222', color: '#fff', border: '1px solid #444', textAlign: 'center' };
const searchButton: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.2s' };
const previewArea: React.CSSProperties = { marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #333', textAlign: 'center' };
const foodTitle: React.CSSProperties = { color: '#3498db', fontWeight: 'bold', fontSize: '20px', marginBottom: '16px' };
const macroGrid: React.CSSProperties = { display: 'flex', justifyContent: 'space-around', marginBottom: '20px' };
const macroItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '18px' };
const pColor: React.CSSProperties = { color: '#2ecc71', fontSize: '12px', fontWeight: 'bold' };
const cColor: React.CSSProperties = { color: '#f1c40f', fontSize: '12px', fontWeight: 'bold' };
const fColor: React.CSSProperties = { color: '#e74c3c', fontSize: '12px', fontWeight: 'bold' };
const microGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' };
const microItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: '13px' };
const microLabel: React.CSSProperties = { color: '#555', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' };
const addButton: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '12px', background: '#3498db', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };