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
        <VCardTitle class="text-h5">{{ t('play.title') }}</VCardTitle>
        <VCardText>{{ t('play.description') }}</VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
