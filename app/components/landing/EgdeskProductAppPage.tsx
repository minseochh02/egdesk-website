import LandingFooter from '@/app/components/landing/LandingFooter';
import LandingHeader, { type LandingNavKey } from '@/app/components/landing/LandingHeader';
import ProductAppContactForm from '@/app/components/landing/ProductAppContactForm';
import { landingImage } from '@/app/components/landing/landing-utils';
import '@/app/landing/landing.css';
import Link from 'next/link';

export type EgdeskProductAppConfig = {
  slug: string;
  activeNav: LandingNavKey;
  pageUrl: string;
  downloadUrl: string;
  downloadLabel: string;
  /** When true, primary CTA opens `downloadUrl` in a new tab (cloud products). */
  externalPrimary?: boolean;
  iconFile: string;
  badge: string;
  sectionThemeClass: string;
  metadataTitle: string;
  metadataDescription: string;
  softwareName: string;
  softwareAlternateName: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroTitleLine2?: string;
  heroDescription: string;
  summaryLabel: string;
  summaryTitle: string;
  checklist: string[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: { title: string; description: string }[];
  infoTitle: string;
  infoSubtitle: string;
  infoCards: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  contactTitle: string;
  contactSubtitle: string;
  contactProductName: string;
  contactStorageKey: string;
  contactScopeLabel?: string;
  tags: string[];
  panelStatus: string;
  panelTitle: string;
};

type EgdeskProductAppPageProps = {
  config: EgdeskProductAppConfig;
};

export default function EgdeskProductAppPage({ config }: EgdeskProductAppPageProps) {
  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.softwareName,
    alternateName: config.softwareAlternateName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Windows, macOS',
    description: config.metadataDescription,
    url: config.pageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'EGDesk',
      url: 'https://egdesk.cloud',
    },
  };

  return (
    <div className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplication),
        }}
      />
      <LandingHeader activeNav={config.activeNav} />

      <section className={`banking-product-hero ${config.sectionThemeClass}`}>
        <div className="banking-product-hero-copy">
          <div className="banking-ai-heading-mark">
            <img
              src={landingImage(config.iconFile)}
              alt={`${config.softwareName} 아이콘`}
              className="banking-ai-icon"
            />
            <span className="badge purple">{config.badge}</span>
          </div>
          <h1 className="hero-title">
            {config.heroTitleLine1}
            <br />
            <span>{config.heroTitleHighlight}</span>
            {config.heroTitleLine2 ? (
              <>
                <br />
                {config.heroTitleLine2}
              </>
            ) : null}
          </h1>
          <p className="hero-desc">{config.heroDescription}</p>
          <div className="hero-actions">
            <a
              href={config.downloadUrl}
              className="btn-secondary btn-download"
              {...(config.externalPrimary || config.downloadUrl.startsWith('http')
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {config.downloadLabel}
            </a>
            <Link href="/#egdesk-apps" className="btn-primary">
              EGDesk 제품 목록
            </Link>
          </div>
        </div>
        <div className="banking-product-summary glass-card">
          <span className="banking-ai-status">{config.summaryLabel}</span>
          <strong>{config.summaryTitle}</strong>
          <ul className="banking-product-checklist">
            {config.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="section-band">
        <div className="page-container">
          <div className="section-title-wrap">
            <span className="badge">Core Features</span>
            <h2 className="section-title">{config.featuresTitle}</h2>
            <p className="section-subtitle">{config.featuresSubtitle}</p>
          </div>
          <div className="banking-ai-feature-grid banking-product-feature-grid">
            {config.features.map((feature, index) => (
              <div key={feature.title} className="banking-ai-feature">
                <span className="banking-ai-feature-icon">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{feature.title}</strong>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="overview">
        <div className="section-title-wrap">
          <span className="badge purple">Overview</span>
          <h2 className="section-title">{config.infoTitle}</h2>
          <p className="section-subtitle">{config.infoSubtitle}</p>
        </div>
        <div className="banking-product-card-grid">
          {config.infoCards.map((item) => (
            <div key={item.title} className="glass-card banking-product-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="section-band">
        <div className="section-title-wrap">
          <span className="badge purple">FAQ</span>
          <h2 className="section-title">자주 묻는 질문</h2>
        </div>
        <div className="banking-faq-list">
          {config.faq.map((item) => (
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
            {config.contactTitle}
          </h2>
          <p className="section-subtitle">{config.contactSubtitle}</p>
        </div>
        <ProductAppContactForm
          productName={config.contactProductName}
          storageKey={config.contactStorageKey}
          scopeLabel={config.contactScopeLabel}
        />
      </section>

      <LandingFooter />
    </div>
  );
}
