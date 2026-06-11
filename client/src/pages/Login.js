import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import '../styles/CinematicHome.css';

const users = [
  { 
    name: 'Maverick', 
    path: '/maverick', 
    emoji: 'ti-rocket', 
    volume: 'Vol. I', 
    cardClass: 'card-maverick',
    characterImage: 'https://images.pexels.com/photos/14201953/pexels-photo-14201953.jpeg'
  },
  { 
    name: 'Bell', 
    path: '/bell', 
    emoji: 'ti-bell', 
    volume: 'Vol. II', 
    cardClass: 'card-bell',
    characterImage: 'https://images.pexels.com/photos/34934399/pexels-photo-34934399.png'
  },
  { 
    name: 'Goju', 
    path: '/goju', 
    emoji: 'ti-flame', 
    volume: 'Vol. III', 
    cardClass: 'card-goju',
    characterImage: 'https://images.pexels.com/photos/29176529/pexels-photo-29176529.jpeg'
  },
];

const categories = [
  { title: 'Music', path: '/music', icon: 'ti-music', class: 'orb-music' },
  { title: 'Movies', path: '/movies', icon: 'ti-movie', class: 'orb-movies' },
  { title: 'Anime', path: '/anime-hub', icon: 'ti-device-tv', class: 'orb-anime' },
  { title: 'Manga', path: '/anime-hub/manga', icon: 'ti-notebook', class: 'orb-manga' },
  { title: 'Books', path: '/books', icon: 'ti-book-2', class: 'orb-books' },
  { title: 'Study', path: '/study-zone', icon: 'ti-brush', class: 'orb-study' },
  { title: 'Games', path: '/games', icon: 'ti-device-gamepad', class: 'orb-games' },
  { title: 'Chat', path: '/chalo-baat-karte-hai', icon: 'ti-message-circle', class: 'orb-chat' },
  { title: 'YouTube', path: '/youtube', icon: 'ti-brand-youtube', class: 'orb-youtube' },
];

function Login() {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const particlesRef = useRef(null);

  const handleIconClick = (e, path) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = ['#f6c879', '#ffe9a6', '#ffab40', '#a370f7', '#d4af37'];
    const count = 12 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'dock-spark';
      
      const size = 2 + Math.random() * 4;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      spark.style.background = color;
      spark.style.boxShadow = `0 0 6px ${color}`;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const sx = Math.cos(angle) * distance;
      const sy = Math.sin(angle) * distance;
      
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.position = 'absolute';
      spark.style.zIndex = '100';
      spark.style.borderRadius = '50%';
      spark.style.pointerEvents = 'none';
      e.currentTarget.appendChild(spark);

      gsap.to(spark, {
        x: sx,
        y: sy,
        opacity: 0,
        duration: 0.7,
        onComplete: () => spark.remove()
      });
    }

    setTimeout(() => navigate(path), 350);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.to('.logo-container', { opacity: 1, y: 0, duration: 1.5, ease: "power4.out" })
        .to('.orb-item', { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          stagger: 0.08, 
          ease: "back.out(1.5)" 
        }, "-=0.8")
        .to('.path-card', { 
          opacity: 1, 
          y: 0, 
          duration: 1.2, 
          stagger: 0.2, 
          ease: "power3.out" 
        }, "-=1")
        .to('.path-header-wrapper', { 
          opacity: 1, 
          duration: 1.2, 
          ease: "power2.inOut" 
        }, "-=0.6");

      gsap.to('.orb-item', {
        y: -15,
        duration: 3.5,
        stagger: {
          each: 0.4,
          repeat: -1,
          yoyo: true
        },
        ease: "sine.inOut"
      });

      const particlesContainer = particlesRef.current;
      if (particlesContainer) {
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
          const p = document.createElement('div');
          p.className = 'dust-particle';
          const size = Math.random() * 2 + 0.5;
          p.style.width = `${size}px`;
          p.style.height = `${size}px`;
          p.style.left = `${Math.random() * 100}vw`;
          p.style.top = `${Math.random() * 100}vh`;
          p.style.opacity = Math.random() * 0.3 + 0.05;
          particlesContainer.appendChild(p);

          gsap.to(p, {
            x: `+=${Math.random() * 200 - 100}`,
            y: `+=${Math.random() * 200 - 100}`,
            opacity: (Math.random() * 0.4) + 0.1,
            duration: Math.random() * 15 + 15,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
      }

      const handleMouseMove = (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 15;
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 15;
        
        gsap.to('.main-video-bg', {
          x: mouseX,
          y: mouseY,
          duration: 1.2,
          ease: "power2.out"
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
    });

    return () => ctx.revert();
  }, []);

  const handleLogin = (user) => {
    loginAsDemo(user.name);
    navigate(user.path);
  };

  return (
    <div className="cinematic-home-container">
      <video autoPlay loop muted playsInline className="main-video-bg">
        <source src="https://kombai-assets.b-cdn.net/generated_assets/91a26b3e-751c-465b-b58d-def7ecb58607/c9ab74b6c82d43a895f9d8e56b33b4b3.mp4" type="video/mp4" />
      </video>

      <div className="fog-overlay"></div>
      <div className="gradient-overlay"></div>
      <div ref={particlesRef} className="dust-particles-container"></div>

      <main className="main-content">
        <div className="logo-container">
          <div className="logo-plaque glass-obsidian">
            <h1 className="gold-glow">WeGift</h1>
            <div className="byline-container">
              <div className="accent-line"></div>
              <p className="byline-text">BY MAVERICK AKA BHAVESH</p>
              <div className="accent-line"></div>
            </div>
          </div>
        </div>

        <div className="orb-dock">
          {categories.map((cat) => (
            <div key={cat.title} className={`orb-item ${cat.class}`} onClick={(e) => handleIconClick(e, cat.path)} title={cat.title}>
              <div className="orb-circle glass-obsidian">
                <i className={`ti ${cat.icon}`}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="path-section">
          <div className="path-header-wrapper">
            <div className="shimmer-line"></div>
            <span className="path-header-text">Choose Your Path</span>
            <div className="shimmer-line"></div>
          </div>
          
          <div className="path-grid">
            {users.map((user) => (
              <div key={user.name} className={`path-card glass-obsidian ${user.cardClass}`} onClick={() => handleLogin(user)}>
                <div className="path-card-overlay"></div>
                
                <div className="character-image-container">
                  <img src={user.characterImage} alt={user.name} className="character-image" />
                  <div className="image-vignette"></div>
                </div>

                <div className="card-icon-badge">
                  <i className={`ti ${user.emoji}`}></i>
                </div>
                <div className="card-info">
                  <span className="card-vol">{user.volume}</span>
                  <h2 className="card-title">{user.name}</h2>
                  <div className="card-footer">
                    <span>Enter Path</span>
                    <div className="card-footer-line"></div>
                    <i className="ti ti-chevron-right"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
