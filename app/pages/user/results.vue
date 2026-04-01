<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="12" md="10" lg="8">
      <VCard>
        <VCardTitle class="text-h5">{{ t('results.title') }}</VCardTitle>
        <VCardText>{{ t('results.description') }}</VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
