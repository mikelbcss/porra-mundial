import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { refreshData, REFRESH_MS } from '@/services/dataService';
import type { AppState } from '@/services/dataService';
import type {
  PuestoGrupoReal, PrediccionesParticipante, PuntuacionParticipante,
  MatchDay, CrucesParticipante, KnockoutMatch,
} from '@/types/domain';

export const useMainStore = defineStore('main', () => {
  const leaderboard = ref<PuntuacionParticipante[]>([]);
  const allMatchDays = ref<MatchDay[]>([]);
  const knockoutMatches = ref<KnockoutMatch[]>([]);
  const standings = ref<PuestoGrupoReal[]>([]);
  const cruces = ref<CrucesParticipante[]>([]);
  const participantNames = ref<string[]>([]);
  const participantsData = ref<PrediccionesParticipante[]>([]);
  const lastUpdated = ref<Date | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  const standingsByGroup = computed(() => {
    const map = new Map<string, PuestoGrupoReal[]>();
    for (const r of standings.value) {
      if (!map.has(r.grupo)) map.set(r.grupo, []);
      map.get(r.grupo)!.push(r);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  async function fetchAll() {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;
    try {
      const state = await refreshData() as AppState;
      leaderboard.value = state.leaderboard ?? [];
      allMatchDays.value = state.allMatchDays ?? [];
      knockoutMatches.value = state.knockoutMatches ?? [];
      standings.value = state.standings ?? [];
      cruces.value = state.cruces ?? [];
      participantNames.value = state.participantNames ?? [];
      participantsData.value = state.participantsData ?? [];
      lastUpdated.value = state.lastUpdated ?? new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido';
    } finally {
      isLoading.value = false;
    }
  }

  function startPolling() { fetchAll(); timer = setInterval(fetchAll, REFRESH_MS); }
  function stopPolling() { if (timer !== null) { clearInterval(timer); timer = null; } }

  return {
    leaderboard, allMatchDays, knockoutMatches, standings, cruces,
    participantNames, participantsData, lastUpdated, isLoading, error,
    standingsByGroup, fetchAll, startPolling, stopPolling,
  };
});
