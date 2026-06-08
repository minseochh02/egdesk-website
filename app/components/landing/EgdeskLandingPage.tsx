import Link from 'next/link';
import '@/app/landing/landing.css';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import { landingImage } from './landing-utils';

const lineups = [
  {
    model: 'entry',
    image: 'CASE1.png',
    name: 'AI_Server 입문형',
    description:
      'AI 교육, 대학원 초년생 연구 및 가벼운 머신러닝 데이터 분석 프로젝트에 최적화된 구성입니다.',
    specs: [
      { label: 'CPU', value: 'AMD EPYC 4545P' },
      { label: 'GPU', value: 'Radeon 내장그래픽' },
      { label: 'RAM', value: '48GB DDR5' },
      { label: 'SSD', value: '1TB High-Speed NVMe' },
      { label: 'POWER', value: '정격 120W (미니베어본)' },
    ],
    discount: '10% OFF',
    originalPrice: '2,455,000원',
    finalPrice: '2,220,000원',
  },
  {
    model: 'standard',
    image: 'CASE2.png',
    name: 'AI_Server 표준형',
    description:
      '일반적인 딥러닝 훈련 및 대다수 비전/NLP 오픈소스 모델 구동에 가장 균형 잡힌 베스트셀러 스펙입니다.',
    specs: [
      { label: 'CPU', value: 'AMD EPYC 4545P' },
      { label: 'GPU', value: 'RTX 5060 Ti 16GB' },
      { label: 'RAM', value: '48GB DDR5 (B850)' },
      { label: 'SSD', value: '1TB High-Speed NVMe' },
      { label: 'POWER', value: '정격 750W (미들타워)' },
    ],
    discount: '5% OFF',
    originalPrice: '3,547,000원',
    finalPrice: '3,364,000원',
  },
  {
    model: 'pro',
    image: 'CASE3.png',
    name: 'AI_Server 실무형',
    description:
      '기업 연구원 및 대규모 프로젝트 환경에서 로컬 파인튜닝과 24시간 끊임없는 학습을 수행하는 실무용 장비입니다.',
    specs: [
      { label: 'CPU', value: 'AMD EPYC 4585PX' },
      { label: 'GPU', value: 'RTX 5060 Ti 16GB' },
      { label: 'RAM', value: '48GB DDR5 (B850)' },
      { label: 'SSD', value: '1TB High-Speed NVMe' },
      { label: 'POWER', value: '정격 850W (빅타워)' },
    ],
    discount: '5% OFF',
    originalPrice: '4,738,000원',
    finalPrice: '4,483,000원',
  },
  {
    model: 'expert',
    image: 'CASE3.png',
    name: 'AI_Server 전문용',
    description:
      '초대형 LLM(대형 언어 모델) 다중 노드 연구, 의료 인공지능 분석 등 타협 없는 최고 성능을 지향하는 서버급 워크스테이션입니다.',
    specs: [
      { label: 'CPU', value: 'AMD EPYC 4585PX' },
      { label: 'GPU', value: 'RTX 5080 Extreme' },
      { label: 'RAM', value: '48GB DDR5 (B850)' },
      { label: 'SSD', value: '1TB High-Speed NVMe' },
      { label: 'POWER', value: '정격 1200W (빅타워)' },
    ],
    discount: '4% OFF',
    originalPrice: '5,316,000원',
    finalPrice: '5,123,000원',
  },
];

