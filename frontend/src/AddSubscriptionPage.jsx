import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography } from "@mui/material";

const AddSubscriptionPage = ({ user }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const handleAddSubscription = () => {
    axios
      .post("http://localhost:8000/subscribe", {
        email: user.email,
        name,
        amount: parseFloat(amount),
        end_date: endDate,
      })
      .then((response) => {
        console.log(response.data);
        navigate("/home");
      })
      .catch((error) => {
        console.error("Error adding subscription:", error);
      });
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Add Subscription
      </Typography>
      <TextField
        label="Subscription Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        fullWidth
        margin="normal"
        InputLabelProps={{
          shrink: true,
        }}
        required
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddSubscription}
        style={{ marginTop: "20px" }}
      >
        Add Subscription
      </Button>
    </Container>
  );
};

export default AddSubscriptionPage;
