import { useState } from 'react'
import './App.css'

const navigation = [
  ['⌂', 'Dashboard'],
  ['✳', 'Eco Challenge'],
  ['⌖', 'Live Map'],
  ['▥', 'City Progress'],
  ['♜', 'Government Action'],
  ['◉', 'AI Eco Coach'],
  ['♧', 'Community'],
  ['♙', 'Profile'],
]

const recommendations = [
  ['×', 'Avoid prolonged outdoor activity', 'coral'],
  ['◉', 'Stay hydrated', 'blue'],
  ['▤', 'Reduce unnecessary water usage', 'sky'],
  ['♻', "Separate today’s waste", 'green'],
]

const actions = [
  ['◉', 'Monitoring air quality', 'Active'],
  ['⌁', 'Road dust control', 'Ongoing'],
  ['♨', 'Pollution-source inspection', 'Ongoing'],
  ['▣', 'Public advisory', 'Active'],
]

function Icon({ children, className = '' }) {
  return <span className={`icon ${className}`} aria-hidden="true">{children}</span>
}

function PanelTitle({ icon, children, action }) {
  return (
    <div className="panel-title">
      <span className="panel-title-label"><Icon>{icon}</Icon>{children}</span>
      {action && <button className="text-action" type="button">{action} <span>→</span></button>}
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [selectedAnswer, setSelectedAnswer] = useState('B')
  const [challengeJoined, setChallengeJoined] = useState(false)
  const [challengeFeedback, setChallengeFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(false)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand brand-sidebar" href="#dashboard" aria-label="EcoGuard home">
          <span className="brand-mark">🌎</span>
          <span><strong>ECOGUARD</strong><small>Cleaner Air. Safer Water.</small></span>
        </a>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(([icon, label]) => (
            <button
              className={`nav-link ${activeNav === label ? 'is-active' : ''}`}
              key={label}
              aria-label={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              <Icon>{icon}</Icon><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="leaf-sprig">♣</span>
          <p>Small actions.<br /><strong>Big change.</strong></p>
          <div className="side-skyline" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        </div>
        <div className="sidebar-foot"><span className="online-dot" /> Air quality alerts are on</div>
      </aside>

      <div className="main-area" id="dashboard">
        <header className="topbar">
          <a className="brand top-brand" href="#dashboard" aria-label="EcoGuard home">
            <span className="brand-mark">🌎</span>
            <span><strong>ECOGUARD</strong><small>Cleaner Air. Safer Water. Resilient Cities.</small></span>
          </a>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search" placeholder="Search for city, action, or anything…" value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          </label>
          <div className="topbar-tools">
            <div className="weather"><span>🌤️</span><div><strong>28°</strong><small>Partly cloudy</small></div></div>
            <div className="city-chip"><span className="pin">●</span><div><strong>Meerut</strong><small>Mon, 28 Sep 2026</small></div></div>
            <button className={`icon-button notification ${notice ? 'has-notice' : ''}`} type="button" aria-label="Notifications" onClick={() => setNotice(!notice)} title="Notifications">♧<i /></button>
            <button className="user-menu" type="button" onClick={() => setActiveNav('Profile')}><span className="avatar">A</span><span className="user-copy"><strong>Ajay Kumar</strong><small>Eco Protector</small></span><span className="chevron">⌄</span></button>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-strip">
            <div className="welcome-place"><span className="place-icon">⌖</span><div><h1>Meerut</h1><p>Uttar Pradesh, India</p></div></div>
            <div className="welcome-date"><span>▦</span><div><strong>Mon, 28 Sep 2026</strong><small>Today</small></div></div>
            <div className="landscape" aria-hidden="true"><div className="sun-disc" /><div className="city-shapes"><i /><i /><i /><i /><i /><i /><i /></div><div className="hill hill-back" /><div className="hill hill-front" /></div>
          </section>

          <section className="dashboard-grid">
            <div className="column column-left">
              <div className="metric-grid">
                <article className="metric-card metric-air"><div className="metric-icon">≋</div><div className="metric-label">AIR <span>›</span></div><strong className="metric-value">245</strong><small>AQI</small><span className="status-pill status-bad">Unhealthy</span></article>
                <article className="metric-card metric-heat"><div className="metric-icon">☼</div><div className="metric-label">HEAT <span>›</span></div><strong className="metric-value">39°C</strong><small>Temperature</small><span className="status-pill status-hot">High</span></article>
                <article className="metric-card metric-water"><div className="metric-icon">♆</div><div className="metric-label">WATER <span>›</span></div><strong className="metric-value">Normal</strong><small>Water Status</small><span className="status-pill status-good">Normal</span></article>
                <article className="metric-card metric-waste"><div className="metric-icon">♻</div><div className="metric-label">WASTE <span>›</span></div><strong className="metric-value">Moderate</strong><small>Waste Status</small><span className="status-pill status-warn">Moderate</span></article>
              </div>

              <div className="risk-alert"><span className="risk-icon">!</span><div><strong>ENVIRONMENTAL RISK: HIGH</strong><p>Air quality and heat levels are affecting health and comfort. Follow recommendations.</p></div><button type="button" aria-label="View risk details">›</button></div>

              <section className="panel recommendation-panel">
                <PanelTitle icon="▤">Today’s Recommendations</PanelTitle>
                <ul className="recommendation-list">
                  {recommendations.map(([icon, text, color]) => <li key={text}><span className={`recommendation-icon ${color}`}>{icon}</span><span>{text}</span><button type="button" aria-label={`View ${text}`}>›</button></li>)}
                </ul>
              </section>

              <section className="panel map-panel">
                <PanelTitle icon="♧" action="View All">Live Map &amp; Sensors</PanelTitle>
                <div className="map-content">
                  <div className="map-visual" role="img" aria-label="Map of Meerut with nearby environmental sensors">
                    <svg viewBox="0 0 260 150" aria-hidden="true"><path d="M-8 31 78 80l40-20 42 29 109-45M4 143l69-53 44 6 31-32 65 15 48-38M31-8l29 49-13 39 48 58m81-151-17 51 28 34-13 48m67-63-43 15-12 42" /><path d="m-8 31 86 49 40-20 42 29 109-45M4 143l69-53 44 6 31-32 65 15 48-38" className="map-road" /></svg>
                    <span className="map-pin pin-one">●</span><span className="map-pin pin-two">●</span><span className="map-pin pin-three">●</span><span className="map-pin pin-four">●</span><span className="map-city">Meerut</span>
                  </div>
                  <div className="map-legend"><span><i className="legend-dot good" /> Good</span><span><i className="legend-dot moderate" /> Moderate</span><span><i className="legend-dot poor" /> Poor</span><span><i className="legend-dot unhealthy" /> Unhealthy</span></div>
                </div>
                <button type="button" className="map-link" onClick={() => setActiveNav('Live Map')}>View Full Map →</button>
              </section>

              <section className="panel community-panel">
                <PanelTitle icon="♧" action="View All">Community Actions</PanelTitle>
                <div className="community-action"><span className="community-icon yellow">♻</span><span>Report waste at your area</span><small>12 reports</small><b>›</b></div>
                <div className="community-action"><span className="community-icon teal">♣</span><span>Suggest tree plantation</span><small>8 suggestions</small><b>›</b></div>
                <div className="community-action"><span className="community-icon blue">✦</span><span>Join clean-up drive</span><small>5 events</small><b>›</b></div>
              </section>
            </div>

            <div className="column column-middle">
              <section className="panel challenge-panel">
                <PanelTitle icon="♧">Today’s Eco Challenge</PanelTitle>
                <div className="challenge-points">✦ +20 Points</div>
                <div className="challenge-heading"><span className="challenge-flame">♨</span><div><h2>Beat the Heat</h2><p>“It’s 39°C today. Which action saves the most energy?”</p></div><span className="thermometer">🌡️</span></div>
                <div className="answer-list" role="radiogroup" aria-label="Choose an energy-saving action">
                  {[
                    ['A', 'Set AC to 18°C'],
                    ['B', 'Set AC around 24–26°C'],
                    ['C', 'Keep windows open with AC'],
                  ].map(([key, answer]) => <button type="button" className={`answer-option ${selectedAnswer === key ? 'selected' : ''}`} key={key} onClick={() => setSelectedAnswer(key)} role="radio" aria-checked={selectedAnswer === key}><span>{key}</span>{answer}</button>)}
                </div>
                <button className={`primary-button ${challengeJoined ? 'button-done' : ''}`} type="button" onClick={() => {
                  if (selectedAnswer === 'B') {
                    setChallengeJoined(true)
                    setChallengeFeedback('Correct! You earned 20 Eco Points.')
                  } else {
                    setChallengeFeedback('Not quite. Set AC around 24–26°C to save energy.')
                  }
                }}>{challengeJoined ? '✓ CHALLENGE COMPLETED' : '▶  PLAY & EARN POINTS'}</button>
                {challengeFeedback && <p className={`challenge-feedback ${challengeJoined ? '' : 'challenge-error'}`}>{challengeFeedback}</p>}
                <div className="streak-row"><span>♨ 7 Day Streak</span><div className="streak-dots"><i /><i /><i /><i /><i /><i /><i /></div><strong>★ 340</strong><small>Eco Points</small></div>
              </section>

              <section className="panel impact-panel">
                <PanelTitle icon="♣" action="View All">Your Impact</PanelTitle>
                <div className="impact-grid">
                  <div className="impact-stat"><span>♣</span><strong>12</strong><small>Actions<br />Completed</small></div>
                  <div className="impact-stat"><span>♻</span><strong>3.2 kg</strong><small>Waste<br />Segregated</small></div>
                  <div className="impact-stat"><span>♧</span><strong>5</strong><small>Trees<br />Suggested</small></div>
                  <div className="impact-stat"><span>♆</span><strong>1,240 L</strong><small>Water<br />Saved</small></div>
                </div>
              </section>

              <section className="panel forecast-panel">
                <PanelTitle icon="☼">7-Day Forecast</PanelTitle>
                <div className="forecast-days">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => <div className="forecast-day" key={day}><small>{day}</small><span>{['☀', '☀', '☁', '☀', '☁', '☀', '☀'][index]}</span><strong>{[39, 38, 36, 35, 37, 38, 36][index]}°</strong></div>)}
                </div>
                <div className="forecast-note"><span>↗</span> Warm and dry through Thursday. Stay hydrated.</div>
              </section>
            </div>

            <div className="column column-right">
              <section className="panel government-panel">
                <PanelTitle icon="♜">Government Action <span className="verified">✓ Verified</span></PanelTitle>
                <div className="panel-meta">Updated 10 min ago</div>
                <h3>Air Pollution Control</h3>
                <ul className="action-list">
                  {actions.map(([icon, title, status]) => <li key={title}><span className={`action-symbol ${status === 'Active' ? 'action-green' : 'action-orange'}`}>{icon}</span><span>{title}</span><small className={status === 'Active' ? 'active-state' : 'ongoing-state'}>{status}</small></li>)}
                </ul>
                <div className="progress-heading"><strong>Overall Progress</strong><b>72%</b></div>
                <div className="progress-track"><span style={{ width: '72%' }} /></div>
                <button className="outline-button" type="button" onClick={() => setActiveNav('Government Action')}>View Action Details →</button>
                <div className="authority"><span className="authority-icon">♜</span><div><strong>Responsible Authority</strong><small>Municipal Corporation, Meerut</small><small>Air Quality: UPPCB / CPCB</small><button type="button" onClick={() => setActiveNav('Government Action')}>View Departments →</button></div></div>
              </section>

              <section className="panel insights-panel">
                <PanelTitle icon="✦" action="›">AI Insights</PanelTitle>
                <p className="insight-copy">Air pollution is expected to remain high for the next 2 days due to increased traffic and low wind speed.</p>
                <div className="insight-chart" aria-label="Air quality trend is expected to stay high"><span style={{ height: '50%' }} /><span style={{ height: '62%' }} /><span style={{ height: '72%' }} /><span style={{ height: '60%' }} /><span style={{ height: '80%' }} /><span style={{ height: '74%' }} /><span style={{ height: '90%' }} /></div>
              </section>

              <section className="panel partnership-panel">
                <PanelTitle icon="♧">Government + Citizens</PanelTitle>
                <p className="panel-subtitle">Together for a greener city.</p>
                <div className="partner-columns"><div><strong>🏛 Authorities Do</strong><span>✓ Monitor</span><span>✓ Respond</span><span>✓ Inspect</span><span>✓ Implement Projects</span></div><div><strong>● You Do</strong><span>✓ Follow Recommendations</span><span>✓ Complete Challenges</span><span>✓ Report Issues</span><span>✓ Spread Awareness</span></div></div>
                <button type="button" className="primary-button partnership-button" onClick={() => setActiveNav('Community')}>♣ Same Goal → A Cleaner, Greener Meerut</button>
              </section>
            </div>

            <aside className="column column-rail">
              <section className="panel progress-panel">
                <PanelTitle icon="♣">City Environmental Progress</PanelTitle>
                <div className="panel-meta">📍 Meerut <span>Updated 10 min ago</span></div>
                {[
                  ['❋', 'Air Quality', '72%', '72', 'red'],
                  ['♆', 'Water Management', '85%', '85', 'blue'],
                  ['♻', 'Waste Management', '60%', '60', 'green'],
                  ['♣', 'Green Cover', '45%', '45', 'lime'],
                ].map(([icon, label, value, width, color]) => <div className="progress-item" key={label}><span className={`progress-icon ${color}`}>{icon}</span><div className="progress-info"><div><strong>{label}</strong><b>{value}</b></div><div className="mini-track"><i className={color} style={{ width: `${width}%` }} /></div></div></div>)}
                <button type="button" className="outline-button" onClick={() => setActiveNav('City Progress')}>See City Action Plan →</button>
              </section>

              <section className="panel waste-panel">
                <PanelTitle icon="♻" action="›">Waste Analysis (AI)</PanelTitle>
                <div className="waste-content"><img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=320&q=80" alt="Recyclable materials sorted for waste analysis" /><div className="waste-breakdown"><span><i className="waste-icon plastic">▰</i>Plastic <b>45%</b></span><span><i className="waste-icon organic">♣</i>Organic <b>30%</b></span><span><i className="waste-icon paper">▤</i>Paper <b>20%</b></span><span><i className="waste-icon metal">◇</i>Metal <b>5%</b></span></div></div>
                <p className="waste-note"><span>♣</span><strong>Mixed waste detected.<br />Segregation needed.</strong></p>
              </section>

              <section className="panel coach-panel">
                <PanelTitle icon="◉">AI Eco Coach</PanelTitle>
                <div className="coach-greeting">What should I do today?</div>
                <div className="coach-plan"><strong><span>✦</span> Your Eco Plan</strong><p>Today’s main concern is air pollution and high heat. Here’s what you can do:</p><ul><li>Avoid prolonged outdoor activity</li><li>Stay hydrated</li><li>Complete today’s Eco Challenge</li><li>Your 7-day streak is active!</li></ul><small>I'll also show you the next verified update when new information is available.</small></div>
                <form className="coach-input" onSubmit={(event) => { event.preventDefault(); setSearch('Eco Coach: ' + search) }}><input aria-label="Ask the Eco Coach" placeholder="Ask anything…" /><button type="submit" aria-label="Send message">↗</button></form>
              </section>
            </aside>
          </section>

          <footer className="dashboard-footer"><span>♣ Together we can make <strong>Meerut greener, cleaner and healthier.</strong></span><span><strong>ECOGUARD</strong><i /> Cleaner Air. Safer Water. Resilient Cities.</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
