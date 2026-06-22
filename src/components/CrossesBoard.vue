<template>
  <div class="crosses">
    <h2 class="crosses__title">🎯 Aciertos en Eliminatorias</h2>
    <div v-if="!items.length" class="loading-overlay">Sin datos aún…</div>
    <div v-else class="crosses__grid">
      <div v-for="item in sortedItems" :key="item.nombre" class="crosses__card">
        <div class="crosses__card-header">
          <span class="crosses__name">{{ item.nombre }}</span>
          <span class="crosses__total">{{ item.totalAciertos }} aciertos</span>
        </div>
        <div class="crosses__phases">
          <div v-for="fase in fases" :key="fase.key" class="crosses__phase">
            <span class="crosses__phase-label">{{ fase.label }}</span>
            <div class="crosses__teams">
              <span
                v-for="team in teamsForPhase(item, fase.key)"
                :key="team.equipo"
                :class="['crosses__team', team.acertado ? 'crosses__team--hit' : 'crosses__team--miss']"
                :title="team.equipo"
              >
                {{ team.equipo }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CrucesParticipante, Fase } from '@/types/domain';

const props = defineProps<{ items: CrucesParticipante[] }>();

const sortedItems = computed(() =>
  [...props.items].sort((a, b) => b.totalAciertos - a.totalAciertos)
);

const fases: { key: Exclude<Fase, 'GRUPOS' | 'TERCER_PUESTO'>; label: string }[] = [
  { key: 'DIECISEISAVOS', label: 'R32' },
  { key: 'OCTAVOS',       label: 'R16' },
  { key: 'CUARTOS',       label: 'QF' },
  { key: 'SEMIS',         label: 'SF' },
  { key: 'FINAL',         label: 'F' },
];

function teamsForPhase(item: CrucesParticipante, fase: string) {
  return item.aciertos.filter((a) => a.fase === fase);
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.crosses {
  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    margin-bottom: $space-5;
    color: $color-navy;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $space-4;
  }

  &__card {
    @include card;
    overflow: hidden;

    &-header {
      @include flex-between;
      padding: $space-3 $space-4;
      background: $color-navy;
      color: $color-white;
    }
  }

  &__name  { font-weight: 600; }
  &__total { font-size: $font-size-sm; background: $color-green; color: $color-navy; border-radius: $radius-full; padding: 2px $space-3; font-weight: 700; }

  &__phases { padding: $space-3 $space-4; display: flex; flex-direction: column; gap: $space-3; }

  &__phase { display: flex; align-items: flex-start; gap: $space-3; }

  &__phase-label {
    width: 36px;
    flex-shrink: 0;
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-gray-700;
    text-transform: uppercase;
    padding-top: 2px;
  }

  &__teams { display: flex; flex-wrap: wrap; gap: $space-1; }

  &__team {
    font-size: $font-size-xs;
    padding: 2px $space-2;
    border-radius: $radius-sm;
    white-space: nowrap;

    &--hit  { background: $color-mint-light; color: $color-green-dark; font-weight: 600; }
    &--miss { background: $color-gray-200; color: $color-gray-400; text-decoration: line-through; }
  }
}
</style>
