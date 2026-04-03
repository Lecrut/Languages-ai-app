<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute } from 'vue-router'
import { useSharedStore } from '../stores/use-shared-store'

const { smAndDown } = useDisplay()
const contentContainerClass = computed(() => (smAndDown.value ? 'py-6 pb-16' : 'py-6'))
const route = useRoute()
const isResultsRoute = computed(() => route.path.includes('/user/results'))
const sharedStore = useSharedStore()
</script>

<template>
  <div>
    <AppTopBar />
    <AppSnackbar />

    <VMain class="position-relative">
      <VContainer
        :fluid="isResultsRoute"
        :class="contentContainerClass">
        <slot />
      </VContainer>

      <VOverlay
        :model-value="sharedStore.loading"
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
    </VMain>
  </div>
</template>
