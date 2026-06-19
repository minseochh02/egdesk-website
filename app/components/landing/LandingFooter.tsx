import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-col">
          <Link href="/" className="logo">
            <img src="/landing/egdesk-logo.svg" alt="EGDESK" className="logo-img logo-img--footer" />
          </Link>
          <p>
            인공지능 연구의 새로운 기준. 최적화된 하드웨어 설계와 연산 가속 인프라로 딥러닝과
            데이터 사이언스 연구를 한 단계 더 높은 수준으로 끌어올립니다.
          </p>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">퀵 링크</h4>
          <ul className="footer-col-links">
            <li>
              <Link href="/#home">홈 / 소개</Link>
            </li>
            <li>
              <Link href="/#necessity">AI 컴퓨터 특장점</Link>
            </li>
            <li>
              <Link href="/#lineups">제품 라인업</Link>
            </li>
            <li>
              <Link href="/?section=banking-contact">인터넷뱅킹AI 상담</Link>
            </li>
            <li>
              <Link href="/landing/detail">상세 기술 사양</Link>
            </li>
            <li>
              <Link href="/landing/detail#quote">AI_Server 견적 문의</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">EGDESK AI_Server</h4>
          <ul className="footer-col-links">
            <li>
              <Link href="/landing/detail?model=entry">AI_Server 입문형</Link>
            </li>
            <li>
              <Link href="/landing/detail?model=standard">AI_Server 표준형</Link>
            </li>
            <li>
              <Link href="/landing/detail?model=pro">AI_Server 실무형</Link>
            </li>
            <li>
              <Link href="/landing/detail?model=expert">AI_Server 전문용</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">고객 지원 &amp; 기술 본부</h4>
          <p>
            <strong>주소:</strong> 경기도 시흥시 서울대학로 59-69 배곧테크노밸리 609호
            <br />
            <strong>기술 문의:</strong> support@egdesk.com
            <br />
            <strong>대표 전화:</strong> 1544-0000 (평일 09:00 - 18:00)
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copyright">&copy; 2026 QUUS. LLC All rights reserved.</p>
        <ul className="footer-bottom-links">
          <li>
            <a href="/landing/privacy.html">개인정보처리방침</a>
          </li>
          <li>
            <a href="/landing/terms.html">이용약관</a>
          </li>
          <li>
            <a href="/landing/email-policy.html">이메일무단수집거부</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
