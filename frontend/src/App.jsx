import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Start from './pages/Start'
import Levels from './pages/Levels'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import GamePlay from './pages/GamePlay'
import Hero from './pages/Hero'
import Inventory from './pages/Inventory'
import SignIn from './pages/SignIn'
import SkinShop from './pages/SkinShop'
import Leaderboard from './pages/Leaderboard'
import DailyTasks from './pages/DailyTasks'
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
          <Link to="/daily-tasks" className={`nav-link ${isActive('/daily-tasks') ? 'active' : ''}`}>
            📋 每日任务
          </Link>
          <Link to="/signin" className={`nav-link ${isActive('/signin') ? 'active' : ''}`}>
            📅 每日签到
          </Link>
          <Link to="/skinshop" className={`nav-link ${isActive('/skinshop') ? 'active' : ''}`}>
            🎨 皮肤商店
          </Link>
          <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}>
            🏆 排行榜
          </Link>
          <Link to="/hero" className={`nav-link ${isActive('/hero') ? 'active' : ''}`}>
            🦸 角色养成
          </Link>
          <Link to="/inventory" className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}>
            🎒 背包
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
      <Link to="/daily-tasks" className={`mobile-nav-link ${isActive('/daily-tasks') ? 'active' : ''}`}>
        📋
        <span>任务</span>
      </Link>
      <Link to="/signin" className={`mobile-nav-link ${isActive('/signin') ? 'active' : ''}`}>
        📅
        <span>签到</span>
      </Link>
      <Link to="/leaderboard" className={`mobile-nav-link ${isActive('/leaderboard') ? 'active' : ''}`}>
        🏆
        <span>排行</span>
      </Link>
      <Link to="/hero" className={`mobile-nav-link ${isActive('/hero') ? 'active' : ''}`}>
        🦸
        <span>养成</span>
      </Link>
      <Link to="/inventory" className={`mobile-nav-link ${isActive('/inventory') ? 'active' : ''}`}>
        🎒
        <span>背包</span>
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
              <Route path="/daily-tasks" element={<DailyTasks />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/hero" element={<Hero />} />
              <Route path="/inventory" element={<Inventory />} />
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
