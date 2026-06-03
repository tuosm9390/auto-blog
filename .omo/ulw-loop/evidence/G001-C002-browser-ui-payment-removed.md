# G001-C002 Browser UI Payment Removal Evidence

status: pass
browser: Chrome (extension, -c8b1-4218-ba7f-5788d56d5e3f)
server: Next dev server on http://127.0.0.1:3000
note: initial iab lookup was unavailable; the available Browser plugin Chrome extension surface was used. A 3210 attempt showed admin redirects to localhost:3000, so the final browser pass used port 3000.
forbidden visible text terms: 결제, 구독, Billing, Subscription, Pricing, 요금제
forbidden link fragments: pricing, subscription, portone, billing

## http://127.0.0.1:3000/ko/settings
finalUrl: http://127.0.0.1:3000/ko/settings
title: 설정 | AI Tech Blog
error: none
visibleTextLength: 154
textMatches: []
linkMatches: []
sampleText:
```
Synapso.dev
서비스 소개
English
Sign In
로그인이 필요합니다

이 기능을 이용하려면 먼저 로그인해주세요.

로그인

© 2026 Synapso.dev. All rights reserved.

devcraft0416@gmail.com
이용약관
업데이트 노트
```
snapshotExcerpt:
```
- banner:
  - link "Synapso.dev Synapso.dev":
    - /url: /ko
    - img "Synapso.dev"
    - generic: Synapso.dev
  - navigation:
    - link "서비스 소개":
      - /url: /ko/about
    - button "언어":
      - generic: English
    - button "Sign In"
- main
- contentinfo:
  - paragraph: © 2026 Synapso.dev. All rights reserved.
  - link "devcraft0416@gmail.com":
    - /url: mailto:devcraft0416@gmail.com
    - text: devcraft0416@gmail.com
  - link "이용약관":
    - /url: /ko/terms
  - link "업데이트 노트":
    - /url: /ko/changelog
- region "Notifications alt+T"
- button "Open Next.js Dev Tools":
- alert
```

## http://127.0.0.1:3000/ko/admin-portal-v5-secret
finalUrl: http://127.0.0.1:3000/ko/about
title: AI-native 프로젝트 메모리 | Synapso.dev
error: none
visibleTextLength: 113
textMatches: []
linkMatches: []
sampleText:
```
Synapso.dev
서비스 소개
English
Sign In

© 2026 Synapso.dev. All rights reserved.

devcraft0416@gmail.com
이용약관
업데이트 노트
```
snapshotExcerpt:
```
- banner:
  - link "Synapso.devSynapso.dev":
    - /url: /ko
    - img "Synapso.dev"
    - text: Synapso.dev
  - navigation:
    - link "서비스 소개":
      - /url: /ko/about
    - button "언어":
      - text: English
    - button "Sign In"
  - button "언어":
    - text: English
  - button "Menu Open"
- main
- contentinfo:
  - paragraph: © 2026 Synapso.dev. All rights reserved.
  - link "devcraft0416@gmail.com":
    - /url: mailto:devcraft0416@gmail.com
    - text: devcraft0416@gmail.com
  - link "이용약관":
    - /url: /ko/terms
  - link "업데이트 노트":
    - /url: /ko/changelog
- region "Notifications alt+T"
```