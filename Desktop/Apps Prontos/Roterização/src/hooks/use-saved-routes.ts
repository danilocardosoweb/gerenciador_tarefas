import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSavedRoutes, saveRoute, deleteSavedRoute, SaveRoutePayload } from "@/services/supabaseData";
import { SavedRoute } from "@/types/route";

export function useSavedRoutes() {
  const queryClient = useQueryClient();

  const savedRoutesQuery = useQuery<SavedRoute[]>({
    queryKey: ["savedRoutes"],
    queryFn: fetchSavedRoutes,
    staleTime: 60_000,
  });

  const saveRouteMutation = useMutation({
    mutationFn: (payload: SaveRoutePayload) => saveRoute(payload),
    onSuccess: (newRoute) => {
      queryClient.setQueryData<SavedRoute[]>(["savedRoutes"], (prev = []) => [newRoute, ...prev]);
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedRoute(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<SavedRoute[]>(["savedRoutes"], (prev = []) => prev.filter((route) => route.id !== id));
    },
  });

  return {
    savedRoutes: savedRoutesQuery.data ?? [],
    isLoading: savedRoutesQuery.isLoading,
    isRefetching: savedRoutesQuery.isRefetching,
    refetch: savedRoutesQuery.refetch,
    saveRoute: saveRouteMutation.mutateAsync,
    isSaving: saveRouteMutation.isPending,
    deleteRoute: deleteRouteMutation.mutateAsync,
    isDeleting: deleteRouteMutation.isPending,
  };
}