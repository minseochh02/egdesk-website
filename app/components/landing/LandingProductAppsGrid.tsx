import Link from 'next/link';
import { LANDING_EGDESK_APP_CARDS } from '@/lib/egdesk-product-apps';
import { landingImage } from '@/app/components/landing/landing-utils';

export default function LandingProductAppsGrid() {
  return (
    <section id="egdesk-apps" className="section-band egdesk-apps-section">
      <div className="page-container">
        <div className="section-title-wrap">
          <span className="badge purple">EGDesk Software</span>
          <h2 className="section-title">데스크톱 업무 자동화 앱</h2>
          <p className="section-subtitle">
            인터넷뱅킹AI, Recorder, 원클릭로그인 — 제품별 상세 소개와 다운로드는 각 페이지에서
            확인할 수 있습니다.
          </p>
        </div>

        <div className="product-apps-grid">
          {LANDING_EGDESK_APP_CARDS.map((app) => (
            <article
              key={app.id}
              className={`glass-card product-app-card ${app.themeClass}`}
            >
              <div className="product-app-card__icon-wrap">
                <img
                  src={landingImage(app.iconFile)}
                  alt=""
                  className="product-app-card__icon"
                />
              </div>
              <span className="badge purple product-app-card__badge">{app.badge}</span>
              <h3 className="product-app-card__name">{app.name}</h3>
              <p className="product-app-card__headline">{app.headline}</p>
              <p className="product-app-card__desc">{app.description}</p>
              <div className="product-app-card__tags">
                {app.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="product-app-card__actions">
                <Link href={app.pagePath} className="btn-primary product-app-card__link">
                  제품 페이지
                </Link>
                <a href={app.downloadUrl} className="btn-secondary btn-download">
                  {app.downloadLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
