import { Route, Routes } from 'react-router-dom'
import OriginalPage from './pages/Original'
import TasksPage from './pages/Tasks'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OriginalPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="*" element={<OriginalPage />} />
    </Routes>
  )
}
