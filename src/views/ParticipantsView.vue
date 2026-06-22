<template>
  <div class="participants-view">
    <h2 class="participants-view__title">👥 Predicciones por Participante</h2>

    <div v-if="!store.participantNames.length" class="loading-overlay">
      {{ store.isLoading ? 'Cargando participantes…' : 'Sin participantes. Revisa manifest.json.' }}
    </div>
    <template v-else>
      <div class="participants-view__tabs" role="tablist">
        <button
          v-for="name in store.participantNames"
          :key="name"
          :class="['participants-view__tab', { 'participants-view__tab--active': active === name }]"
          role="tab"
          @click="active = name"
        >{{ name }}</button>
      </div>
      <div class="participants-view__panel">
        <ParticipantPicksPanel :data="activeData" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import ParticipantPicksPanel from '@/components/ParticipantPicksPanel.vue';

const store = useMainStore();
const active = ref<string | null>(null);

const activeData = computed(() => {
  if (!active.value) return null;
  const p = store.participantsData.find((p) => p.nombre === active.value) ?? null;
  if (!p) return null;
  const score = store.leaderboard.find((l) => l.nombre === active.value);
  return score ? { ...p, puntuacion: score } : p;
});

watch(() => store.participantNames, (names) => {
  if (names.length && !active.value) active.value = names[0];
}, { immediate: true });
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
.participants-view {
  &__title { font-size:$font-size-xl; font-weight:700; color:$color-navy; margin-bottom:$space-5; }
  &__tabs { display:flex; flex-wrap:wrap; gap:$space-2; margin-bottom:$space-6; border-bottom:2px solid $color-gray-200; padding-bottom:$space-3; }
  &__tab { padding:$space-2 $space-4; border-radius:$radius-md $radius-md 0 0; font-size:$font-size-sm; font-weight:500; color:$color-gray-700; background:$color-gray-200; transition:background .15s,color .15s; &:hover { background:$color-navy; color:$color-white; } &--active { background:$color-navy; color:$color-white; font-weight:700; } }
  &__panel { min-height:400px; }
}
</style>
