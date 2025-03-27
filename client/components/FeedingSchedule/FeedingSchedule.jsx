// This component gets the feeding schedule of a baby and displays it in a table.
import React, { useEffect, useState } from 'react';
import { Alert, Table, Button } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';

const FeedingSchedule = ({ babyId }) => {
  const { t } = useTranslation('common');
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedingSchedules = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/getFeedingSchedules`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch feeding schedules');
        const data = await response.json(); // `data` is an object with a `status` field and the feeding schedules
        // Convert object to array and filter out the status field
        const scheduleArray = Object.keys(data)
          .filter(key => key !== 'status')
          .map(key => data[key]);
        setFeedingSchedules(scheduleArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (babyId) {
      fetchFeedingSchedules();
    }
  }, [babyId]);

  const getLatestFeed = () => {
    if (!feedingSchedules.length) return null;
    
    const today = new Date().toISOString().split('T')[0];
    // Sort feeds by date and time
    const sortedFeeds = [...feedingSchedules].sort((a, b) => {
      const dateA = new Date(`${a.date.split('T')[0]}T${a.time}`);
      const dateB = new Date(`${b.date.split('T')[0]}T${b.time}`);
      return dateB - dateA;
    });
    
    return sortedFeeds[0];
  };

  if (loading) return <Alert variant="info">{t("Loading feeding schedule...")}</Alert>;
  if (error) return <p>{t("No feeding schedules found for this baby.")}</p>;

  const latestFeed = getLatestFeed();

  return (
    <>
      {latestFeed && (
        <Alert variant="info" className="my-3">
          {t("Last feed details")}
          <br />
          <small>
            {t("Last feed at {{time}} - {{amount}}oz - {{type}}", {
              time: latestFeed.time,
              amount: latestFeed.amount,
              type: latestFeed.type
            })}
          </small>
        </Alert>
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{t("Date")}</th>
            <th>{t("Time")}</th>
            <th>{t("Meal")}</th>
            <th>{t("Type")}</th>
            <th>{t("Amount")}</th>
            <th>{t("Notes")}</th>
          </tr>
        </thead>
        <tbody>
          {feedingSchedules.map((feed, index) => (
            <tr key={feed.feeding_schedule_id}>
              <td>{new Date(feed.date).toLocaleDateString()}</td>
              <td>{feed.time}</td>
              <td>{feed.meal}</td>
              <td>{feed.type}</td>
              <td>{`${feed.amount} oz`}</td>
              <td>{feed.notes || feed.issues || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default FeedingSchedule;
