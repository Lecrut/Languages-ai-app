<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useSharedStore } from '../stores/use-shared-store'

const { smAndDown } = useDisplay()
const contentContainerClass = computed(() => (smAndDown.value ? 'py-6 pb-16' : 'py-6'))
const sharedStore = useSharedStore()
</script>

<template>
  <div>
    <AppTopBar />
    <AppSnackbar />

    <VMain class="d-flex">
      <VContainer
        v-if="sharedStore.loading"
        fluid
        class="fill-height d-flex align-center justify-center pa-0"
      >
        <VProgressCircular indeterminate color="primary" :size="68" :width="6" />
      </VContainer>

      <VContainer v-else :class="contentContainerClass">
        <slot />
      </VContainer>
    </VMain>
  </div>
</template>
