import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

function DashboardGoju() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + '/api/goju')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ message: 'Goju dashboard ready', user: { name: 'Goju', role: 'guardian' } }));
  }, []);

  return (
    <Dashboard
      name="Goju"
      accent="#43e97b"
      data={data}
      onBack={() => navigate('/')}
    />
  );
}

export default DashboardGoju;
