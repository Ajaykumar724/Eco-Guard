import { useEffect, useState } from 'react'
import { EnvironmentCard } from './components/EnvironmentCard.jsx'
import EcoAssistant from './assistant/EcoAssistant.jsx'
import { fetchRecommendations } from './assistant/api.js'
import logo from './assets/logo.png'
import { useEnvironmentData } from './hooks/useEnvironmentData.js'
import EcoGames from './components/EcoGames.jsx'
import challengeData from './data.json'
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

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const { data: environmentData, loading: environmentLoading, location: currentLocation } = useEnvironmentData()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [challengeProgress, setChallengeProgress] = useState({ date: '', selectedAnswer: '', completed: false, feedback: '' })
  const [search, setSearch] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [recommendationState, setRecommendationState] = useState({ context: null, items: [], error: '' })
  const dailyChallenge = challengeData.challenges.find(({ date }) => date === getLocalDateKey())
  const currentChallengeProgress = challengeProgress.date === dailyChallenge?.date
    ? challengeProgress
    : { selectedAnswer: '', completed: false, feedback: '' }
  const air = environmentData?.air
  const heat = environmentData?.heat
  const water = environmentData?.water
  const waste = environmentData?.waste
  const elevatedConditions = (air?.available && air.value > 100) || (heat?.available && heat.value > 30)
  const riskClass = environmentLoading || (!air?.available && !heat?.available)
    ? 'risk-neutral'
    : elevatedConditions ? 'risk-high' : 'risk-good'

  useEffect(() => {
    if (!environmentData) return undefined
    const controller = new AbortController()
    fetchRecommendations(environmentData, controller.signal)
      .then((items) => setRecommendationState({ context: environmentData, items, error: '' }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRecommendationState({ context: environmentData, items: [], error: error.message })
        }
      })
    return () => controller.abort()
  }, [environmentData])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand brand-sidebar" href="#dashboard" aria-label="EcoGuard home">
          <img className="brand-mark" src={logo} alt="" />
          <span><strong>ECOGUARD</strong><small>Cleaner Air | Safer Water | Resilient Cities</small></span>
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
          <a className="brand top-brand" href="#" aria-label="EcoGuard home">
            <img className="brand-mark" src={logo} alt="" />
            <span>
              <strong style={{display:'block', fontSize:'22px', fontWeight:'bold'}}>
                ECOGUARD
                </strong>
                <small style={{
              fontSize:'11px',
              fontWeight:'400',
              letterSpacing:'0.1px',
              color:'#15803d',
              texttransform:'uppercase',
              marginTop:'2px',
              fontStyle:'italic',
              display:'block',
                                  
            }}>
              Cleaner Air | Safer Water | Resilient Cities
              </small>
              </span>
          </a>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search" placeholder= " Ask Eco-Guard... "  value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            <span className="search-mic" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-4 0h8" />
              </svg>
            </span>
          </label>
          <div className="topbar-tools">
            <div className="weather"><span>🌤️</span><div><strong>{environmentLoading ? 'Loading...' : environmentData?.heat.available ? `${environmentData.heat.value.toFixed(0)}°` : 'Unavailable'}</strong><small>{environmentData?.heat.status ?? 'Current temperature'}</small></div></div>
            <div className="city-chip"><span className="pin">●</span><div><strong>{formatLocation(currentLocation)}</strong><small>{currentLocation ? 'Selected coordinates' : 'Current location'}</small></div></div>
            <button
              className={`assistant-toggle ${assistantOpen ? 'is-open' : ''}`}
              type="button"
              aria-label={assistantOpen ? 'Close EcoGuard AI assistant' : 'Open EcoGuard AI assistant'}
              aria-expanded={assistantOpen}
              onClick={() => setAssistantOpen((open) => !open)}
              title="Ask EcoGuard AI"
            >◉</button>
            <button className="user-menu" type="button" onClick={() => setActiveNav('Profile')}><span className="avatar">A</span><span className="user-copy"><strong>Ajay Kumar</strong><small>Eco Protector</small></span><span className="chevron">⌄</span></button>
          </div>
        </header>

        <EcoAssistant
          context={environmentData}
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
        />

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
                {!environmentData
                  ? <p className="recommendation-status" role={environmentLoading ? 'status' : 'alert'}>{environmentLoading ? 'Waiting for live environmental data…' : 'Environmental data is unavailable.'}</p>
                  : recommendationState.context !== environmentData
                    ? <p className="recommendation-status" role="status">Generating recommendations from current conditions…</p>
                    : recommendationState.error
                      ? <p className="recommendation-status recommendation-error" role="alert">{recommendationState.error}</p>
                    : <ul className="recommendation-list">
                      {recommendationState.items.map((text, index) => (
                        <li key={`${index}-${text}`}>
                          <span className={`recommendation-icon ${['coral', 'blue', 'sky', 'green'][index]}`}>{['×', '◉', '▤', '♻'][index]}</span>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>}
              </section>

              {/* <section className="panel map-panel">
                <PanelTitle icon="♧" action="View All">Live Map &amp; Sensors</PanelTitle>
                <div className="map-content">
                  <div className="map-visual map-unavailable" role="status">Live map and sensor feed unavailable</div>
                </div>
                <p className="map-link">No map source configured</p>
              </section> */}

              {/* <section className="panel community-panel">
                <PanelTitle icon="♧" action="View All">Community Actions</PanelTitle>
                <div className="community-action"><span className="community-icon yellow">♻</span><span>Report waste in your area</span><small>Live feed unavailable</small></div>
                <div className="community-action"><span className="community-icon teal">♣</span><span>Suggest tree plantation</span><small>Live feed unavailable</small></div>
                <div className="community-action"><span className="community-icon blue">✦</span><span>Join a clean-up drive</span><small>Live feed unavailable</small></div>
              </section> */}
            </div>

            <div className="column column-middle">
              <section className="panel challenge-panel">
                <PanelTitle icon="♧">Today’s Eco Challenge</PanelTitle>
                {dailyChallenge ? (
                  <>
                    <div className="challenge-points">✦ +{dailyChallenge.points} Points</div>
                    <div className="challenge-heading"><span className="challenge-flame">♨</span><div><h2>{dailyChallenge.title}</h2><p>{dailyChallenge.question}</p></div><span className="thermometer">🌡️</span></div>
                    <div className="answer-list" role="radiogroup" aria-label={dailyChallenge.question}>
                      {dailyChallenge.options.map(({ id, text }) => (
                        <button
                          type="button"
                          className={`answer-option ${currentChallengeProgress.selectedAnswer === id ? 'selected' : ''}`}
                          key={id}
                          onClick={() => setChallengeProgress({ date: dailyChallenge.date, selectedAnswer: id, completed: false, feedback: '' })}
                          role="radio"
                          aria-checked={currentChallengeProgress.selectedAnswer === id}
                          disabled={currentChallengeProgress.completed}
                        >
                          <span>{id}</span>{text}
                        </button>
                      ))}
                    </div>
                    <button
                      className={`primary-button ${currentChallengeProgress.completed ? 'button-done' : ''}`}
                      type="button"
                      disabled={currentChallengeProgress.completed}
                      onClick={() => {
                        if (!dailyChallenge.options.some(({ id }) => id === currentChallengeProgress.selectedAnswer)) {
                          setChallengeProgress({
                            date: dailyChallenge.date,
                            selectedAnswer: '',
                            completed: false,
                            feedback: 'Choose an answer before submitting.',
                          })
                          return
                        }

                        const isCorrect = currentChallengeProgress.selectedAnswer === dailyChallenge.answer
                        setChallengeProgress({
                          date: dailyChallenge.date,
                          selectedAnswer: currentChallengeProgress.selectedAnswer,
                          completed: isCorrect,
                          feedback: isCorrect
                            ? `${dailyChallenge.correctFeedback} You earned ${dailyChallenge.points} Eco Points.`
                            : dailyChallenge.incorrectFeedback,
                        })
                      }}
                    >
                      {currentChallengeProgress.completed ? '✓ CHALLENGE COMPLETED' : '▶  PLAY & EARN POINTS'}
                    </button>
                    {currentChallengeProgress.feedback && (
                      <p className={`challenge-feedback ${currentChallengeProgress.completed ? '' : 'challenge-error'}`} role="status">
                        {currentChallengeProgress.feedback}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="challenge-feedback" role="status">No Eco Challenge is scheduled for today. Check back tomorrow!</p>
                )}
                <EcoGames games={challengeData.games} />
                <div className="streak-row"><span>♨ 7 Day Streak</span><div className="streak-dots"><i /><i /><i /><i /><i /><i /><i /></div><strong>★ 340</strong><small>Eco Points</small></div>
              </section>

              {/* <section className="panel impact-panel">
                <PanelTitle icon="♣" action="View All">Your Impact</PanelTitle>
                <div className="impact-grid">
                  <div className="impact-stat"><span>♣</span><strong>Unavailable</strong><small>Actions<br />Completed</small></div>
                  <div className="impact-stat"><span>♻</span><strong>Unavailable</strong><small>Waste<br />Segregated</small></div>
                  <div className="impact-stat"><span>♧</span><strong>Unavailable</strong><small>Trees<br />Suggested</small></div>
                  <div className="impact-stat"><span>♆</span><strong>Unavailable</strong><small>Water<br />Saved</small></div>
                </div>
              </section> */}

              {/* <section className="panel forecast-panel">
                <PanelTitle icon="☼">7-Day Forecast</PanelTitle>
                <div className="forecast-days"><p>{environmentLoading ? 'Loading forecast...' : 'Forecast data unavailable'}</p></div>
                <div className="forecast-note"><span>↗</span> No forecast source is configured.</div>
              </section> */}
            </div>

            <div className="column column-right">
              {/* <section className="panel government-panel">
                <PanelTitle icon="♜">Government Action</PanelTitle>
                <div className="panel-meta">{environmentData ? `Readings updated ${new Date(environmentData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting environmental data'}</div>
                <h3>Government data source</h3>
                <ul className="action-list"><li><span className="action-symbol">—</span><span>Government action feed</span><small>Unavailable</small></li></ul>
                <div className="progress-heading"><strong>Program progress</strong><b>Data unavailable</b></div>
                <div className="progress-track" />
                <button className="outline-button" type="button" onClick={() => setActiveNav('Government Action')}>View Action Details →</button>
                <div className="authority"><span className="authority-icon">♜</span><div><strong>Responsible Authority</strong><small>Government source not configured</small><small>Air quality: Open-Meteo</small><button type="button" onClick={() => setActiveNav('Government Action')}>View Departments →</button></div></div>
              </section> */}

              <section className="panel insights-panel">
                <PanelTitle icon="✦">Current Air Readings</PanelTitle>
                <p className="insight-copy">{air?.available ? `AQI ${Math.round(air.value)} (${air.status}); PM2.5 ${Number.isFinite(air.pm25) ? `${air.pm25} µg/m³` : 'unavailable'}; PM10 ${Number.isFinite(air.pm10) ? `${air.pm10} µg/m³` : 'unavailable'}.` : 'Air-quality readings are unavailable.'}</p>
              </section>

              {/* <section className="panel partnership-panel">
                <PanelTitle icon="♧">Government + Citizens</PanelTitle>
                <p className="panel-subtitle">Together for a greener city.</p>
                <div className="partner-columns"><div><strong>🏛 Authorities Do</strong><span>✓ Monitor</span><span>✓ Respond</span><span>✓ Inspect</span><span>✓ Implement Projects</span></div><div><strong>● You Do</strong><span>✓ Follow Recommendations</span><span>✓ Complete Challenges</span><span>✓ Report Issues</span><span>✓ Spread Awareness</span></div></div>
                <button type="button" className="primary-button partnership-button" onClick={() => setActiveNav('Community')}>♣ Same Goal → A Cleaner, Greener Community</button>
              </section> */}
            </div>

            <aside className="column column-rail">
              {/* <section className="panel progress-panel">
                <PanelTitle icon="♣">Environmental Data</PanelTitle>
                <div className="panel-meta">{currentLocation ? formatLocation(currentLocation) : 'Current location'} <span>{environmentData ? 'Live status' : 'Awaiting data'}</span></div>
                {[
                  ['❋', 'Air quality', air?.available ? `${Math.round(air.value)} AQI · ${air.status}` : environmentLoading ? 'Loading...' : 'Data unavailable', 'red'],
                  ['☼', 'Temperature', heat?.available ? `${heat.value.toFixed(1)}°C · ${heat.status}` : environmentLoading ? 'Loading...' : 'Data unavailable', 'blue'],
                  ['♆', 'Water quality', water?.available ? water.status : environmentLoading ? 'Loading...' : 'Data unavailable', 'green'],
                  ['♻', 'Waste management', waste?.available ? waste.status : environmentLoading ? 'Loading...' : 'Data unavailable', 'lime'],
                ].map(([icon, label, value, color]) => <div className="progress-item" key={label}><span className={`progress-icon ${color}`}>{icon}</span><div className="progress-info"><div><strong>{label}</strong><b>{value}</b></div></div></div>)}
                <button type="button" className="outline-button" onClick={() => setActiveNav('City Progress')}>See City Action Plan →</button>
              </section> */}

              {/* <section className="panel waste-panel">
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
              </section> */}

              <section className="panel coach-panel">
                <PanelTitle icon="◉">Eco Coach</PanelTitle>
                <p className="coach-description">Your AI assistant can answer questions using current environmental readings and general sustainability guidance.</p>
                <button className="outline-button" type="button" onClick={() => setAssistantOpen(true)}>Ask EcoGuard AI →</button>
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
