import type { Metadata } from 'next';
import '@/app/landing/landing.css';
import BankingAIContactForm from '@/app/components/landing/BankingAIContactForm';
import LandingFooter from '@/app/components/landing/LandingFooter';
import LandingHeader from '@/app/components/landing/LandingHeader';
import { landingImage } from '@/app/components/landing/landing-utils';

const pageUrl = 'https://egdesk.cloud/internet-banking-ai';
const latestDownloadUrl = '/download/internet-banking-ai/latest';

export const metadata: Metadata = {
  metadataBase: new URL('https://egdesk.cloud'),
  title: '인터넷뱅킹AI | 은행·카드·홈택스 자동수집 | EGDesk',
  description:
    '은행, 카드사, 홈택스에 반복 로그인해 거래·매출·세금 자료를 수집하고 엑셀로 정리하는 소상공인·경리 업무 자동화 솔루션입니다.',
  alternates: {
    canonical: '/internet-banking-ai',
  },
  openGraph: {
    title: '인터넷뱅킹AI | 금융자료 수집·엑셀 정리 자동화',
    description: '은행·카드·홈택스 자료 수집과 엑셀 정리를 자동화하는 EGDesk 솔루션',
    url: '/internet-banking-ai',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/landing/icon-banking.svg',
        width: 1024,
        height: 1024,
        alt: 'EGDesk 인터넷뱅킹AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '인터넷뱅킹AI | EGDesk',
    description: '은행·카드·홈택스 자료 수집과 엑셀 정리를 자동화합니다.',
    images: ['/landing/icon-banking.svg'],
  },
};

const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EGDesk 인터넷뱅킹AI',
  alternateName: 'EGDesk Internet Banking AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Windows, macOS',
  description:
    '은행, 카드사, 홈택스 자료 수집과 엑셀 정리를 자동화하는 소상공인·경리 업무 자동화 솔루션입니다.',
  url: pageUrl,
  publisher: {
    '@type': 'Organization',
    name: 'EGDesk',
    url: 'https://egdesk.cloud',
  },
};

const supportItems = [
  '은행 거래내역 자동 수집',
  '카드사 매출·승인 자료 정리',
  '국세청 홈택스 세금 자료 수집',
  '엑셀 다운로드 및 월말 정산 파일 정리',
];

const securityItems = [
  {
    title: '사용자 PC에서 실행',
    description: '반복 로그인과 자료 수집은 사용자의 실행 환경에서 진행되는 방식으로 설계합니다.',
  },
  {
    title: '금융자료 목적 제한',
    description: '상담 시 필요한 기관과 자료 범위를 먼저 정하고, 업무에 필요한 데이터만 자동화합니다.',
  },
  {
    title: '도입 전 보안 안내',
    description: '인증 방식, 저장 위치, 오류 대응 방식은 도입 상담 단계에서 별도로 확인합니다.',
  },
];

const faqItems = [
  {
    question: '개인뱅킹과 기업뱅킹을 모두 지원하나요?',
    answer:
      '지원 범위는 은행과 로그인 방식에 따라 달라질 수 있습니다. 상담 시 사용하는 은행과 계정 유형을 확인한 뒤 적용 범위를 안내합니다.',
  },
  {
    question: '여러 사업자 자료를 한 번에 관리할 수 있나요?',
    answer:
      '여러 사업자나 여러 금융기관을 사용하는 업무 흐름을 기준으로 자동화 범위를 설계할 수 있습니다.',
  },
  {
    question: '자동 실행 주기를 정할 수 있나요?',
    answer:
      '월말, 주간, 일간처럼 반복 주기가 있는 업무에 맞춰 실행 방식과 결과 파일 정리 방식을 상담합니다.',
  },
  {
    question: '오류가 나면 어떻게 처리하나요?',
    answer:
      '은행 화면 변경, 인증 실패, 네트워크 오류 등 반복 업무에서 발생할 수 있는 예외 상황을 확인하고 대응 방식을 함께 설계합니다.',
  },
];

