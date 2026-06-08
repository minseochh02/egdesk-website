import Link from 'next/link';

type LandingHeaderProps = {
  activeNav?: 'home' | 'detail';
};

export default function LandingHeader({ activeNav = 'home' }: LandingHeaderProps) {
  return (
    <header>
      <div className="nav-container">
        <Link href="/" className="logo">
          EGDESK <span>AI_Server</span>
        </Link>
        <ul className="nav-menu">
          <li className={`nav-item${activeNav === 'home' ? ' active' : ''}`}>
            <Link href="/#home">홈 / 소개</Link>
          </li>
          <li className="nav-item">
            <Link href="/#necessity">특장점</Link>
          </li>
          <li className="nav-item">
            <Link href="/#lineups">라인업</Link>
          </li>
          <li className="nav-item">
            <Link href="/#compare">비교 분석</Link>
          </li>
          <li className={`nav-item${activeNav === 'detail' ? ' active' : ''}`}>
            <Link href="/landing/detail">상세 스펙</Link>
          </li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="nav-btn nav-btn-outline">
            웹 로그인
          </Link>
          <Link href="/landing/detail#quote" className="nav-btn">
            실시간 견적 상담
          </Link>
        </div>
      </div>
    </header>
  );
}
