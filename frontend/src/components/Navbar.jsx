import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Menu, MenuItem, Box, Tooltip, Avatar, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const Navbar = ({ onSidebarToggle, onSidebarCollapseToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleOpenNotifMenu = (event) => setAnchorElNotif(event.currentTarget);
  const handleCloseNotifMenu = () => setAnchorElNotif(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get('/api/notifications');
      setNotifications(res.data);
      const countRes = await axiosInstance.get('/api/notifications/unread-count');
      setUnreadCount(countRes.data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.post('/api/notifications/read-all');
      fetchNotifications();
      handleCloseNotifMenu();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0f172a', borderBottom: '1px solid #1f2937', boxShadow: 'none' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Mobile Drawer Toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Desktop Sidebar Collapse Toggle */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={onSidebarCollapseToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: 800, letterSpacing: '0.05em', background: 'linear-gradient(45deg, #818cf8 30%, #34d399 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            MENT-X
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications Bell */}
          <IconButton color="inherit" onClick={handleOpenNotifMenu}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            sx={{ mt: '45px' }}
            id="menu-notifications"
            anchorEl={anchorElNotif}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElNotif)}
            onClose={handleCloseNotifMenu}
            PaperProps={{ sx: { width: 320, maxHeight: 400, backgroundColor: '#111827', border: '1px solid #1f2937' } }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Notifications</Typography>
              {unreadCount > 0 && (
                <Typography variant="caption" sx={{ color: '#6366f1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={handleMarkAllRead}>
                  Mark all read
                </Typography>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <MenuItem disabled sx={{ justifyContent: 'center', p: 3 }}>
                <Typography variant="body2" color="text.secondary">No notifications</Typography>
              </MenuItem>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  sx={{
                    whiteSpace: 'normal',
                    backgroundColor: notif.readStatus ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                    borderBottom: '1px solid #1f2937',
                    py: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: notif.readStatus ? 500 : 700 }}>
                      {notif.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {notif.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }}>
              <Avatar src={user?.profilePicture} sx={{ bgcolor: '#6366f1', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 600 }}>
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            PaperProps={{ sx: { backgroundColor: '#111827', border: '1px solid #1f2937' } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              <Box sx={{ mt: 0.5, px: 1, py: 0.2, borderRadius: 1, bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', width: 'fit-content', fontSize: '0.7rem', fontWeight: 700 }}>
                {user?.role}
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
              <ListItemText primary="My Profile" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
