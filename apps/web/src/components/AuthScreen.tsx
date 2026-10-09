import type { AccountInfo } from '@ragidle/protocol';
import { Alert, Button, Field, Panel, Tabs, TextInput } from '@ragidle/ui';
import { type FormEvent, useState } from 'react';
import { authApi } from '../net/auth-api';

type Mode = 'login' | 'register';

const MODES: { id: Mode; label: string }[] = [
  { id: 'login', label: 'Sign in' },
  { id: 'register', label: 'Create account' },
];

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
    <div className="flex min-h-screen items-center justify-center bg-bg-deep p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center leading-none select-none">
          <span className="font-display text-4xl font-bold tracking-wide text-primary">
            Ragnarok
          </span>
          <span className="mt-1 font-display text-base font-semibold tracking-[0.5em] text-text">
            IDLE
          </span>
        </div>
        <Panel>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Tabs tabs={MODES} value={mode} onChange={switchMode} aria-label="Account" />
            <Field label="Email" htmlFor="auth-email">
              <TextInput
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="auth-password">
              <TextInput
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {mode === 'register' && (
              <Field label="Character name" htmlFor="auth-character">
                <TextInput
                  id="auth-character"
                  autoComplete="off"
                  required
                  pattern="[A-Za-z0-9_]{4,23}"
                  title="4 to 23 letters, digits or underscores"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                />
              </Field>
            )}
            {error && <Alert>{error}</Alert>}
            <Button type="submit" variant="primary" disabled={pending}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
