import type { AccountInfo } from '@ragidle/protocol';
import { type FormEvent, useState } from 'react';
import { authApi } from '../net/auth-api';

type Mode = 'login' | 'register';

export function AuthScreen({ onSignedIn }: { onSignedIn: (account: AccountInfo) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result =
      mode === 'login'
        ? await authApi.login({ email, password })
        : await authApi.register({ email, password, characterName });
    setPending(false);
    if (result.ok) onSignedIn(result.account);
    else setError(result.message);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="auth-screen">
      <form className="window auth-form" onSubmit={submit}>
        <h2>Ragnarok Idle</h2>
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'register' ? 8 : 1}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === 'register' && (
          <label>
            Character name
            <input
              autoComplete="off"
              required
              pattern="[A-Za-z0-9_]{4,23}"
              title="4 to 23 letters, digits or underscores"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
            />
          </label>
        )}
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={pending}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
