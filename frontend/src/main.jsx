import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="854178614764-f09gu8tu505js4e37djp0mh9l8r21b07.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
