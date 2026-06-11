import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BirthdayCelebration from '../components/BirthdayCelebration';

const API = process.env.REACT_APP_API_URL + '/api/birthday/check';

function BirthdayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = searchParams.get('user') || 'Maverick';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/${user}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.isBirthday) {
          navigate(`/${user.toLowerCase()}`);
          return;
        }
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        navigate(`/${user.toLowerCase()}`);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '1.5rem', color: '#999' }}>
        Loading your birthday surprise...
      </div>
    );
  }

  if (!data) return null;

  return (
    <BirthdayCelebration
      user={data.user}
      message={data.message}
      quote={data.quote}
      cardDesigns={data.cardDesigns}
      onDone={() => navigate(`/${user.toLowerCase()}`)}
    />
  );
}

export default BirthdayPage;
