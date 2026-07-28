import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ── CHANGE THESE ───────────────────────────────────────────────────────────
const SECRET_TOKEN = 'fyp2025cust';

const TEAM_MEMBERS = [
    {
        name: 'Zeeshan Sajid',
        role: 'Backend & AI Developer',
        linkedin: 'https://www.linkedin.com/in/zeeshansajid',
        github: 'https://github.com/ZeeshanSajid03',
        avatar: 'ZS',
        color: '#0ea5e9',
    },
    {
        name: 'Tallal Mahmood',
        role: 'IoT & Hardware Engineer',
        linkedin: 'https://linkedin.com/in/tallal-mahmood',
        github: 'https://github.com/tallalmirza04',
        avatar: 'TM',
        color: '#10b981',
    },
    {
        name: 'Hayan Sajid',
        role: 'Frontend Developer',
        linkedin: 'https://linkedin.com/in/hayan-sajid-a60745355',
        github: 'https://github.com/Hayansajid',
        avatar: 'HS',
        color: '#8b5cf6',
    },
];

const PROJECT_LINKS = [
    {
        label: 'Live Demo',
        url: 'https://smartirrigiation-fyp.vercel.app',
        emoji: '🌐',
    },
    {
        label: 'GitHub Repo',
        url: 'https://github.com/zeeshansajid-03/smart-irrigation-system',
        emoji: '📦',
    },
];

// ─────────────────────────────────────────────────────────────────────────────

const TeamPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [authorized, setAuthorized] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (token === SECRET_TOKEN) {
            setAuthorized(true);

            const timer = setTimeout(() => {
                setVisible(true);
            }, 50);

            return () => clearTimeout(timer);
        }

        navigate('/login', { replace: true });
    }, [searchParams, navigate]);

    if (!authorized) return null;

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 16px',
                opacity: visible ? 1 : 0,
                transform: visible
                    ? 'translateY(0)'
                    : 'translateY(16px)',
                transition:
                    'opacity 0.5s ease, transform 0.5s ease',
            }}
        >
            <style>{`
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(24px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .member-card {
                    animation: fadeUp 0.5s ease both;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .member-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2) !important;
                }

                .link-btn {
                    transition: all 0.18s ease;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .link-btn:hover {
                    transform: translateY(-2px);
                    opacity: 0.92;
                }
            `}</style>

            {/* Header */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    maxWidth: '560px',
                }}
            >

                <img
                    src="/Logo.png"
                    alt="Smart Irrigation System Logo"
                    style={{
                        width: '90px',
                        height: '90px',
                        objectFit: 'contain',
                        marginBottom: '16px',
                    }}
                />


                <h1
                    style={{
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.8rem',
                        marginBottom: '8px',
                    }}
                >
                    Smart Irrigation System
                </h1>

                <p
                    style={{
                        color: '#6ee7b7',
                        fontSize: '0.92rem',
                        marginBottom: '4px',
                    }}
                >
                    Final Year Project — BSCS Fall 2025
                </p>

                <p
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.82rem',
                    }}
                >
                    Capital University of Science and Technology, Islamabad
                </p>
            </div>

            {/* Team Members */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '20px',
                    width: '100%',
                    maxWidth: '860px',
                    marginBottom: '36px',
                }}
            >
                {TEAM_MEMBERS.map((member, i) => (
                    <div
                        key={member.name}
                        className="member-card"
                        style={{
                            animationDelay: `${i * 0.1 + 0.1}s`,
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '20px',
                            padding: '28px 24px',
                            boxShadow:
                                '0 8px 32px rgba(0,0,0,0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: member.color,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                marginBottom: '14px',
                                boxShadow: `0 4px 16px ${member.color}55`,
                            }}
                        >
                            {member.avatar}
                        </div>

                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#1e293b',
                                marginBottom: '4px',
                            }}
                        >
                            {member.name}
                        </div>

                        <div
                            style={{
                                fontSize: '0.78rem',
                                color: '#64748b',
                                marginBottom: '20px',
                            }}
                        >
                            {member.role}
                        </div>

                        {/* Links */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                width: '100%',
                            }}
                        >
                            <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-btn"
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    background: '#0077b5',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>

                                LinkedIn
                            </a>

                            <a
                                href={member.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-btn"
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    background: '#1e293b',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>

                                GitHub
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Project Links */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '860px',
                    marginBottom: '32px',
                }}
            >
                <div
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}
                >
                    Project Links
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {PROJECT_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-btn"
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(255,255,255,0.12)',
                                border:
                                    '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                            }}
                        >
                            {link.emoji} {link.label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.72rem',
                    textAlign: 'center',
                }}
            >
                CUST · Department of Computer Science · 2026
            </div>
        </div>
    );
};

export default TeamPage;