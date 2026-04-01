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

    <VMain>
      <VContainer :class="contentContainerClass">
        <VRow v-if="sharedStore.loading" class="min-h-screen" align="center" justify="center">
          <VCol cols="12" class="d-flex justify-center">
            <VProgressCircular indeterminate color="primary" :size="68" :width="6" />
          </VCol>
        </VRow>
        <slot v-else />
      </VContainer>
    </VMain>
  </div>
</template>
