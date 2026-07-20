# 안압케어 (AnapCare) — 녹내장 통합관리 앱

CVT200 안압계를 중심으로 **안압 · 점안 · 전자문진 · 웨어러블 건강데이터**를 하나의 환자 앱에 통합하고,
임상적으로 의미 있는 데이터를 **의료진 웹**으로 전달하는 녹내장 통합관리 솔루션의 프로토타입입니다.

> C&V Tech · CVT200 Companion · **프로토타입 / 데모용 (샘플 데이터)**

---

## 주요 기능

### 환자 앱
- **홈** — 최근 안압, 점안 순응도 그래프(오늘/2주/1개월/3개월/6개월/1년/누적), 알림 배너
- **안압 (IOP)** — 실시간 다회 측정(원시값), 일자별 평균+최소·최대, 기간 프리셋/날짜 직접 선택, **좌/우 목표 안압 입력**(전 화면 연동)
- **점안** — 성분명별 라이브러리(제조사·제형) 또는 직접 입력으로 약·시간 등록. **30분 전 미리 알림 + 예정 시간 초과 자동 알람**, **푸시 알림 토글**
- **전자 문진 (12항목)** — 옵션 선택 + 저장/이전. 위험도·안내는 의료진 웹 전용
- **건강 (웨어러블)** — Apple Watch(HealthKit)·Galaxy Watch(Samsung Health) 수집 지표 전체:
  활동(걸음·거리·층수·칼로리·운동시간·서있기·VO₂max), 심장(심박·안정심박·범위·HRV·IRN·ECG·고저심박알림),
  수면(총시간·깊은/렘/얕은/깬·SpO₂·호흡수·코골이·수면점수), 신체·기타(SpO₂·피부온도·스트레스·체성분·혈압·마음챙김·낙상·소음).
  플랫폼별 제공 여부 배지(Apple·Galaxy/전용) 및 문진 자동 반영(Q2·Q3·Q9·Q10·Q11) 표시.

### 의료진 웹
- 안압 추세(실시간/기간, 평균+범위, 날짜 선택), 처방 점안제, 문진 12항목(위험도 배지 호버 → 맞춤 안내), 점안–안압 병렬 시각화(SaMD 경계 준수)

---

## 푸시 알림 아키텍처

| 단계 | 동작 | 구현 위치 |
|---|---|---|
| 앱(탭) 활성/백그라운드 | Notification API + Service Worker `showNotification` → OS 알림 | `App.jsx` `usePushNotifications`, `public/sw.js` |
| 탭 백그라운드 예약 | 페이지 → SW `SCHEDULE_MED_ALERTS` 메시지로 로컬 알림 예약 | `src/push.js` `scheduleLocalAlerts` |
| **앱 완전 종료** | **서버 발송 Web Push** — SW `push` 이벤트가 수신·표시 | `public/sw.js`, `src/push.js` `subscribeWebPush(VAPID)` |

앱이 완전히 꺼진 상태에서 알림을 받으려면 백엔드에서 Web Push(VAPID, `web-push` 라이브러리) 또는 FCM으로
점안 예정 시각(30분 전/초과)에 푸시를 발송해야 합니다. 클라이언트 측(SW 수신·구독 생성·알림 클릭 처리)은
이 저장소에 모두 구현되어 있으며, `subscribeWebPush()`가 반환하는 구독 객체를 서버에 저장한 뒤 발송하면 됩니다.

> 참고: Service Worker/푸시는 HTTPS(또는 localhost)에서 동작합니다. iOS Safari는 홈 화면에 추가된 PWA에서 Web Push를 지원합니다.

---

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview
```

상단 토글로 **환자 앱 ↔ 의료진 웹** 전환. 점안 화면의 **푸시 알림 켜기**로 브라우저 알림 권한을 요청한 뒤,
데모용 현재 시각을 조정해 30분 전 알림·초과 알람 발송을 확인할 수 있습니다.

---

## 구조

```
anapcare-glaucoma-app/
├─ index.html                  # manifest·Tailwind CDN
├─ public/
│  ├─ sw.js                    # push 수신·로컬 예약·알림 클릭
│  └─ manifest.webmanifest     # PWA 매니페스트
├─ src/
│  ├─ main.jsx                 # SW 등록 + React 마운트
│  ├─ push.js                  # SW 등록·Web Push 구독·로컬 예약 유틸
│  ├─ App.jsx                  # 앱 전체 (환자 앱 + 의료진 웹)
│  └─ index.css
└─ package.json / vite.config.js
```

---

## 주의 사항

- 프로토타입이며 수치·환자 데이터·제품 매핑·워치 지표 값은 **샘플**입니다. 일부 워치 지표는 기기 모델·국가·OS 버전에 따라 제공 여부가 다릅니다(혈압은 Galaxy 커프 보정 필요, ECG/IRN은 선별 목적).
- 문진·위험도 기준, 측정 신뢰도 정책, 상관 시각화 표시 범위는 **임상 검증 및 규제(SaMD) 검토**가 필요합니다.
- 실제 서비스의 종료 상태 푸시는 백엔드 푸시 서버(VAPID/FCM/APNs) 연동이 필요합니다(클라이언트 스캐폴딩 포함).

## License

Proprietary © C&V Tech. All rights reserved. 내부 검토용.
