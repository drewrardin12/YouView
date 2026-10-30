/* YouView interface icons. Decorative SVGs never replace accessible button names. */
(() => {
  'use strict';
  const sprite = './assets/ui-icons.svg?v=icons-1';
  const svg = name => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('class', 'ui-icon');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    const use = document.createElementNS(el.namespaceURI, 'use');
    use.setAttribute('href', `${sprite}#${name}`);
    el.append(use);
    return el;
  };
  const ids = {
    back10:'back10', forward10:'forward10', minimize:'mini', 'close-player':'close',
    'retry-player':'retry', 'previous-short':'up', 'next-short':'down',
    'short-channel':'channels', 'short-share':'share', 'not-short':'not-short',
    share:'share', 'replay-video':'replay', 'mark-short':'mark-short', 'youtube-link':'external',
    'clear-history':'trash', 'undo-clear-history':'undo', 'share-channel':'share',
    'broaden-channel-search':'channels', 'refresh-live-view':'refresh', 'check-live':'live',
    'carousel-prev':'chevron-left', 'carousel-next':'chevron', 'clear-channel-name':'close',
    'clear-search':'close', 'index-history':'archive', 'stop-index':'pause',
    'index-all':'archive', 'stop-all-index':'pause', 'sync-now':'sync', 'sync-out':'sign-out',
    'clear-key':'key', 'reset-counters':'refresh', export:'export',
    older:'load-more', 'more-results':'load-more', 'remote-search':'search', 'more-search':'load-more',
    'retry-playlists':'retry', 'more-playlists':'load-more', 'back-playlists':'back',
    'play-playlist':'play-all', 'more-playlist-entries':'load-more',
    'all-playlist-entries':'archive', 'stop-playlist-loading':'stop',
    'refresh-chapters':'refresh', 'more-chapters':'search', 'skip-startup':'forward', refresh:'refresh'
  };
  const routes = {home:'home',shorts:'shorts',channels:'channels',you:'you',continue:'continue',history:'history',playlists:'playlist',live:'live',settings:'settings',search:'search'};
  const filters = {All:'all',Packers:'packers',NFL:'nfl',NBA:'nba',Golf:'golf',Ministry:'ministry',Other:'other',Latest:'newest',Popular:'popular',Oldest:'oldest',Videos:'videos',Shorts:'shorts',Live:'live',Playlists:'playlist',Channels:'channels',Home:'home',About:'about'};
  const actions = {'data-remove-history':'remove-entry','data-resume':'play','data-restart':'restart','data-home-restart':'restart','data-dismiss-shelf':'remove-entry','data-share-video':'share','data-remove':'remove-channel'};
  const labels = {'Search':'search','Find':'search','Clear':'close','Manage':'manage','Connect':'connect','Connect YouTube':'connect','Sign in and sync':'sign-in','Add channel':'add-channel','Your library':'you','Your channels':'channels','Open settings':'settings','Retry':'retry','Check activity':'refresh','Refresh chapters':'refresh','Search more comments':'search'};
  // Limit label matching to actual controls, never titles, creator names or descriptions.
  function decorate(el, name, iconOnly = false) {
    if (!name) return;
    if (el.querySelector(':scope > .ui-icon')) return;
    // Existing glyphs are text nodes; retain real labels and nested inputs.
    for (const node of [...el.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/[⌂▷▦◉◷↺▤⚙↗↻▶✕×↑↓←→▱●]/gu, '').replace(/↶10|10↷/gu, '').trim();
      }
    }
    if (iconOnly) {
      const text = el.textContent.trim();
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text || name);
      for (const node of [...el.childNodes]) if (node.nodeType === Node.TEXT_NODE) node.remove();
      el.classList.add('icon-only');
    }
    el.prepend(svg(name));
    el.classList.add('has-ui-icon');
  }
  function apply(root) {
    if (!(root instanceof Element) || root.closest('svg, #ytplayer, iframe')) return;
    const controls = [...(root.matches('button, a, summary, label.pill') ? [root] : []), ...root.querySelectorAll('button, a, summary, label.pill')];
    for (const el of controls) {
      if (el.closest('#ytplayer, iframe') || el.matches('.brand, .account-avatar, .hero-channel, .home-video-channel, .home-video-title, .history-channel, .history-title, #player-channel, .channel, .home-channel, .network-card, .playlist-owner, .related-item, .chapter-row')) continue;
      const tile = el.querySelector('.tile-icon');
      if (tile) {
        if (!tile.querySelector('svg')) tile.replaceChildren(svg(routes[el.dataset.nav] || 'chevron'));
        const end=el.lastElementChild;
        if(end && end!==tile && !end.querySelector('svg')) {end.replaceChildren(svg('chevron'));end.setAttribute('aria-hidden','true');}
        continue;
      }
      if (el.matches('.home-video-menu button, .shelf-menu button') && el.hasAttribute('data-channel')) {decorate(el,'channels');continue;}
      let name = ids[el.id], only = ['back10','forward10','minimize','close-player','carousel-prev','carousel-next'].includes(el.id) || el.matches('.history-remove, [data-remove]');
      if (el.matches('aside [data-nav]')) name=routes[el.dataset.nav];
      if (el.matches('[data-filter]')) {name=filters[el.dataset.filter];el.classList.add('category-icon-chip');}
      if (el.matches('[data-search-kind]')) name=filters[el.dataset.searchKind];
      if (el.matches('[data-tab]')) name=filters[el.dataset.tab];
      if (el.matches('[data-player-detail]')) name=({Chapters:'chapters',Description:'description',Related:'related'})[el.dataset.playerDetail];
      if (el.matches('.channel-collections [data-channel-tab]')) {
        const slot=el.querySelector('span'); if(slot&&!slot.querySelector('svg')) slot.replaceChildren(svg(filters[el.dataset.channelTab])); continue;
      }
      if (el.matches('.shelf-menu > summary, .short-more > summary')) name='more';
      if (el.matches('.channel-management > summary')) name='manage';
      if (el.matches('.details details > summary') && !name) name='description';
      if (el.matches('a[target="_blank"]') && !name) name='external';
      if (el.matches('.settings-jump a')) name=({'#settings-youtube':'connect','#settings-archives':'archive','#settings-sync':'sync','#settings-storage':'storage','#settings-install':'install'})[el.getAttribute('href')];
      if (el.matches('[data-open]') && !name) name='channels';
      if (el.matches('.text-action, [data-channel-videos]') && !name) name='chevron';
      for (const [attr,icon] of Object.entries(actions)) if(el.hasAttribute(attr)) name=icon;
      if (el.matches('form button') && !name) {
        const form=el.closest('form'); name=({keyform:'connect','sync-form':'sign-in',addform:'add-channel',searchform:'search','library-search':'search','history-search-form':'search','channel-search-form':'search','channel-selector-search':'search'})[form.id];
      }
      if (el.matches('label.pill') && el.querySelector('input[type=file]')) name='import';
      if (!name && !el.querySelector('img, svg, strong')) name=labels[el.textContent.trim()];
      decorate(el,name,only);
    }
    for (const art of root.querySelectorAll('.playlist-art')) {
      if (!art.querySelector('svg')) {for(const n of [...art.childNodes]) if(n.nodeType===Node.TEXT_NODE)n.remove();art.prepend(svg('playlist'));}
    }
    for (const badge of root.querySelectorAll('.approved-pill')) {
      if(!badge.querySelector('svg')) {badge.textContent=badge.textContent.replace('✓','').trim();badge.prepend(svg('approved'));badge.classList.add('has-ui-icon');}
    }
    for (const empty of root.querySelectorAll('.empty .big')) {if(!empty.querySelector('svg'))empty.replaceChildren(svg('videos'));}
    for (const duration of root.querySelectorAll('.duration')) {
      if(duration.textContent.includes('🔴')) duration.textContent=duration.textContent.replace('🔴','').trim();
    }
  }
  window.YouViewIcons = Object.freeze({create:svg, apply});
  function start() {
    apply(document.body);
    const observer=new MutationObserver(records=>{
      const roots=new Set();
      for(const record of records) {
        if(record.target instanceof Element && record.target.closest('svg')) continue;
        if(record.type==='characterData') {
          const control=record.target.parentElement?.closest('button, a, summary');if(control)roots.add(control);
        } else {
          // Replacing a button's text removes its SVG; update that control as well.
          if(record.target instanceof Element && record.target.matches('button, a, summary')) roots.add(record.target);
          for(const node of record.addedNodes) if(node instanceof Element && node.tagName.toLowerCase()!=='svg') roots.add(node);
        }
      }
      for(const root of roots) if(root.isConnected)apply(root);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
