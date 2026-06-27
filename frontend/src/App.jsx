import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { useSelector } from 'react-redux';

// Layout components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Pages
import DashboardRedirect from './pages/DashboardRedirect';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';

// Admin Pages
import UserVerifications from './pages/admin/UserVerifications';
import AdminGroups from './pages/admin/AdminGroups';

// Mentor Pages
import MentorGroups from './pages/mentor/MentorGroups';
import CreateTask from './pages/mentor/CreateTask';
import SubmissionsReview from './pages/mentor/SubmissionsReview';

// Mentee Pages
import TasksBoard from './pages/mentee/TasksBoard';

const drawerWidth = 240;

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const layout = (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      <Navbar onSidebarToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onSidebarToggle={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, py: 2 }}>
          <Routes>
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/verifications" element={<UserVerifications />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
            </Route>

            {/* Mentor Routes */}
            <Route element={<PrivateRoute allowedRoles={['MENTOR']} />}>
              <Route path="/mentor/groups" element={<MentorGroups />} />
              <Route path="/mentor/create-task" element={<CreateTask />} />
              <Route path="/mentor/reviews" element={<SubmissionsReview />} />
            </Route>

            {/* Mentee Routes */}
            <Route element={<PrivateRoute allowedRoles={['MENTEE']} />}>
              <Route path="/mentee/tasks" element={<TasksBoard />} />
            </Route>
          </Routes>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      <Route path="/*" element={isAuthenticated ? layout : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
