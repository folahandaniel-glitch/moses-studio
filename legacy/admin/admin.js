/* Admin dashboard: Super Admin and Admin can edit content and work samples.
   Only the Super Admin sees the Team page (add / remove admins). */
(function () {
  'use strict';

  var PF = window.PF, sb = PF.sb, esc = PF.esc, getByPath = PF.getByPath, setByPath = PF.setByPath;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var main = $('#main'), side = $('#side'), modal = $('#modal');

  var state = { user: null, profile: null, content: null, works: [], messages: [], team: [], view: 'dashboard', dirty: false };

  /* ------------------------------------------------------------------
     EDITABLE SECTIONS. Add a field here and it appears in the dashboard.
  ------------------------------------------------------------------ */
  var SECTIONS = [
    { id: 'brand', title: 'Brand and SEO', intro: 'Your name, logo and how the site appears in Google and browser tabs.', fields: [
      { path: 'brand.name', label: 'Brand name', type: 'text' },
      { path: 'brand.tagline', label: 'Tagline', type: 'text', help: 'Shown in the footer.' },
      { path: 'brand.logo', label: 'Logo image', type: 'image', help: 'Optional. Leave empty to show your initials with your name.' },
      { path: 'seo.title', label: 'Page title (browser tab and Google)', type: 'text' },
      { path: 'seo.description', label: 'Page description (Google)', type: 'textarea', rows: 3, help: 'One or two sentences, up to about 155 characters.' }
    ] },
    { id: 'hero', title: 'Hero (top of the page)', intro: 'The first thing visitors see.', fields: [
      { path: 'hero.status', label: 'Availability line', type: 'text', help: 'Example: Taking on new projects. Leave empty to hide it.' },
      { path: 'hero.headline', label: 'Headline', type: 'textarea', rows: 2 },
      { path: 'hero.subheadline', label: 'Supporting text', type: 'textarea', rows: 3 },
      { type: 'row', fields: [
        { path: 'hero.ctaText', label: 'Main button text', type: 'text' },
        { path: 'hero.ctaLink', label: 'Main button link', type: 'text', help: 'Use #work, #contact, or a full web address.' }
      ] },
      { type: 'row', fields: [
        { path: 'hero.secondaryText', label: 'Second button text', type: 'text', help: 'Also used for the button in the menu.' },
        { path: 'hero.secondaryLink', label: 'Second button link', type: 'text' }
      ] },
      { path: 'hero.image', label: 'Hero photo', type: 'image', help: 'Optional. If empty, the hero shows a collage of your first three work samples.' },
      { path: 'stats', type: 'list', label: 'Numbers under the headline', itemName: 'Number', titleKey: 'value', help: 'Short proof points. Remove all of them to hide the row.', fields: [
        { key: 'value', label: 'Number', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' }
      ] }
    ] },
    { id: 'about', title: 'About', intro: 'Who you are and how you work.', fields: [
      { path: 'about.title', label: 'Title', type: 'text' },
      { path: 'about.text', label: 'Text', type: 'textarea', rows: 9, help: 'Leave a blank line between paragraphs.' },
      { path: 'about.image', label: 'Photo', type: 'image' },
      { path: 'about.skills', label: 'Skills (separate with commas)', type: 'tags' }
    ] },
    { id: 'services', title: 'Services', intro: 'What you offer.', fields: [
      { path: 'services.title', label: 'Section title', type: 'text' },
      { path: 'services.subtitle', label: 'Short introduction', type: 'text' },
      { path: 'services.items', type: 'list', label: 'Services', itemName: 'Service', titleKey: 'title', fields: [
        { key: 'title', label: 'Service name', type: 'text' },
        { key: 'text', label: 'Description', type: 'textarea', rows: 3 }
      ] }
    ] },
    { id: 'work', title: 'Work section text', intro: 'The heading above your portfolio grid.', fields: [
      { type: 'note', text: 'To add, edit, hide or reorder the actual designs, open Work samples in the menu.' },
      { path: 'work.title', label: 'Section title', type: 'text' },
      { path: 'work.subtitle', label: 'Short introduction', type: 'text' },
      { path: 'work.emptyText', label: 'Message when there is no work yet', type: 'text' }
    ] },
    { id: 'testimonials', title: 'Client reviews', intro: 'Short quotes from happy clients.', fields: [
      { path: 'testimonials.title', label: 'Section title', type: 'text' },
      { path: 'testimonials.items', type: 'list', label: 'Reviews', itemName: 'Review', titleKey: 'name', fields: [
        { key: 'name', label: 'Client name', type: 'text' },
        { key: 'role', label: 'Role and company', type: 'text' },
        { key: 'text', label: 'Quote', type: 'textarea', rows: 3 }
      ] }
    ] },
    { id: 'contact', title: 'Contact and footer', intro: 'How visitors reach you. Messages from the form appear under Messages.', fields: [
      { path: 'contact.title', label: 'Title', type: 'text' },
      { path: 'contact.subtitle', label: 'Introduction', type: 'textarea', rows: 2 },
      { type: 'row', fields: [
        { path: 'contact.email', label: 'Email', type: 'text' },
        { path: 'contact.phone', label: 'Phone', type: 'text' }
      ] },
      { path: 'contact.address', label: 'Location', type: 'text' },
      { path: 'contact.buttonText', label: 'Form button text', type: 'text' },
      { path: 'contact.socials', type: 'list', label: 'Social links', itemName: 'Link', titleKey: 'label', fields: [
        { key: 'label', label: 'Name', type: 'text' },
        { key: 'url', label: 'Web address', type: 'text' }
      ] },
      { path: 'footer.text', label: 'Footer text', type: 'text', help: 'Shown after the copyright line.' }
    ] },
    { id: 'look', title: 'Look and sections', intro: 'Colours, fonts and which sections appear.', fields: [
      { path: 'theme.mode', label: 'Colour mode', type: 'select', options: [['light', 'Light'], ['dark', 'Dark']] },
      { type: 'row', fields: [
        { path: 'theme.primary', label: 'Main colour', type: 'color', help: 'Buttons and highlights.' },
        { path: 'theme.accent', label: 'Accent colour', type: 'color', help: 'Contact button and small details.' }
      ] },
      { path: 'theme.font', label: 'Font style', type: 'select', options: Object.keys(PF.FONTS).map(function (k) { return [k, PF.FONTS[k].label]; }) },
      { type: 'heading', text: 'Show or hide sections', help: 'The hero is always visible.' },
      { path: 'sections.about', label: 'About', type: 'toggle' },
      { path: 'sections.services', label: 'Services', type: 'toggle' },
      { path: 'sections.work', label: 'Work', type: 'toggle' },
      { path: 'sections.testimonials', label: 'Client reviews', type: 'toggle' },
      { path: 'sections.contact', label: 'Contact', type: 'toggle' }
    ] }
  ];

  /* ------------------------------------------------------------------ helpers */
  var toastTimer;
  function toast(msg, bad) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast'; }, 3600);
  }
  function fire(el) { el.dispatchEvent(new Event('input', { bubbles: true })); }
  function isSuper() { return state.profile && state.profile.role === 'super_admin'; }
  function fmtDate(d) { try { return new Date(d).toLocaleString(); } catch (e) { return ''; } }
  function unread() { return state.messages.filter(function (m) { return !m.is_read; }).length; }

  function findField(list, path) {
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (f.type === 'row') { var r = findField(f.fields, path); if (r) return r; }
      else if (f.path === path) return f;
    }
    return null;
  }
  function findListDef(path) {
    for (var i = 0; i < SECTIONS.length; i++) { var f = findField(SECTIONS[i].fields, path); if (f) return f; }
    return null;
  }

  /* ------------------------------------------------------------------ images */
  function prepareImage(file) {
    return new Promise(function (resolve, reject) {
      if (file.size > 20 * 1024 * 1024) return reject(new Error('That image is over 20 MB. Choose a smaller file.'));
      if (/svg|gif/.test(file.type)) return resolve({ blob: file, ext: file.type.indexOf('svg') > -1 ? 'svg' : 'gif', type: file.type });
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var r = Math.min(1, 1800 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return reject(new Error('Could not process that image.'));
          resolve({ blob: b, ext: b.type === 'image/png' ? 'png' : 'webp', type: b.type });
        }, 'image/webp', 0.88);
      };
      img.onerror = function () { reject(new Error('That file is not a supported image.')); };
      img.src = url;
    });
  }

  function uploadImage(file) {
    return prepareImage(file).then(function (p) {
      var path = 'uploads/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + p.ext;
      return sb.storage.from('portfolio').upload(path, p.blob, { contentType: p.type, cacheControl: '31536000', upsert: false })
        .then(function (r) {
          if (r.error) throw new Error(r.error.message);
          return sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
        });
    });
  }

  function imageBlock(attrs, v) {
    return '<div class="imgf"><div class="imgprev">' + (v ? '<img src="' + esc(v) + '" alt="">' : 'No image') + '</div><div>' +
      '<input type="text" ' + attrs + ' placeholder="Paste an image link, or upload one" value="' + esc(v || '') + '">' +
      '<div class="actions"><button class="btn sm" type="button" data-act="upload">Upload image</button>' +
      '<button class="btn sm" type="button" data-act="clear-img">Remove</button></div></div></div>';
  }

  function updatePrev(t) {
    var box = t.closest && t.closest('.imgf');
    if (!box || t.type !== 'text') return;
    var u = PF.safeUrl(t.value);
    box.querySelector('.imgprev').innerHTML = u ? '<img src="' + esc(u) + '" alt="">' : 'No image';
  }

  function onImageAct(e) {
    var b = e.target.closest('[data-act]'); if (!b) return false;
    var act = b.getAttribute('data-act');
    if (act !== 'upload' && act !== 'clear-img') return false;
    var inp = b.closest('.imgf').querySelector('input[type=text]');
    if (act === 'clear-img') { inp.value = ''; fire(inp); return true; }
    var pick = document.createElement('input'); pick.type = 'file'; pick.accept = 'image/*';
    pick.onchange = function () {
      var file = pick.files[0]; if (!file) return;
      b.disabled = true; b.textContent = 'Uploading...';
      uploadImage(file).then(function (url) { inp.value = url; fire(inp); toast('Image uploaded.'); })
        .catch(function (err) { toast(err.message || 'Upload failed.', true); })
        .then(function () { b.disabled = false; b.textContent = 'Upload image'; });
    };
    pick.click();
    return true;
  }

  /* ------------------------------------------------------------------ form rendering */
  function singleHtml(f, path) {
    var v = getByPath(state.content, path);
    var help = f.help ? '<p class="help">' + esc(f.help) + '</p>' : '';
    var p = 'data-path="' + esc(path) + '"';
    if (f.type === 'toggle') return '<label class="toggle"><input type="checkbox" ' + p + (v ? ' checked' : '') + '> ' + esc(f.label) + '</label>' + help;
    var id = 'f_' + path.replace(/\./g, '_');
    var ctl;
    if (f.type === 'textarea') ctl = '<textarea id="' + id + '" ' + p + ' rows="' + (f.rows || 4) + '">' + esc(v) + '</textarea>';
    else if (f.type === 'select') ctl = '<select id="' + id + '" ' + p + '>' + f.options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'color') ctl = '<div class="inline"><input type="color" ' + p + ' value="' + esc(v) + '" aria-label="' + esc(f.label) + ' picker">' +
      '<input type="text" id="' + id + '" ' + p + ' value="' + esc(v) + '" maxlength="7"></div>';
    else if (f.type === 'tags') ctl = '<input type="text" id="' + id + '" ' + p + ' data-type="tags" value="' + esc((v || []).join(', ')) + '">';
    else if (f.type === 'image') ctl = imageBlock('id="' + id + '" ' + p, v);
    else ctl = '<input type="text" id="' + id + '" ' + p + ' value="' + esc(v) + '">';
    return '<label for="' + id + '">' + esc(f.label) + '</label>' + ctl + help;
  }

  function listHtml(f) {
    var arr = getByPath(state.content, f.path) || [];
    var h = '<div class="field-title">' + esc(f.label) + '</div>' + (f.help ? '<p class="help">' + esc(f.help) + '</p>' : '');
    arr.forEach(function (it, i) {
      var pp = 'data-path="' + esc(f.path) + '" data-i="' + i + '"';
      h += '<div class="li"><div class="li-head"><b>' + esc(it[f.titleKey] || (f.itemName + ' ' + (i + 1))) + '</b><span class="li-actions">' +
        '<button class="btn sm" type="button" data-act="list-up" ' + pp + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">&#8593;</button>' +
        '<button class="btn sm" type="button" data-act="list-down" ' + pp + (i === arr.length - 1 ? ' disabled' : '') + ' aria-label="Move down">&#8595;</button>' +
        '<button class="btn sm danger" type="button" data-act="list-del" ' + pp + '>Remove</button></span></div>' +
        f.fields.map(function (sf) { return singleHtml(sf, f.path + '.' + i + '.' + sf.key); }).join('') + '</div>';
    });
    return h + '<button class="btn list-add" type="button" data-act="list-add" data-path="' + esc(f.path) + '">+ Add ' + esc(f.itemName.toLowerCase()) + '</button>';
  }

  function fieldHtml(f) {
    if (f.type === 'heading') return '<div class="field-title">' + esc(f.text) + '</div>' + (f.help ? '<p class="help">' + esc(f.help) + '</p>' : '');
    if (f.type === 'note') return '<div class="notice info">' + esc(f.text) + '</div>';
    if (f.type === 'row') return '<div class="row2">' + f.fields.map(fieldHtml).join('') + '</div>';
    if (f.type === 'list') return listHtml(f);
    return singleHtml(f, f.path);
  }

  /* ------------------------------------------------------------------ views */
  function saveBarHtml() {
    return '<div class="savebar' + (state.dirty ? ' dirty' : '') + '" id="savebar"><span class="state" id="saveState">' +
      (state.dirty ? 'You have unsaved changes' : 'All changes saved') + '</span>' +
      '<span><a class="btn" href="/" target="_blank" rel="noopener">View website</a> ' +
      '<button class="btn primary" type="button" data-act="save">Save changes</button></span></div>';
  }
  function markDirty() {
    state.dirty = true;
    var bar = $('#savebar'); if (bar) { bar.classList.add('dirty'); $('#saveState').textContent = 'You have unsaved changes'; }
  }

  function head(title, intro, right) {
    return '<div class="page-head"><div><h2>' + esc(title) + '</h2>' + (intro ? '<p>' + esc(intro) + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }

  function renderContent(id) {
    var sec = SECTIONS.filter(function (s) { return s.id === id; })[0];
    main.innerHTML = head(sec.title, sec.intro) + '<div class="panel">' + sec.fields.map(fieldHtml).join('') + '</div>' + saveBarHtml();
  }

  function renderDashboard() {
    var pub = state.works.filter(function (w) { return w.published; }).length;
    main.innerHTML = head('Welcome back', 'Manage everything on your website from here.') +
      '<div class="stat-grid">' +
      '<div class="stat-card"><b>' + pub + '</b><span>Published work samples</span></div>' +
      '<div class="stat-card"><b>' + (state.works.length - pub) + '</b><span>Hidden work samples</span></div>' +
      '<div class="stat-card"><b>' + unread() + '</b><span>Unread messages</span></div>' +
      (isSuper() ? '<div class="stat-card"><b>' + state.team.length + '</b><span>Team members</span></div>' : '') +
      '</div><div class="panel wide"><h3 style="padding-top:20px">Quick actions</h3><p class="muted">Changes go live as soon as you save.</p><div class="quick">' +
      '<button class="btn primary" data-go="works" data-new="1">Add a work sample</button>' +
      '<button class="btn" data-go="c:hero">Edit the hero</button>' +
      '<button class="btn" data-go="c:look">Change colours and fonts</button>' +
      '<button class="btn" data-go="messages">Read messages</button>' +
      '<a class="btn" href="/" target="_blank" rel="noopener">View website</a></div></div>';
  }

  function renderWorks() {
    var cards = state.works.map(function (w, i) {
      return '<article class="wcard"><div class="wthumb">' + (PF.safeUrl(w.image_url) ? '<img src="' + esc(PF.safeUrl(w.image_url)) + '" alt="" loading="lazy">' : 'No image') +
        (w.published ? '' : '<span class="badge">Hidden</span>') + '</div><div class="wbody"><b>' + esc(w.title) + '</b><small>' + esc(w.category || 'No category') + '</small>' +
        '<div class="wact"><button class="btn sm" data-act="work-edit" data-id="' + w.id + '">Edit</button>' +
        '<button class="btn sm" data-act="work-up" data-id="' + w.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move earlier">&#8592;</button>' +
        '<button class="btn sm" data-act="work-down" data-id="' + w.id + '"' + (i === state.works.length - 1 ? ' disabled' : '') + ' aria-label="Move later">&#8594;</button>' +
        '<button class="btn sm danger" data-act="work-del" data-id="' + w.id + '">Delete</button></div></div></article>';
    }).join('');
    main.innerHTML = head('Work samples', 'Add your designs and projects. The order here is the order on the website.',
      '<button class="btn primary" data-act="work-new">Add work sample</button>') +
      (state.works.length ? '<div class="works-grid">' + cards + '</div>' :
        '<div class="empty"><p><b>No work samples yet.</b></p><p>Add your first design to show it on the website.</p><button class="btn primary" data-act="work-new">Add work sample</button></div>');
  }

  function openWorkModal(id) {
    var w = id ? state.works.filter(function (x) { return x.id === id; })[0] : { title: '', category: '', description: '', image_url: '', link_url: '', published: true };
    if (!w) return;
    var seen = {}, cats = [];
    state.works.forEach(function (x) { var c = (x.category || '').trim(); if (c && !seen[c]) { seen[c] = 1; cats.push(c); } });
    modal.setAttribute('data-id', id || '');
    modal.innerHTML = '<h3>' + (id ? 'Edit work sample' : 'Add work sample') + '</h3><form id="wf">' +
      '<label for="w_title">Title</label><input type="text" id="w_title" name="title" maxlength="140" required value="' + esc(w.title) + '">' +
      '<label for="w_cat">Category</label><input type="text" id="w_cat" name="category" maxlength="40" list="catlist" value="' + esc(w.category || '') + '">' +
      '<datalist id="catlist">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<p class="help">Visitors can filter the portfolio by category. Example: Branding, Print, Social, Web.</p>' +
      '<label for="w_desc">Description</label><textarea id="w_desc" name="description" rows="4" maxlength="1500">' + esc(w.description || '') + '</textarea>' +
      '<label>Image</label>' + imageBlock('name="image_url"', w.image_url) +
      '<label for="w_link">Project link (optional)</label><input type="text" id="w_link" name="link_url" placeholder="https://" value="' + esc(w.link_url || '') + '">' +
      '<label class="toggle"><input type="checkbox" name="published"' + (w.published ? ' checked' : '') + '> Show on the website</label>' +
      '<p class="err" id="wErr"></p>' +
      '<div class="modal-foot"><button class="btn" type="button" data-act="close">Cancel</button><button class="btn primary" type="submit">Save work sample</button></div></form>';
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
  }

  function saveWork(form) {
    var id = modal.getAttribute('data-id');
    var f = form.elements;
    var row = {
      title: f.title.value.trim(), category: f.category.value.trim() || null, description: f.description.value.trim() || null,
      image_url: f.image_url.value.trim() || null, link_url: f.link_url.value.trim() || null, published: f.published.checked
    };
    if (!row.title) { $('#wErr').textContent = 'Enter a title.'; return; }
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    var q;
    if (id) q = sb.from('works').update(row).eq('id', id);
    else {
      var min = state.works.reduce(function (m, w) { return Math.min(m, w.sort_order); }, 0);
      row.sort_order = min - 1;
      q = sb.from('works').insert(row);
    }
    q.then(function (r) {
      btn.disabled = false;
      if (r.error) { $('#wErr').textContent = r.error.message; return; }
      modal.close(); toast('Work sample saved.');
      return loadWorks().then(render);
    });
  }

  function storagePath(url) {
    var m = String(url || '').match(/\/storage\/v1\/object\/public\/portfolio\/(.+)$/);
    return m ? m[1] : null;
  }

  function deleteWork(id) {
    var w = state.works.filter(function (x) { return x.id === id; })[0]; if (!w) return;
    if (!confirm('Delete "' + w.title + '"? This cannot be undone.')) return;
    sb.from('works').delete().eq('id', id).then(function (r) {
      if (r.error) return toast(r.error.message, true);
      var p = storagePath(w.image_url);
      if (p) sb.storage.from('portfolio').remove([p]);
      toast('Work sample deleted.');
      return loadWorks().then(render);
    });
  }

  function moveWork(id, dir) {
    var i = state.works.findIndex(function (w) { return w.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= state.works.length) return;
    var t = state.works[i]; state.works[i] = state.works[j]; state.works[j] = t;
    var jobs = [];
    state.works.forEach(function (w, k) {
      if (w.sort_order !== k) { w.sort_order = k; jobs.push(sb.from('works').update({ sort_order: k }).eq('id', w.id)); }
    });
    renderWorks();
    Promise.all(jobs).then(function (rs) {
      var bad = rs.filter(function (r) { return r.error; })[0];
      if (bad) { toast(bad.error.message, true); loadWorks().then(render); }
    });
  }

  function renderMessages() {
    main.innerHTML = head('Messages', 'Enquiries sent from the contact form on your website.') +
      (state.messages.length ? state.messages.map(function (m) {
        return '<div class="msg' + (m.is_read ? '' : ' unread') + '"><div class="msg-top"><b>' + esc(m.name) + '</b><span class="muted">' + esc(fmtDate(m.created_at)) + '</span></div>' +
          '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a><p>' + esc(m.message) + '</p>' +
          '<a class="btn sm primary" href="mailto:' + esc(m.email) + '?subject=' + encodeURIComponent('Re: your enquiry') + '">Reply</a> ' +
          '<button class="btn sm" data-act="msg-read" data-id="' + m.id + '">' + (m.is_read ? 'Mark as unread' : 'Mark as read') + '</button> ' +
          '<button class="btn sm danger" data-act="msg-del" data-id="' + m.id + '">Delete</button></div>';
      }).join('') : '<div class="empty"><p><b>No messages yet.</b></p><p>New enquiries will appear here.</p></div>');
  }

  function renderTeam() {
    if (!isSuper()) { main.innerHTML = head('Team', '') + '<div class="notice warn">Only the Super Admin can manage the team.</div>'; return; }
    main.innerHTML = head('Team', 'Admins can edit content and work samples. Only you, the Super Admin, can add or remove admins.') +
      '<div class="panel wide" style="padding:8px 20px 20px;margin-bottom:26px"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>' +
      state.team.map(function (p) {
        var sup = p.role === 'super_admin';
        return '<tr><td><b>' + esc(p.full_name || 'No name') + '</b></td><td>' + esc(p.email) + '</td><td><span class="tag' + (sup ? ' super' : '') + '">' + (sup ? 'Super Admin' : 'Admin') + '</span></td><td style="text-align:right">' +
          (sup ? '' : '<button class="btn sm" data-act="team-reset" data-id="' + p.id + '">Reset password</button> <button class="btn sm danger" data-act="team-del" data-id="' + p.id + '" data-email="' + esc(p.email) + '">Remove</button>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="panel"><h3 style="padding-top:22px">Add an admin</h3><p class="muted">Create their login here, then send them the email and password. They can change the password after signing in.</p>' +
      '<form id="adminForm"><div class="row2"><div><label for="a_name">Full name</label><input type="text" id="a_name" required maxlength="120"></div>' +
      '<div><label for="a_email">Email</label><input type="email" id="a_email" required></div></div>' +
      '<label for="a_pass">Temporary password</label><input type="text" id="a_pass" minlength="8" required autocomplete="off"><p class="help">At least 8 characters.</p>' +
      '<p class="err" id="aErr"></p><button class="btn primary" type="submit">Add admin</button></form></div>';
  }

  function renderAccount() {
    main.innerHTML = head('My account', '') +
      '<div class="panel"><label>Name</label><p style="margin:0">' + esc(state.profile.full_name || 'Not set') + '</p>' +
      '<label>Email</label><p style="margin:0">' + esc(state.user.email) + '</p>' +
      '<label>Role</label><p style="margin:0"><span class="tag' + (isSuper() ? ' super' : '') + '">' + (isSuper() ? 'Super Admin' : 'Admin') + '</span></p>' +
      '<div class="field-title">Change password</div><form id="pwForm"><label for="p1">New password</label><input type="password" id="p1" minlength="8" required autocomplete="new-password">' +
      '<label for="p2">Repeat new password</label><input type="password" id="p2" minlength="8" required autocomplete="new-password">' +
      '<p class="err" id="pErr"></p><button class="btn primary" type="submit">Update password</button></form></div>';
  }

  function renderSide() {
    function b(id, label, extra) {
      return '<button class="nav-btn" data-go="' + id + '"' + (state.view === id ? ' aria-current="page"' : '') + '>' + esc(label) + (extra || '') + '</button>';
    }
    var u = unread();
    side.innerHTML = '<div class="logo">Website admin</div>' +
      '<div class="who"><b>' + esc(state.profile.full_name || state.user.email) + '</b>' + (isSuper() ? 'Super Admin' : 'Admin') + '</div>' +
      b('dashboard', 'Overview') +
      '<div class="grp">Website content</div>' + SECTIONS.map(function (s) { return b('c:' + s.id, s.title); }).join('') +
      '<div class="grp">Manage</div>' + b('works', 'Work samples') + b('messages', 'Messages', u ? '<span class="pill">' + u + '</span>' : '') +
      (isSuper() ? b('team', 'Team') : '') + b('account', 'My account') +
      '<div class="spacer"></div><a class="nav-btn" href="/" target="_blank" rel="noopener">View website</a><button class="nav-btn" data-act="signout">Sign out</button>';
  }

  function render() {
    renderSide();
    var v = state.view;
    if (v === 'dashboard') renderDashboard();
    else if (v.indexOf('c:') === 0) renderContent(v.slice(2));
    else if (v === 'works') renderWorks();
    else if (v === 'messages') renderMessages();
    else if (v === 'team') renderTeam();
    else if (v === 'account') renderAccount();
    window.scrollTo(0, 0);
  }

  function go(view, opts) {
    if (state.dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    state.dirty = false; state.view = view; render();
    if (opts && opts.newWork) openWorkModal(null);
  }

  /* ------------------------------------------------------------------ data */
  function loadWorks() {
    return sb.from('works').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
      .then(function (r) { state.works = r.data || []; });
  }
  function loadMessages() {
    return sb.from('messages').select('*').order('created_at', { ascending: false }).limit(300)
      .then(function (r) { state.messages = r.data || []; });
  }
  function loadTeam() {
    return sb.from('profiles').select('*').order('created_at', { ascending: true })
      .then(function (r) { state.team = r.data || []; });
  }
  function loadContent() {
    return sb.from('site_settings').select('content').eq('id', 1).maybeSingle().then(function (r) {
      state.content = PF.deepMerge(PF.clone(PF.DEFAULTS), (r.data && r.data.content) || {});
    });
  }

  function saveContent(btn) {
    btn.disabled = true;
    sb.from('site_settings').upsert({ id: 1, content: state.content, updated_by: state.user.id, updated_at: new Date().toISOString() })
      .then(function (r) {
        btn.disabled = false;
        if (r.error) return toast(r.error.message, true);
        state.dirty = false;
        var bar = $('#savebar'); if (bar) { bar.classList.remove('dirty'); $('#saveState').textContent = 'All changes saved'; }
        toast('Saved. Your website is updated.');
      });
  }

  function api(payload) {
    return sb.auth.getSession().then(function (r) {
      var tok = r.data.session && r.data.session.access_token;
      return fetch('/api/admins', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(payload) });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok) throw new Error(j.error || 'Request failed (' + res.status + ')');
        return j;
      });
    });
  }

  /* ------------------------------------------------------------------ events */
  function rerenderKeepScroll() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  main.addEventListener('input', function (e) {
    var t = e.target, path = t.getAttribute && t.getAttribute('data-path'); if (!path) return;
    var val;
    if (t.type === 'checkbox') val = t.checked;
    else if (t.getAttribute('data-type') === 'tags') val = t.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    else val = t.value;
    setByPath(state.content, path, val);
    main.querySelectorAll('[data-path="' + path + '"]').forEach(function (x) { if (x !== t && x.type !== 'checkbox' && x.getAttribute('data-type') !== 'tags') x.value = val; });
    updatePrev(t); markDirty();
  });

  main.addEventListener('click', function (e) {
    var goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.getAttribute('data-go'), { newWork: goBtn.getAttribute('data-new') === '1' }); return; }
    if (onImageAct(e)) return;
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), path = b.getAttribute('data-path'), i = parseInt(b.getAttribute('data-i'), 10), id = b.getAttribute('data-id');

    if (act === 'save') return saveContent(b);
    if (act === 'list-add') {
      var def = findListDef(path), item = {};
      def.fields.forEach(function (sf) { item[sf.key] = ''; });
      var arr = getByPath(state.content, path) || []; arr.push(item); setByPath(state.content, path, arr);
      markDirty(); return rerenderKeepScroll();
    }
    if (act === 'list-del') {
      if (!confirm('Remove this item?')) return;
      getByPath(state.content, path).splice(i, 1); markDirty(); return rerenderKeepScroll();
    }
    if (act === 'list-up' || act === 'list-down') {
      var a = getByPath(state.content, path), j = act === 'list-up' ? i - 1 : i + 1;
      if (j < 0 || j >= a.length) return;
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp; markDirty(); return rerenderKeepScroll();
    }
    if (act === 'work-new') return openWorkModal(null);
    if (act === 'work-edit') return openWorkModal(id);
    if (act === 'work-del') return deleteWork(id);
    if (act === 'work-up') return moveWork(id, -1);
    if (act === 'work-down') return moveWork(id, 1);
    if (act === 'msg-read') {
      var m = state.messages.filter(function (x) { return x.id === id; })[0];
      return sb.from('messages').update({ is_read: !m.is_read }).eq('id', id).then(function (r) {
        if (r.error) return toast(r.error.message, true); m.is_read = !m.is_read; render();
      });
    }
    if (act === 'msg-del') {
      if (!confirm('Delete this message?')) return;
      return sb.from('messages').delete().eq('id', id).then(function (r) {
        if (r.error) return toast(r.error.message, true); return loadMessages().then(render);
      });
    }
    if (act === 'team-del') {
      if (!confirm('Remove ' + b.getAttribute('data-email') + '? They will no longer be able to sign in.')) return;
      return api({ action: 'remove', id: id }).then(function () { toast('Admin removed.'); return loadTeam().then(render); })
        .catch(function (err) { toast(err.message, true); });
    }
    if (act === 'team-reset') {
      var np = prompt('Enter a new temporary password (at least 8 characters):');
      if (!np) return;
      return api({ action: 'reset_password', id: id, password: np }).then(function () { toast('Password updated. Share it with the admin.'); })
        .catch(function (err) { toast(err.message, true); });
    }
  });

  main.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'adminForm') {
      var btn = e.target.querySelector('button'); btn.disabled = true; $('#aErr').textContent = '';
      api({ action: 'create', full_name: $('#a_name').value, email: $('#a_email').value, password: $('#a_pass').value })
        .then(function () { toast('Admin added. Share the email and password with them.'); return loadTeam().then(render); })
        .catch(function (err) { btn.disabled = false; $('#aErr').textContent = err.message; });
    }
    if (e.target.id === 'pwForm') {
      var p1 = $('#p1').value, p2 = $('#p2').value;
      if (p1 !== p2) { $('#pErr').textContent = 'The two passwords do not match.'; return; }
      sb.auth.updateUser({ password: p1 }).then(function (r) {
        if (r.error) { $('#pErr').textContent = r.error.message; return; }
        e.target.reset(); $('#pErr').textContent = ''; toast('Password updated.');
      });
    }
  });

  side.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) return go(g.getAttribute('data-go'));
    if (e.target.closest('[data-act="signout"]')) {
      if (state.dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
      state.dirty = false; sb.auth.signOut().then(showLogin);
    }
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) return modal.close();
    if (onImageAct(e)) return;
    if (e.target.closest('[data-act="close"]')) modal.close();
  });
  modal.addEventListener('input', function (e) { updatePrev(e.target); });
  modal.addEventListener('submit', function (e) { e.preventDefault(); if (e.target.id === 'wf') saveWork(e.target); });

  window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ------------------------------------------------------------------ auth */
  function showLogin() {
    $('#shell').hidden = true; $('#login').hidden = false;
    state.user = null; state.profile = null;
  }

  function boot(user) {
    return sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(function (r) {
      if (!r.data) {
        return sb.auth.signOut().then(function () {
          showLogin(); $('#loginErr').textContent = 'This account does not have admin access. Ask the Super Admin to add you.';
        });
      }
      state.user = user; state.profile = r.data; state.view = 'dashboard'; state.dirty = false;
      return Promise.all([loadContent(), loadWorks(), loadMessages(), loadTeam()]).then(function () {
        $('#login').hidden = true; $('#shell').hidden = false; render();
      });
    });
  }

  function bootFailed() {
    showLogin();
    var b = $('#loginBtn'); b.disabled = false; b.textContent = 'Sign in';
    $('#loginErr').textContent = 'Could not load the dashboard. Check that supabase/schema.sql was run and that your Supabase keys are correct.';
  }

  function init() {
    if (!sb) {
      $('#setupNotice').hidden = false; $('#loginBtn').disabled = true; return;
    }
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Signing in...'; $('#loginErr').textContent = '';
      sb.auth.signInWithPassword({ email: $('#lEmail').value.trim(), password: $('#lPass').value }).then(function (r) {
        if (r.error) { btn.disabled = false; btn.textContent = 'Sign in'; $('#loginErr').textContent = 'Email or password is incorrect.'; return; }
        return boot(r.data.user).then(function () { btn.disabled = false; btn.textContent = 'Sign in'; $('#lPass').value = ''; })
          .catch(bootFailed);
      });
    });
    sb.auth.getSession().then(function (r) { if (r.data.session) return boot(r.data.session.user).catch(bootFailed); });
    sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') showLogin(); });
  }

  init();
})();
