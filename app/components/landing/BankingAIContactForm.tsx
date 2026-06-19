'use client';

import { FormEvent, useState } from 'react';

const RECIPIENT_EMAIL = 'egdeskofficial@gmail.com';

export default function BankingAIContactForm() {
  const [bankingSubmitting, setBankingSubmitting] = useState(false);
  const [showBankingModal, setShowBankingModal] = useState(false);

  const handleBankingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const serviceScope = String(formData.get('serviceScope') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !phone || !email) {
      alert('필수 기입 사항(*)들을 모두 입력해 주세요.');
      return;
    }

    const inquiryData = {
      product: '인터넷뱅킹AI',
      name,
      phone,
      email,
      company,
      serviceScope,
      message,
      submittedAt: new Date().toISOString(),
    };

    setBankingSubmitting(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[인터넷뱅킹AI] 도입 상담 신청 - ${name}`,
          _replyto: email,
          _captcha: 'false',
          _template: 'table',
          문의상품: '인터넷뱅킹AI',
          성함: name,
          연락처: phone,
          이메일: email,
          소속: company || '(미입력)',
          '희망 자동화 범위': serviceScope || '(미선택)',
          '추가 문의 내용': message || '(없음)',
          '접수 일시': new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.success !== 'true') {
        throw new Error('메일 전송 실패');
      }

      localStorage.setItem('internet_banking_ai_latest_inquiry', JSON.stringify(inquiryData));
      setShowBankingModal(true);
      event.currentTarget.reset();
    } catch (error) {
      console.error('인터넷뱅킹AI 상담 신청 메일 전송 오류:', error);
      alert('메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBankingSubmitting(false);
    }
  };

  return (
    <>
      <form id="banking-ai-contact-form" onSubmit={handleBankingSubmit}>
        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label" htmlFor="banking-user-name">
              성함 *
            </label>
            <input
              type="text"
              id="banking-user-name"
              name="name"
              className="form-input"
              placeholder="홍길동"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="banking-user-phone">
              연락처 *
            </label>
            <input
              type="tel"
              id="banking-user-phone"
              name="phone"
              className="form-input"
              placeholder="010-0000-0000"
              required
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label className="form-label" htmlFor="banking-user-email">
              이메일 주소 *
            </label>
            <input
              type="email"
              id="banking-user-email"
              name="email"
              className="form-input"
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="banking-user-company">
              상호 / 회사명
            </label>
            <input
              type="text"
              id="banking-user-company"
              name="company"
              className="form-input"
              placeholder="예: 가나다상사"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="banking-service-scope">
            희망 자동화 범위
          </label>
          <select id="banking-service-scope" name="serviceScope" className="form-select">
            <option value="">-- 선택해 주세요 --</option>
            <option value="은행 자동 로그인 및 엑셀 다운로드">
              은행 자동 로그인 및 엑셀 다운로드
            </option>
            <option value="은행 + 카드사 데이터 자동 수집">은행 + 카드사 데이터 자동 수집</option>
            <option value="은행 + 카드사 + 홈택스 자동화">은행 + 카드사 + 홈택스 자동화</option>
            <option value="상담 후 범위 결정">상담 후 범위 결정</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="banking-user-message">
            추가 문의
          </label>
          <textarea
            id="banking-user-message"
            name="message"
            className="form-textarea"
            rows={4}
            placeholder="예: KB국민은행, 신한카드, 홈택스 자료를 월말마다 엑셀로 정리하고 싶습니다."
          />
        </div>

        <button type="submit" className="btn-primary form-submit-btn" disabled={bankingSubmitting}>
          {bankingSubmitting ? '전송 중...' : '인터넷뱅킹AI 상담 신청하기'}
        </button>
      </form>

      <div
        className={`modal-overlay${showBankingModal ? ' active' : ''}`}
        id="banking-success-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setShowBankingModal(false);
          }
        }}
      >
        <div className="modal-content">
          <div className="modal-icon">✓</div>
          <h3 className="modal-title">인터넷뱅킹AI 상담 신청 완료</h3>
          <p className="modal-desc">
            인터넷뱅킹AI 도입 상담 신청이 정상적으로 접수되었습니다.
            <br />
            입력하신 연락처 및 이메일로 담당자가 별도 안내해 드리겠습니다.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '0.7rem 2rem' }}
            onClick={() => setShowBankingModal(false)}
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}
