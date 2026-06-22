<template>
  <div class="home">
    <!-- Partidos -->
    <section class="home__section">
      <h2 class="home__section-title">📅 Partidos</h2>
      <div v-if="!store.matchDays.length && !store.isLoading" class="loading-overlay">
        Sin partidos en el rango de días configurado.
      </div>
      <div v-for="day in store.matchDays" :key="day.fecha" class="home__day">
        <h3 class="home__day-title">{{ formatDate(day.fecha) }}</h3>
        <MatchCard
          v-for="match in day.partidos"
          :key="match.id"
          :match="match"
        />
      </div>
    </section>

    <!-- Leaderboard -->
    <section class="home__section">
      <LeaderboardTable :items="store.leaderboard" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import LeaderboardTable from '@/components/LeaderboardTable.vue';
import MatchCard from '@/components/MatchCard.vue';

const store = useMainStore();

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.home {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  align-items: start;

  @include responsive($bp-lg) { grid-template-columns: 1fr; }

  &__section-title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-navy;
    margin-bottom: $space-4;
  }

  &__day { margin-bottom: $space-6; }
  &__day-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-gray-700;
    text-transform: capitalize;
    margin-bottom: $space-3;
    padding-bottom: $space-2;
    border-bottom: 1px solid $color-gray-200;
  }
}
</style>
