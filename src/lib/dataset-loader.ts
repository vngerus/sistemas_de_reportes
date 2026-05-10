import rawMetrics from '@/data/metrics.json';
import type { Dataset, DatasetId } from '@/types/metrics';
const metricsData = rawMetrics as unknown as Record<DatasetId, Dataset>;

export function getDataset(id: DatasetId | string | null): Dataset {
  const validIds: DatasetId[] = ['A', 'B', 'C', 'D'];
  const datasetId = validIds.includes(id as DatasetId) ? (id as DatasetId) : 'A';

  const dataset = metricsData[datasetId];

  if (!dataset) {
    throw new Error(`Dataset ${datasetId} not found in metrics.json`);
  }
  return {
    ...dataset,
    id: datasetId,
  };
}
