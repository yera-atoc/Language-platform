import { createBrowserRouter } from 'react-router-dom'
import Home from '@pages/Home'
import Lessons from '@pages/Lessons'
import Lesson from '@pages/Lesson'
import Progress from '@pages/Progress'
import Profile from '@pages/Profile'
import ExamPrep from '@pages/ExamPrep'
import ExamTest from '@pages/ExamTest'
import Auth from '@pages/Auth'
import ProtectedRoute from '@components/ui/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/auth', element: <Auth /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/lessons/:language/:level', element: <Lessons /> },
      { path: '/lessons/:language', element: <Lessons /> },
      { path: '/lesson/:language/:level/:lessonId', element: <Lesson /> },
      { path: '/progress', element: <Progress /> },
      { path: '/profile', element: <Profile /> },
      { path: '/exam/:language', element: <ExamPrep /> },
      { path: '/exam', element: <ExamPrep /> },
      { path: '/exam-test/:language/:testId', element: <ExamTest /> },
    ],
  },
])

export default router
