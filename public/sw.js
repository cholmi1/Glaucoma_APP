/* 안압케어 Service Worker
   - push: 서버(Web Push/FCM)에서 보낸 푸시를 앱 종료 상태에서도 수신·표시
   - message(SCHEDULE_MED_ALERTS): 페이지가 전달한 점안 일정으로 로컬 알림 예약
   - notificationclick: 알림 탭 → 앱 열기/포커스
*/
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// 서버 발송 Web Push 수신 (앱/탭 종료 상태 포함)
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data && event.data.text() }; }
  const title = data.title || "안압케어";
  const options = {
    body: data.body || "점안 시간을 확인해 주세요.",
    tag: data.tag || "anapcare",
    data: { url: data.url || "/" },
    badge: data.badge, icon: data.icon,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return self.clients.openWindow(url);
    })
  );
});

// 페이지에서 전달한 점안 일정으로 로컬 알림 예약 (SW가 살아있는 동안 유효.
// 브라우저가 SW를 종료하면 예약이 사라지므로, 앱 완전 종료 대응은 서버 푸시 필요)
const timers = new Map();
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type !== "SCHEDULE_MED_ALERTS" || !Array.isArray(msg.alerts)) return;
  timers.forEach((t) => clearTimeout(t)); timers.clear();
  const now = Date.now();
  msg.alerts.forEach((a) => {
    const delay = a.at - now;
    if (delay <= 0 || delay > 12 * 3600 * 1000) return;
    timers.set(a.tag, setTimeout(() => {
      self.registration.showNotification(a.title, { body: a.body, tag: a.tag, data: { url: "/" } });
    }, delay));
  });
});
