<template>
  <div class="standings-view">
    <section class="standings-view__section">
      <h2 class="standings-view__title">📊 Clasificación Real por Grupos</h2>
      <div v-if="!store.standingsByGroup.length" class="loading-overlay">Sin datos de grupos aún.</div>
      <div v-else class="standings-view__groups-grid">
        <GroupStandingsTable
          v-for="[grupo, rows] in store.standingsByGroup"
          :key="grupo" :group="grupo" :rows="rows"
        />
      </div>
    </section>

    <section class="standings-view__section">
      <KnockoutBracket :matches="store.knockoutMatches" />
    </section>

    <section class="standings-view__section">
      <CrossesBoard :items="store.cruces" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import GroupStandingsTable from '@/components/GroupStandingsTable.vue';
import KnockoutBracket from '@/components/KnockoutBracket.vue';
import CrossesBoard from '@/components/CrossesBoard.vue';
const store = useMainStore();
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
.standings-view {
  &__section { margin-bottom:$space-10; }
  &__title { font-size:$font-size-xl; font-weight:700; color:$color-navy; margin-bottom:$space-5; }
  &__groups-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:$space-4; }
}
</style>
