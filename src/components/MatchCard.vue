<template>
  <div :class="['match-card', `match-card--${statusClass}`]">
    <!-- Meta: grupo + jornada + estado -->
    <div class="match-card__meta">
      <span v-if="match.grupo" class="match-card__group">Grupo {{ match.grupo }}</span>
      <span v-if="match.jornada" class="match-card__jornada">{{ match.jornada }}</span>
      <span v-if="isLive" class="badge badge--live">
        🔴 {{ minuteLabel }}
      </span>
      <span v-else-if="match.estado === 'FINISHED'" class="badge badge--done">Finalizado</span>
      <span v-else class="badge badge--sched">{{ kickoffTime }}</span>
    </div>

    <!-- Marcador -->
    <div class="match-card__result">
      <span class="match-card__team match-card__team--home">{{ match.casa }}</span>
      <span class="match-card__score">
        <template v-if="match.golCasa !== null && match.golFuera !== null">
          {{ match.golCasa }} – {{ match.golFuera }}
        </template>
        <template v-else>–</template>
      </span>
      <span class="match-card__team match-card__team--away">{{ match.fuera }}</span>
    </div>

    <!-- Goles en tiempo real (solo si hay goles) -->
    <div v-if="match.goles && match.goles.length" class="match-card__goals">
      <div
        v-for="(gol, i) in match.goles"
        :key="i"
        :class="['match-card__goal', gol.esCasa ? 'match-card__goal--home' : 'match-card__goal--away']"
      >
        <span class="match-card__goal-icon">{{ goalIcon(gol.tipo) }}</span>
        <span class="match-card__goal-scorer">{{ gol.goleador }}</span>
        <span v-if="gol.asistencia" class="match-card__goal-assist">({{ gol.asistencia }})</span>
        <span class="match-card__goal-minute">{{ minuteStr(gol.minuto, gol.minutoAnadido) }}</span>
      </div>
    </div>

    <!-- Acordeón predicciones -->
    <button class="match-card__toggle" @click="open = !open">
      <span>Predicciones participantes</span>
      <span class="match-card__toggle-icon">{{ open ? '▲' : '▼' }}</span>
    </button>

    <transition name="slide">
      <div v-if="open" class="match-card__predictions">
        <table class="match-card__pred-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Predicción</th>
              <th v-if="played">Resultado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pred in match.predicciones"
              :key="pred.participante"
              :class="rowClass(pred)"
            >
              <td>{{ pred.participante }}</td>
              <td class="match-card__pred-score">
                {{ pred.golCasa !== null && pred.golFuera !== null ? `${pred.golCasa} – ${pred.golFuera}` : '–' }}
              </td>
              <td v-if="played">
                <span :class="['badge', badgeClass(pred)]">{{ resultLabel(pred) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MatchWithPredictions } from '@/types/domain';

const props = defineProps<{ match: MatchWithPredictions }>();
const open = ref(false);

const isLive = computed(() =>
  props.match.estado === 'IN_PLAY' || props.match.estado === 'PAUSED',
);
const played = computed(() => props.match.estado === 'FINISHED');

const statusClass = computed(() => {
  if (isLive.value) return 'live';
  if (played.value) return 'done';
  return 'sched';
});

const minuteLabel = computed(() => {
  if (props.match.estado === 'PAUSED') return 'Descanso';
  if (props.match.minutoActual) return `${props.match.minutoActual}'`;
  return 'En vivo';
});

const kickoffTime = computed(() => {
  const d = new Date(props.match.fechaUtc);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
});

function minuteStr(min: number | null, added: number | null): string {
  if (min === null) return '';
  if (added) return `${min}+${added}'`;
  return `${min}'`;
}

function goalIcon(tipo: string): string {
  if (tipo === 'PROPIA') return '🔴';
  if (tipo === 'PENALTI') return '⚽(p)';
  return '⚽';
}

function signo(a: number | null, b: number | null) {
  if (a === null || b === null) return null;
  return a > b ? '1' : a === b ? 'X' : '2';
}

function rowClass(pred: MatchWithPredictions['predicciones'][0]) {
  if (!played.value || pred.golCasa === null) return '';
  const isExact = pred.golCasa === props.match.golCasa && pred.golFuera === props.match.golFuera;
  if (isExact) return 'match-card__pred-row--exact';
  const realS = signo(props.match.golCasa, props.match.golFuera);
  const predS = signo(pred.golCasa, pred.golFuera);
  if (realS && predS === realS) return 'match-card__pred-row--win';
  return 'match-card__pred-row--miss';
}

function badgeClass(pred: MatchWithPredictions['predicciones'][0]) {
  const c = rowClass(pred);
  if (c.includes('exact')) return 'badge--exact';
  if (c.includes('win')) return 'badge--win';
  return 'badge--done';
}

function resultLabel(pred: MatchWithPredictions['predicciones'][0]) {
  const c = rowClass(pred);
  if (c.includes('exact')) return 'Exacto ⭐';
  if (c.includes('win')) return '1X2 ✓';
  return 'Fallo';
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.match-card {
  @include card;
  overflow: hidden;
  margin-bottom: $space-3;

  &--live { border-left: 3px solid $color-live; }
  &--done { border-left: 3px solid $color-green; }
  &--sched { border-left: 3px solid $color-gray-200; }

  &__meta {
    display: flex;
    gap: $space-2;
    align-items: center;
    padding: $space-2 $space-4;
    background: $color-gray-100;
    font-size: $font-size-xs;
    color: $color-gray-700;
    flex-wrap: wrap;
  }

  &__group { font-weight: 600; color: $color-navy; }

  &__result {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: $space-4;
    padding: $space-4 $space-6;
  }

  &__team {
    font-weight: 600;
    font-size: $font-size-md;
    &--home { text-align: right; }
    &--away { text-align: left; }
  }

  &__score {
    text-align: center;
    font-size: $font-size-xl;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 64px;
  }

  /* ── Goles ── */
  &__goals {
    padding: $space-1 $space-4 $space-3;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__goal {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $font-size-xs;
    color: $color-gray-700;

    &--home { padding-right: 40%; }
    &--away { padding-left: 40%; flex-direction: row-reverse; }
  }

  &__goal-icon { font-size: 0.75rem; flex-shrink: 0; }
  &__goal-scorer { font-weight: 600; }
  &__goal-assist { color: $color-gray-400; }
  &__goal-minute {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    color: $color-gray-400;
    font-weight: 600;
    flex-shrink: 0;

    .match-card__goal--away & { margin-left: 0; margin-right: auto; }
  }

  /* ── Toggle ── */
  &__toggle {
    width: 100%;
    @include flex-between;
    padding: $space-2 $space-4;
    background: $color-gray-100;
    color: $color-gray-700;
    font-size: $font-size-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    border-top: 1px solid $color-gray-200;
    transition: background .15s;
    &:hover { background: $color-gray-200; }
    &-icon { font-size: 0.6rem; }
  }

  /* ── Predicciones ── */
  &__pred-table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;

    thead th {
      background: $color-gray-100;
      color: $color-gray-700;
      font-size: $font-size-xs;
      text-transform: uppercase;
      letter-spacing: .04em;
      padding: $space-2 $space-4;
      text-align: left;
      border-bottom: 1px solid $color-gray-200;
    }
    td { padding: $space-2 $space-4; border-bottom: 1px solid $color-gray-200; }
    tr:last-child td { border-bottom: none; }
  }

  &__pred-score { font-variant-numeric: tabular-nums; font-weight: 600; }

  &__pred-row {
    &--exact { background: rgba($color-accent, .12); }
    &--win   { background: rgba($color-green, .08); }
    &--miss  { opacity: .65; }
  }
}

.slide-enter-active, .slide-leave-active {
  transition: max-height .25s ease, opacity .2s;
  max-height: 800px;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }
</style>
