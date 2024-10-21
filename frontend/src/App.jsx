import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import MainPage from "./MainPage";
import AddSubscriptionPage from "./AddSubscriptionPage";
import EditSubscriptionPage from "./EditSubscriptionPage";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#90caf9" : "#1976d2",
      },
      secondary: {
        main: darkMode ? "#f48fb1" : "#d32f2f",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1d1d1d" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#000000",
        secondary: darkMode ? "#b0bec5" : "#757575",
      },
    },
  });

  useEffect(() => {
    axios
      .get("http://localhost:8000/verify-token")
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error("User is not authenticated:", error);
        setUser(null);
      });
  }, []);

  const handleLoginSuccess = (response) => {
    const token = response.credential;
    axios
      .post("http://localhost:8000/auth/callback", { token })
      .then((response) => {
        axios
          .get("http://localhost:8000/verify-token")
          .then((response) => {
            setUser(response.data);
          })
          .catch((error) => {
            console.error("User is not authenticated:", error);
            setUser(null);
          });
      })
      .catch((error) => {
        console.error("Error sending token to backend:", error);
      });
  };

  const handleLoginFailure = (error) => {
    console.error("Login Failed:", error);
  };

  const handleLogout = () => {
    axios
      .post("http://localhost:8000/logout")
      .then((response) => {
        console.log(response.data);
        setUser(null);
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Subscription Manager
            </Typography>
            <IconButton sx={{ ml: 1 }} onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {user ? (
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            ) : null}
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
          }}
        >
          <Routes>
            <Route
              path="/home"
              element={
                user ? <MainPage user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/add-subscription"
              element={
                user ? (
                  <AddSubscriptionPage user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/edit-subscription/:sub_id"
              element={
                user ? (
                  <EditSubscriptionPage user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/home" />
                ) : (
                  <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    style={{ height: "100vh" }}
                  >
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginFailure}
                    />
                  </Grid>
                )
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
