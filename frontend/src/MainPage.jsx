import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const MainPage = ({ user }) => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:8000/subscriptions")
        .then((response) => {
          setSubscriptions(response.data);
        })
        .catch((error) => {
          console.error("Error fetching subscriptions:", error);
        });
    }
  }, [user]);

  return (
    <div style={{ padding: "20px" }}>
      <Grid container spacing={3}>
        {subscriptions.map((sub) => (
          <Grid item xs={12} sm={6} md={4} key={sub.sub_id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {sub.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amount: ${sub.amount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  End Date: {sub.end_date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {sub.status}
                </Typography>
                <Button
                  component={Link}
                  to={`/edit-subscription/${sub.sub_id}`}
                  variant="contained"
                  color="secondary"
                  sx={{ marginTop: "10px" }}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Fab
        color="primary"
        aria-label="add"
        component={Link}
        to="/add-subscription"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </div>
  );
};

export default MainPage;
