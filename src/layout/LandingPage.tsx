import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Anchor, Activity, ShieldCheck, Globe, Key, Command, ChevronRight, Play, Layout, Terminal } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../ds/tokens';
import logoSvg from '../../svg/Pandatrade.svg';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 0.3], [1.3, 1.0]);
    const y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: TYPE.family.sans, overflowX: 'hidden' }}>
            {/* Header / Nav */}
            <nav className="nav-container" style={{ 
                height: '72px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 40px',
                position: 'fixed',
                top: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 1000
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logoSvg} alt="PandaTrade" style={{ height: '20px', objectFit: 'contain' }} />
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <button 
                        onClick={() => navigate('/app')}
                        style={{ 
                            height: '38px', 
                            padding: '0 20px', 
                            background: '#fff', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: '900', 
                            cursor: 'pointer',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Open App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section" style={{ 
                paddingTop: '140px', 
                paddingBottom: '80px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}>
                <motion.h1 
                    className="hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ 
                        fontSize: '90px', 
                        fontWeight: '500', 
                        margin: '0 0 24px 0', 
                        lineHeight: '0.92', 
                        letterSpacing: '-0.02em',
                        maxWidth: '1000px',
                        color: COLOR.semantic.info,
                        fontFamily: TYPE.family.heading
                    }}
                >
                    Experimental trading <span style={{ color: '#444' }}>dashboard.</span>
                </motion.h1>

                <motion.p 
                    className="hero-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ 
                        fontSize: '18px', 
                        color: '#888', 
                        maxWidth: '600px', 
                        margin: '0 auto 48px auto', 
                        lineHeight: '1.6' 
                    }}
                >
                    A unified cockpit for institutional bridging, high-frequency execution, and modular data visualization.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', gap: '16px' }}
                >
                    <button 
                        onClick={() => navigate('/app')}
                        style={{ 
                            height: '52px', 
                            padding: '0 32px', 
                            background: '#fff', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontSize: '14px', 
                            fontWeight: '900', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        START TRADING NOW <ChevronRight size={18} />
                    </button>
                </motion.div>

                {/* App Preview Frame */}
                <motion.div 
                    className="preview-frame"
                    style={{ 
                        scale, 
                        y,
                        width: '1200px', 
                        aspectRatio: '16 / 9',
                        marginTop: '40px', 
                        background: '#050505', 
                        border: '1px solid #222', 
                        borderRadius: '12px',
                        boxShadow: '0 50px 100px rgba(0,0,0,0.8)',
                        position: 'relative',
                        padding: '8px',
                        perspective: '1000px'
                    }}
                >
                    <div style={{ width: '100%', height: '100%', background: '#000', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                         {/* Terminal Screenshot */}
                         <img 
                            src="/terminal_preview.png" 
                            alt="Panda Trade Terminal" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                // Fallback if image not found
                                (e.currentTarget as HTMLImageElement).style.opacity = '0';
                            }}
                         />
                    </div>
                </motion.div>
            </section>

            {/* Feature Bento Grid */}
            <section style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 16px 0' }}>Infinite Data. One View.</h2>
                    <p style={{ color: '#666', fontSize: '16px' }}>Every connector you need to gain an edge in global markets.</p>
                </div>

                <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <FeatureCard 
                        icon={<Zap size={24} color={COLOR.semantic.warning} />}
                        title="Unified Control"
                        desc="Bridge directly to institutional brokers for seamless execution and millisecond order placement."
                    />
                    <FeatureCard 
                        icon={<Anchor size={24} color={COLOR.semantic.info} />}
                        title="Live Telemetry"
                        desc="Stream global data feeds in real-time. From market liquidity to alternative global indicators."
                    />
                    <FeatureCard 
                        icon={<Activity size={24} color={COLOR.semantic.down} />}
                        title="Advanced Scanners"
                        desc="Monitor anomaly detection and technical crossovers with precision-engineered data scanners."
                    />
                    <FeatureCard 
                        icon={<Command size={24} color="#fff" />}
                        title="Modular OS"
                        desc="High-performance terminal with dynamic layouts. Arrange your workspace your way."
                    />
                    <FeatureCard 
                        icon={<ShieldCheck size={24} color={COLOR.semantic.up} />}
                        title="Secure Bridge"
                        desc="Enterprise-grade local encryption. Your authentication keys never leave your infrastructure."
                    />
                    <FeatureCard 
                        icon={<Layout size={24} color="#888" />}
                        title="Bento Workspaces"
                        desc="Switch between specialized analytics suites and execution desks with zero operational latency."
                    />
                </div>
            </section>

            {/* CTA Banner */}
            <section style={{ padding: '100px 40px', textAlign: 'center', background: '#050505', borderTop: '1px solid #111' }}>
                <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px' }}>Ready to elevate your edge?</h2>
                <button 
                    onClick={() => navigate('/app')}
                    style={{ 
                        height: '60px', 
                        padding: '0 48px', 
                        background: '#fff', 
                        color: '#000', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontSize: '16px', 
                        fontWeight: '900', 
                        cursor: 'pointer'
                    }}
                >
                    ENTER THE TERMINAL
                </button>
            </section>

            <footer style={{ padding: '80px 40px', borderTop: '1px solid #111', background: '#030303' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '48px', marginBottom: '80px' }} className="footer-grid">
                    <div style={{ gridColumn: 'span 1' }}>
                        <img src={logoSvg} alt="PandaTrade" style={{ height: '18px', objectFit: 'contain', marginBottom: '24px' }} />
                        <p style={{ color: '#444', fontSize: '13px', lineHeight: '1.6' }}>
                            The institutional cockpit for experimental trading and high-fidelity global data visualization.
                        </p>
                    </div>
                    
                    <div>
                        <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold',  letterSpacing: '0.1em', marginBottom: '20px' }}>Platform</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Infrastructure', 'Bento_UI', 'OS_v2.0', 'Latency_Metrics'].map(it => (
                                <li key={it}><a href="#" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='#666'}>{it}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold',  letterSpacing: '0.1em', marginBottom: '20px' }}>Connectors</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Upstox_Bridge', 'AISStream_Global', 'NASA_FIRMS', 'TradingView_Core'].map(it => (
                                <li key={it}><a href="#" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='#666'}>{it}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold',  letterSpacing: '0.1em', marginBottom: '20px' }}>System</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Protocol_Security', 'Privacy_Policy', 'Service_Terms', 'Node_Status'].map(it => (
                                <li key={it}><a href="#" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='#666'}>{it}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '32px' }}>
                    <div style={{ color: '#333', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>© 2026 PANDA_TRADE_SYSTEMS. ALL_PROTOCOL_RIGHTS_RESERVED.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                         <span style={{ fontSize: '11px', color: '#222', letterSpacing: '0.2em', fontWeight: TYPE.weight.black }}>STABLE_BUILD_v2.0.431</span>
                         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d084', boxShadow: '0 0 10px #00d084' }} />
                    </div>
                </div>
            </footer>

            <style>{`
                @media (max-width: 1024px) {
                    .hero-title { font-size: 64px !important; }
                    .preview-frame { width: 90% !important; margin-top: 60px !important; }
                    .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 768px) {
                    .hero-title { font-size: 42px !important; }
                    .nav-container { padding: 0 20px !important; }
                    .feature-grid { grid-template-columns: 1fr !important; }
                    .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
                    .preview-frame { width: 95% !important; margin-top: 40px !important; }
                    .hero-section { padding-top: 120px !important; }
                    .hero-subtitle { font-size: 16px !important; }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
            `}</style>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string, desc: string }> = ({ icon, title, desc }) => (
    <div style={{ 
        background: '#0a0a0a', 
        border: '1px solid #111', 
        borderRadius: '8px', 
        padding: '32px',
        transition: 'all 0.2s linear'
    }} onMouseOver={e => (e.currentTarget.style.borderColor = '#333')} onMouseOut={e => (e.currentTarget.style.borderColor = '#111')}>
        <div style={{ marginBottom: '20px' }}>{icon}</div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 12px 0' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0, lineHeight: '1.6' }}>{desc}</p>
    </div>
);

export default LandingPage;
