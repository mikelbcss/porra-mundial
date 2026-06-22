import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/clasificacion', name: 'standings', component: () => import('@/views/StandingsView.vue') },
    { path: '/participantes', name: 'participants', component: () => import('@/views/ParticipantsView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
