/* Public one-page site. Content comes from Supabase (edited in /admin),
   with the template defaults as a fallback so the page always renders. */
(function () {
  'use strict';
  var PF = window.PF, sb = PF.sb, esc = PF.esc, safeUrl = PF.safeUrl;
  var app = document.getElementById('app');
  var content = PF.clone(PF.DEFAULTS);
  var works = [];
  var filter = 'All';
  var shown = [];
  var lbIndex = 0;

  function load() {
    if (!sb) { works = PF.DEMO_WORKS; return Promise.resolve(); }
    var p1 = sb.from('site_settings').select('content').eq('id', 1).maybeSingle()
      .then(function (r) { if (r && r.data && r.data.content) content = PF.deepMerge(PF.DEFAULTS, r.data.content); })
      .catch(function () {});
    var p2 = sb.from('works').select('*').eq('published', true)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: false })
      .then(function (r) { works = r && !r.error && r.data ? r.data : []; })
      .catch(function () { works = []; });
    return Promise.all([p1, p2]);
  }

  function paras(text) {
    return String(text || '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function link(u) { return esc(safeUrl(u) || '#'); }

  function phBlock(i, title) {
    var p = PF.placeholder(i);
    return '<div class="ph" style="background:' + p.bg + ';color:' + p.ink + '">' + esc(PF.initials(title).charAt(0)) + '</div>';
  }

  function heroVisual(c) {
    if (c.hero.image && safeUrl(c.hero.image)) {
      return '<div class="hero-photo"><img src="' + esc(safeUrl(c.hero.image)) + '" alt=""></div>';
    }
    var cls = ['ct-a', 'ct-b', 'ct-c'];
    var withImg = works.filter(function (w) { return safeUrl(w.image_url); });
    var pool = withImg.concat(works.filter(function (w) { return !safeUrl(w.image_url); })).slice(0, 3);
    var out = '';
    for (var i = 0; i < 3; i++) {
      var w = pool[i];
      var inner = w && safeUrl(w.image_url)
        ? '<img src="' + esc(safeUrl(w.image_url)) + '" alt="" loading="eager">'
        : phBlock(i * 2 + 1, w ? w.title : c.brand.name);
      out += '<div class="ct ' + cls[i] + '">' + inner + '</div>';
    }
    return '<div class="collage" aria-hidden="true">' + out + '</div>';
  }

  function categories() {
    var seen = {}, list = [];
    works.forEach(function (w) { var c = (w.category || '').trim(); if (c && !seen[c]) { seen[c] = 1; list.push(c); } });
    return list;
  }

  function gridHtml() {
    shown = works.filter(function (w) { return filter === 'All' || (w.category || '').trim() === filter; });
    if (!shown.length) return '<p class="empty">' + esc(content.work.emptyText) + '</p>';
    return '<div class="grid">' + shown.map(function (w, i) {
      var span = i % 5 === 0 ? ' w7' : (i % 5 === 1 ? ' w5' : '');
      var img = safeUrl(w.image_url)
        ? '<img src="' + esc(safeUrl(w.image_url)) + '" alt="' + esc(w.title) + '" loading="lazy">'
        : phBlock(i, w.title);
      return '<button class="tile' + span + '" data-i="' + i + '" aria-label="Open ' + esc(w.title) + '">' + img +
        '<span class="cap"><b>' + esc(w.title) + '</b>' + (w.category ? '<span>' + esc(w.category) + '</span>' : '') + '</span></button>';
    }).join('') + '</div>';
  }

  function render() {
    var c = content, s = c.sections;
    PF.applyTheme(c.theme);
    document.title = c.seo.title || c.brand.name;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', c.seo.description || '');

    var navItems = [['about', 'About'], ['services', 'Services'], ['work', 'Work'], ['testimonials', 'Reviews'], ['contact', 'Contact']]
      .filter(function (n) { return s[n[0]] !== false; });

    var brand = safeUrl(c.brand.logo)
      ? '<img src="' + esc(safeUrl(c.brand.logo)) + '" alt="' + esc(c.brand.name) + '">'
      : '<span class="brand-mark">' + esc(PF.initials(c.brand.name)) + '</span><span>' + esc(c.brand.name) + '</span>';

    var h = '';
    h += '<header class="site-header" id="hdr"><div class="wrap nav">' +
      '<a class="brand" href="#top" aria-label="' + esc(c.brand.name) + '">' + brand + '</a>' +
      '<button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<nav class="nav-links" id="navLinks" aria-label="Main">' +
      navItems.map(function (n) { return '<a href="#' + n[0] + '">' + n[1] + '</a>'; }).join('') +
      (s.contact !== false ? '<a class="btn btn-primary" href="#contact">' + esc(c.hero.secondaryText || 'Contact') + '</a>' : '') +
      '</nav></div></header>';

    h += '<main id="top">';
    h += '<section class="hero"><div class="wrap"><div class="hero-grid"><div>' +
      (c.hero.status ? '<p class="status"><i></i>' + esc(c.hero.status) + '</p>' : '') +
      '<h1>' + esc(c.hero.headline) + '</h1>' +
      '<p class="hero-sub">' + esc(c.hero.subheadline) + '</p>' +
      '<div class="hero-cta">' +
      (c.hero.ctaText ? '<a class="btn btn-primary" href="' + link(c.hero.ctaLink) + '">' + esc(c.hero.ctaText) + '</a>' : '') +
      (c.hero.secondaryText ? '<a class="btn btn-ghost" href="' + link(c.hero.secondaryLink) + '">' + esc(c.hero.secondaryText) + '</a>' : '') +
      '</div>' +
      ((c.stats || []).length ? '<div class="stats">' + c.stats.map(function (t) {
        return '<div class="stat"><b>' + esc(t.value) + '</b><span>' + esc(t.label) + '</span></div>';
      }).join('') + '</div>' : '') +
      '</div><div>' + heroVisual(c) + '</div></div></div></section>';

    if (s.about !== false) {
      h += '<section class="sec" id="about"><div class="wrap about-grid">' +
        '<div class="about-img">' + (safeUrl(c.about.image) ? '<img src="' + esc(safeUrl(c.about.image)) + '" alt="">' : phBlock(0, c.brand.name)) + '</div>' +
        '<div class="about-text"><h2 class="sec-title">' + esc(c.about.title) + '</h2>' + paras(c.about.text) +
        ((c.about.skills || []).length ? '<ul class="skills">' + c.about.skills.map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>' : '') +
        '</div></div></section>';
    }

    if (s.services !== false) {
      h += '<section class="sec" id="services"><div class="wrap"><h2 class="sec-title">' + esc(c.services.title) + '</h2>' +
        (c.services.subtitle ? '<p class="sec-sub">' + esc(c.services.subtitle) + '</p>' : '') +
        '<div class="svc-list">' + (c.services.items || []).map(function (it) {
          return '<div class="svc"><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></div>';
        }).join('') + '</div></div></section>';
    }

    if (s.work !== false) {
      var cats = categories();
      h += '<section class="sec" id="work"><div class="wrap"><div class="work-head"><div><h2 class="sec-title">' + esc(c.work.title) + '</h2>' +
        (c.work.subtitle ? '<p class="sec-sub">' + esc(c.work.subtitle) + '</p>' : '') + '</div>' +
        (cats.length > 1 ? '<div class="filters" id="filters">' + ['All'].concat(cats).map(function (k) {
          return '<button class="chip" data-f="' + esc(k) + '" aria-pressed="' + (k === filter) + '">' + esc(k) + '</button>';
        }).join('') + '</div>' : '') +
        '</div><div id="gridHost">' + gridHtml() + '</div></div></section>';
    }

    if (s.testimonials !== false && (c.testimonials.items || []).length) {
      h += '<section class="sec" id="testimonials"><div class="wrap"><h2 class="sec-title">' + esc(c.testimonials.title) + '</h2><div class="quotes">' +
        c.testimonials.items.map(function (q) {
          return '<blockquote class="quote"><p>' + esc(q.text) + '</p><footer>' + esc(q.name) + (q.role ? '<span>' + esc(q.role) + '</span>' : '') + '</footer></blockquote>';
        }).join('') + '</div></div></section>';
    }

    if (s.contact !== false) {
      var ct = c.contact;
      h += '<section class="sec contact" id="contact"><div class="wrap contact-grid"><div>' +
        '<h2>' + esc(ct.title) + '</h2><p class="lead">' + esc(ct.subtitle) + '</p><ul class="details">' +
        (ct.email ? '<li><small>Email</small><a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a></li>' : '') +
        (ct.phone ? '<li><small>Phone</small><a href="tel:' + esc(String(ct.phone).replace(/[^\d+]/g, '')) + '">' + esc(ct.phone) + '</a></li>' : '') +
        (ct.address ? '<li><small>Location</small><span>' + esc(ct.address) + '</span></li>' : '') +
        '</ul>' +
        ((ct.socials || []).length ? '<div class="socials">' + ct.socials.map(function (so) {
          return '<a href="' + link(so.url) + '" target="_blank" rel="noopener noreferrer">' + esc(so.label) + '</a>';
        }).join('') + '</div>' : '') +
        '</div>' +
        '<form class="form" id="form" novalidate>' +
        '<div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" maxlength="120" required></div>' +
        '<div class="field"><label for="f-email">Your email</label><input id="f-email" name="email" type="email" autocomplete="email" maxlength="200" required></div>' +
        '<div class="field"><label for="f-msg">Project details</label><textarea id="f-msg" name="message" maxlength="4000" required></textarea></div>' +
        '<div class="hp" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
        '<button class="btn btn-accent" type="submit">' + esc(ct.buttonText || 'Send message') + '</button>' +
        '<p class="form-msg" id="formMsg" role="status" aria-live="polite"></p></form>' +
        '</div></section>';
    }

    h += '</main>';
    h += '<footer class="site-footer" style="background:var(--inverse)"><div class="wrap"><span>&copy; ' + new Date().getFullYear() + ' ' + esc(c.brand.name) + '. ' + esc(c.footer.text) + '</span><span>' + esc(c.brand.tagline) + '</span></div></footer>';

    app.innerHTML = h;
    bind();
  }

  function bind() {
    var hdr = document.getElementById('hdr');
    function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var mb = document.getElementById('menuBtn'), nl = document.getElementById('navLinks');
    mb.addEventListener('click', function () {
      var open = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', String(open));
    });
    nl.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nl.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });

    var fl = document.getElementById('filters');
    if (fl) fl.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      filter = b.getAttribute('data-f');
      fl.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.getElementById('gridHost').innerHTML = gridHtml();
    });

    var host = document.getElementById('gridHost');
    if (host) host.addEventListener('click', function (e) {
      var t = e.target.closest('.tile'); if (t) openLb(parseInt(t.getAttribute('data-i'), 10));
    });

    var form = document.getElementById('form');
    if (form) form.addEventListener('submit', submitForm);
  }

  /* ---------- Contact form ---------- */
  function submitForm(e) {
    e.preventDefault();
    var f = e.target, msg = document.getElementById('formMsg'), btn = f.querySelector('button');
    var el = f.elements;
    if (el.website.value) return;
    var d = { name: el.name.value.trim(), email: el.email.value.trim(), message: el.message.value.trim() };
    msg.className = 'form-msg';
    if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.message) {
      msg.className = 'form-msg err'; msg.textContent = 'Please fill in your name, a valid email and your message.'; return;
    }
    if (!sb) {
      window.location.href = 'mailto:' + content.contact.email + '?subject=' + encodeURIComponent('Project enquiry from ' + d.name) +
        '&body=' + encodeURIComponent(d.message + '\n\n' + d.name + '\n' + d.email);
      return;
    }
    btn.disabled = true; msg.textContent = 'Sending...';
    sb.from('messages').insert(d).then(function (r) {
      btn.disabled = false;
      if (r.error) { msg.className = 'form-msg err'; msg.textContent = 'Your message could not be sent. Please email us directly.'; }
      else { msg.className = 'form-msg ok'; msg.textContent = 'Thank you. Your message has been sent.'; f.reset(); }
    });
  }

  /* ---------- Lightbox ---------- */
  function openLb(i) {
    lbIndex = i;
    var dlg = document.getElementById('lb');
    fillLb();
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }
  function fillLb() {
    var w = shown[lbIndex]; if (!w) return;
    var body = document.getElementById('lbBody');
    body.innerHTML =
      '<div class="lb-media">' + (safeUrl(w.image_url) ? '<img src="' + esc(safeUrl(w.image_url)) + '" alt="' + esc(w.title) + '">' : phBlock(lbIndex, w.title)) + '</div>' +
      '<div class="lb-info">' + (w.category ? '<small>' + esc(w.category) + '</small>' : '') + '<h3>' + esc(w.title) + '</h3>' +
      (w.description ? '<p>' + esc(w.description) + '</p>' : '') +
      (safeUrl(w.link_url) ? '<a class="btn btn-primary" href="' + esc(safeUrl(w.link_url)) + '" target="_blank" rel="noopener noreferrer">View project</a>' : '') +
      '<div class="lb-nav"><button type="button" data-d="-1" aria-label="Previous">&#8592;</button><button type="button" data-d="1" aria-label="Next">&#8594;</button></div></div>';
  }
  function step(d) { if (!shown.length) return; lbIndex = (lbIndex + d + shown.length) % shown.length; fillLb(); }

  function initLb() {
    var dlg = document.getElementById('lb');
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('.lb-close')) dlg.close();
      var b = e.target.closest('[data-d]'); if (b) step(parseInt(b.getAttribute('data-d'), 10));
    });
    document.addEventListener('keydown', function (e) {
      if (!dlg.open) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  initLb();
  load().then(render).catch(render);
})();
