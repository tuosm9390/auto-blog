---
title: 'Next.js와 AI로 구축하는 실시간 투자 플랫폼: 시세 조회부터 SMC 전략 분석까지'
date: '2026-02-15T09:15:29.207Z'
summary: >-
  실시간 바이낸스 데이터와 Google Gemini AI를 결합하여 투자 인사이트를 제공하는 플랫폼, Invesight의 핵심 기능을
  구현했습니다. WebSocket 기반의 실시간 시세 반영부터 SMC/ICT 전략을 활용한 AI 예측 모델 구축까지의 기술적 여정을 다룹니다.
repo: tuosm9390/investment-platform
commits:
  - 59e43645b3272bf28f191e4081c68e416e38bbc3
  - aec781784536cdb1b90b5da277da7f83220b2f19
  - d8598ff32e0e4fec2376beb58d93e092569ae55a
  - 1e846f7c13568ddef7211dec56560543a1509db1
  - 4d60a09900c3f77bb70cb2cbf930b878dc0c9829
  - 85c77f38fe38640694f37f890d236b1ecb7e21ba
  - 4f8fe4fd18dcb51cc30423f3d860e0fa8f5b4877
  - fca3eb67aa2eb5f0967a5fcfb3c6de506aa0635d
  - d9a2ddccac8a3c2ea871000362846a8beb789b6f
tags:
  - Next.js
  - AI
  - Binance API
  - FinTech
  - WebSocket
  - Gemini
---
## 1. 투자 플랫폼 Invesight의 시작: 정보의 파편화를 해결하다

단순한 뉴스 나열을 넘어, 실시간 시세 데이터와 전문가급 투자 전략(SMC/ICT)을 AI가 분석해주는 통합 플랫폼 **Invesight**를 개발했습니다. 이번 프로젝트의 핵심은 '데이터의 실시간성'과 '분석의 전문성'을 동시에 확보하는 것이었습니다.

## 2. 데이터 파이프라인: WebSocket과 Fallback 전략

투자 플랫폼에서 가장 중요한 것은 끊김 없는 가격 데이터입니다. 바이낸스의 `!ticker@arr` 스트림을 활용해 전 세계 암호화폐의 실시간 시세와 24시간 변동률을 확보했습니다.

### 실시간 시세 동기화 (WebSocket)
단순히 가격만 보여주는 것이 아니라, 24시간 변동폭(`P`)을 실시간으로 반영하도록 구현했습니다. 

```typescript
// src/lib/prices.ts
// 24시간 변동률을 포함하는 전체 티커 스트림 활용
export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';

// src/app/search/[topic]/prices/page.tsx 내 업데이트 로직
const data: BinanceTickerStream[] = JSON.parse(event.data);
setAllCryptoPrices((prev) => {
  const priceMap = new Map(data.map((t) => [t.s, t]));
  return prev.map(crypto => {
    const ticker = priceMap.get(`${crypto.symbol.toUpperCase()}USDT`);
    return ticker ? {
      ...crypto,
      current_price_usd: parseFloat(ticker.c),
      price_change_percentage_24h: parseFloat(ticker.P)
    } : crypto;
  });
});
```

또한, 특정 API 장애에 대비해 **Binance → CoinCap**으로 이어지는 Fallback 메커니즘과 환율 API(Frankfurter) 캐싱 로직을 추가하여 안정성을 높였습니다.

## 3. AI 투자 전망: SMC/ICT 전략의 페르소나 주입

단순한 AI 요약이 아닌, 전문 트레이더의 관점을 제공하기 위해 **Smart Money Concepts (SMC)**와 **Inner Circle Trader (ICT)** 전략을 프롬프트 엔지니어링에 녹여냈습니다.

- **Order Block & FVG 탐지**: 차트상의 급격한 움직임이 발생한 구간(footprint)을 식별하도록 프롬프트를 구성했습니다.
- **기술 지표 계산**: 서버사이드에서 직접 RSI, MACD, EMA를 계산하여 AI에게 원천 데이터를 제공함으로써 분석의 신뢰도를 높였습니다.

```typescript
// src/app/api/ai/predict/route.ts
// 기술 지표와 함께 주입되는 분석 프롬프트의 핵심
const smcPrompt = `
  Analyze ${symbol} based on SMC & ICT patterns:
  1. MSS/CHoCH: Identify trend reversals.
  2. FVG: Look for price imbalances.
  3. Order Blocks: Find institutional liquidity zones.
  Confluence Rule: Need at least 3 signals for a valid setup.
`;
```

## 4. 시각화와 UX: 트레이딩 뷰의 전문성을 웹으로

금융 데이터는 가독성이 생명입니다. `lightweight-charts`를 사용해 오더블록과 타겟가, 손절가를 차트에 시각화했으며, 초보자를 위해 어려운 용어를 쉽게 설명해주는 **용어 사전(Glossary) 툴팁** 기능을 구현했습니다.

- **반응형 대시보드**: 모바일에서도 시세 테이블이 깨지지 않도록 가로 스크롤과 핵심 정보 위주의 레이아웃을 설계했습니다.
- **투자 유의사항 고지**: AI 분석의 한계를 명시하고 투자 책임을 안내하는 Disclaimer 컴포넌트를 배치하여 서비스의 신뢰성을 더했습니다.

## 5. 개발 중 직면한 과제와 해결책

### TypeScript의 엄격한 타입 안정성
에러 핸들링 시 `any` 타입을 `unknown`으로 리팩토링하고, `instanceof Error` 체크를 통해 타입 안전성을 강화했습니다. 이는 복잡한 외부 API 연동 시 예기치 못한 런타임 에러를 방지하는 데 큰 도움이 되었습니다.

### API 레이트 리밋 해결
바이낸스 API 호출 시 실패할 경우 1초의 지연 시간을 두는 **Retry 로직(최대 3회)**을 구현하여 배포 환경에서의 안정적인 데이터 수급을 보장했습니다.

## 6. 마치며

이번 업데이트를 통해 Next.js의 App Router와 AI 모델을 결합하여 실질적으로 동작하는 투자 보조 도구를 구축할 수 있었습니다. 특히 서버에서 계산된 기술 지표를 AI에게 제공하는 방식이 분석 결과의 퀄리티를 비약적으로 상승시킨다는 점이 인상적이었습니다. 앞으로는 주식 시장 데이터의 실시간 크롤링 성능을 더욱 개선해볼 계획입니다.
