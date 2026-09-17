export type LoadingStatus = 'neutral' | 'loading' | 'success' | 'failed';

export interface LoadingStatusProps {
  status: LoadingStatus;
}
