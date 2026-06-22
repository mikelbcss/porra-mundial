<template>
  <div class="app">
    <header class="app__header">
      <div class="app__header-inner">
        <div class="app__brand">
          <span class="app__brand-icon">⚽</span>
          <span class="app__brand-text">Porra Mundial 2026</span>
        </div>
        <nav class="app__nav">
          <RouterLink to="/" class="app__nav-link" active-class="app__nav-link--active" exact>
            Inicio
          </RouterLink>
          <RouterLink to="/clasificacion" class="app__nav-link" active-class="app__nav-link--active">
            Clasificación Real
          </RouterLink>
          <RouterLink to="/participantes" class="app__nav-link" active-class="app__nav-link--active">
            Participantes
          </RouterLink>
        </nav>
        <div class="app__refresh">
          <button class="app__refresh-btn" :disabled="store.isLoading" @click="store.fetchAll()">
            <span :class="['app__refresh-icon', { spinning: store.isLoading }]">↻</span>
          </button>
          <span v-if="store.lastUpdated" class="app__refresh-time">
            Actualizado {{ timeAgo }}
          </span>
          <span v-else class="app__refresh-time">Cargando…</span>
        </div>
      </div>
    </header>

    <main class="app__main">
      <div v-if="store.error" class="error-banner">
        Error al cargar datos: {{ store.error }}
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';

const store = useMainStore();

const timeAgo = computed(() => {
  if (!store.lastUpdated) return '';
  const diff = Math.floor((Date.now() - store.lastUpdated.getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  return `hace ${Math.floor(diff / 60)}m`;
});

onMounted(() => store.startPolling());
onUnmounted(() => store.stopPolling());
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__header {
    background: $color-navy;
    color: $color-white;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: $shadow-md;
  }

  &__header-inner {
    max-width: $bp-xl;
    margin: 0 auto;
    padding: $space-3 $space-6;
    @include flex-between;
    gap: $space-4;
    flex-wrap: wrap;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $font-size-lg;
    font-weight: 700;
    letter-spacing: -.01em;

    &-icon { font-size: 1.5rem; }
  }

  &__nav {
    display: flex;
    gap: $space-1;
  }

  &__nav-link {
    padding: $space-2 $space-4;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: 500;
    color: rgba($color-white, .75);
    transition: background .15s, color .15s;

    &:hover { background: rgba($color-white, .1); color: $color-white; }
    &--active { background: $color-green; color: $color-navy; font-weight: 700; }
  }

  &__refresh {
    display: flex;
    align-items: center;
    gap: $space-2;

    &-btn {
      color: $color-white;
      font-size: 1.25rem;
      line-height: 1;
      opacity: .7;
      transition: opacity .15s;
      &:hover:not(:disabled) { opacity: 1; }
      &:disabled { cursor: default; }
    }

    &-icon {
      display: inline-block;
      &.spinning { animation: spin .8s linear infinite; }
    }

    &-time {
      font-size: $font-size-xs;
      color: rgba($color-white, .55);
    }
  }

  &__main {
    flex: 1;
    max-width: $bp-xl;
    width: 100%;
    margin: 0 auto;
    padding: $space-6;

    @include responsive($bp-md) { padding: $space-4; }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
