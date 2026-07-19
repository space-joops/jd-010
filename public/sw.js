/**
 * 아스트로펫 티저 서비스워커.
 *
 * 버전은 등록 URL의 ?v= 쿼리에서 읽는다 — URL이 바뀌면 브라우저가 새 SW로
 * 취급하는 규칙을 이용하므로, 배포 시 package.json version만 올리면 된다.
 * 캐싱: 내비게이션은 네트워크 우선(오프라인 시 캐시된 셸),
 * 해시가 붙는 정적 자원(/_next/static, 아이콘)은 캐시 우선.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `astropet-teaser-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  // 이전 버전 캐시 정리
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // POST /api/preregister 등은 건드리지 않는다

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/"))
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
