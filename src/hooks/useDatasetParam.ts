import { useState, useEffect, useCallback } from 'react';
import type { DatasetId } from '@/types/metrics';


export function useDatasetParam(): [DatasetId, (id: DatasetId) => void] {
  const [datasetId, setDatasetId] = useState<DatasetId>(() => {
    if (typeof window === 'undefined') return 'A';
    
    const params = new URLSearchParams(window.location.search);
    const id = params.get('dataset');
    const validIds: DatasetId[] = ['A', 'B', 'C', 'D'];
    
    return validIds.includes(id as DatasetId) ? (id as DatasetId) : 'A';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('dataset');
      const validIds: DatasetId[] = ['A', 'B', 'C', 'D'];
      if (validIds.includes(id as DatasetId)) {
        setDatasetId(id as DatasetId);
      } else {
        setDatasetId('A');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setDataset = useCallback((id: DatasetId) => {
    setDatasetId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('dataset', id);
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  }, []);

  return [datasetId, setDataset];
}
