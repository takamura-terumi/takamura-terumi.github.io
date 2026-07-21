/* ============================================================
   高村輝美 ポートフォリオ 共通スクリプト
   （グリッド組版・ライトボックス・ヘッダー・出現アニメ）
   ============================================================ */
const Site = (() => {

  /* IntersectionObserver等のGC回収防止（関数スコープのobserverは
     参照が切れると回収され、出現アニメが永久に発火しなくなる） */
  const _held = [];
  const hold = o => { _held.push(o); return o; };

  /* ---- ジャスティファイドグリッド（行の高さを揃え、縦横比は保持） ---- */
  function layoutGrid(grid, list){
    const cards = [...grid.children];
    if(!cards.length || !list.length) return;
    const W = grid.clientWidth - 1, GAP = 24, TARGET = 304;
    if(W < 560){ cards.forEach(c => c.style.width = '100%'); return; }

    // 1) 貪欲に行を組む
    const items = cards.map((el, i) => ({el, ar: list[i].width / list[i].height}));
    const rows = [];
    let row = [], arSum = 0;
    items.forEach(it => {
      row.push(it); arSum += it.ar;
      if(arSum * TARGET + GAP * (row.length - 1) >= W){ rows.push(row); row = []; arSum = 0; }
    });
    if(row.length) rows.push(row);

    // 2) 最終行に1枚だけ孤立したら、直前行と合わせて2行に配り直す
    let rebalanced = false;
    if(rows.length >= 2 && rows[rows.length - 1].length === 1){
      const merged = rows.splice(rows.length - 2, 2).flat();
      const cut = Math.ceil(merged.length / 2);
      rows.push(merged.slice(0, cut), merged.slice(cut));
      rebalanced = true;
    }

    // 3) 各行を幅ピッタリにジャスティファイ
    rows.forEach((r, ri) => {
      const sum = r.reduce((s, it) => s + it.ar, 0);
      let h = (W - GAP * (r.length - 1)) / sum;
      const isLast = ri === rows.length - 1;
      // 通常の最終行は間延び防止で自然高さまで／配り直した行は少し大きくなるのを許容
      h = Math.min(h, isLast && !rebalanced ? TARGET : TARGET * 1.6);
      r.forEach(it => it.el.style.width = (it.ar * h).toFixed(1) + 'px');
    });
  }

  /* ---- カード生成。lbList=ライトボックスで前後送りする集合（省略時はlist） ---- */
  function buildGrid(grid, list, lbList){
    const navList = lbList || list;
    list.forEach((w, i) => {
      const c = document.createElement('div');
      c.className = 'card reveal';
      c.style.transitionDelay = (i % 3 * 0.08) + 's';
      const spec = [w.size, w.materials].filter(Boolean).join('　');
      c.innerHTML = `<div class="frame"><img src="${w.file}" alt="${w.title}" width="${w.width}" height="${w.height}" loading="lazy"></div>
        <div class="info"><h3>${w.title}</h3><div class="year">${w.year}制作</div>${spec ? `<div class="spec">${spec}</div>` : ''}</div>`;
      c.onclick = () => openLb(navList, navList.indexOf(w));
      grid.appendChild(c);
    });
  }

  /* ---- ライトボックス ---- */
  let lbWorks = [], cur = 0;
  function openLb(list, i){
    lbWorks = list; cur = i;
    const w = list[i];
    document.getElementById('lb-img').src = w.file;
    document.getElementById('lb-title').textContent = w.title;
    document.getElementById('lb-sub').textContent = w.subtitle || '';
    document.getElementById('lb-year').textContent =
      `${w.year}制作${w.size ? '　' + w.size : ''}${w.materials ? '　' + w.materials : ''}${w.award ? '　／　' + w.award : ''}`;
    document.getElementById('lb-cap').textContent = (w.caption || '').replace(/（[^）]*制作）$/, '');
    document.getElementById('lb-count').textContent =
      `${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    const lb = document.getElementById('lb');
    if(!lb.open) lb.showModal();
  }
  function initLightbox(){
    const lb = document.getElementById('lb');
    document.getElementById('lb-close').onclick = () => lb.close();
    document.getElementById('lb-prev').onclick = () => openLb(lbWorks, (cur - 1 + lbWorks.length) % lbWorks.length);
    document.getElementById('lb-next').onclick = () => openLb(lbWorks, (cur + 1) % lbWorks.length);
    addEventListener('keydown', e => {
      if(!lb.open) return;
      if(e.key === 'ArrowLeft') openLb(lbWorks, (cur - 1 + lbWorks.length) % lbWorks.length);
      if(e.key === 'ArrowRight') openLb(lbWorks, (cur + 1) % lbWorks.length);
    });
  }

  /* ---- スクロール出現 ---- */
  function reveal(){
    const io = hold(new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
    }), {threshold:.12}));
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    // 保険：observerが何らかの理由で発火しない環境でも、コンテンツを見えないままにしない
    setTimeout(() => {
      if(!document.querySelector('.reveal.on'))
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('on'));
    }, 4000);
  }

  /* ---- ヘッダー背景＋ハンバーガーメニュー ---- */
  function chrome(){
    const hd = document.querySelector('header');
    addEventListener('scroll', () => hd.classList.toggle('scrolled', scrollY > 40));
    const menuBtn = document.getElementById('menu-btn');
    const navEl = document.getElementById('nav');
    if(!menuBtn || !navEl) return;
    const closeMenu = () => {
      menuBtn.classList.remove('open'); navEl.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'メニューを開く');
    };
    const openMenu = () => {
      menuBtn.classList.add('open'); navEl.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'メニューを閉じる');
    };
    menuBtn.addEventListener('click', () => navEl.classList.contains('open') ? closeMenu() : openMenu());
    navEl.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    addEventListener('resize', () => { if(innerWidth > 700) closeMenu(); });
  }

  /* ---- リサイズ時の再組版（ページ側で対象グリッドを登録） ---- */
  function autoRelayout(pairs){
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => pairs.forEach(([g, l]) => layoutGrid(g, l)), 150); });
  }

  return {layoutGrid, buildGrid, openLb, initLightbox, reveal, chrome, autoRelayout, hold};
})();
