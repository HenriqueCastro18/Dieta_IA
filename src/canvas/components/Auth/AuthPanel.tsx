import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { DBLite } from '../../../services/db';

interface AuthPanelProps {
  onLogin: (userData: any) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ onLogin }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = (credentials: any) => {
    try {
      const user = DBLite.validateLogin(credentials);
      onLogin(user);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegister = (userData: any) => {
    try {
      DBLite.saveUser(userData);
      alert("Conta criada com sucesso! Agora pode fazer login.");
      setIsFlipped(false);
    } catch (err: any) {
      alert(err.message);
    }
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

          /* CONFIGURAÇÃO BASE DO CARTÃO */
          .auth-card {
            width: 100%;
            max-width: 440px;
            background: rgba(12, 12, 12, 0.85);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 50px 100px rgba(0, 0, 0, 0.9);
            overflow: hidden; /* Remove scroll do cartão */
          }

          /* AJUSTES PARA ECRÃS PEQUENOS OU BAIXOS (MOBILE/TECLADO ABERTO) */
          @media (max-height: 780px), (max-width: 480px) {
            .auth-card { border-radius: 24px; max-width: 380px; }
            .auth-form-inner { padding: 30px 30px !important; }
            .auth-logo { width: 45px !important; height: 45px !important; margin-bottom: 15px !important; font-size: 18px !important; }
            .auth-title { font-size: 22px !important; }
            .auth-subtitle { font-size: 12px !important; margin-top: 4px !important; }
            .auth-input-group { gap: 4px !important; }
            .auth-input { padding: 12px 16px !important; font-size: 14px !important; border-radius: 12px !important; }
            .auth-btn { padding: 15px !important; margin-top: 5px !important; border-radius: 12px !important; font-size: 14px !important; }
            footer { margin-top: 20px !important; }
          }

          /* AJUSTE EXTREMO (Para quando o teclado ocupa quase tudo) */
          @media (max-height: 600px) {
            .auth-subtitle { display: none; }
            .auth-form-inner { padding: 20px 25px !important; }
            header { margin-bottom: 15px !important; }
          }
        `}
      </style>
    </div>
  );
};

const authWrapper: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 20,
  padding: '20px',
};

const glassCard: React.CSSProperties = {
  position: 'relative',
};

const formContent: React.CSSProperties = {
  padding: '60px 50px',
};

export default AuthPanel;