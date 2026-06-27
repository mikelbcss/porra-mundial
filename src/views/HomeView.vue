<template>
  <div class="home">
    <!-- ── Partidos con navegación por día ── -->
    <section class="home__section">
      <div class="home__day-nav">
        <button class="home__day-btn" :disabled="dayIndex <= 0" @click="dayIndex--">‹</button>
        <h2 class="home__day-title">{{ currentDayLabel }}</h2>
        <button class="home__day-btn" :disabled="dayIndex >= store.allMatchDays.length - 1" @click="dayIndex++">›</button>
      </div>

      <div v-if="!store.allMatchDays.length && !store.isLoading" class="loading-overlay">
        Cargando partidos…
      </div>
      <template v-else-if="currentDay">
        <MatchCard v-for="match in currentDay.partidos" :key="match.id" :match="match" />
      </template>
    </section>

    <!-- ── Leaderboard ── -->
    <section class="home__section">
      <LeaderboardTable :items="store.leaderboard" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import LeaderboardTable from '@/components/LeaderboardTable.vue';
import MatchCard from '@/components/MatchCard.vue';

const store = useMainStore();
const dayIndex = ref(0);

// Cuando lleguen los días, saltar al día de hoy (o el más cercano)
watch(() => store.allMatchDays, (days) => {
  if (!days.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const idx = days.findIndex((d) => d.fecha >= today);
  dayIndex.value = idx >= 0 ? idx : days.length - 1;
}, { immediate: true });

const currentDay = computed(() => store.allMatchDays[dayIndex.value] ?? null);

const currentDayLabel = computed(() => {
  if (!currentDay.value) return '📅 Partidos';
  const d = new Date(currentDay.value.fecha + 'T12:00:00');
  const label = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = new Date().toISOString().slice(0, 10);
  if (currentDay.value.fecha === today) return `📅 Hoy — ${label}`;
  return `📅 ${label}`;
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.home {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  align-items: start;
  @include responsive($bp-lg) { grid-template-columns: 1fr; }

  &__section-title { font-size:$font-size-xl; font-weight:700; color:$color-navy; margin-bottom:$space-4; }

  &__day-nav {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-4;
  }

  &__day-title {
    flex: 1;
    text-align: center;
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-navy;
    text-transform: capitalize;
  }

  &__day-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: $radius-md;
    background: $color-navy;
    color: $color-white;
    font-size: 1.25rem;
    line-height: 1;
    @include flex-center;
    transition: background .15s, opacity .15s;
    &:hover:not(:disabled) { background: $color-navy-light; }
    &:disabled { opacity: .3; cursor: default; }
  }
}
</style>
