<template>
  <div class="bracket">
    <h2 class="bracket__title">🏟️ Cuadro de Eliminatorias</h2>
    <div v-if="!phases.length" class="loading-overlay">Sin datos de eliminatorias aún.</div>
    <div v-else class="bracket__phases">
      <div v-for="phase in phases" :key="phase.fase" class="bracket__phase">
        <h3 class="bracket__phase-title">{{ phaseLabel(phase.fase) }}</h3>
        <div class="bracket__matches">
          <div
            v-for="m in phase.matches" :key="m.id"
            :class="['bracket__match', `bracket__match--${statusClass(m.estado)}`]"
          >
            <div :class="['bracket__team', { 'bracket__team--winner': isWinner(m, 'casa') }]">
              <span>{{ m.casa }}</span>
              <span v-if="m.golCasa !== null" class="bracket__goal">{{ m.golCasa }}</span>
            </div>
            <div :class="['bracket__team', { 'bracket__team--winner': isWinner(m, 'fuera') }]">
              <span>{{ m.fuera }}</span>
              <span v-if="m.golFuera !== null" class="bracket__goal">{{ m.golFuera }}</span>
            </div>
            <div class="bracket__meta">{{ matchMeta(m) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KnockoutMatch } from '@/types/domain';

const props = defineProps<{ matches: KnockoutMatch[] }>();

const FASE_ORDER = ['DIECISEISAVOS','OCTAVOS','CUARTOS','SEMIS','TERCER_PUESTO','FINAL'];
const FASE_LABELS: Record<string, string> = {
  DIECISEISAVOS: 'Dieciseisavos de final',
  OCTAVOS: 'Octavos de final',
  CUARTOS: 'Cuartos de final',
  SEMIS: 'Semifinales',
  TERCER_PUESTO: 'Tercer puesto',
  FINAL: 'Final',
};

const phases = computed(() => {
  const map = new Map<string, KnockoutMatch[]>();
  for (const m of props.matches) {
    if (!map.has(m.fase)) map.set(m.fase, []);
    map.get(m.fase)!.push(m);
  }
  return FASE_ORDER
    .filter((f) => map.has(f))
    .map((f) => ({ fase: f, matches: map.get(f)! }));
});

function phaseLabel(fase: string) { return FASE_LABELS[fase] ?? fase; }

function statusClass(estado: string) {
  if (estado === 'FINISHED') return 'done';
  if (estado === 'IN_PLAY' || estado === 'PAUSED') return 'live';
  return 'sched';
}

function isWinner(m: KnockoutMatch, side: 'casa' | 'fuera') {
  if (m.estado !== 'FINISHED' || m.golCasa === null || m.golFuera === null) return false;
  if (side === 'casa') return m.golCasa > m.golFuera;
  return m.golFuera > m.golCasa;
}

function matchMeta(m: KnockoutMatch) {
  const d = new Date(m.fechaUtc);
  const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (m.estado === 'FINISHED') return dateStr;
  if (m.estado === 'IN_PLAY' || m.estado === 'PAUSED') return '🔴 En vivo';
  return `${dateStr} ${timeStr}`;
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.bracket {
  &__title { font-size:$font-size-xl; font-weight:700; color:$color-navy; margin-bottom:$space-5; }

  &__phases { display:flex; flex-direction:column; gap:$space-6; }

  &__phase-title {
    font-size:$font-size-md; font-weight:700; color:$color-white;
    background:$color-navy; padding:$space-2 $space-4;
    border-radius:$radius-md $radius-md 0 0;
  }

  &__matches {
    display:grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap:$space-3;
    padding:$space-3;
    background:$color-gray-100;
    border-radius: 0 0 $radius-md $radius-md;
    border:1px solid $color-gray-200;
    border-top:none;
  }

  &__match {
    @include card;
    padding:$space-3;
    border-left:3px solid $color-gray-200;
    &--done { border-left-color: $color-green; }
    &--live { border-left-color: $color-live; }
    &--sched { border-left-color: $color-gray-200; }
  }

  &__team {
    display:flex; justify-content:space-between; align-items:center;
    padding:$space-1 0;
    font-size:$font-size-sm;
    color:$color-gray-700;
    &--winner { font-weight:700; color:$color-navy; }
    &:first-child { border-bottom:1px solid $color-gray-200; padding-bottom:$space-2; margin-bottom:$space-1; }
  }

  &__goal { font-weight:700; font-size:$font-size-md; min-width:20px; text-align:right; }

  &__meta { font-size:$font-size-xs; color:$color-gray-400; margin-top:$space-2; text-align:right; }
}
</style>
