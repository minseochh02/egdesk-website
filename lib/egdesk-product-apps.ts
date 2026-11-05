import type { EgdeskProductAppConfig } from '@/app/components/landing/EgdeskProductAppPage';

export const RECORDER_PRODUCT: EgdeskProductAppConfig = {
  slug: 'recorder',
  activeNav: 'recorder',
  pageUrl: 'https://egdesk.cloud/recorder',
  downloadUrl: '/download/recorder/latest',
  downloadLabel: 'Recorder 다운로드',
  iconFile: 'icon-recorder.svg',
  badge: 'EGDesk Recorder',
  sectionThemeClass: 'product-app-theme--recorder',
  metadataTitle: 'EGDesk Recorder | 브라우저·데스크톱 녹화 자동화',
  metadataDescription:
    '웹 로그인·ERP·데스크톱 화면을 녹화하고 반복 업무 흐름을 자동화하는 EGDesk Recorder 데스크톱 앱입니다.',
  softwareName: 'EGDesk Recorder',
  softwareAlternateName: 'EGDesk Recorder Desktop',
  heroTitleLine1: '브라우저와 데스크톱',
  heroTitleHighlight: '업무 녹화',
  heroTitleLine2: '를 하나의 앱에서',
  heroDescription:
    'EGDesk Recorder는 웹 로그인 녹화, 데스크톱 ERP 조작, 스케줄 실행을 연결해 반복 업무를 기록하고 재생하는 EGDesk 전용 앱입니다.',
  summaryLabel: 'Workflow Capture',
  summaryTitle: '기록 → 재생 → 자동화까지 이어지는 흐름',
  checklist: [
    '브라우저 로그인·폼 입력 녹화',
    '데스크톱 ERP / 창 조작 캡처',
    '스케줄·MCP 연동 워크플로',
    'EGDesk 생태계와 동일 계정 연동',
  ],
  featuresTitle: 'Recorder 핵심 기능',
  featuresSubtitle: '웹과 데스크톱을 아우르는 녹화·자동화 도구를 하나의 앱으로 제공합니다.',
  features: [
    {
      title: '브라우저 녹화',
      description: '로그인·데이터 입력·다운로드 흐름을 브라우저에서 그대로 기록합니다.',
    },
    {
      title: '데스크톱 녹화',
      description: 'ERP, 회계, 사내 프로그램 조작을 화면 단위로 캡처하고 재생합니다.',
    },
    {
      title: '워크플로 연동',
      description: 'EGDesk MCP·스케줄러와 연결해 기록한 흐름을 자동 실행 파이프라인으로 확장합니다.',
    },
  ],
  infoTitle: 'Recorder 도입 시 확인 사항',
  infoSubtitle: '녹화 대상 프로그램, 실행 환경, 보안 정책을 먼저 정리하면 도입이 수월합니다.',
  infoCards: [
    {
      title: '로컬 PC 실행',
      description: '녹화와 재생은 사용자 PC에서 동작하도록 설계되어 사내 업무 환경에 맞게 구성합니다.',
    },
    {
      title: '대상 앱 범위',
      description: '브라우저 기반 SaaS와 Windows/macOS 데스크톱 앱 중 어떤 흐름을 자동화할지 상담 시 정합니다.',
    },
    {
      title: 'EGDesk와 함께 사용',
      description: '메인 EGDesk, 원클릭로그인, 인터넷뱅킹AI와 같은 계정·인프라 위에서 확장됩니다.',
    },
  ],
  faq: [
    {
      question: 'EGDesk 본 앱과 무엇이 다른가요?',
      answer:
        'Recorder는 녹화·재생·스케줄 실행에 특화된 별도 Electron 앱입니다. EGDesk 본체와 함께 설치해 사용합니다.',
    },
    {
      question: 'Windows와 macOS를 지원하나요?',
      answer: 'GitHub Releases에서 제공하는 최신 설치 파일 기준으로 Windows·macOS용 빌드를 배포합니다.',
    },
    {
      question: '녹화 파일은 어디에 저장되나요?',
      answer: '저장 위치와 보관 정책은 사용자 환경과 설정에 따라 달라질 수 있어, 도입 전 경로와 백업 방식을 함께 확인합니다.',
    },
  ],
  contactTitle: 'Recorder 도입 상담',
  contactSubtitle: '녹화하려는 사이트·프로그램과 반복 주기를 남겨 주시면 적용 범위를 안내드립니다.',
  contactProductName: 'EGDesk Recorder',
  contactStorageKey: 'egdesk_recorder_latest_inquiry',
  contactScopeLabel: '희망 녹화 / 자동화 범위',
  tags: ['#업무자동화', '#RPA', '#브라우저녹화', '#데스크톱녹화'],
  panelStatus: 'Capture & Replay',
  panelTitle: '[Recorder] 핵심 기능',
};