export default function InternetBankingAIPage() {
  return (
    <div className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplication),
        }}
      />
      <LandingHeader activeNav="banking" />

      <section className="banking-product-hero">
        <div className="banking-product-hero-copy">
          <div className="banking-ai-heading-mark">
            <img
              src={landingImage('icon-banking.svg')}
              alt="EGDesk 인터넷뱅킹AI 아이콘"
              className="banking-ai-icon"
            />
            <span className="badge purple">EGDesk Internet Banking AI</span>
          </div>
          <h1 className="hero-title">
            은행·카드·홈택스 자료 수집과
            <br />
            <span>엑셀 정리를 자동화</span>합니다
          </h1>
          <p className="hero-desc">
            EGDesk 인터넷뱅킹AI는 소상공인 사장님과 경리 실무자가 매번 반복하는 금융자료
            수집, 로그인, 다운로드, 엑셀 정리 업무를 줄이기 위한 자동화 솔루션입니다.
          </p>
          <div className="hero-actions">
            <a
              href="https://youtu.be/j0zQy-XZ0rI"
              className="btn-primary"
              target="_blank"
              rel="noreferrer"
            >
              90초 데모 보기
            </a>
            <a href={latestDownloadUrl} className="btn-secondary">
              최신 버전 다운로드
            </a>
          </div>
        </div>
        <div className="banking-product-summary glass-card">
          <span className="banking-ai-status">Accounting Automation</span>
          <strong>반복 금융업무를 하나의 흐름으로 정리</strong>
          <ul className="banking-product-checklist">
            {supportItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="section-band">
        <div className="page-container">
          <div className="section-title-wrap">
            <span className="badge">Core Features</span>
            <h2 className="section-title">인터넷뱅킹AI 핵심 기능</h2>
            <p className="section-subtitle">
              흩어진 금융 채널에 반복 접속하는 업무를 줄이고, 필요한 결과물을 엑셀 중심으로
              정리합니다.
            </p>
          </div>
          <div className="banking-ai-feature-grid banking-product-feature-grid">
            <div className="banking-ai-feature">
              <span className="banking-ai-feature-icon">01</span>
              <div>
                <strong>동시 자동 로그인</strong>
                <p>은행, 카드사, 홈택스 등 반복 접속이 필요한 기관을 업무 흐름에 맞게 연결합니다.</p>
              </div>
            </div>
            <div className="banking-ai-feature">
              <span className="banking-ai-feature-icon">02</span>
              <div>
                <strong>자료 자동 수집</strong>
                <p>거래내역, 카드 매출, 세금 자료처럼 정기적으로 필요한 데이터를 수집합니다.</p>
              </div>
            </div>
            <div className="banking-ai-feature">
              <span className="banking-ai-feature-icon">03</span>
              <div>
                <strong>엑셀 정리</strong>
                <p>다운로드한 금융자료를 경리 업무에 바로 사용할 수 있는 엑셀 파일로 정리합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security">
        <div className="section-title-wrap">
          <span className="badge purple">Security</span>
          <h2 className="section-title">금융정보 처리 방식</h2>
          <p className="section-subtitle">
            자동 로그인 기능은 편리함만큼 보안 확인이 중요합니다. 도입 전 실행 환경, 저장 위치,
            인증 방식, 오류 대응 범위를 함께 확인합니다.
          </p>
        </div>
        <div className="banking-product-card-grid">
          {securityItems.map((item) => (
            <div key={item.title} className="glass-card banking-product-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="section-band">
        <div className="page-container banking-demo-layout">
          <div>
            <span className="badge">Demo Video</span>
            <h2 className="section-title">실제 구동 화면 확인</h2>
            <p className="section-subtitle">
              지원 기관 선택부터 자동 로그인, 자료 수집, 엑셀 결과 확인까지 실제 흐름을 데모
              영상에서 확인할 수 있습니다.
            </p>
          </div>
          <a
            href="https://youtu.be/j0zQy-XZ0rI"
            className="glass-card banking-demo-card"
            target="_blank"
            rel="noreferrer"
          >
            <span>데모 영상 열기</span>
            <strong>은행·카드·홈택스 한 번에 자동 정리</strong>
          </a>
        </div>
      </section>

      <section id="faq">
        <div className="section-title-wrap">
          <span className="badge purple">FAQ</span>
          <h2 className="section-title">자주 묻는 질문</h2>
        </div>
        <div className="banking-faq-list">
          {faqItems.map((item) => (
            <div key={item.question} className="glass-card banking-faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="glass-card quote-section banking-contact-section">
        <div className="section-title-wrap" style={{ marginBottom: '2.5rem' }}>
          <span className="badge purple">Contact</span>
          <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            인터넷뱅킹AI 도입 상담
          </h2>
          <p className="section-subtitle">
            사용하는 은행, 카드사, 홈택스 업무 범위와 현재 엑셀 정리 방식을 남겨주시면 별도
            상담으로 안내드립니다.
          </p>
        </div>
        <BankingAIContactForm />
      </section>

      <LandingFooter />
    </div>
  );
}
