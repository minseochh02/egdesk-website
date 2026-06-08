'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import '@/app/landing/landing.css';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import { landingImage } from './landing-utils';

const RECIPIENT_EMAIL = 'jskimjskim@gmail.com';

const modelMap: Record<string, string> = {
  entry: 'entry-spec',
  standard: 'standard-spec',
  pro: 'pro-spec',
  expert: 'expert-spec',
};

const modelLabels: Record<string, string> = {
  entry: 'AI_Server 입문형 (교육 / 개인 입문용)',
  standard: 'AI_Server 표준형 (일반 딥러닝 연구실)',
  pro: 'AI_Server 실무형 (현업 프로젝트 및 고부하 연산)',
  expert: 'AI_Server 전문용 (LLM 및 멀티 GPU 플래그십)',
};

const caseLabels: Record<string, string> = {
  case1: 'CASE 1: 사일런트 저소음 케이스',
  case2: 'CASE 2: 익스트림 메쉬 쿨링 케이스',
  case3: 'CASE 3: 서버급 빅타워 케이스',
};

const specTabs = [
  {
    id: 'entry-spec',
    model: 'entry',
    title: 'AI_Server 입문형 상세 구성',
    description:
      '학습용 인공지능 기초 알고리즘 연구, 파이썬 머신러닝, 합리적인 CUDA 환경 구축을 위한 권장 구성',
    image: '입문형구성설명.png',
  },
  {
    id: 'standard-spec',
    model: 'standard',
    title: 'AI_Server 표준형 상세 구성',
    description:
      '이미지 분할(Segmentation), NLP 트랜스포머 파인튜닝, 다목적 고효율 AI 연산 연구를 위한 최적의 표준 스펙',
    image: '표준형구성설명.png',
  },
  {
    id: 'pro-spec',
    model: 'pro',
    title: 'AI_Server 실무형 상세 구성',
    description:
      '대규모 이미지/영상 데이터 처리, 로컬 언어모델 경량화 튜닝 등 고부하 실무 비즈니스 연구용 구성',
    image: '실무형구성설명.png',
  },
  {
    id: 'expert-spec',
    model: 'expert',
    title: 'AI_Server 전문용 상세 구성',
    description:
      '멀티 GPU 연산 가속, 수십억 파라미터급 대형 모델 연구 및 고집적 딥러닝 트레이닝을 위한 엔터프라이즈 서버급 사양',
    image: '전문형구성설명.png',
  },
];

const caseOptions = [
  {
    id: 'case1',
    image: 'CASE1.png',
    name: 'CASE 1: 사일런트 저소음',
    description:
      '방음 패널이 내장되어 연구소나 사무실 등 조용한 집중이 필요한 공간에 완벽히 부합하는 정숙한 케이스입니다.',
  },
  {
    id: 'case2',
    image: 'CASE2.png',
    name: 'CASE 2: 익스트림 메쉬 쿨링',
    description:
      '고풍량 쿨링팬과 강화유리 윈도우를 조합하여 공기역학적 열 배출을 극대화하고 하드웨어 모니터링이 용이한 케이스입니다.',
  },
  {
    id: 'case3',
    image: 'CASE3.png',
    name: 'CASE 3: 서버급 빅타워',
    description:
      '다중 GPU 풀 장착 및 고성능 커스텀 수랭 쿨러 장착에 특화된 광활한 확장 공간을 지닌 플래그십 빅타워 케이스입니다.',
  },
];

