import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';

interface MFAProps {
  user: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MFAOverlay: React.FC<MFAProps> = ({ user, onSuccess, onCancel }) => {
  const [inputCode, setInputCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  
  // --- NOVOS ESTADOS PARA PROTEÇÃO CONTRA FORÇA BRUTA ---
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const timerRef = useRef<any>(null);
  const hasSentFirstCode = useRef(false);

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // Verifica se há um bloqueio ativo ao carregar
  useEffect(() => {
    const savedLockout = localStorage.getItem(`lockout_${user.email}`);
    if (savedLockout) {
      const expiration = parseInt(savedLockout);
      if (Date.now() < expiration) {
        setLockoutTime(expiration);
      } else {
        localStorage.removeItem(`lockout_${user.email}`);
      }
    }
  }, [user.email]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(120);
    setIsExpired(false);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsExpired(true);
          setGeneratedCode(''); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendSecurityCode = async (isManual = false) => {
    if (lockoutTime && Date.now() < lockoutTime) return;
    if (!isManual && hasSentFirstCode.current) return;
    if (!isManual) hasSentFirstCode.current = true;

    setIsSending(true);
    setError(false);
    setIsExpired(false);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        to_name: user.name || "Usuário",
        to_email: user.email,
        otp_code: code,
      }, PUBLIC_KEY);
      setLoading(false);
      startTimer();
    } catch (err) {
      onCancel();
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (user?.email) sendSecurityCode(false);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [user]);

  const handleVerify = () => {
    if (lockoutTime && Date.now() < lockoutTime) return;

    if (isExpired || timeLeft === 0) {
      alert("Código expirado!");
      sendSecurityCode(true);
      return;
    }

    if (inputCode === generatedCode) {
      // Sucesso: Limpa tentativas e bloqueios
      localStorage.removeItem(`lockout_${user.email}`);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);
      setInputCode('');

      if (newAttempts >= 3) {
        const duration = 5 * 60 * 1000; // 5 minutos de bloqueio
        const expireAt = Date.now() + duration;
        setLockoutTime(expireAt);
        localStorage.setItem(`lockout_${user.email}`, expireAt.toString());
      }
    }
  };

  // Se estiver bloqueado, mostra tela de espera
  if (lockoutTime && Date.now() < lockoutTime) {
    const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <span style={{ fontSize: '40px' }}>🚫</span>
          <h2 style={{ color: '#ff4444' }}>Acesso Bloqueado</h2>
          <p style={{ color: '#888', textAlign: 'center' }}>
            Muitas tentativas incorretas. <br/> Por segurança, tente novamente em:
          </p>
          <div style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>
            {formatTime(remainingSeconds)}
          </div>
          <button onClick={onCancel} style={styles.btnExit}>VOLTAR AO LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.overlay}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={styles.modal}>
        <span style={{ fontSize: '40px' }}>📧</span>
        <h2 style={{ color: '#fff', margin: '10px 0', fontSize: '20px' }}>Verificação 2FA</h2>
        
        {loading ? (
          <p style={{ color: '#888', fontSize: '12px' }}>ENVIANDO CÓDIGO...</p>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
              Código enviado para: <strong style={{ color: '#00f2fe' }}>{user.email}</strong>
            </p>

            <div style={{ color: timeLeft < 30 ? '#ff4444' : '#00f2fe', fontSize: '14px', fontWeight: 'bold' }}>
              Expira em: {formatTime(timeLeft)}
            </div>

            <input
              type="text" maxLength={6} placeholder="000000"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ""))}
              style={{ ...styles.pinInput, borderColor: error ? '#ff4444' : '#222' }}
            />

            {error && <p style={{ color: '#ff4444', fontSize: '11px' }}>Código incorreto! ({attempts}/3)</p>}

            <button onClick={handleVerify} disabled={isSending || inputCode.length < 6} style={styles.btnVerify}>
              {isExpired ? 'GERAR NOVO CÓDIGO' : 'CONFIRMAR ACESSO'}
            </button>

            <button onClick={() => sendSecurityCode(true)} disabled={isSending} style={styles.btnExit}>
              {isSending ? 'REENVIANDO...' : 'REENVIAR AGORA'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: '90%', maxWidth: '340px', background: '#0a0a0a', padding: '40px 30px', borderRadius: '32px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  pinInput: { background: '#111', border: '2px solid #222', borderRadius: '12px', padding: '15px', color: '#fff', fontSize: '24px', textAlign: 'center', letterSpacing: '5px', width: '180px', outline: 'none' },
  btnVerify: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#00f2fe', color: '#000', fontWeight: '900', cursor: 'pointer' },
  btnExit: { background: 'transparent', color: '#00f2fe', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }
};