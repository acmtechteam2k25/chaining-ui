import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '@/pages/admin-page'
import { JoinPage } from '@/pages/join-page'
import { LeaderboardPage } from '@/pages/leaderboard-page'
import { PlayPage } from '@/pages/play-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinPage />} />
      <Route path="/contest" element={<PlayPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
