import React, { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Anchor, ChevronRight, Command, Layout, ShieldCheck, Zap } from 'lucide-react';
import { BrandLockup, Button, COLOR, KeyBadge, MetricWrapper, SectionHeader, SPACE, StatusWrapper, Text, TYPE } from '../ds';
import logoSvg from '../../svg/Pandatrade.svg';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const previewY = useTransform(scrollYProgress, [0, 0.3], [48, 0]);

  useEffect(() => {
    document.title = 'PandaTrade | Upstox API Trading Terminal for Indian Markets';

    const ensureMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        if (property) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    ensureMeta(
      'description',
      'PandaTrade is an Upstox API trading terminal for Indian markets with live watchlists, charts, options chain, orders, positions, holdings, and desktop-first workflows.'
    );
    ensureMeta(
      'keywords',
      'Upstox API, Upstox trading terminal, Upstox API trading app, Indian stock market terminal, options chain Upstox, trading dashboard India, watchlist orders positions holdings'
    );
    ensureMeta('og:title', 'PandaTrade | Upstox API Trading Terminal for Indian Markets', true);
    ensureMeta(
      'og:description',
      'Desktop-first trading terminal built around the Upstox API with watchlists, charts, options chain, orders, positions, and holdings.',
      true
    );
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: COLOR.bg.base, color: COLOR.text.primary, fontFamily: TYPE.family.mono, overflowX: 'hidden' }}>
      <nav
        className="nav-container"
        style={{
          minHeight: '4.5rem',
          borderBottom: `1px solid ${COLOR.bg.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(5,5,5,0.96)',
          zIndex: 1000,
        }}
      >
        <BrandLockup
          logo={<img src={logoSvg} alt="PandaTrade" style={{ height: '1.125rem', objectFit: 'contain' }} />}
          title="Pandatrade"
          subtitle="Upstox API trading terminal"
          tone="accent"
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          <StatusWrapper label="Built for Indian markets" tone="accent" />
          <Button variant="accent" size="sm" onClick={() => navigate('/app')}>
            Open app
          </Button>
        </div>
      </nav>

      <section
        className="hero-section"
        style={{
          paddingTop: '9rem',
          paddingBottom: '5rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          maxWidth: '84rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '2rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '2rem', alignItems: 'start' }} className="hero-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[4], flexWrap: 'wrap' }}>
              <KeyBadge keys="CTRL + K" />
              <StatusWrapper label="Built around the Upstox API" tone="accent" />
            </div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{
                fontSize: TYPE.size['4xl'],
                fontWeight: TYPE.weight.bold,
                margin: 0,
                lineHeight: '1',
                letterSpacing: TYPE.letterSpacing.tight,
                maxWidth: '46rem',
              }}
            >
              Upstox API
              <br />
              <span style={{ color: COLOR.semantic.info }}>trading terminal.</span>
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              style={{
                fontSize: TYPE.size.lg,
                color: COLOR.text.secondary,
                maxWidth: '38rem',
                margin: `${SPACE[4]} 0 ${SPACE[5]} 0`,
                lineHeight: TYPE.lineHeight.relaxed,
              }}
            >
              PandaTrade is a desktop-first trading terminal for Indian markets with Upstox API connectivity, live watchlists, charting, options chain workflows, and fast access to orders, positions, and holdings.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap' }}>
              <Button variant="accent" size="md" onClick={() => navigate('/app')}>
                Enter terminal <ChevronRight size={14} style={{ marginLeft: SPACE[1] }} />
              </Button>
              <Button variant="ghost" size="md" onClick={() => navigate('/api')}>
                Login with Upstox
              </Button>
            </motion.div>
          </div>

          <div style={{ display: 'grid', gap: SPACE[3] }}>
            <MetricWrapper label="Broker connectivity" value="Upstox API login + session flow" tone="accent" />
            <MetricWrapper label="Workspace" value="Watchlist, chart, orders, positions, holdings" />
            <MetricWrapper label="Market tools" value="Options chain, symbol search, terminal widgets" />
            <StatusWrapper label="Desktop-first trading workflow" tone="up" />
          </div>
        </div>

        <motion.div
          className="preview-frame"
          style={{
            y: previewY,
            width: '100%',
            aspectRatio: '16 / 9',
            background: COLOR.bg.surface,
            border: `1px solid ${COLOR.bg.border}`,
            position: 'relative',
            padding: SPACE[2],
          }}
        >
          <div style={{ width: '100%', height: '100%', background: '#000', overflow: 'hidden', position: 'relative', border: `1px solid ${COLOR.bg.border}` }}>
            <img
              src="/terminal_preview.png"
              alt="PandaTrade Upstox API trading terminal preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
            />
          </div>
        </motion.div>
      </section>

      <section style={{ padding: '4rem 2rem', maxWidth: '84rem', margin: '0 auto' }}>
        <SectionHeader
          title="Upstox API workflow"
          subtitle="A single desktop trading surface for market monitoring, chart analysis, and account actions in Indian markets."
          actions={<Text size="xs" color="muted">SEO landing mode</Text>}
        />

        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACE[4], marginTop: SPACE[5] }}>
          <FeatureCard icon={<Zap size={20} color={COLOR.semantic.info} />} title="Upstox API Login" desc="Authenticate your Upstox API session from the terminal and move straight into live market workflows." />
          <FeatureCard icon={<Anchor size={20} color={COLOR.semantic.warning} />} title="Live Watchlists" desc="Track Indian market symbols with hover actions, fast navigation, and compact quote density." />
          <FeatureCard icon={<Activity size={20} color={COLOR.semantic.down} />} title="Chart + Options Chain" desc="Review price action and options chain data inside the same Upstox trading workspace." />
          <FeatureCard icon={<Command size={20} color={COLOR.text.primary} />} title="Orders + Positions" desc="Keep orders, positions, and holdings grouped together for account monitoring and quick review." />
          <FeatureCard icon={<ShieldCheck size={20} color={COLOR.semantic.up} />} title="Secure Broker Bridge" desc="Provider setup follows the same terminal shell while keeping the Upstox API flow clear and accessible." />
          <FeatureCard icon={<Layout size={20} color={COLOR.text.secondary} />} title="Desktop Trading Layout" desc="A modular layout keeps the watchlist, chart, and account stack visible without wasting screen space." />
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', borderTop: `1px solid ${COLOR.bg.border}`, borderBottom: `1px solid ${COLOR.bg.border}`, background: COLOR.bg.surface }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: SPACE[5], flexWrap: 'wrap' }}>
          <div>
            <Text size="3xl" weight="bold" color="primary">
              Ready to trade through the Upstox API?
            </Text>
            <div style={{ marginTop: SPACE[2] }}>
              <Text size="sm" color="secondary">
                Launch the trading terminal or move directly into Upstox API login and configuration.
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: SPACE[2] }}>
            <Button variant="accent" size="md" onClick={() => navigate('/app')}>
              Enter terminal
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate('/api')}>
              Open setup
            </Button>
          </div>
        </div>
      </section>

      <footer style={{ padding: '3rem 2rem', background: '#030303' }}>
        <div style={{ maxWidth: '84rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))', gap: SPACE[6] }} className="footer-grid">
          <div>
            <BrandLockup
              logo={<img src={logoSvg} alt="PandaTrade" style={{ height: '1rem', objectFit: 'contain' }} />}
              title="Pandatrade"
              subtitle="Upstox API terminal for Indian market workflows"
              tone="accent"
            />
            <p style={{ color: COLOR.text.muted, fontSize: TYPE.size.xs, lineHeight: '1.6', marginTop: SPACE[4], maxWidth: '20rem' }}>
              PandaTrade combines a terminal-style interface with Upstox API connectivity for watchlists, charts, options chain review, and account actions.
            </p>
          </div>

          <FooterColumn title="Platform" items={['Upstox_API_Terminal', 'Trading_Layout', 'Charting_Workspace', 'Account_Monitoring']} />
          <FooterColumn title="Core flows" items={['Upstox_Login', 'Watchlists', 'Options_Chain', 'Orders_Positions_Holdings']} />
          <FooterColumn title="System" items={['Broker_Config', 'Privacy_Policy', 'Service_Terms', 'Terminal_Status']} />
        </div>

        <div
          style={{
            maxWidth: '84rem',
            margin: `${SPACE[6]} auto 0 auto`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${COLOR.bg.border}`,
            paddingTop: SPACE[4],
            gap: SPACE[3],
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: COLOR.text.muted, fontSize: TYPE.size.xs }}>© 2026 PANDA_TRADE_SYSTEMS. ALL_RIGHTS_RESERVED.</span>
          <div style={{ display: 'flex', gap: SPACE[3], alignItems: 'center' }}>
            <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
              Stable build v2.0.431
            </span>
            <StatusWrapper label="Live" tone="up" />
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 768px) {
          .nav-container { padding: 0 1rem !important; }
          .hero-title { font-size: 2rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .hero-section { padding-top: 7rem !important; }
        }
      `}</style>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div
    style={{
      background: COLOR.bg.surface,
      border: `1px solid ${COLOR.bg.border}`,
      padding: '2rem',
      transition: 'border-color 80ms linear, background 80ms linear',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = COLOR.semantic.info;
      e.currentTarget.style.background = COLOR.interactive.selected;
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = COLOR.bg.border;
      e.currentTarget.style.background = COLOR.bg.surface;
    }}
  >
    <div style={{ marginBottom: SPACE[4] }}>{icon}</div>
    <h3 style={{ fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, margin: `0 0 ${SPACE[2]} 0` }}>{title}</h3>
    <p style={{ fontSize: TYPE.size.md, color: COLOR.text.secondary, margin: 0, lineHeight: TYPE.lineHeight.relaxed }}>{desc}</p>
  </div>
);

const FooterColumn: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 style={{ color: COLOR.text.primary, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, marginBottom: SPACE[4] }}>{title}</h4>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      {items.map((item) => (
        <li key={item} style={{ color: COLOR.text.secondary, fontSize: TYPE.size.xs }}>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default LandingPage;
