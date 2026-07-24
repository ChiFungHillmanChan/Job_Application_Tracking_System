import Link from 'next/link';

export const metadata = {
  title: 'About | Job Application Tracker',
  description:
    'What Job Application Tracker does: track applications, manage resumes, search job boards, and let automation do the repetitive part.',
};

const features = [
  {
    title: 'Application tracking',
    body: 'Keep every application in one list with its current status, the role and company, your notes, and the dates that matter. No more digging through your inbox to remember where you stand.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    title: 'Resume library',
    body: 'Upload several versions of your CV and attach the right one to each application. Files stay private — they are never served from a public URL and only reach you through an authenticated download.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    title: 'Job Finder',
    body: 'Search across several job boards from a single query instead of opening a tab for each one. Results come back in one consistent shape — title, company, location, salary and posting date — so they are actually comparable.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
  },
  {
    title: 'AI assistance',
    body: 'Have your CV analysed, see how closely a listing matches your background, and get a first draft of a cover letter to edit rather than a blank page to fill.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    title: 'Automated searches',
    body: 'Save a search once and let it run on a schedule in the background. New listings are collected and scored while you get on with something else, ready for you to review.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    ),
  },
  {
    title: 'Yours to control',
    body: 'Pick your theme, colour and spacing, and export or delete your data whenever you want. Your job search is your business.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
    ),
  },
];

const steps = [
  {
    n: '1',
    title: 'Add your CV',
    body: 'Upload one or more versions. Everything else builds on top of it.',
  },
  {
    n: '2',
    title: 'Find and save roles',
    body: 'Search the boards from Job Finder, or add a listing you found elsewhere by hand.',
  },
  {
    n: '3',
    title: 'Track what happens next',
    body: 'Move each application through its stages and keep your notes where you will find them again.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            About Job Application Tracker
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Looking for a job means running a small project with no project
            manager: dozens of listings, several versions of your CV, and a
            follow-up you meant to send two weeks ago. Job Application Tracker
            keeps that whole thing in one place, so the admin stops competing
            with the actual search.
          </p>
        </section>

        {/* What it does */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            What it does
          </h2>
          <div className="grid gap-6 mt-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Getting started
          </h2>
          <ol className="grid gap-6 mt-8 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="card">
                <span className="flex items-center justify-center w-8 h-8 text-sm font-semibold text-white rounded-full bg-primary-600">
                  {step.n}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Plans */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Plans
          </h2>
          <p className="max-w-3xl mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
            The free tier covers tracking applications and managing your
            resumes. Plus and Pro raise the limits and unlock the AI and
            automation features — the current details for each are on the{' '}
            <Link
              href="/settings/subscription"
              className="font-medium underline text-primary-600 dark:text-primary-400 underline-offset-2"
            >
              subscription page
            </Link>
            .
          </p>
        </section>

        {/* CTA */}
        <section className="p-8 mt-16 text-center bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Ready to get organised?
          </h2>
          <p className="max-w-xl mx-auto mt-3 text-gray-600 dark:text-gray-400">
            Create an account and add your first application in a couple of
            minutes.
          </p>
          <div className="flex flex-col justify-center gap-3 mt-6 sm:flex-row">
            <Link href="/auth/register" className="btn-primary">
              Create an account
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
