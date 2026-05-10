import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Start from './pages/Start'
import Levels from './pages/Levels'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import GamePlay from './pages/GamePlay'
import { GameProvider } from './context/GameContext'
import './styles/App.css'

function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const isGamePage = location.pathname.startsWith('/game/')

  if (isGamePage) return null

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">🎮 卡通游戏</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            🏠 首页
          </Link>
          <Link to="/start" className={`nav-link ${isActive('/start') ? 'active' : ''}`}>
            ▶️ 开始
          </Link>
          <Link to="/levels" className={`nav-link ${isActive('/levels') ? 'active' : ''}`}>
            🎯 关卡
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            👤 个人中心
          </Link>
          <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
            ⚙️ 设置
          </Link>
        </div>
      </div>
    </nav>
  )
}

function MobileNavbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const isGamePage = location.pathname.startsWith('/game/')

  if (isGamePage) return null

  return (
    <nav className="mobile-navbar">
      <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}>
        🏠
        <span>首页</span>
      </Link>
      <Link to="/start" className={`mobile-nav-link ${isActive('/start') ? 'active' : ''}`}>
        ▶️
        <span>开始</span>
      </Link>
      <Link to="/levels" className={`mobile-nav-link ${isActive('/levels') ? 'active' : ''}`}>
        🎯
        <span>关卡</span>
      </Link>
      <Link to="/profile" className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}>
        👤
        <span>我的</span>
      </Link>
      <Link to="/settings" className={`mobile-nav-link ${isActive('/settings') ? 'active' : ''}`}>
        ⚙️
        <span>设置</span>
      </Link>
    </nav>
  )
}

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/start" element={<Start />} />
              <Route path="/levels" element={<Levels />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/game/:levelId" element={<GamePlay />} />
            </Routes>
          </main>
          <MobileNavbar />
        </div>
      </BrowserRouter>
    </GameProvider>
  )
}

export default App