export const ONECLICK_PRODUCT: EgdeskProductAppConfig = {
  slug: 'oneclick',
  activeNav: 'oneclick',
  pageUrl: 'https://egdesk.cloud/oneclick',
  downloadUrl: '/download/oneclick/latest',
  downloadLabel: '원클릭로그인 다운로드',
  iconFile: 'icon-oneclick.svg',
  badge: '원클릭로그인',
  sectionThemeClass: 'product-app-theme--oneclick',
  metadataTitle: '원클릭로그인 | 웹사이트 로그인 녹화·자동 로그인',
  metadataDescription:
    '웹사이트 로그인을 한 번 녹화해 이후 원클릭으로 자동 로그인하는 EGDesk OneClick 데스크톱 앱입니다.',
  softwareName: '원클릭로그인',
  softwareAlternateName: 'EGDesk OneClick Login',
  heroTitleLine1: '웹사이트 로그인을',
  heroTitleHighlight: '한 번 녹화',
  heroTitleLine2: '하고 원클릭으로 실행',
  heroDescription:
    '원클릭로그인은 자주 쓰는 웹사이트 로그인 과정을 녹화해 저장하고, 이후 버튼 한 번으로 자동 로그인하는 EGDesk 전용 앱입니다.',
  summaryLabel: 'Quick Login Automation',
  summaryTitle: '반복 로그인 시간을 줄이는 가장 빠른 방법',
  checklist: [
    '로그인 과정 녹화 및 저장',
    '저장된 계정 원클릭 실행',
    '여러 사이트·계정 목록 관리',
    'EGDesk Quick Actions와 연동',
  ],
  featuresTitle: '원클릭로그인 핵심 기능',
  featuresSubtitle: '매일 반복하는 웹 로그인을 기록하고 재사용합니다.',
  features: [
    {
      title: '로그인 녹화',
      description: 'ID·비밀번호·2단계 인증 흐름을 사용자 PC에서 녹화해 재사용 가능한 시나리오로 저장합니다.',
    },
    {
      title: '원클릭 실행',
      description: '저장된 시나리오를 선택해 브라우저 로그인을 자동으로 재생합니다.',
    },
    {
      title: '계정 목록 관리',
      description: '사이트별·계정별로 정리해 팀원이 자주 쓰는 포털에 빠르게 접속합니다.',
    },
  ],
  infoTitle: '원클릭로그인 사용 시 유의사항',
  infoSubtitle: '자동 로그인은 편리하지만, 계정 보안 정책과 함께 검토해야 합니다.',
  infoCards: [
    {
      title: '사용자 PC에서 실행',
      description: '녹화·재생은 로컬 환경에서 동작하며, 저장된 자격 증명 처리 방식은 설정과 정책에 따릅니다.',
    },
    {
      title: '사이트별 호환성',
      description: '로그인 UI가 자주 바뀌는 사이트는 재녹화가 필요할 수 있어, 대상 포털을 상담 시 확인합니다.',
    },
    {
      title: 'EGDesk와 연동',
      description: 'EGDesk 본 앱 Quick Actions에서 one-click 시나리오를 호출하는 흐름과 함께 사용할 수 있습니다.',
    },
  ],
  faq: [
    {
      question: '모든 웹사이트를 지원하나요?',
      answer:
        '대부분의 일반 로그인 폼을 지원하지만, CAPTCHA·하드웨어 토큰 등 추가 인증이 있는 사이트는 제한될 수 있습니다.',
    },
    {
      question: 'EGDesk Recorder와 차이는 무엇인가요?',
      answer:
        '원클릭로그인은 웹 로그인 자동화에 특화되어 있고, Recorder는 브라우저·데스크톱 전반의 녹화·워크플로에 가깝습니다.',
    },
    {
      question: 'Windows와 macOS를 지원하나요?',
      answer: '최신 GitHub Release 설치 파일 기준으로 Windows·macOS 빌드를 제공합니다.',
    },
  ],
  contactTitle: '원클릭로그인 도입 상담',
  contactSubtitle: '자동화하려는 사이트 수와 로그인 방식을 남겨 주시면 적용 가능 여부를 안내드립니다.',
  contactProductName: '원클릭로그인',
  contactStorageKey: 'egdesk_oneclick_latest_inquiry',
  contactScopeLabel: '희망 자동 로그인 범위',
  tags: ['#원클릭', '#웹로그인', '#업무자동화', '#QuickActions'],
  panelStatus: 'Login Automation',
  panelTitle: '[원클릭로그인] 핵심 기능',
};

export type LandingProductCardConfig = {
  id: string;
  pagePath: string;
  downloadUrl: string;
  downloadLabel: string;
  iconFile: string;
  badge: string;
  name: string;
  headline: string;
  description: string;
  themeClass: string;
  tags: string[];
};

function productToLandingCard(config: EgdeskProductAppConfig): LandingProductCardConfig {
  return {
    id: config.slug,
    pagePath: `/${config.slug}`,
    downloadUrl: config.downloadUrl,
    downloadLabel: config.downloadLabel,
    iconFile: config.iconFile,
    badge: config.badge,
    name: config.softwareName,
    headline: `${config.heroTitleHighlight}${config.heroTitleLine2 ? ` · ${config.heroTitleLine2}` : ''}`,
    description: config.heroDescription,
    themeClass: config.sectionThemeClass,
    tags: config.tags.slice(0, 4),
  };
}

export const BANKING_PRODUCT_CARD: LandingProductCardConfig = {
  id: 'banking-ai',
  pagePath: '/internet-banking-ai',
  downloadUrl: '/download/internet-banking-ai/latest',
  downloadLabel: '뱅킹AI 다운로드',
  iconFile: 'icon-banking.svg',
  badge: '인터넷뱅킹AI',
  name: 'EGDesk 인터넷뱅킹AI',
  headline: '은행·카드·홈택스 자료 수집',
  description:
    '소상공인·경리 업무를 위해 금융기관 로그인, 자료 수집, 엑셀 정리를 자동화합니다.',
  themeClass: 'product-app-theme--banking',
  tags: ['#경리업무', '#소상공인', '#홈택스', '#엑셀'],
};

/** Landing grid — each card links to its own product page. */
export const LANDING_EGDESK_APP_CARDS: LandingProductCardConfig[] = [
  BANKING_PRODUCT_CARD,
  productToLandingCard(RECORDER_PRODUCT),
  productToLandingCard(ONECLICK_PRODUCT),
];
