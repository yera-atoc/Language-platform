import { createBrowserRouter } from 'react-router-dom'
import Home from '@pages/Home'
import Lesson from '@pages/Lesson'
import Progress from '@pages/Progress'
import Profile from '@pages/Profile'
import ExamPrep from '@pages/ExamPrep'
import Auth from '@pages/Auth'
import ProtectedRoute from '@components/ui/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/auth', element: <Auth /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/lesson/:language/:level/:lessonId', element: <Lesson /> },
      { path: '/progress', element: <Progress /> },
      { path: '/profile', element: <Profile /> },
      { path: '/exam/:language', element: <ExamPrep /> },
    ],
  },
])

export default router
