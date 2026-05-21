'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? 'Registration failed.');
        return;
      }

      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/channels/me'
      });

      if (!signInRes || signInRes.error) {
        setError('Account created but sign-in failed. Please try logging in.');
        return;
      }

      router.push(signInRes.url ?? '/channels/me');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-50">
        Create an account
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Email
          </label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Username
          </label>
          <Input
            required
            minLength={2}
            maxLength={32}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Password
          </label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting}
        >
          {submitting ? 'Creating account...' : 'Continue'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="text-discord-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
