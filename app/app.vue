<script setup lang="ts">
import { useAuthStore } from './stores/use-auth-store'

const authStore = useAuthStore()
</script>

<template>
  <VApp>
    <NuxtRouteAnnouncer />
    <VOverlay
      v-if="!authStore.initialized"
      class="align-center justify-center"
      contained
      persistent
    >
      <VProgressCircular
        indeterminate
        color="primary"
        :size="104"
        :width="8" />
    </VOverlay>
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </VApp>
</template>