export default function EgdeskLandingPage() {
  return (
    <div className="landing-page">
      <LandingHeader activeNav="home" />

      <section className="hero" id="home">
        <div className="hero-content">
          <span className="badge">Next-Gen AI Workstation</span>
          <h1 className="hero-title">
            인공지능 연구의
            <br />
            새로운 기준, <br />
            <span>EGDESK AI_Server</span>
          </h1>
          <p className="hero-desc">
            복잡한 딥러닝 모델 학습부터 생성형 AI 배포, 실무 데이터 분석까지. 최적화된 하드웨어
            설계로 AI 개발의 속도와 완성도를 극대화합니다.
          </p>
          <div className="hero-actions">
            <Link href="/landing/detail" className="btn-primary">
              상세 스펙 보기
            </Link>
            <Link href="/#lineups" className="btn-secondary">
              라인업 둘러보기
            </Link>
            <Link href="/login" className="btn-secondary">
              웹 인터페이스 로그인
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-container">
            <img src={landingImage('CASE2.png')} alt="EGDESK AI_Server 프리미엄 케이스 외관" />
          </div>
        </div>
      </section>

      <section id="necessity">
        <div className="section-title-wrap">
          <span className="badge purple">Why AI_Server?</span>
          <h2 className="section-title">왜 AI 전용 컴퓨터가 필요할까요?</h2>
          <p className="section-subtitle">
            일반 PC와 차별화된 EGDESK AI_Server만의 압도적인 컴퓨팅 솔루션
          </p>
        </div>

        <div className="necessity-features-grid">
          <div className="necessity-feature-item">
            <div className="necessity-icon">⚡</div>
            <strong>강력한 다중 GPU 연산 능력 지원</strong>
            <p>
              딥러닝 학습 및 미세조정(Fine-tuning)을 위한 고성능 NVIDIA Tensor Core GPU
              기술을 탑재하여 대용량 모델 연산을 빠르게 수행합니다.
            </p>
          </div>
          <div className="necessity-feature-item">
            <div className="necessity-icon">💾</div>
            <strong>대용량 데이터셋 처리 인프라</strong>
            <p>
              고속 PCIe Gen5/4 NVMe SSD와 초고속 시스템 메모리를 결합하여 수십 기가바이트에
              달하는 데이터셋 로드 병목 현상을 최소화했습니다.
            </p>
          </div>
          <div className="necessity-feature-item">
            <div className="necessity-icon">🌡️</div>
            <strong>열 효율성과 정숙함을 유지하는 쿨링 솔루션</strong>
            <p>
              장시간 100% 연산 부하가 지속되는 환경에서도 안정적인 성능 유지를 보장하는 수랭
              및 지능형 공랭식 복합 쿨링 아키텍처가 적용되었습니다.
            </p>
          </div>
        </div>

        <div className="necessity-img-fullwidth">
          <img
            src={landingImage('AI_COM 필요성.png')}
            alt="AI 컴퓨터의 필요성 및 기대 효과 인포그래픽"
          />
        </div>
      </section>

      <section id="processor">
        <div className="processor-stacked-layout">
          <div className="processor-info-wide">
            <span className="badge">Core Architecture</span>
            <h2 className="section-title">
              연산 병목을 무너뜨리는 <span>핵심 프로세서</span>
            </h2>
            <p className="section-subtitle">
              최신 멀티코어 프로세서와 신경망 연산 가속기를 결합하여, 동시다발적인
              추론(Inference)과 대규모 파라미터 트레이닝을 원활하게 수행합니다. 정밀 가공된
              인터커넥트 기술로 칩셋 간 통신 대역폭을 극대화했습니다.
            </p>

            <div className="processor-features-grid">
              <div className="feature-list-item">
                <strong>하이브리드 NPU &amp; CPU/GPU 시너지</strong>
                <p>
                  최신 고성능 멀티스레딩 프로세서와 AI 전용 가속 텐서 코어가 유기적으로
                  연결되어 작업 부하를 적재적소에 배분합니다.
                </p>
              </div>
              <div className="feature-list-item">
                <strong>AI 라이브러리 완벽 호환</strong>
                <p>
                  PyTorch, TensorFlow, JAX, Hugging Face 등 현대 AI 연구에 필수적인 주요
                  프레임워크와 즉각적인 하드웨어 가속 연동을 보장합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="processor-img-expanded-box">
            <img
              src={landingImage('AI_COM 햑심프로세서.png')}
              alt="EGDESK AI_Server 핵심 프로세서 사양 비교 (AMD EPYC 4545P vs 4585PX)"
            />
          </div>
        </div>
      </section>

      <section id="lineups">
        <div className="section-title-wrap">
          <span className="badge">Lineup Overview</span>
          <h2 className="section-title">최적의 성능을 위한 4가지 라인업</h2>
          <p className="section-subtitle">
            사용자의 목적과 예산에 맞추어 세분화된 고성능 AI 개발 장비를 확인해 보세요.
          </p>
        </div>

        <div className="lineup-grid">
          {lineups.map((lineup) => (
            <div key={lineup.model} className="glass-card lineup-card">
              <div className="lineup-img-holder">
                <img src={landingImage(lineup.image)} alt={`EGDESK ${lineup.name} 본체`} />
              </div>
              <h3 className="lineup-name">{lineup.name}</h3>
              <p className="lineup-desc">{lineup.description}</p>

              <div className="spec-chips-container">
                {lineup.specs.map((spec) => (
                  <div key={spec.label} className="spec-chip">
                    <span className="spec-chip-label">{spec.label}</span>
                    <span className="spec-chip-value">{spec.value}</span>
                  </div>
                ))}
              </div>

              <div className="price-tag-wrap">
                <div className="original-price-wrap">
                  <span className="discount-badge">{lineup.discount}</span>
                  <span className="original-price">{lineup.originalPrice}</span>
                </div>
                <span className="final-price">{lineup.finalPrice}</span>
              </div>

              <div className="lineup-footer">
                <Link href={`/landing/detail?model=${lineup.model}`} className="lineup-link">
                  상세 사양 &amp; 견적
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="compare" className="section-band section-band--bordered-bottom">
        <div className="page-container compare-container">
          <div className="section-title-wrap">
            <span className="badge purple">Specs Comparison</span>
            <h2 className="section-title">스펙 일괄 비교 분석</h2>
            <p className="section-subtitle">
              각 사양별 하드웨어 CPU, GPU, RAM, 저장공간 및 가격 정책 차이를 한눈에
              확인하십시오.
            </p>
          </div>
          <div className="compare-img-box">
            <img
              src={landingImage('AI_COM 비교.png')}
              alt="EGDESK AI_Server 모델별 상세 스펙 및 가격 비교표"
            />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
