<template>
  <div :class="['match-card', `match-card--${statusClass}`]">
    <!-- Cabecera: grupo + jornada -->
    <div class="match-card__meta">
      <span v-if="match.grupo" class="match-card__group">Grupo {{ match.grupo }}</span>
      <span v-if="match.jornada" class="match-card__jornada">{{ match.jornada }}</span>
      <span v-if="match.estado === 'IN_PLAY'" class="badge badge--live">En vivo</span>
    </div>

    <!-- Resultado real -->
    <div class="match-card__result">
      <span class="match-card__team match-card__team--home">{{ match.casa }}</span>
      <span class="match-card__score">
        <template v-if="match.golCasa !== null && match.golFuera !== null">
          {{ match.golCasa }} – {{ match.golFuera }}
        </template>
        <template v-else-if="match.estado === 'IN_PLAY'">
          <span class="match-card__score-live">EN VIVO</span>
        </template>
        <template v-else>
          <span class="match-card__score-time">{{ kickoffTime }}</span>
        </template>
      </span>
      <span class="match-card__team match-card__team--away">{{ match.fuera }}</span>
    </div>

    <!-- Acordeón de predicciones -->
    <button class="match-card__toggle" @click="open = !open">
      <span>Predicciones</span>
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
                <template v-if="pred.golCasa !== null && pred.golFuera !== null">
                  {{ pred.golCasa }} – {{ pred.golFuera }}
                </template>
                <template v-else>–</template>
              </td>
              <td v-if="played" class="match-card__pred-result">
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

const played = computed(() => props.match.estado === 'FINISHED');

const statusClass = computed(() => {
  if (props.match.estado === 'IN_PLAY') return 'live';
  if (props.match.estado === 'FINISHED') return 'done';
  return 'sched';
});

const kickoffTime = computed(() => {
  const d = new Date(props.match.fechaUtc);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
});

function signo(golCasa: number | null, golFuera: number | null) {
  if (golCasa === null || golFuera === null) return null;
  if (golCasa > golFuera) return '1';
  if (golCasa === golFuera) return 'X';
  return '2';
}

function rowClass(pred: MatchWithPredictions['predicciones'][0]) {
  if (!played.value || pred.golCasa === null) return '';
  const realSigno = signo(props.match.golCasa, props.match.golFuera);
  const predSigno = signo(pred.golCasa, pred.golFuera);
  const isExact = pred.golCasa === props.match.golCasa && pred.golFuera === props.match.golFuera;
  if (isExact) return 'match-card__pred-row--exact';
  if (realSigno && predSigno === realSigno) return 'match-card__pred-row--win';
  return 'match-card__pred-row--miss';
}

function badgeClass(pred: MatchWithPredictions['predicciones'][0]) {
  const cls = rowClass(pred);
  if (cls.includes('exact')) return 'badge--exact';
  if (cls.includes('win')) return 'badge--win';
  return 'badge--done';
}

function resultLabel(pred: MatchWithPredictions['predicciones'][0]) {
  const cls = rowClass(pred);
  if (cls.includes('exact')) return 'Exacto';
  if (cls.includes('win')) return '1X2 ✓';
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
  }

  &__group  { font-weight: 600; color: $color-navy; }

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
    min-width: 80px;

    &-time { font-size: $font-size-sm; color: $color-gray-400; font-weight: 400; }
    &-live { font-size: $font-size-sm; color: $color-live; font-weight: 700; animation: pulse 1.5s infinite; }
  }

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

  &__predictions { padding: 0; }

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

.slide-enter-active, .slide-leave-active { transition: max-height .25s ease, opacity .2s; max-height: 800px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
</style>
