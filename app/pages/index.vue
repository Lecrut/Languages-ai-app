<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="text-h5">{{ t('home.title') }}</VCardTitle>
        <VCardText>{{ t('home.description') }}</VCardText>
        <VCardActions>
          <VBtn color="primary" to="/auth">{{ t('home.goAuth') }}</VBtn>
          <VBtn variant="outlined" to="/user/profile">{{ t('home.goProfile') }}</VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
