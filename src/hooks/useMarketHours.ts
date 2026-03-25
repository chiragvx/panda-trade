import { useState, useEffect } from 'react';
import { isWeekend, isWithinInterval, set, isAfter, isBefore } from 'date-fns';

export const useMarketHours = () => {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [sessionType, setSessionType] = useState<"pre" | "live" | "post" | "closed">("closed");

  useEffect(() => {
    const updateMarketStatus = () => {
      // Get current India time (IST is UTC +5:30)
      const now = new Date();
      // Since date-fns-tz is not installed, we'll manually calculate for simpler logic
      // Assume local time for now OR use UTC
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const istNow = new Date(utcNow + (5.5 * 3600000));
      
      const day = istNow.getDay();
      const isWeekDay = day >= 1 && day <= 5;
      
      const startTime = set(istNow, { hours: 9, minutes: 15, seconds: 0 });
      const preStartTime = set(istNow, { hours: 9, minutes: 0, seconds: 0 });
      const endTime = set(istNow, { hours: 15, minutes: 30, seconds: 0 });
      const postEndTime = set(istNow, { hours: 16, minutes: 0, seconds: 0 });

      if (!isWeekDay) {
        setIsMarketOpen(false);
        setSessionType("closed");
        return;
      }

      if (isWithinInterval(istNow, { start: startTime, end: endTime })) {
        setIsMarketOpen(true);
        setSessionType("live");
      } else if (isWithinInterval(istNow, { start: preStartTime, end: startTime })) {
        setIsMarketOpen(false);
        setSessionType("pre");
      } else if (isWithinInterval(istNow, { start: endTime, end: postEndTime })) {
        setIsMarketOpen(false);
        setSessionType("post");
      } else {
        setIsMarketOpen(false);
        setSessionType("closed");
      }
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return { isMarketOpen, sessionType };
};
