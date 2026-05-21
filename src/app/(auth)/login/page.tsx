'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/channels/me';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      });
      if (!res || res.error) {
        setError('Invalid email or password.');
        return;
      }
      router.push(res.url ?? callbackUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-semibold text-zinc-50">
        Welcome back
      </h1>
      <p className="mb-6 text-center text-sm text-zinc-400">
        We&apos;re so excited to see you again!
      </p>

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
            Password
          </label>
          <Input
            type="password"
            required
            autoComplete="current-password"
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
          {submitting ? 'Signing in...' : 'Log In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Need an account?{' '}
        <Link
          href="/register"
          className="text-discord-accent hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
