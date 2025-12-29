import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EventIcon from '@mui/icons-material/Event';
import TuneIcon from '@mui/icons-material/Tune';
import LogoutIcon from '@mui/icons-material/Logout';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect } from 'react';
import { getUserEmail, clearAuthData, getAuthTokens } from '../../services/auth';
import { authAPI } from '../../services/api';

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

export const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMediaQuery('(min-width:1024px)');
  const [open, setOpen] = React.useState(matches);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const menuItems: MenuItem[] = [
    {
      text: 'Мероприятия',
      icon: <EventIcon />,
      path: '/events'
    },
    {
      text: 'Настройки',
      icon: <TuneIcon />,
      path: '/settings'
    }
  ];

  useEffect(() => {
    const email = getUserEmail();
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    if (!matches) {
      setOpen(false);
    }
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (!matches) {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const authTokens = getAuthTokens();

      if (authTokens?.refresh) {
        try {
          await authAPI.logout(authTokens.refresh);
        } catch (error) {
          console.error('Ошибка при логауте на сервере:', error);
        }
      }

      clearAuthData();

      navigate('/', { replace: true });

    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  React.useEffect(() => {
    setOpen(matches);
  }, [matches]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        {!matches && (
          <Toolbar style={{backgroundColor: "white"}}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={[
                {
                  mr: 2,
                },
                open && { display: 'none' },
              ]}
            >
              <MenuIcon color="disabled"/>
            </IconButton>
          </Toolbar>
        )}
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        variant={matches ? "persistent" : "temporary"}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <DrawerHeader>
          <div style={{width: "220px", display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div style={{height: '40px', width: '40px', borderRadius: '100px', backgroundColor: 'lightgray'}}/>
            <span style={{fontWeight: 'bold', fontSize: '14px'}}>
              {userEmail || 'user@example.com'}
            </span>
          </div>
          {!matches && (
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'ltr' ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
            </IconButton>
          )}
        </DrawerHeader>
        <Divider/>
        <List sx={{flexGrow: 1}}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleMenuItemClick(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'lightgray',
                    '&:hover': {
                      backgroundColor: 'gray',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon color={isLoggingOut ? "disabled" : "error"} />
              </ListItemIcon>
              <ListItemText
                primary={isLoggingOut ? "Выход..." : "Выйти"}
                primaryTypographyProps={{
                  color: isLoggingOut ? 'text.disabled' : 'error'
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}

export default Sidebar;