import React, { useState } from 'react';
import { DBService } from '../../../services/db';

interface LoginProps {
  onLogin: (credentials: any) => void;
  onGoToRegister: () => void;
}

const LoginForm: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      if (isRecovering) {
        await DBService.sendPasswordReset(email);
        setStatusMsg({ 
          type: 'success', 
          text: 'Link enviado com sucesso! Verifique sua caixa de entrada e spam.' 
        });
        setPassword('');
      } else {
        await onLogin({ email, password });
      }
    } catch (error: any) {
      console.error("Erro no formulário:", error);
      let message = 'Ocorreu um erro inesperado.';

      if (error.code?.includes('error-code:-26') || error.message?.includes('503')) {
        message = 'Serviço de e-mail indisponível. Verifique o Console do Firebase.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'E-mail não cadastrado em nossa base.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta. Tente novamente.';
      }

      setStatusMsg({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStyle = (id: string) => ({
    ...inputStyle,
    borderColor: focused === id ? '#00f2fe' : '#1a1a1a',
    boxShadow: focused === id ? '0 0 15px rgba(0, 242, 254, 0.1)' : 'none',
    opacity: isSubmitting ? 0.6 : 1,
  });

  return (
    <>
      <header style={headerStyle}>
        <div style={logoBadge}>DF</div>
        <h2 style={titleStyle}>{isRecovering ? 'Recuperar Acesso' : 'Bem-vindo'}</h2>
        <p style={subtitleStyle}>
          {isRecovering 
            ? 'Digite seu e-mail para receber o link de redefinição' 
            : 'Acesse sua conta para continuar sua jornada'}
        </p>
      </header>

      {statusMsg && (
        <div style={{
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '20px',
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'center',
          backgroundColor: statusMsg.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          color: statusMsg.type === 'success' ? '#4ade80' : '#f87171',
          border: `1px solid ${statusMsg.type === 'success' ? '#4ade8033' : '#f8717133'}`,
        }}>
          {statusMsg.text}
        </div>
      )}

      <form style={formStyle} onSubmit={handleSubmit}>
        <div style={inputGroup}>
          <label style={labelStyle}>E-MAIL</label>
          <input 
            type="email" 
            placeholder="seu@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={getStyle('email')}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            disabled={isSubmitting}
            required 
          />
        </div>

        {!isRecovering && (
          <div style={inputGroup}>
            <label style={labelStyle}>SENHA</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={getStyle('password')}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              disabled={isSubmitting}
              required 
            />
            {/* Link de esqueci a senha posicionado abaixo do input */}
            <div style={{ textAlign: 'right', marginTop: '4px' }}>
              <span 
                onClick={() => { setIsRecovering(true); setStatusMsg(null); }}
                style={forgotLinkStyle}
              >
                Esqueceu a senha?
              </span>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          style={{
            ...primaryButton,
            background: isRecovering 
              ? 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)' 
              : 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
            color: isRecovering ? '#00f2fe' : '#000',
            border: isRecovering ? '1px solid #00f2fe33' : 'none',
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'PROCESSANDO...' : (isRecovering ? 'ENVIAR LINK DE RESGATE' : 'ENTRAR NA CONTA')}
        </button>

        {isRecovering && (
          <button 
            type="button" 
            onClick={() => { setIsRecovering(false); setStatusMsg(null); }}
            style={backButtonStyle}
          >
            ← Voltar para o Login
          </button>
        )}
      </form>

      {!isRecovering && (
        <footer style={{ marginTop: '30px', textAlign: 'center' }}>
          <button onClick={onGoToRegister} style={linkButton} disabled={isSubmitting}>
            Não tem conta? <span style={{ color: '#00f2fe', fontWeight: '900' }}>Registre-se</span>
          </button>
        </footer>
      )}
    </>
  );
};

// --- ESTILOS ATUALIZADOS ---
const headerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '40px' };
const logoBadge: React.CSSProperties = { width: '60px', height: '60px', background: '#fff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', margin: '0 auto 24px', fontSize: '24px' };
const titleStyle: React.CSSProperties = { color: '#fff', fontSize: '28px', fontWeight: '800' };
const subtitleStyle: React.CSSProperties = { color: '#555', fontSize: '14px', marginTop: '8px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '22px' };
const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: '900', color: '#333', letterSpacing: '1.5px', marginLeft: '4px' };
const inputStyle: React.CSSProperties = { background: '#080808', border: '1px solid #151515', borderRadius: '18px', padding: '18px 22px', color: '#fff', outline: 'none', transition: 'all 0.3s ease' };
const primaryButton: React.CSSProperties = { padding: '20px', borderRadius: '18px', fontWeight: '950', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', marginTop: '10px' };
const linkButton: React.CSSProperties = { background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' };
const backButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#555', fontSize: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '15px' };

// Estilo melhorado para o "Esqueceu a senha?"
const forgotLinkStyle: React.CSSProperties = { 
  fontSize: '12px', 
  fontWeight: '700', 
  color: '#888', 
  cursor: 'pointer',
  transition: 'color 0.2s',
  padding: '4px 8px'
};

export default LoginForm;