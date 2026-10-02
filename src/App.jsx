import { useState } from 'react'
import { EnvironmentCard } from './components/EnvironmentCard.jsx'
import logo from './assets/logo.png'
import { useEnvironmentData } from './hooks/useEnvironmentData.js'
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

function formatLocation(location) {
  return location
    ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
    : 'Locating...'
}

function App() {
  const { data: environmentData, loading: environmentLoading, location: currentLocation } = useEnvironmentData()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [selectedAnswer, setSelectedAnswer] = useState('B')
  const [challengeJoined, setChallengeJoined] = useState(false)
  const [challengeFeedback, setChallengeFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(false)
  const air = environmentData?.air
  const heat = environmentData?.heat
  const water = environmentData?.water
  const waste = environmentData?.waste
  const elevatedConditions = (air?.available && air.value > 100) || (heat?.available && heat.value > 30)
  const riskClass = environmentLoading || (!air?.available && !heat?.available)
    ? 'risk-neutral'
    : elevatedConditions ? 'risk-high' : 'risk-good'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand brand-sidebar" href="#dashboard" aria-label="EcoGuard home">
          <img className="brand-mark" src={logo} alt="" />
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
          <div className="sidebar-foot"><span className="online-dot" /> Environmental data updates automatically</div>
      </aside>

      <div className="main-area" id="dashboard">
        <header className="topbar">
          <a className="brand top-brand" href="#dashboard" aria-label="EcoGuard home">
            <img className="brand-mark" src={logo} alt="" />
            <span><strong>ECOGUARD</strong><small>Cleaner Air. Safer Water. Resilient Cities.</small></span>
          </a>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search" placeholder="Search for city, action, or anything…" value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          </label>
          <div className="topbar-tools">
            <div className="weather"><span>🌤️</span><div><strong>{environmentLoading ? 'Loading...' : environmentData?.heat.available ? `${environmentData.heat.value.toFixed(0)}°` : 'Unavailable'}</strong><small>{environmentData?.heat.status ?? 'Current temperature'}</small></div></div>
            <div className="city-chip"><span className="pin">●</span><div><strong>{formatLocation(currentLocation)}</strong><small>{currentLocation ? 'Selected coordinates' : 'Current location'}</small></div></div>
            <button className={`icon-button notification ${notice ? 'has-notice' : ''}`} type="button" aria-label="Notifications" onClick={() => setNotice(!notice)} title="Notifications">♧<i /></button>
            <button className="user-menu" type="button" onClick={() => setActiveNav('Profile')}><span className="avatar">A</span><span className="user-copy"><strong>Ajay Kumar</strong><small>Eco Protector</small></span><span className="chevron">⌄</span></button>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-strip">
            <div className="welcome-place"><span className="place-icon">⌖</span><div><h1>{currentLocation ? formatLocation(currentLocation) : 'Selected location'}</h1><p>Live environmental data</p></div></div>
            <div className="welcome-date"><span>▦</span><div><strong>{environmentData ? `Updated ${new Date(environmentData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live data'}</strong><small>{environmentLoading ? 'Loading' : 'Current conditions'}</small></div></div>
            <div className="landscape" aria-hidden="true"><div className="sun-disc" /><div className="city-shapes"><i /><i /><i /><i /><i /><i /><i /></div><div className="hill hill-back" /><div className="hill hill-front" /></div>
          </section>

          <section className="dashboard-grid">
            <div className="column column-left">
              <div className="metric-grid">
                <EnvironmentCard type="air" icon="≋" title="AIR" source={environmentData?.air} loading={environmentLoading} />
                <EnvironmentCard type="heat" icon="☼" title="HEAT" source={environmentData?.heat} loading={environmentLoading} />
                <EnvironmentCard type="water" icon="♆" title="WATER" source={environmentData?.water} loading={environmentLoading} />
                <EnvironmentCard type="waste" icon="♻" title="WASTE" source={environmentData?.waste} loading={environmentLoading} />
              </div>

              <div className={`risk-alert ${riskClass}`}><span className="risk-icon">!</span><div><strong>{environmentLoading ? 'ENVIRONMENTAL DATA: LOADING' : air?.available ? `AIR QUALITY: ${air.status.toUpperCase()}` : heat?.available ? `HEAT STATUS: ${heat.status.toUpperCase()}` : 'ENVIRONMENTAL DATA UNAVAILABLE'}</strong><p>{air?.available ? `AQI ${Math.round(air.value)} (${air.status}).` : 'Air-quality readings are unavailable.'} {heat?.available ? `Temperature ${heat.value.toFixed(1)}°C (${heat.status}).` : 'Temperature readings are unavailable.'}</p></div></div>

              <section className="panel recommendation-panel">
                <PanelTitle icon="▤">Today’s Recommendations</PanelTitle>
                <ul className="recommendation-list">
                  {recommendations.map(([icon, text, color]) => <li key={text}><span className={`recommendation-icon ${color}`}>{icon}</span><span>{text}</span><button type="button" aria-label={`View ${text}`}>›</button></li>)}
                </ul>
              </section>

              <section className="panel map-panel">
                <PanelTitle icon="♧" action="View All">Live Map &amp; Sensors</PanelTitle>
                <div className="map-content">
                  <div className="map-visual map-unavailable" role="status">Live map and sensor feed unavailable</div>
                </div>
                <p className="map-link">No map source configured</p>
              </section>

              <section className="panel community-panel">
                <PanelTitle icon="♧" action="View All">Community Actions</PanelTitle>
                <div className="community-action"><span className="community-icon yellow">♻</span><span>Report waste in your area</span><small>Live feed unavailable</small></div>
                <div className="community-action"><span className="community-icon teal">♣</span><span>Suggest tree plantation</span><small>Live feed unavailable</small></div>
                <div className="community-action"><span className="community-icon blue">✦</span><span>Join a clean-up drive</span><small>Live feed unavailable</small></div>
              </section>
            </div>

            <div className="column column-middle">
              <section className="panel challenge-panel">
                <PanelTitle icon="♧">Today’s Eco Challenge</PanelTitle>
                <div className="challenge-points">✦ +20 Points</div>
                <div className="challenge-heading"><span className="challenge-flame">♨</span><div><h2>Beat the Heat</h2><p>{heat?.available ? `Current temperature is ${heat.value.toFixed(1)}°C. Which action saves the most energy?` : 'Temperature data is unavailable. Which action saves the most energy?'}</p></div><span className="thermometer">🌡️</span></div>
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
                  <div className="impact-stat"><span>♣</span><strong>Unavailable</strong><small>Actions<br />Completed</small></div>
                  <div className="impact-stat"><span>♻</span><strong>Unavailable</strong><small>Waste<br />Segregated</small></div>
                  <div className="impact-stat"><span>♧</span><strong>Unavailable</strong><small>Trees<br />Suggested</small></div>
                  <div className="impact-stat"><span>♆</span><strong>Unavailable</strong><small>Water<br />Saved</small></div>
                </div>
              </section>

              <section className="panel forecast-panel">
                <PanelTitle icon="☼">7-Day Forecast</PanelTitle>
                <div className="forecast-days"><p>{environmentLoading ? 'Loading forecast...' : 'Forecast data unavailable'}</p></div>
                <div className="forecast-note"><span>↗</span> No forecast source is configured.</div>
              </section>
            </div>

            <div className="column column-right">
              <section className="panel government-panel">
                <PanelTitle icon="♜">Government Action</PanelTitle>
                <div className="panel-meta">{environmentData ? `Readings updated ${new Date(environmentData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting environmental data'}</div>
                <h3>Government data source</h3>
                <ul className="action-list"><li><span className="action-symbol">—</span><span>Government action feed</span><small>Unavailable</small></li></ul>
                <div className="progress-heading"><strong>Program progress</strong><b>Data unavailable</b></div>
                <div className="progress-track" />
                <button className="outline-button" type="button" onClick={() => setActiveNav('Government Action')}>View Action Details →</button>
                <div className="authority"><span className="authority-icon">♜</span><div><strong>Responsible Authority</strong><small>Government source not configured</small><small>Air quality: Open-Meteo</small><button type="button" onClick={() => setActiveNav('Government Action')}>View Departments →</button></div></div>
              </section>

              <section className="panel insights-panel">
                <PanelTitle icon="✦">Current Air Readings</PanelTitle>
                <p className="insight-copy">{air?.available ? `AQI ${Math.round(air.value)} (${air.status}); PM2.5 ${Number.isFinite(air.pm25) ? `${air.pm25} µg/m³` : 'unavailable'}; PM10 ${Number.isFinite(air.pm10) ? `${air.pm10} µg/m³` : 'unavailable'}.` : 'Air-quality readings are unavailable.'}</p>
              </section>

              <section className="panel partnership-panel">
                <PanelTitle icon="♧">Government + Citizens</PanelTitle>
                <p className="panel-subtitle">Together for a greener city.</p>
                <div className="partner-columns"><div><strong>🏛 Authorities Do</strong><span>✓ Monitor</span><span>✓ Respond</span><span>✓ Inspect</span><span>✓ Implement Projects</span></div><div><strong>● You Do</strong><span>✓ Follow Recommendations</span><span>✓ Complete Challenges</span><span>✓ Report Issues</span><span>✓ Spread Awareness</span></div></div>
                <button type="button" className="primary-button partnership-button" onClick={() => setActiveNav('Community')}>♣ Same Goal → A Cleaner, Greener Community</button>
              </section>
            </div>

            <aside className="column column-rail">
              <section className="panel progress-panel">
                <PanelTitle icon="♣">Environmental Data</PanelTitle>
                <div className="panel-meta">{currentLocation ? formatLocation(currentLocation) : 'Current location'} <span>{environmentData ? 'Live status' : 'Awaiting data'}</span></div>
                {[
                  ['❋', 'Air quality', air?.available ? `${Math.round(air.value)} AQI · ${air.status}` : environmentLoading ? 'Loading...' : 'Data unavailable', 'red'],
                  ['☼', 'Temperature', heat?.available ? `${heat.value.toFixed(1)}°C · ${heat.status}` : environmentLoading ? 'Loading...' : 'Data unavailable', 'blue'],
                  ['♆', 'Water quality', water?.available ? water.status : environmentLoading ? 'Loading...' : 'Data unavailable', 'green'],
                  ['♻', 'Waste management', waste?.available ? waste.status : environmentLoading ? 'Loading...' : 'Data unavailable', 'lime'],
                ].map(([icon, label, value, color]) => <div className="progress-item" key={label}><span className={`progress-icon ${color}`}>{icon}</span><div className="progress-info"><div><strong>{label}</strong><b>{value}</b></div></div></div>)}
                <button type="button" className="outline-button" onClick={() => setActiveNav('City Progress')}>See City Action Plan →</button>
              </section>

              <section className="panel waste-panel">
                <PanelTitle icon="♻">Waste Management Data</PanelTitle>
                <div className="waste-content"><img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=320&q=80" alt="Sorted recyclable materials" /><div className="waste-breakdown">
                  {[
                    ['▰', 'Collection', waste?.collection_efficiency],
                    ['♣', 'Segregation', waste?.segregation_rate],
                    ['▤', 'Processing', waste?.processing_rate],
                    ['◇', 'Open dumping', waste?.open_dumping_rate],
                  ].map(([icon, label, value]) => <span key={label}><i className="waste-icon plastic">{icon}</i>{label}<b>{environmentLoading ? 'Loading...' : Number.isFinite(value) ? `${value}%` : 'Unavailable'}</b></span>)}
                </div></div>
                <p className="waste-note"><span>♣</span><strong>{waste?.available ? waste.status : 'Waste data unavailable'}</strong></p>
              </section>

              <section className="panel coach-panel">
                <PanelTitle icon="◉">Eco Coach</PanelTitle>
                <div className="coach-greeting">What should I do today?</div>
                <div className="coach-plan"><strong><span>✦</span> Current Conditions</strong><p>{air?.available ? `Air quality is ${air.status.toLowerCase()}.` : 'Air-quality data is unavailable.'} {heat?.available ? `Temperature is ${heat.value.toFixed(1)}°C (${heat.status.toLowerCase()}).` : 'Temperature data is unavailable.'}</p><ul><li>{air?.available && air.value > 100 ? 'Limit prolonged outdoor activity while AQI is elevated' : 'Check current local conditions before outdoor activity'}</li><li>{heat?.available && heat.value >= 30 ? 'Limit strenuous activity during high temperatures' : 'Stay hydrated during outdoor activity'}</li><li>{water?.available ? `Water source: ${water.status}` : 'Water-quality source is not configured'}</li><li>{waste?.available ? `Waste source: ${waste.status}` : 'Waste-data source is not configured'}</li></ul><small>Recommendations reflect the latest available readings.</small></div>
                <form className="coach-input" onSubmit={(event) => { event.preventDefault(); setSearch('Eco Coach: ' + search) }}><input aria-label="Ask the Eco Coach" placeholder="Ask anything…" /><button type="submit" aria-label="Send message">↗</button></form>
              </section>
            </aside>
          </section>

          <footer className="dashboard-footer"><span>♣ Together we can make <strong>our communities greener, cleaner and healthier.</strong></span><span><strong>ECOGUARD</strong><i /> Cleaner Air. Safer Water. Resilient Cities.</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
