import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

function DashboardMaverick() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + '/api/maverick')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ message: 'Maverick dashboard ready', user: { name: 'Maverick', role: 'pioneer' } }));
  }, []);

  return (
    <Dashboard
      name="Maverick"
      accent="#6c63ff"
      data={data}
      onBack={() => navigate('/')}
    />
  );
}

export default DashboardMaverick;
