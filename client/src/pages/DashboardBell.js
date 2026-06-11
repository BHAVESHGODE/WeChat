import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

function DashboardBell() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + '/api/bell')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ message: 'Bell dashboard ready', user: { name: 'Bell', role: 'strategist' } }));
  }, []);

  return (
    <Dashboard
      name="Bell"
      accent="#ff6584"
      data={data}
      onBack={() => navigate('/')}
    />
  );
}

export default DashboardBell;
