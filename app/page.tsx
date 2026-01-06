'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (status === 'loading') return;

    if (session?.user?.id) {
      // User is authenticated - use smart redirect
      try {
        const response = await fetch('/api/auth/redirect');
        if (response.ok) {
          const { redirectTo } = await response.json();
          router.push(redirectTo);
        } else {
          // Fallback to onboarding if API fails
          router.push('/onboarding');
        }
      } catch (error) {
        router.push('/onboarding');
      }
    } else {
      // User is not authenticated - redirect to sign in
      router.push('/auth/signin');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className=" px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-black hover:text-gray-700">
                How it Works
              </a>
              <a href="#" className="text-black hover:text-gray-700">
                Examples
              </a>
              <a href="#" className="text-black hover:text-gray-700">
                Blog
              </a>
              <a href="#" className="text-black hover:text-gray-700">
                Pricing
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-transparent border-black text-black hover:bg-black hover:text-white"
            >
              Book a call
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={handleGetStarted}
            >
              Get Started →
            </Button>
          </div>
        </div>
      </header>

      <main className="bg-white px-6 pt-16 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-100 text-xs px-3 py-1 rounded-full inline-block mb-8 text-gray-600">
            Free Blog Content Strategies
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Publish high-quality blog posts
            <br />
            that drive SEO traffic on autopilot
          </h1>

          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Blog Boast delivers well-researched, SEO-optimized blog posts every
            day,
            <br />
            driving high-intent traffic to your business while you sleep.
          </p>

          <Button
            className="bg-black text-white hover:bg-gray-800 text-lg px-8 py-3 mb-4"
            onClick={handleGetStarted}
          >
            Get Started →
          </Button>

          <p className="text-sm text-gray-600">
            Try 5 articles for just $1 - Upgrade later
          </p>
        </div>
      </main>

      <div className="bg-yellow-400 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
            <Image
              src="/screenshot.png"
              alt="AI-Powered Blog Setup interface showing progress steps and form fields"
              width={1000}
              height={600}
              className="w-full h-auto"
            />
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-2 mx-auto">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-black">
                Topic Planner
              </span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-2 mx-auto">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-black">Post Ideas</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-2 mx-auto">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-black">
                Post Editor
              </span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-2 mx-auto">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-black">
                Blog Hosting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
