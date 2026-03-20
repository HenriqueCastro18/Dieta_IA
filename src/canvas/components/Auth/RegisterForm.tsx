import React, { useState } from 'react';

interface RegisterProps {
  onRegister: (userData: any) => void;
  onGoToLogin: () => void;
}

const RegisterForm: React.FC<RegisterProps> = ({ onRegister, onGoToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass !== confirm) return alert("As senhas não coincidem!");
    onRegister({ name, email, password: pass });
  };

  const getStyle = (id: string) => ({
    ...inputStyle,
    borderColor: focused === id ? '#fff' : '#1a1a1a',
    boxShadow: focused === id ? '0 0 0 1px #fff' : 'none',
  });

  return (
    <div className="auth-form-inner" style={{ display: 'flex', flexDirection: 'column' }}>
      <header style={headerStyle}>
        <div className="auth-logo" style={logoBadge}>DF</div>
        <h2 className="auth-title" style={titleStyle}>Criar Conta</h2>
        <p className="auth-subtitle" style={subtitleStyle}>Comece sua transformação hoje</p>
      </header>

      <form style={formStyle} onSubmit={handleAction}>
        <div className="auth-input-group" style={inputGroup}>
          <label style={labelStyle}>NOME COMPLETO</label>
          <input 
            className="auth-input"
            type="text" 
            placeholder="Seu nome" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={getStyle('name')}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            required 
          />
        </div>

        <div className="auth-input-group" style={inputGroup}>
          <label style={labelStyle}>E-MAIL</label>
          <input 
            className="auth-input"
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

        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="auth-input-group" style={inputGroup}>
            <label style={labelStyle}>SENHA</label>
            <input 
              className="auth-input"
              type="password" 
              placeholder="••••" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              style={getStyle('pass')}
              onFocus={() => setFocused('pass')}
              onBlur={() => setFocused(null)}
              required 
            />
          </div>
          <div className="auth-input-group" style={inputGroup}>
            <label style={labelStyle}>CONFIRMAR</label>
            <input 
              className="auth-input"
              type="password" 
              placeholder="••••" 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={getStyle('confirm')}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              required 
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" style={primaryButton}>
          CRIAR MINHA CONTA
        </button>
      </form>

      <footer style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={onGoToLogin} style={linkButton}>
          Já tem conta? <span style={{ color: '#fff' }}>Fazer Login</span>
        </button>
      </footer>
    </div>
  );
};

// --- ESTILOS REFINADOS ---
const headerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '25px' };
const logoBadge: React.CSSProperties = { width: '50px', height: '50px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', margin: '0 auto 15px', fontSize: '20px' };
const titleStyle: React.CSSProperties = { color: '#fff', fontSize: '24px', fontWeight: '800' };
const subtitleStyle: React.CSSProperties = { color: '#666', fontSize: '13px', marginTop: '4px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '14px' };
const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 };
const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: '800', color: '#444', marginLeft: '4px', letterSpacing: '1px' };
const inputStyle: React.CSSProperties = { background: '#050505', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '12px 18px', color: '#fff', outline: 'none', transition: 'all 0.2s', width: '100%' };
const primaryButton: React.CSSProperties = { background: '#fff', color: '#000', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' };
const linkButton: React.CSSProperties = { background: 'none', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer' };

export default RegisterForm;