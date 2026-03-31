import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DBService } from '../../../services/db';
import { auth } from '../../../services/firebase';

interface ProfileProps {
  user: any;
  onSave: (data: any) => Promise<void> | void;
  onCancel: () => void;
  isFirstLogin?: boolean; 
}

export const ProfilePanel: React.FC<ProfileProps> = ({ user, onSave, onCancel, isFirstLogin = false }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    weight: user?.weight || user?.currentWeight || '', 
    goalCalories: user?.goalCalories || '2000',
    goalProtein: user?.goalProtein || '150',
    goalCarbs: user?.goalCarbs || '200',
    goalFat: user?.goalFat || '60',
    goalFiber: user?.goalFiber || '30',
    goalSodium: user?.goalSodium || '2300',
    goalWater: user?.goalWater ? (Number(user.goalWater) / 1000).toString() : '2.5'
  });

  const [errors, setErrors] = useState<{name?: boolean, weight?: boolean}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: false });
    }
  };


  const applySecurityUpgrade = async () => {
    try {
      const pinPadrao = "1234";
      const pinHash = await DBService.hashData(pinPadrao);
      
      console.log("🔐 Hash Gerado para o Firebase:", pinHash);

      return {
        securityPin: pinHash,
        mfaEnabled: user?.mfaEnabled || false,
        securityUpgraded: true,
        lastSecurityCheck: new Date().toISOString()
      };
    } catch (err) {
      console.error("Erro ao gerar Hash de segurança:", err);
      return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    const newErrors = {
      name: !formData.name.trim(),
      weight: !formData.weight || parseFloat(formData.weight.toString()) <= 0
    };

    if (newErrors.name || newErrors.weight) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const uid = user?.uid || user?.id || auth.currentUser?.uid;
      if (!uid) throw new Error("Usuário não autenticado");

      const dataToSave = {
        ...formData,
        weight: parseFloat(formData.weight.toString()),
        goalCalories: parseInt(formData.goalCalories.toString()),
        goalProtein: parseInt(formData.goalProtein.toString()),
        goalCarbs: parseInt(formData.goalCarbs.toString()),
        goalFat: parseInt(formData.goalFat.toString()),
        goalFiber: parseInt(formData.goalFiber.toString()),
        goalSodium: parseInt(formData.goalSodium.toString()),
        goalWater: Math.round(parseFloat(formData.goalWater.toString()) * 1000) 
      };

      const securityData = await applySecurityUpgrade();

      const finalUserObj = { 
        ...user, 
        ...dataToSave, 
        ...securityData, 
        uid: uid 
      };

      await DBService.updateProfile(uid, finalUserObj);

      await onSave(finalUserObj);
      
      if(!isFirstLogin) {
        alert("Perfil e Camada de Segurança (Hash) atualizados!");
      }

    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.overlayContainer}>
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={styles.cardStyle}
      >
        <div style={styles.dragHandle} />

        <header style={styles.headerStyle}>
          <div style={styles.avatarStyle}>{formData.name?.[0]?.toUpperCase() || 'H'}</div>
          <h2 style={styles.titleStyle}>
            {isFirstLogin ? 'Complete seu Perfil' : 'Configurações de Perfil'}
          </h2>
          <div style={styles.badgeSeguranca}>
             <span style={{ marginRight: '4px' }}>🛡️</span> SEGURANÇA ATIVA (BCRYPT)
          </div>
        </header>

        <form onSubmit={handleSubmit} style={styles.formScrollArea}>
          
          <div style={styles.sectionLabel}>DADOS OBRIGATÓRIOS</div>
          <div style={styles.inputGrid}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{...styles.labelStyle, color: errors.name ? '#ff4444' : '#555'}}>
                NOME {errors.name && '(OBRIGATÓRIO)'}
              </label>
              <input name="name" autoComplete="off" disabled={isSaving} style={{...styles.inputStyle, borderColor: errors.name ? '#ff4444' : '#222'}} value={formData.name} onChange={handleChange} placeholder="Seu nome" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{...styles.labelStyle, color: errors.weight ? '#ff4444' : '#555'}}>
                PESO ATUAL (KG) {errors.weight && '(OBRIGATÓRIO)'}
              </label>
              <input name="weight" type="number" step="0.1" disabled={isSaving} style={{...styles.inputStyle, borderColor: errors.weight ? '#ff4444' : '#222'}} value={formData.weight} onChange={handleChange} placeholder="Ex: 80.5" />
            </div>
          </div>

          <div style={styles.sectionLabel}>METAS DIÁRIAS (PADRÃO)</div>
          
          <div style={styles.singleInputGroup}>
            <label style={styles.labelStyle}>1. CALORIAS TOTAIS (KCAL)</label>
            <input name="goalCalories" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalCalories} onChange={handleChange} />
          </div>

          <div style={styles.inputGrid}>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>2. PROT. (G)</label>
              <input name="goalProtein" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalProtein} onChange={handleChange} />
            </div>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>3. CARB. (G)</label>
              <input name="goalCarbs" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalCarbs} onChange={handleChange} />
            </div>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>4. GORD. (G)</label>
              <input name="goalFat" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalFat} onChange={handleChange} />
            </div>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>5. FIBRA (G)</label>
              <input name="goalFiber" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalFiber} onChange={handleChange} />
            </div>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>6. SÓDIO (MG)</label>
              <input name="goalSodium" type="number" disabled={isSaving} style={styles.inputStyle} value={formData.goalSodium} onChange={handleChange} />
            </div>
            <div style={styles.gridItem}>
              <label style={styles.labelStyle}>ÁGUA (LITROS)</label>
              <div style={styles.inputWrapper}>
                <input name="goalWater" type="number" step="0.1" disabled={isSaving} style={styles.inputStyle} value={formData.goalWater} onChange={handleChange} placeholder="Ex: 2.5" />
                <span style={styles.inputSuffix}>L</span>
              </div>
            </div>
          </div>

          <div style={styles.footerActions}>
            {!isFirstLogin && (
              <button type="button" disabled={isSaving} onClick={onCancel} style={styles.btnCancel}>CANCELAR</button>
            )}
            <button type="submit" disabled={isSaving} style={{ ...styles.btnSave, flex: isFirstLogin ? 1 : 2, opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? 'SALVANDO...' : (isFirstLogin ? 'FINALIZAR CADASTRO' : 'SALVAR ALTERAÇÕES')}
            </button>
          </div>
        </form>
      </motion.div>

      <style>{`
        input:focus { border-color: #00f2fe !important; outline: none; }
        input:disabled { opacity: 0.5; cursor: not-allowed; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlayContainer: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.90)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(10px)' },
  cardStyle: { width: '100%', maxWidth: '500px', background: '#080808', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a', borderBottom: 'none' },
  dragHandle: { width: '40px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 15px' },
  headerStyle: { textAlign: 'center', marginBottom: '20px' },
  titleStyle: { fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0 },
  badgeSeguranca: { display: 'inline-block', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', marginTop: '10px', border: '1px solid rgba(0, 242, 254, 0.3)' },
  avatarStyle: { width: '50px', height: '50px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', margin: '0 auto 10px' },
  formScrollArea: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' },
  sectionLabel: { fontSize: '11px', fontWeight: '900', color: '#00f2fe', letterSpacing: '1px', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' },
  inputGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  singleInputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  gridItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelStyle: { fontSize: '10px', color: '#555', fontWeight: '800', marginLeft: '4px' },
  inputStyle: { background: '#111', border: '1px solid #222', borderRadius: '14px', padding: '14px', color: '#fff', fontSize: '16px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputSuffix: { position: 'absolute', right: '15px', color: '#444', fontWeight: '900', fontSize: '14px' },
  footerActions: { display: 'flex', gap: '10px', marginTop: '10px', padding: '10px 0' },
  btnSave: { background: '#fff', color: '#000', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' },
  btnCancel: { flex: 1, background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '16px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }
};