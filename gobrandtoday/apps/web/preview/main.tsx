/**
 * Entry for the single-file preview build: the real GoBrandToday pages and
 * components, an in-memory router and the in-browser API (local-api.ts).
 */
import React, { StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import Home from '../app/page';
import CreatePage from '../app/create/page';
import PricingPage from '../app/pricing/page';
import LoginPage from '../app/login/page';
import SignupPage from '../app/signup/page';
import NotFound from '../app/not-found';
import SharedBrand from '../app/b/[slug]/page';
import GuidelinesPage from '../app/brand/[id]/guidelines/page';
import DashboardLayout from '../app/dashboard/layout';
import { BrandView } from '../components/BrandView';
import { DashAssistant, DashBrands, DashDomains, DashHandles, DashHome, DashSaved, DashSettings } from '../components/Dashboard';
import { NameCheck } from '../components/NameCheck';
import { ExpertsPage } from '../components/ExpertsPage';
import { ToolContent } from '../components/ToolContent';
import { ToolsIndex } from '../components/ToolsIndex';
import { Shell } from '../components/ui';
import { Providers, useApp } from '../lib/providers';
import { SEO_PAGES } from '../lib/seo-pages';
import { resetPreview } from './local-api';
import { isInternal, match, navigate, useRoute } from './router';

const DASH: Record<string, () => React.JSX.Element> = {
  '': DashHome,
  saved: DashSaved,
  brands: DashBrands,
  domains: DashDomains,
  handles: DashHandles,
  assistant: DashAssistant,
  settings: DashSettings,
};

function Page() {
  const { path, params } = useRoute();
  const m = match(path);
  useEffect(() => {
    document.title = path === '/' ? 'GoBrandToday Preview' : `${path.split('/')[1]} · GoBrandToday Preview`;
  }, [path]);
  switch (m?.route) {
    case '/':
      return <Home />;
    case '/create':
      return <CreatePage key={path} />;
    case '/name/:name':
      return (
        <Shell key={params.name}>
          <NameCheck name={(params.name ?? '').slice(0, 40)} />
        </Shell>
      );
    case '/brand/:id':
      return (
        <Shell>
          <BrandView key={params.id} id={params.id!} />
        </Shell>
      );
    case '/brand/:id/guidelines':
      return <GuidelinesPage />;
    case '/b/:slug':
      return <SharedBrand />;
    case '/pricing':
      return <PricingPage />;
    case '/login':
      return <LoginPage />;
    case '/signup':
      return <SignupPage />;
    case '/tools':
      return <ToolsIndex />;
    case '/experts':
      return (
        <Shell>
          <ExpertsPage />
        </Shell>
      );
    case '/tools/:slug': {
      const p = SEO_PAGES.find((x) => x.slug === params.slug);
      return p ? <ToolContent p={p} /> : <NotFound />;
    }
    case '/dashboard':
    case '/dashboard/:section': {
      const C = DASH[params.section ?? ''] ?? DashHome;
      return (
        <DashboardLayout>
          <C />
        </DashboardLayout>
      );
    }
    default:
      return <NotFound />;
  }
}

/** Every same-site link in the app (including plain <a href="/…">) navigates in memory. */
function useLinkInterceptor() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      const href = a?.getAttribute('href');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      if (href?.startsWith('#') && href.length > 1) {
        e.preventDefault();
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (isInternal(href)) {
        e.preventDefault();
        navigate(href);
      }
    };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, []);
}

function PreviewBar() {
  const { system, toast } = useApp();
  const ai = !!system?.ai.live;
  useEffect(() => {
    const on = (e: Event) => toast(String((e as CustomEvent).detail), 'error');
    window.addEventListener('gbt-toast', on);
    return () => window.removeEventListener('gbt-toast', on);
  }, [toast]);
  return (
    <div className="preview-bar" role="note">
      <span>
        <b>Preview</b> · runs in your browser. {ai ? 'Names, brand bibles and logo symbols come from Claude.' : 'Names come from the offline generator.'} Domain and handle checks run on the server version, so here you get prices and one-tap links, never a guess.
      </span>
      <span className="row gap-8">
        <button type="button" className="btn-link tiny" onClick={() => navigate('/dashboard')}>
          My brands
        </button>
        <button
          type="button"
          className="btn-link tiny"
          onClick={() => {
            resetPreview();
            location.hash = '';
            location.reload();
          }}
        >
          Reset
        </button>
      </span>
    </div>
  );
}

function App() {
  useLinkInterceptor();
  return (
    <Providers>
      <PreviewBar />
      <Suspense>
        <Page />
      </Suspense>
    </Providers>
  );
}

/** Downloads: a sandboxed page can't follow <a download>, so files go through the viewer's save dialog. */
(globalThis as { __gbtSave?: (filename: string, blob: Blob) => Promise<void> }).__gbtSave = async (filename, blob) => {
  const c = (globalThis as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
  const downloads = (c?.use ? await c.use('downloads').catch(() => null) : null) as { save: (r: { filename: string; data: Blob }) => Promise<unknown> } | null;
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code !== 'declined') window.dispatchEvent(new CustomEvent('gbt-toast', { detail: 'This view can’t save files. Try the full app.' }));
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
