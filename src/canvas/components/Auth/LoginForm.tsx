import React, { useState } from 'react';

interface LoginProps {
  onLogin: (credentials: any) => void;
  onGoToRegister: () => void;
}

const LoginForm: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Envia o objeto com os dados para o AuthPanel/DBLite
    onLogin({ email, password });
  };

  const getStyle = (id: string) => ({
    ...inputStyle,
    borderColor: focused === id ? '#fff' : '#1a1a1a',
    boxShadow: focused === id ? '0 0 0 1px #fff' : 'none',
  });

  return (
    <>
      <header style={headerStyle}>
        <div style={logoBadge}>DF</div>
        <h2 style={titleStyle}>Bem-vindo</h2>
        <p style={subtitleStyle}>Acesse sua conta para continuar</p>
      </header>

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
            required 
          />
        </div>
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
            required 
          />
        </div>

        <button type="submit" style={primaryButton}>
          ENTRAR NA CONTA
        </button>
      </form>

      <footer style={{ marginTop: '30px', textAlign: 'center' }}>
        <button onClick={onGoToRegister} style={linkButton}>
          Não tem conta? <span style={{ color: '#fff' }}>Registe-se</span>
        </button>
      </footer>
    </>
  );
};

// --- ESTILOS (Mantendo o seu padrão visual) ---
const headerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '40px' };
const logoBadge: React.CSSProperties = { width: '56px', height: '56px', background: '#fff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', margin: '0 auto 24px', fontSize: '22px' };
const titleStyle: React.CSSProperties = { color: '#fff', fontSize: '28px', fontWeight: '800' };
const subtitleStyle: React.CSSProperties = { color: '#666', fontSize: '14px', marginTop: '8px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '800', color: '#444', marginLeft: '4px', letterSpacing: '1px' };
const inputStyle: React.CSSProperties = { background: '#050505', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '16px 20px', color: '#fff', outline: 'none', transition: 'all 0.2s' };
const primaryButton: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' };
const linkButton: React.CSSProperties = { background: 'none', border: 'none', color: '#444', fontSize: '13px', cursor: 'pointer' };

export default LoginForm;