/* Shared by the public site and the admin dashboard. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     TEMPLATE CONTENT. Everything here can be edited from /admin.
     The values below are only the starting point.
  ------------------------------------------------------------------ */
  var DEFAULTS = {
    brand: { name: 'Studio Name', tagline: 'Graphic design and brand identity', logo: '' },
    seo: {
      title: 'Studio Name | Graphic Design and Brand Identity',
      description: 'A design studio creating logos, print, packaging and digital designs for businesses that want to look as good as they work.'
    },
    theme: { mode: 'light', primary: '#2F5BFF', accent: '#FFC933', font: 'studio' },
    sections: { about: true, services: true, work: true, testimonials: true, contact: true },
    hero: {
      status: 'Taking on new projects',
      headline: 'Design that makes your business hard to overlook.',
      subheadline: 'Logos, print, packaging and digital designs for brands that want to look as good as they work.',
      ctaText: 'See the work',
      ctaLink: '#work',
      secondaryText: 'Start a project',
      secondaryLink: '#contact',
      image: ''
    },
    stats: [
      { value: '120+', label: 'Projects delivered' },
      { value: '8 yrs', label: 'In practice' },
      { value: '60+', label: 'Returning clients' }
    ],
    about: {
      title: 'A small studio that sweats the details',
      text: 'Tell visitors who you are and how you work. Two or three short paragraphs are enough: where you started, what you care about, and what a client can expect when they hire you.\n\nEvery project gets a clear brief, honest feedback and files that are ready to use the day they are delivered.',
      image: '',
      skills: ['Logo design', 'Brand identity', 'Flyers and posters', 'Social media design', 'Packaging', 'Web design']
    },
    services: {
      title: 'What we can make for you',
      subtitle: 'Pick a single service or bring us in for the whole identity.',
      items: [
        { title: 'Logo and brand identity', text: 'A mark, colours, type and simple rules so your brand looks the same everywhere.' },
        { title: 'Print and packaging', text: 'Flyers, brochures, banners, labels and boxes, prepared for the printer.' },
        { title: 'Social media design', text: 'Post templates and campaign visuals your team can reuse every week.' },
        { title: 'Web and app interface', text: 'Clean, mobile-first layouts that make it easy for customers to act.' },
        { title: 'Presentations and documents', text: 'Pitch decks, proposals and company profiles that read well and look credible.' }
      ]
    },
    work: {
      title: 'Selected work',
      subtitle: 'A few recent projects. Select any piece to see it larger.',
      emptyText: 'New work is being added. Please check back soon.'
    },
    testimonials: {
      title: 'What clients say',
      items: [
        { name: 'Client Name', role: 'Founder, Company', text: 'They understood the brief on the first call and delivered better than what we imagined. Our customers noticed the change straight away.' },
        { name: 'Client Name', role: 'Marketing Manager, Company', text: 'Fast, careful and easy to work with. Every file arrived ready for print and for social media.' }
      ]
    },
    contact: {
      title: 'Tell us about your project',
      subtitle: 'Share what you need and when you need it. You will hear back within one working day.',
      email: 'hello@example.com',
      phone: '+234 800 000 0000',
      address: 'Your city, your country',
      buttonText: 'Send message',
      socials: [
        { label: 'Instagram', url: '#' },
        { label: 'Facebook', url: '#' },
        { label: 'LinkedIn', url: '#' }
      ]
    },
    footer: { text: 'All rights reserved.' }
  };

  var DEMO_WORKS = [
    { id: 'd1', title: 'Harbour Coffee identity', category: 'Branding', description: 'Logo, colour palette and cup design for a neighbourhood coffee shop.', image_url: '', link_url: '' },
    { id: 'd2', title: 'Launch poster series', category: 'Print', description: 'Three posters for a product launch event.', image_url: '', link_url: '' },
    { id: 'd3', title: 'Fresh Farms packaging', category: 'Packaging', description: 'Label and carton design for a farm produce brand.', image_url: '', link_url: '' },
    { id: 'd4', title: 'Church conference visuals', category: 'Social', description: 'Social media flyers and stage screens for a three-day conference.', image_url: '', link_url: '' },
    { id: 'd5', title: 'Fintech landing page', category: 'Web', description: 'Landing page layout for a mobile payments start-up.', image_url: '', link_url: '' },
    { id: 'd6', title: 'Annual report', category: 'Print', description: 'A 48-page annual report with charts and photography.', image_url: '', link_url: '' }
  ];

  var FONTS = {
    studio:    { label: 'Studio (Bricolage Grotesque + Manrope)', head: "'Bricolage Grotesque', 'Manrope', system-ui, sans-serif", body: "'Manrope', system-ui, sans-serif" },
    editorial: { label: 'Editorial (Fraunces + Instrument Sans)', head: "'Fraunces', Georgia, serif", body: "'Instrument Sans', system-ui, sans-serif" },
    modern:    { label: 'Modern (Space Grotesk + DM Sans)', head: "'Space Grotesk', 'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" }
  };

  /* ------------------------------------------------------------------ helpers */
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function deepMerge(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in over) out[k] = (isObj(base[k]) && isObj(over[k])) ? deepMerge(base[k], over[k]) : over[k];
    return out;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Only allow safe URL types in links and images. */
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}([\/?#].*)?$/i.test(u)) return 'https://' + u;
    return '';
  }

  function getByPath(obj, path) {
    return String(path).split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function setByPath(obj, path, val) {
    var keys = String(path).split('.'), o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }

  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '•';
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return [47, 91, 255];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function readableOn(hex) {
    var c = hexToRgb(hex);
    var lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    return lum > 0.62 ? '#0B1B3A' : '#FFFFFF';
  }

  function applyTheme(t) {
    t = t || {};
    var r = document.documentElement;
    var primary = /^#[0-9a-f]{6}$/i.test(t.primary) ? t.primary : DEFAULTS.theme.primary;
    var accent = /^#[0-9a-f]{6}$/i.test(t.accent) ? t.accent : DEFAULTS.theme.accent;
    var f = FONTS[t.font] || FONTS.studio;
    r.setAttribute('data-mode', t.mode === 'dark' ? 'dark' : 'light');
    r.style.setProperty('--primary', primary);
    r.style.setProperty('--primary-rgb', hexToRgb(primary).join(','));
    r.style.setProperty('--on-primary', readableOn(primary));
    r.style.setProperty('--accent', accent);
    r.style.setProperty('--on-accent', readableOn(accent));
    r.style.setProperty('--font-head', f.head);
    r.style.setProperty('--font-body', f.body);
  }

  /* Gradient / colour blocks used when a work has no image yet. */
  var PLACEHOLDERS = [
    'linear-gradient(140deg, var(--primary), color-mix(in srgb, var(--primary) 45%, #000))',
    'var(--accent)',
    'color-mix(in srgb, var(--primary) 18%, var(--surface))',
    'linear-gradient(200deg, color-mix(in srgb, var(--primary) 30%, #fff), var(--primary))',
    'color-mix(in srgb, var(--accent) 35%, var(--surface))',
    'linear-gradient(160deg, #0B1B3A, color-mix(in srgb, var(--primary) 55%, #0B1B3A))'
  ];
  var PLACEHOLDER_INK = ['var(--on-primary)', 'var(--on-accent)', 'var(--text)', 'var(--on-primary)', 'var(--text)', '#fff'];
  function placeholder(i) {
    return { bg: PLACEHOLDERS[i % PLACEHOLDERS.length], ink: PLACEHOLDER_INK[i % PLACEHOLDER_INK.length] };
  }

  /* ------------------------------------------------------------------ Supabase */
  var cfg = window.APP_CONFIG || {};
  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_URL.indexOf('YOUR_') === -1 && cfg.SUPABASE_ANON_KEY.indexOf('YOUR_') === -1);
  var sb = null;
  if (configured && window.supabase && window.supabase.createClient) {
    try { sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY); } catch (e) { sb = null; }
  }

  window.PF = {
    DEFAULTS: DEFAULTS, DEMO_WORKS: DEMO_WORKS, FONTS: FONTS,
    deepMerge: deepMerge, clone: clone, esc: esc, safeUrl: safeUrl,
    getByPath: getByPath, setByPath: setByPath, initials: initials,
    applyTheme: applyTheme, placeholder: placeholder,
    sb: sb, configured: configured && !!sb
  };
})();
