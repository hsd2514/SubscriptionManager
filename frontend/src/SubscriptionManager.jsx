import React, { useState, useEffect } from "react";
import axios from "axios";

const SubscriptionManager = ({ user }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [editingSubId, setEditingSubId] = useState(null);

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

  const handleSubscribe = () => {
    axios
      .post("http://localhost:8000/subscribe", {
        email: user.email,
        name,
        amount: parseFloat(amount),
        end_date: endDate,
      })
      .then((response) => {
        console.log(response.data);
        setSubscriptions([...subscriptions, response.data]);
      })
      .catch((error) => {
        console.error("Error subscribing:", error);
      });
  };

  const handleEditSubscription = () => {
    axios
      .put(`http://localhost:8000/edit-subscription/${editingSubId}`, {
        email: user.email,
        name,
        amount: parseFloat(amount),
        end_date: endDate,
      })
      .then((response) => {
        console.log(response.data);
        setSubscriptions(
          subscriptions.map((sub) =>
            sub.sub_id === response.data.sub_id ? response.data : sub
          )
        );
        setEditingSubId(null);
      })
      .catch((error) => {
        console.error("Error editing subscription:", error);
      });
  };

  const handleEditClick = (sub) => {
    setName(sub.name);
    setAmount(sub.amount);
    setEndDate(sub.end_date);
    setEditingSubId(sub.sub_id);
  };

  return (
    <div>
      <h2>Subscription Manager</h2>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subscription Name"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <button onClick={handleSubscribe}>Subscribe</button>
        <button onClick={handleEditSubscription} disabled={!editingSubId}>
          Edit Subscription
        </button>
      </div>
      <h3>Current Subscriptions</h3>
      <ul>
        {subscriptions.map((sub) => (
          <li key={sub.sub_id}>
            {sub.email} - {sub.name} - ${sub.amount} - {sub.end_date} (
            {sub.status})
            <button onClick={() => handleEditClick(sub)}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionManager;