export default function DetailPageContent() {
  const searchParams = useSearchParams();
  const initialModel = searchParams.get('model');
  const initialTab =
    initialModel && modelMap[initialModel] ? modelMap[initialModel] : 'entry-spec';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedModel, setSelectedModel] = useState(initialModel || '');
  const [selectedCase, setSelectedCase] = useState('case2');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialModel && modelMap[initialModel]) {
      setActiveTab(modelMap[initialModel]);
      setSelectedModel(initialModel);
    }
  }, [initialModel]);

  const handleTabChange = (tabId: string, model?: string) => {
    setActiveTab(tabId);
    if (model) {
      setSelectedModel(model);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const requirements = String(formData.get('message') || '').trim();
    const model = selectedModel;
    const caseOption = selectedCase;

    if (!name || !phone || !email || !model) {
      alert('필수 기입 사항(*)들을 모두 입력해 주세요.');
      return;
    }

    const peripherals = ['프로 디스플레이', '에르고 마우스', '정밀 기계식 키보드'];
    const quoteData = {
      name,
      phone,
      email,
      company,
      model,
      case: caseOption,
      peripherals,
      message: requirements,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[EGDESK AI_Server] 상담 신청 - ${name}`,
          _replyto: email,
          _captcha: 'false',
          _template: 'table',
          성함: name,
          연락처: phone,
          이메일: email,
          소속: company || '(미입력)',
          '희망 베이스 모델': modelLabels[model] || model,
          '희망 케이스 옵션': caseLabels[caseOption] || caseOption,
          '기본 제공 패키지': peripherals.join(', '),
          '추가 기술 요구사항': requirements || '(없음)',
          '접수 일시': new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.success !== 'true') {
        throw new Error('메일 전송 실패');
      }

      localStorage.setItem('egdesk_latest_quote', JSON.stringify(quoteData));
      setShowModal(true);
      event.currentTarget.reset();
      setSelectedCase('case2');
      setSelectedModel('');
    } catch (error) {
      console.error('상담 신청 메일 전송 오류:', error);
      alert('메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader activeNav="detail" />

      <section id="specs-detail">
        <div className="section-title-wrap">
          <span className="badge">Technical Specs</span>
          <h2 className="section-title">모델별 상세 구성 정보</h2>
          <p className="section-subtitle">
            개발 목적에 따라 엄선된 하드웨어 조합 정보를 탭을 전환하여 확인해 보세요.
          </p>
        </div>

        <div className="detail-layout">
          <div className="tab-sidebar">
            <ul className="tab-list">
              {specTabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                    onClick={() => handleTabChange(tab.id, tab.model)}
                  >
                    {tab.title.replace(' 상세 구성', '')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="tab-content-container">
            {specTabs.map((tab) => (
              <div
                key={tab.id}
                className={`tab-content-panel${activeTab === tab.id ? ' active' : ''}`}
                id={tab.id}
              >
                <div className="spec-img-card">
                  <div className="spec-title-info">
                    <h3>{tab.title}</h3>
                    <p>{tab.description}</p>
                  </div>
                  <img src={landingImage(tab.image)} alt={tab.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cases" className="section-band">
        <div className="page-container">
          <div className="section-title-wrap">
            <span className="badge purple">Customizing</span>
            <h2 className="section-title">케이스 선택 옵션</h2>
            <p className="section-subtitle">
              워크스테이션이 설치될 공간과 사용 목적에 알맞은 케이스 디자인을 선택해 보세요.
              (견적 문의 시 자동 포함)
            </p>
          </div>

          <div className="options-grid">
            {caseOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`option-card${selectedCase === option.id ? ' selected' : ''}`}
                onClick={() => setSelectedCase(option.id)}
              >
                <div className="option-img-holder">
                  <img src={landingImage(option.image)} alt={option.name} />
                </div>
                <h3 className="option-name">{option.name}</h3>
                <p className="option-desc">{option.description}</p>
                <div className="select-indicator" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="accessories">
        <div className="accessory-section">
          <div className="section-title-wrap">
            <span className="badge">Base Bundle</span>
            <h2 className="section-title">EGDESK 기본 패키지</h2>
            <p className="section-subtitle">
              AI_Server 구매 시 연구 환경의 생산성과 편의성을 극대화하기 위해 프로 사양의
              기기들이 기본 패키지로 함께 제공됩니다.
            </p>
          </div>

          <div className="accessory-grid">
            <div className="accessory-card">
              <div className="accessory-img-box">
                <img src={landingImage('Molitor1.png')} alt="EGDESK 전문가용 AI 모니터" />
              </div>
              <h3 className="accessory-name">EGDESK 프로 디스플레이</h3>
              <p className="accessory-desc">
                긴 코드 리딩과 고화질 시각 자료 분석에 적합한 초고해상도 시력보호 탑재 모니터가
                기본 포함됩니다.
              </p>
            </div>
            <div className="accessory-card">
              <div className="accessory-img-box">
                <img src={landingImage('Mouse1.png')} alt="인체공학 마우스" />
              </div>
              <h3 className="accessory-name">에르고 인체공학 마우스</h3>
              <p className="accessory-desc">
                장시간 연구 및 코딩 중 발생하는 손목 피로를 덜어주는 인체공학 마우스가 기본
                패키지에 동반 제공됩니다.
              </p>
            </div>
            <div className="accessory-card">
              <div className="accessory-img-box">
                <img src={landingImage('KB.png')} alt="기계식 키보드" />
              </div>
              <h3 className="accessory-name">정밀 기계식 키보드</h3>
              <p className="accessory-desc">
                정확한 피드백과 소음을 억제한 적축 기반의 프리미엄 기계식 키보드가 기본 사양으로
                포함됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="quote" className="glass-card quote-section">
        <div className="section-title-wrap" style={{ marginBottom: '2.5rem' }}>
          <span className="badge">Quick Inquiry</span>
          <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            실시간 맞춤 견적 신청
          </h2>
          <p className="section-subtitle">
            희망 사양 및 구성품을 선택하시면 24시간 내에 전문 엔지니어가 상세 기술 검토와
            견적을 보내드립니다.
          </p>
        </div>

        <form id="consultation-form" onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="user-name">
                성함 *
              </label>
              <input
                type="text"
                id="user-name"
                name="name"
                className="form-input"
                placeholder="홍길동"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="user-phone">
                연락처 *
              </label>
              <input
                type="tel"
                id="user-phone"
                name="phone"
                className="form-input"
                placeholder="010-0000-0000"
                required
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="user-email">
                이메일 주소 *
              </label>
              <input
                type="email"
                id="user-email"
                name="email"
                className="form-input"
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="user-company">
                소속 (회사 / 대학 / 연구소)
              </label>
              <input
                type="text"
                id="user-company"
                name="company"
                className="form-input"
                placeholder="EGDESK 대학교 AI 연구실"
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label" htmlFor="select-model">
                희망 베이스 모델 *
              </label>
              <select
                id="select-model"
                className="form-select"
                required
                value={selectedModel}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedModel(value);
                  if (value && modelMap[value]) {
                    setActiveTab(modelMap[value]);
                  }
                }}
              >
                <option value="">-- 모델을 선택해 주세요 --</option>
                <option value="entry">AI_Server 입문형 (교육 / 개인 입문용)</option>
                <option value="standard">AI_Server 표준형 (일반 딥러닝 연구실)</option>
                <option value="pro">AI_Server 실무형 (현업 프로젝트 및 고부하 연산)</option>
                <option value="expert">AI_Server 전문용 (LLM 및 멀티 GPU 플래그십)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="select-case">
                희망 케이스 옵션 *
              </label>
              <select
                id="select-case"
                className="form-select"
                required
                value={selectedCase}
                onChange={(event) => setSelectedCase(event.target.value)}
              >
                <option value="case1">CASE 1: 사일런트 저소음 케이스</option>
                <option value="case2">CASE 2: 익스트림 메쉬 쿨링 케이스</option>
                <option value="case3">CASE 3: 서버급 빅타워 케이스</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">기본 제공 패키지 구성 (무상 동반 제공)</label>
            <div className="form-checkbox-group">
              <label
                className="form-checkbox-label"
                style={{
                  opacity: 0.8,
                  cursor: 'not-allowed',
                  background: 'rgba(0, 242, 254, 0.05)',
                  borderColor: 'rgba(0, 242, 254, 0.2)',
                }}
              >
                <input type="checkbox" checked disabled readOnly />
                <span>프로 디스플레이 (모니터)</span>
              </label>
              <label
                className="form-checkbox-label"
                style={{
                  opacity: 0.8,
                  cursor: 'not-allowed',
                  background: 'rgba(0, 242, 254, 0.05)',
                  borderColor: 'rgba(0, 242, 254, 0.2)',
                }}
              >
                <input type="checkbox" checked disabled readOnly />
                <span>에르고 마우스</span>
              </label>
              <label
                className="form-checkbox-label"
                style={{
                  opacity: 0.8,
                  cursor: 'not-allowed',
                  background: 'rgba(0, 242, 254, 0.05)',
                  borderColor: 'rgba(0, 242, 254, 0.2)',
                }}
              >
                <input type="checkbox" checked disabled readOnly />
                <span>정밀 기계식 키보드</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-message">
              추가 기술 요구사항 및 문의 (메모리 증설, GPU 추가 등)
            </label>
            <textarea
              id="user-message"
              name="message"
              className="form-textarea"
              rows={4}
              placeholder="예: GPU 1개 추가 장착 희망 및 RAM을 128GB로 업그레이드 요청 드립니다."
            />
          </div>

          <button type="submit" className="btn-primary form-submit-btn" disabled={submitting}>
            {submitting ? '전송 중...' : '상담 신청서 제출하기'}
          </button>
        </form>
      </section>

      <div
        className={`modal-overlay${showModal ? ' active' : ''}`}
        id="success-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setShowModal(false);
          }
        }}
      >
        <div className="modal-content">
          <div className="modal-icon">✓</div>
          <h3 className="modal-title">상담 신청 완료</h3>
          <p className="modal-desc">
            EGDESK AI_Server 견적 상담 신청이 정상적으로 접수되었습니다.
            <br />
            입력하신 연락처 및 이메일로 24시간 이내에 전문 엔지니어가 신속히 안내해 드리겠습니다.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '0.7rem 2rem' }}
            onClick={() => setShowModal(false)}
          >
            확인
          </button>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
