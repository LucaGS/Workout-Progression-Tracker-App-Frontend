import { useEffect, useState } from 'react';
import { getContainer } from './container';

export const useServices = () => {
  const [services, setServices] = useState(null);

  useEffect(() => {
    let mounted = true;
    getContainer().then((c) => {
      if (mounted) setServices(c.usecases);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return services;
};
