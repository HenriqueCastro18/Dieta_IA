import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


export interface UserData {
    name: string;
    gender: 'Masculino' | 'Feminino' | 'Outro';
    weight: number;
    height: number;
    duration: number;
    isCustomDuration: boolean;
    splitType: 'AB' | 'ABC' | 'ABCD' | 'ABCDE' | 'ABCDEF' | 'PPL' | 'FULLBODY' | 'UPPER/LOWER';
    goal: 'Hipertrofia Agressiva' | 'Corte/Definição' | 'Recomposição' | 'Manutenção';
    level: 'Intermediário' | 'Avançado' | 'Atleta (Enhanced)';
    frequency: number;
    offDays: number[];
    limitations: string;
    focusMuscles: string;
    chemicalCockpit: { [key: string]: { qty?: string; mg?: string } };
}

export const UserSetupForm = ({ onSave, initialData, isCreating = false }: any) => {
    const [formData, setFormData] = useState<UserData>({
        name: initialData?.name || 'Atleta V8',
        gender: initialData?.gender || 'Masculino',
        duration: initialData?.duration || 60,
        isCustomDuration: false,
        weight: initialData?.weight || 74,
        height: initialData?.height || 175,
        goal: initialData?.goal || 'Hipertrofia Agressiva',
        level: initialData?.level || 'Avançado',
        splitType: initialData?.splitType || 'ABCDE',
        frequency: initialData?.frequency || 6,
        offDays: initialData?.offDays || [0],
        limitations: initialData?.limitations || '',
        focusMuscles: initialData?.focusMuscles || '',
        chemicalCockpit: initialData?.chemicalCockpit || {}
    });

    const muscleGroups = ["PEITO", "COSTAS", "OMBROS", "BÍCEPS", "TRÍCEPS", "QUADRÍCEPS", "POSTERIOR", "PANTURRILHA"];

    const supplementList = ["CREATINA", "ALBUMINA", "WHEY PROTEIN", "PRE-WORKOUT", "BETA-ALANINA"];
    const gearList = ["TESTOSTERONA", "DECA (NANDROLONA)", "TREMBOLONA", "BOLDENONA", "HEMOGENIN", "DIANABOL", "STANOZOLOL"];
    const cuttingList = ["MOUNJARO", "OZEMPIC", "CLEMBUTEROL", "T3 / T4", "OXANDROLONA"];

    const toggleTag = (currentValue: string, tag: string, field: 'limitations' | 'focusMuscles') => {
        const current = currentValue ? currentValue.split(', ') : [];
        const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
        setFormData({ ...formData, [field]: updated.join(', ') });
    };

    const isSelected = (fieldValue: string, tag: string) => fieldValue.split(', ').includes(tag);

    const updateDosage = (substance: string, key: 'qty' | 'mg', value: string) => {
        setFormData(prev => ({
            ...prev,
            chemicalCockpit: {
                ...prev.chemicalCockpit,
                [substance]: {
                    ...prev.chemicalCockpit[substance],
                    [key]: value
                }
            }
        }));
    };

    const handleSave = () => {
        const chemicalData = Object.entries(formData.chemicalCockpit)
            .filter(([name]) => formData.focusMuscles.includes(name))
            .map(([name, info]) => `${name}: ${info.qty || 'N/A'} - ${info.mg || 'N/A'}`)
            .join(' | ');

        const finalData = {
            ...formData,
            focusMuscles: `${formData.focusMuscles} [COCKPIT: ${chemicalData}]`,
            level: chemicalData.length > 0 ? 'Atleta (Enhanced)' : formData.level,
            recoverySpeed: chemicalData.length > 0 ? 'Ultra-Rápida' : 'Normal',
            intensity: 'Máxima RPE 10'
        };
        onSave(finalData);
    };

    return (
        <div className="setup-container">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="setup-sheet">
                <div className="handle" />
                <h2 className="setup-title">V8 ENGINE - COCKPIT FISIOLÓGICO</h2>

                <div className="form-grid">

                    {}
                    <div className="input-group full">
                        <label>ESTRUTURA DE DIVISÃO (SPLIT)</label>
                        <div className="split-grid">
                            {['AB', 'ABC', 'PPL', 'ABCD', 'ABCDE', 'ABCDEF', 'FULLBODY'].map(split => (
                                <button key={split}
                                    className={`split-btn ${formData.splitType === split ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, splitType: split as any })}>
                                    {split}
                                </button>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="input-group full">
                        <label>TEMPO DE TREINO (MINUTOS)</label>
                        <div className="duration-grid">
                            {[30, 60, 90].map(time => (
                                <button key={time}
                                    className={`duration-btn ${!formData.isCustomDuration && formData.duration === time ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, duration: time, isCustomDuration: false })}>
                                    {time} MIN
                                </button>
                            ))}

                            <div className={`custom-field-container ${formData.isCustomDuration ? 'active-custom' : ''}`}>
                                {!formData.isCustomDuration ? (
                                    <button className="duration-btn" onClick={() => setFormData({ ...formData, isCustomDuration: true })}>
                                        CUSTOM
                                    </button>
                                ) : (
                                    <div className="custom-input-wrapper">
                                        <input
                                            type="number"
                                            autoFocus
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                        />
                                        <span className="unit-label">MIN</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="input-group">
                        <label>ALTURA (CM)</label>
                        <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
                    </div>
                    <div className="input-group">
                        <label>PESO (KG)</label>
                        <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} />
                    </div>

                    {}
                    <div className="input-group full">
                        <label>GRUPOS PRIORITÁRIOS</label>
                        <div className="chip-group">
                            {muscleGroups.map(m => (
                                <button key={m} className={`chip muscle ${isSelected(formData.focusMuscles, m) ? 'active-muscle' : ''}`}
                                    onClick={() => toggleTag(formData.focusMuscles, m, 'focusMuscles')}>{m}</button>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="input-group full">
                        <label>COCKPIT QUÍMICO E SUPLEMENTAÇÃO (CLIQUE PARA EXPANDIR E DOSAR)</label>
                        <div className="chip-group">
                            <button className={`chip btn-suple ${isSelected(formData.focusMuscles, 'MENU_SUPLE') ? 'active-suple' : ''}`}
                                onClick={() => toggleTag(formData.focusMuscles, 'MENU_SUPLE', 'focusMuscles')}>+ SUPLEMENTOS</button>
                            <button className={`chip btn-gear ${isSelected(formData.focusMuscles, 'MENU_GEAR') ? 'active-gear' : ''}`}
                                onClick={() => toggleTag(formData.focusMuscles, 'MENU_GEAR', 'focusMuscles')}>+ ANABÓLICOS (BOMBA)</button>
                            <button className={`chip btn-cut ${isSelected(formData.focusMuscles, 'MENU_CUT') ? 'active-cut' : ''}`}
                                onClick={() => toggleTag(formData.focusMuscles, 'MENU_CUT', 'focusMuscles')}>+ EMAGRECIMENTO/CUT</button>
                        </div>
                    </div>

                    {}
                    <AnimatePresence>
                        {isSelected(formData.focusMuscles, 'MENU_SUPLE') && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sub-panel suple-border full">
                                <label>QUAIS SUPLEMENTOS E DOSAGEM SEMANAL?</label>
                                <div className="cockpit-dosage-grid">
                                    {supplementList.map(s => (
                                        <div key={s} className={`dosage-card ${isSelected(formData.focusMuscles, s) ? 'active-suple' : ''}`}>
                                            <button className="chip sub-chip" onClick={() => toggleTag(formData.focusMuscles, s, 'focusMuscles')}>{s}</button>
                                            {isSelected(formData.focusMuscles, s) && (
                                                <input type="text" placeholder="Qnt Semana (ex: 5g Dia)" value={formData.chemicalCockpit[s]?.qty || ''} onChange={(e) => updateDosage(s, 'qty', e.target.value)} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {}
                    <AnimatePresence>
                        {isSelected(formData.focusMuscles, 'MENU_GEAR') && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sub-panel gear-border full">
                                <label>QUAIS ERGOGÊNICOS ANABÓLICOS E DOSAGEM SEMANAL?</label>
                                <div className="cockpit-dosage-grid double-input">
                                    {gearList.map(g => (
                                        <div key={g} className={`dosage-card ${isSelected(formData.focusMuscles, g) ? 'active-gear' : ''}`}>
                                            {}
                                            <button className="chip substance-header" onClick={() => toggleTag(formData.focusMuscles, g, 'focusMuscles')}>
                                                {g}
                                            </button>

                                            {}
                                            {isSelected(formData.focusMuscles, g) && (
                                                <div className="dosage-inputs-grid">
                                                    <input type="text" placeholder="QNT" value={formData.chemicalCockpit[g]?.qty || ''} onChange={(e) => updateDosage(g, 'qty', e.target.value)} />
                                                    <input type="text" placeholder="MG" value={formData.chemicalCockpit[g]?.mg || ''} onChange={(e) => updateDosage(g, 'mg', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {}
                    <AnimatePresence>
                        {isSelected(formData.focusMuscles, 'MENU_CUT') && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sub-panel cut-border full">
                                <label>RECURSOS PARA DEFINIÇÃO/CUT E DOSAGEM DIÁRIA?</label>
                                <div className="cockpit-dosage-grid double-input">
                                    {cuttingList.map(c => (
                                        <div key={c} className={`dosage-card cut ${isSelected(formData.focusMuscles, c) ? 'active-cut' : ''}`}>
                                            <button className="chip sub-chip" onClick={() => toggleTag(formData.focusMuscles, c, 'focusMuscles')}>{c}</button>
                                            {isSelected(formData.focusMuscles, c) && (
                                                <div className="dosage-inputs">
                                                    <input type="text" placeholder="Frequência (ex: 3x CP Dia)" value={formData.chemicalCockpit[c]?.qty || ''} onChange={(e) => updateDosage(c, 'qty', e.target.value)} />
                                                    <input type="text" placeholder="Dosagem (ex: 10mg)" value={formData.chemicalCockpit[c]?.mg || ''} onChange={(e) => updateDosage(c, 'mg', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                <button className="save-btn" onClick={handleSave}>
                    ATUALIZAR CORE ENGINE ⚡
                </button>
            </motion.div>

            <style>{`
                .setup-container { position: fixed; inset: 0; background: rgba(0,0,0,0.98); z-index: 1000; display: flex; align-items: flex-end; backdrop-filter: blur(20px); }
                .setup-sheet { background: #000; width: 100%; padding: 25px; border-top: 1px solid #1a1a1a; border-radius: 30px 30px 0 0; max-height: 95vh; overflow-y: auto; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .full { grid-column: span 2; }
                
                h2 { font-size: 0.8rem; font-weight: 900; color: #fff; text-align: center; margin-bottom: 25px; letter-spacing: 2px; }

                .duration-grid, .split-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
                .duration-btn, .split-btn { background: #0a0a0a; border: 1px solid #1a1a1a; color: #444; padding: 12px 2px; border-radius: 10px; font-size: 0.55rem; font-weight: 900; cursor: pointer; }
                .active { border-color: #00f2fe !important; color: #00f2fe !important; }

                .chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
                .chip { background: #0a0a0a; border: 1px solid #1a1a1a; color: #555; padding: 8px 12px; border-radius: 8px; font-size: 0.6rem; font-weight: 800; cursor: pointer; }
                .active-muscle { background: #fff !important; color: #000 !important; }
                .active-suple { background: #00f2fe !important; color: #000 !important; }
                .active-gear { background: #7000ff !important; color: #fff !important; }
                .active-cut { background: #ffaa00 !important; color: #000 !important; }

                .sub-panel { padding: 15px; border-radius: 15px; margin-top: 5px; background: #050505; border: 1px dashed #222; }
                .suple-border { border-color: #00f2fe; }
                .gear-border { border-color: #7000ff; }
                .cut-border { border-color: #ffaa00; }
                .sub-panel label { color: #fff !important; font-size: 0.55rem !important; margin-bottom: 12px; }

                .cockpit-dosage-grid { 
                    display: grid; 
                    grid-template-columns: 1fr; 
                    gap: 15px; 
                }
                .cockpit-dosage-grid.double-input { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
                .dosage-card { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 10px; 
                    padding: 12px;
                    background: #080808;
                    border-radius: 14px;
                }

                .substance-header { 
                    width: 100%; 
                    padding: 10px !important; 
                    font-size: 0.7rem !important; 
                }

                .dosage-inputs-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 10px; 
                    width: 100%; 
                }

                .input-field {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .input-field label {
                    font-size: 0.45rem !important;
                    color: #7000ff !important;
                    margin: 0;
                    opacity: 0.8;
                }

                .dosage-card input { 
                    width: 100%;
                    background: #111; 
                    border: 1px solid #1a1a1a; 
                    padding: 10px; 
                    font-size: 0.7rem; 
                    border-radius: 8px;
                    text-align: center;
                }

                .cockpit-dosage-grid.double-input { 
                    grid-template-columns: 1fr; 
                    gap: 15px;
                }

                .dosage-card.gear.active-gear { border-color: #7000ff; background: rgba(112,0,255,0.05); }
                .dosage-card.cut.active-cut { border-color: #ffaa00; background: rgba(255,170,0,0.05); }

                .dosage-card .sub-chip { margin: 0; padding: 10px; }
                .dosage-card input { flex: 1; padding: 8px; font-size: 0.65rem; background: #111; border: 1px solid #1a1a1a; margin-top: 5px; }
                
                .dosage-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 1; width: 100%; }

                input { width: 100%; background: #0f0f0f; border: 1px solid #1a1a1a; padding: 12px; border-radius: 10px; color: #fff; font-weight: 900; }
                .save-btn { width: 100%; margin-top: 20px; padding: 22px; border-radius: 20px; background: #fff; color: #000; font-weight: 950; border: none; cursor: pointer; }
                label { display: block; font-size: 0.55rem; color: #00f2fe; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; }

                .custom-field-container {
                    height: 100%;
                    min-height: 45px;
                    display: flex;
                }

                .custom-input-wrapper {
                    position: relative;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    background: rgba(0, 242, 254, 0.05);
                    border: 1px solid #00f2fe;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
                    overflow: hidden;
                }

                .custom-input-wrapper input {
                    width: 100%;
                    height: 100% !important;
                    background: transparent !important;
                    border: none !important;
                    padding: 0 35px 0 10px !important; 
                    color: #00f2fe !important;
                    font-size: 0.8rem !important;
                    text-align: center;
                    margin: 0 !important;
                }

                .unit-label {
                    position: absolute;
                    right: 8px;
                    font-size: 0.5rem;
                    font-weight: 900;
                    color: #00f2fe;
                    opacity: 0.6;
                    pointer-events: none;
                }

                .active-custom {
                    animation: neon-pulse 1.5s infinite alternate;
                }

                @keyframes neon-pulse {
                    from { box-shadow: 0 0 5px rgba(0, 242, 254, 0.2); }
                    to { box-shadow: 0 0 15px rgba(0, 242, 254, 0.4); }
                }
            `}</style>
        </div>
    );
};