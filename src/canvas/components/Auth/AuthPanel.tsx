import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { DBService } from '../../../services/db';

interface AuthPanelProps {
  onLogin: (userData: any) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ onLogin }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (credentials: any) => {
    const { email } = credentials;
    setLoading(true);

    try {
      const user = await DBService.login(credentials);
      
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      console.error("Erro no login:", err);

      if (err.message && err.message.includes("BLOQUEADO|")) {
        const parts = err.message.split('|');
        const minutes = parseInt(parts[1]);
        setLockoutTime(Date.now() + (minutes * 60 * 1000));
        setBlockedEmail(email);
        return;
      }

      const isInvalidCredential = 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found';

      if (isInvalidCredential) {
        try {
          const result = await DBService.registerFailedAttempt(email);
          
          if (result && result.blocked) {
            setLockoutTime(Date.now() + (15 * 60 * 1000));
            setBlockedEmail(email);
          } else if (result) {
            alert(`Senha incorreta para ${email}. Tentativa ${result.attempts}/3`);
          }
        } catch (dbErr) {
          console.error("Erro ao registrar falha no Firestore:", dbErr);
        }
      } else {
        alert("Erro ao entrar: " + (err.message || "Verifique suas conexões"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData: any) => {
    setLoading(true);
    try {
      const newUser = await DBService.register(userData);
      if (newUser) {
        alert("Conta criada com sucesso!");
        setIsFlipped(false);
      }
    } catch (err: any) {
      console.error("Erro no registro:", err);
      alert("Erro ao criar conta: " + (err.message || "Verifique os dados"));
    } finally {
      setLoading(false);
    }
  };

  const resetLockoutVisual = () => {
    setLockoutTime(null);
    setBlockedEmail('');
  };

  if (!isMounted) return null;

  return (
    <div style={authWrapper}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={glassCard}
        className="auth-card"
      >
        {lockoutTime && Date.now() < lockoutTime && (
          <div style={lockoutOverlayStyle}>
             <span style={{ fontSize: '40px' }}>🚫</span>
             <h2 style={{ color: '#ff4444', margin: '15px 0', textAlign: 'center' }}>Acesso Suspenso</h2>
             <p style={{ color: '#888', textAlign: 'center', fontSize: '13px', lineHeight: '1.6' }}>
                O e-mail <b>{blockedEmail}</b> foi bloqueado por excesso de tentativas.<br/>
                Por segurança do <b>Smarko Security</b>, aguarde 15 minutos.
             </p>
             <button 
               onClick={resetLockoutVisual} 
               style={btnRetryStyle}
             >
               TENTAR OUTRO E-MAIL
             </button>
          </div>
        )}

        {loading && (
          <div style={loadingStyle}>
            <div className="spinner"></div>
            <span style={{ marginTop: '10px', fontSize: '10px', letterSpacing: '2px' }}>AUTENTICANDO...</span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {!isFlipped ? (
            <motion.div
              key="login-side"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={formContent}
              className="auth-form-inner"
            >
              <LoginForm 
                onLogin={handleLogin} 
                onGoToRegister={() => setIsFlipped(true)} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="register-side"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={formContent}
              className="auth-form-inner"
            >
              <RegisterForm 
                onRegister={handleRegister} 
                onGoToLogin={() => setIsFlipped(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>
        {`
          body { margin: 0; padding: 0; overflow: hidden; background: #000; }
          *:focus { outline: none !important; }
          .auth-card {
            width: 100%;
            max-width: 440px;
            background: rgba(12, 12, 12, 0.85);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 50px 100px rgba(0, 0, 0, 0.9);
            position: relative;
          }
          .spinner {
            width: 30px; height: 30px;
            border: 2px solid rgba(0, 242, 254, 0.1);
            border-top: 2px solid #00f2fe;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const authWrapper: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 20, padding: '20px',
};

const glassCard: React.CSSProperties = { position: 'relative' };
const formContent: React.CSSProperties = { padding: '60px 50px' };

const loadingStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  color: '#00f2fe', zIndex: 100, fontWeight: '900', backdropFilter: 'blur(12px)'
};

const lockoutOverlayStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(10, 10, 10, 0.96)',
  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  zIndex: 110, padding: '40px', backdropFilter: 'blur(20px)', borderRadius: '32px'
};

const btnRetryStyle: React.CSSProperties = {
  marginTop: '30px', background: '#fff', color: '#000', border: 'none',
  padding: '14px 28px', borderRadius: '14px', cursor: 'pointer',
  fontSize: '11px', fontWeight: '900', letterSpacing: '1px'
};

export default AuthPanel;