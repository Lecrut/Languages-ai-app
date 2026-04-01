<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()
const contentContainerClass = computed(() => (smAndDown.value ? 'py-6 pb-16' : 'py-6'))
</script>

<template>
  <div>
    <AppTopBar />

    <VMain>
      <VContainer :class="contentContainerClass">
        <slot />
      </VContainer>
    </VMain>
  </div>
</template>
