/* Cover hero — lazy, poster-first, reduced-motion-safe.
   The poster is the LCP element and loads immediately; the video carries NO
   <source> until this script injects them once the hero scrolls near view.
   Under prefers-reduced-motion the video is never loaded or played. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function setup(fig) {
    var video = fig.querySelector('.cover-hero__video');
    if (!video) return;
    var loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      var webm = video.getAttribute('data-webm');
      var mp4 = video.getAttribute('data-mp4');
      if (webm) { var sw = document.createElement('source'); sw.src = webm; sw.type = 'video/webm'; video.appendChild(sw); }
      if (mp4)  { var sm = document.createElement('source'); sm.src = mp4;  sm.type = 'video/mp4';  video.appendChild(sm); }
      video.load();
      video.addEventListener('playing', function () { fig.classList.add('is-playing'); }, { once: true });
      var p = video.play();
      if (p && p.catch) p.catch(function () {}); // autoplay blocked → poster remains
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { load(); io.disconnect(); } });
      }, { rootMargin: '200px' });
      io.observe(fig);
    } else {
      load();
    }
  }

  document.querySelectorAll('.cover-hero[data-cover-video]').forEach(setup);
})();
