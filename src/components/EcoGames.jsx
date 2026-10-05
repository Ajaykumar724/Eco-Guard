import { useCallback, useEffect, useState } from 'react'

const createSudokuBoard = (puzzle) => puzzle.map((row) => [...row])

function Sudoku({ config }) {
  const [board, setBoard] = useState(() => createSudokuBoard(config.puzzle))
  const [feedback, setFeedback] = useState('')
  const [complete, setComplete] = useState(false)

  function updateCell(rowIndex, columnIndex, value) {
    const number = value === '' ? 0 : Number(value)
    if (number < 0 || number > 9) return

    setBoard((current) => current.map((row, r) => (
      r === rowIndex ? row.map((cell, c) => (c === columnIndex ? number : cell)) : row
    )))
    setFeedback('')
    setComplete(false)
  }

  function checkBoard() {
    if (board.every((row, rowIndex) => row.every((value, columnIndex) => value === config.solution[rowIndex][columnIndex]))) {
      setFeedback('Solved! Great work.')
      setComplete(true)
    } else {
      setFeedback('Not solved yet. Check your entries and try again.')
      setComplete(false)
    }
  }

  function resetBoard() {
    setBoard(createSudokuBoard(config.puzzle))
    setFeedback('')
    setComplete(false)
  }

  return (
    <div className="eco-game-play sudoku-game">
      <p className="eco-game-instructions">Complete the grid. Original clues are locked.</p>
      <div className="sudoku-grid" role="group" aria-label="Sudoku puzzle">
        {board.map((row, rowIndex) => row.map((value, columnIndex) => {
          const fixed = config.puzzle[rowIndex][columnIndex] !== 0
          return (
            <input
              aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}${fixed ? ', clue' : ''}`}
              className={`sudoku-cell${fixed ? ' fixed' : ''}`}
              key={`${rowIndex}-${columnIndex}`}
              type="text"
              inputMode="numeric"
              pattern="[1-9]"
              maxLength={1}
              value={value || ''}
              readOnly={fixed || complete}
              onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value.replace(/[^1-9]/g, ''))}
            />
          )
        }))}
      </div>
      <div className="eco-game-actions">
        <button className="eco-game-button" type="button" onClick={checkBoard} disabled={complete}>Check puzzle</button>
        <button className="eco-game-button secondary" type="button" onClick={resetBoard}>Reset</button>
      </div>
      {feedback && <p className={`eco-game-feedback${complete ? ' success' : ''}`} role="status">{feedback}</p>}
    </div>
  )
}

function Hanoi({ config }) {
  const initialTowers = () => [Array.from({ length: config.disks }, (_, index) => config.disks - index), [], []]
  const [towers, setTowers] = useState(initialTowers)
  const [selectedTower, setSelectedTower] = useState(null)
  const [moves, setMoves] = useState(0)
  const [feedback, setFeedback] = useState('Select a tower to pick up its top disk.')
  const complete = towers[2].length === config.disks

  function selectTower(towerIndex) {
    const from = selectedTower
    if (from === null) {
      if (towers[towerIndex].length) {
        setSelectedTower(towerIndex)
        setFeedback('Now select a tower to place the disk.')
      }
      return
    }

    if (from === towerIndex) {
      setSelectedTower(null)
      setFeedback('Move cancelled.')
      return
    }

    const disk = towers[from][towers[from].length - 1]
    const destinationTop = towers[towerIndex][towers[towerIndex].length - 1]
    if (destinationTop && destinationTop < disk) {
      setFeedback('A larger disk cannot go on a smaller disk.')
      setSelectedTower(null)
      return
    }

    setTowers((current) => current.map((tower, index) => {
      if (index === from) return tower.slice(0, -1)
      if (index === towerIndex) return [...tower, disk]
      return tower
    }))
    setMoves((current) => current + 1)
    setSelectedTower(null)
    setFeedback('Nice move!')
  }

  function resetGame() {
    setTowers(initialTowers())
    setSelectedTower(null)
    setMoves(0)
    setFeedback('Select a tower to pick up its top disk.')
  }

  return (
    <div className="eco-game-play hanoi-game">
      <p className="eco-game-instructions">Move all {config.disks} disks to the right tower. Moves: {moves}</p>
      <div className="hanoi-towers">
        {towers.map((tower, towerIndex) => (
          <button
            aria-label={`Tower ${towerIndex + 1}${selectedTower === towerIndex ? ', selected' : ''}`}
            aria-pressed={selectedTower === towerIndex}
            className={`hanoi-tower${selectedTower === towerIndex ? ' selected' : ''}`}
            key={towerIndex}
            onClick={() => selectTower(towerIndex)}
            type="button"
          >
            <span className="hanoi-stack">
              {tower.map((disk) => (
                <i className="hanoi-disk" key={disk} style={{ width: `${28 + disk * 14}px` }}>
                  {disk}
                </i>
              ))}
            </span>
            <span className="hanoi-base" />
            <span className="hanoi-label">Tower {towerIndex + 1}</span>
          </button>
        ))}
      </div>
      <button className="eco-game-button secondary" type="button" onClick={resetGame}>Restart</button>
      <p className={`eco-game-feedback${complete ? ' success' : ''}`} role="status">
        {complete ? `Solved in ${moves} moves!` : feedback}
      </p>
    </div>
  )
}

const birdStart = { y: 100, velocity: 0, score: 0, pipes: [], status: 'ready' }
const birdX = 56
const birdSize = 22
const playfieldHeight = 220
const pipeWidth = 34

function Flappy({ config }) {
  const [game, setGame] = useState(birdStart)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => {
        if (current.status !== 'running') return current

        const velocity = current.velocity + config.gravity
        const y = current.y + velocity
        let score = current.score
        const pipes = current.pipes
          .map((pipe) => ({ ...pipe, x: pipe.x - 3 }))
          .filter((pipe) => pipe.x > -pipeWidth)

        if (!pipes.length || pipes[pipes.length - 1].x < 190) {
          pipes.push({
            x: 320,
            gapTop: 30 + Math.floor(Math.random() * 76),
            counted: false,
          })
        }

        const nextPipes = pipes.map((pipe) => {
          const overlapsBird = pipe.x < birdX + birdSize && pipe.x + pipeWidth > birdX
          if (overlapsBird && !pipe.counted) {
            score += 1
            pipe.counted = true
          }
          const hitsPipe = overlapsBird && (
            y < pipe.gapTop || y + birdSize > pipe.gapTop + config.gapSize
          )
          return { ...pipe, hit: hitsPipe }
        })
        const hit = y < 0 || y + birdSize > playfieldHeight || nextPipes.some((pipe) => pipe.hit)

        return {
          ...current,
          y,
          velocity,
          score,
          pipes: nextPipes,
          status: hit ? 'over' : 'running',
        }
      })
    }, 45)

    return () => window.clearInterval(timer)
  }, [config.gapSize, config.gravity])

  const flap = useCallback(() => {
    setGame((current) => {
      if (current.status === 'over') return current
      if (current.status === 'ready') {
        return {
          ...birdStart,
          status: 'running',
          velocity: config.flapStrength,
          pipes: [{ x: 320, gapTop: 68, counted: false }],
        }
      }
      return { ...current, velocity: config.flapStrength }
    })
  }, [config.flapStrength])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === 'Space' && game.status !== 'over') {
        event.preventDefault()
        flap()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game.status, flap])

  function restart() {
    setGame(birdStart)
  }

  return (
    <div className="eco-game-play flappy-game">
      <p className="eco-game-instructions">Score: {game.score} · Tap the game or press Space to flap.</p>
      <button
        aria-label="Flappy Bird game. Press Space or tap to flap."
        className="flappy-field"
        onClick={flap}
        style={{ height: playfieldHeight }}
        type="button"
      >
        <span className="flappy-skyline" aria-hidden="true">♧ ♣ ♧ ♣ ♧</span>
        {game.pipes.map((pipe, index) => (
          <span aria-hidden="true" className="flappy-pipe-pair" key={`${index}-${pipe.x}`} style={{ left: pipe.x }}>
            <i className="flappy-pipe" style={{ height: pipe.gapTop }} />
            <i className="flappy-pipe" style={{ top: pipe.gapTop + config.gapSize, height: playfieldHeight - pipe.gapTop - config.gapSize }} />
          </span>
        ))}
        <span aria-hidden="true" className="flappy-bird" style={{ left: birdX, top: game.y }}>●</span>
        {game.status !== 'running' && (
          <span className="flappy-overlay">
            {game.status === 'over' ? 'Game over — restart to try again' : 'Tap or press Space to start'}
          </span>
        )}
      </button>
      {game.status === 'over' && <button className="eco-game-button secondary" type="button" onClick={restart}>Restart</button>}
    </div>
  )
}

function EcoGames({ games }) {
  const [selectedId, setSelectedId] = useState(games[0]?.id ?? '')
  const selectedGame = games.find(({ id }) => id === selectedId)

  return (
    <section className="eco-games" aria-label="Mini games">
      <div className="eco-games-heading">
        <h3>Play a Mini Game</h3>
        <span>Choose a game</span>
      </div>
      <div className="eco-game-picker" role="group" aria-label="Choose a mini game">
        {games.map((game) => (
          <button
            aria-pressed={selectedId === game.id}
            className={`eco-game-choice${selectedId === game.id ? ' active' : ''}`}
            key={game.id}
            onClick={() => setSelectedId(game.id)}
            type="button"
          >
            <span aria-hidden="true">{game.icon}</span>{game.title}
          </button>
        ))}
      </div>
      {selectedGame && (
        <div className="eco-game-card">
          <div className="eco-game-title">
            <span aria-hidden="true">{selectedGame.icon}</span>
            <div><h4>{selectedGame.title}</h4><p>{selectedGame.description}</p></div>
          </div>
          {selectedGame.id === 'sudoku' && <Sudoku config={selectedGame.config} key={selectedGame.id} />}
          {selectedGame.id === 'hanoi' && <Hanoi config={selectedGame.config} key={selectedGame.id} />}
          {selectedGame.id === 'flappy' && <Flappy config={selectedGame.config} key={selectedGame.id} />}
        </div>
      )}
    </section>
  )
}

export default EcoGames
