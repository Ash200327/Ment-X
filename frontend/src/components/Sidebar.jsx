import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, onSidebarToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
          { text: 'Verify Users', icon: <VerifiedUserIcon />, path: '/admin/verifications' },
          { text: 'Groups', icon: <PeopleIcon />, path: '/admin/groups' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
          { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
          { text: 'Profile', icon: <AccountBoxIcon />, path: '/profile' },
        ];
      case 'MENTOR':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
          { text: 'Groups & Mentees', icon: <PeopleIcon />, path: '/mentor/groups' },
          { text: 'Assign Task', icon: <AssignmentIcon />, path: '/mentor/create-task' },
          { text: 'Review Submissions', icon: <RateReviewIcon />, path: '/mentor/reviews' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
          { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
          { text: 'Profile', icon: <AccountBoxIcon />, path: '/profile' },
        ];
      case 'MENTEE':
        return [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
          { text: 'My Tasks', icon: <AssignmentIcon />, path: '/mentee/tasks' },
          { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
          { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
          { text: 'Profile', icon: <AccountBoxIcon />, path: '/profile' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const drawerContent = (
    <Box sx={{ backgroundColor: '#111827', height: '100%', borderRight: '1px solid #1f2937', color: '#f3f4f6' }}>
      <Toolbar />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) onSidebarToggle();
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: isSelected ? '#818cf8' : '#f3f4f6',
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? '#818cf8' : '#9ca3af',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onSidebarToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
