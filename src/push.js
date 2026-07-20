/* 푸시 알림 유틸리티
   1) registerServiceWorker(): sw.js 등록 → 백그라운드 알림 표시 기반
   2) subscribeWebPush(vapidPublicKey): 서버 발송용 Web Push 구독 생성
      - 구독 객체를 백엔드에 저장하고, 서버(web-push 라이브러리/FCM)에서
        점안 시각에 맞춰 푸시를 발송하면 "앱이 완전히 꺼져 있어도" 알림이 울립니다.
   3) scheduleLocalAlerts(alerts): SW에 로컬 예약 전달(탭 백그라운드 대응)
*/
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); }
  catch (e) { console.warn("SW register failed", e); return null; }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeWebPush(vapidPublicKey) {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  // TODO: fetch("/api/push/subscribe", { method:"POST", body: JSON.stringify(sub) })
  return sub;
}

export async function scheduleLocalAlerts(alerts) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (reg.active) reg.active.postMessage({ type: "SCHEDULE_MED_ALERTS", alerts });
}
