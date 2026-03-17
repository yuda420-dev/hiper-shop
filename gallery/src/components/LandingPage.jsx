import { useEffect, useState } from 'react';

const FEATURE_ARTWORKS = [
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518882605630-8b17b9c1d406?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&h=600&fit=crop',
];

/**
 * @param {{ onEnter: () => void }} props
 */
export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col overflow-hidden">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-purple-500/8 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/4 rounded-full blur-[220px]" />
      </div>

      {/* Nav bar */}
      <header className="relative z-10 flex justify-between items-center px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">HiPeR Gallery</span>
        </div>
        <button
          onClick={onEnter}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-powered art curation
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            <span className="bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Discover art that
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              moves you
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            A curated gallery of AI-generated and human artworks. Browse, upload, and collect
            prints — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnter}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a0b] font-semibold text-base hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300"
            >
              Enter Gallery
            </button>
            <a
              href="https://hiper-shop.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-white/70 font-medium text-base hover:border-white/20 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              Shop Prints ↗
            </a>
          </div>
        </div>

        {/* Art grid preview */}
        <div
          className={`mt-20 w-full max-w-4xl transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {FEATURE_ARTWORKS.map((url, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden relative group"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-4 text-center">
            Sample artworks from the gallery
          </p>
        </div>
      </main>

      {/* Feature pills */}
      <footer className="relative z-10 pb-12 pt-8">
        <div className="flex flex-wrap justify-center gap-3 px-6">
          {[
            '✦ AI Vision Descriptions',
            '✦ Series & Collections',
            '✦ Drag-and-Drop Curation',
            '✦ Print-on-Demand via Prodigi',
            '✦ Favorites',
          ].map((label) => (
            <span
              key={label}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/8 text-white/40 text-xs"
            >
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
