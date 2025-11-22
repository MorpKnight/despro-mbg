import { useSnackbarContext } from '../context/SnackbarContext';

export function useSnackbar() {
  return useSnackbarContext();
}
