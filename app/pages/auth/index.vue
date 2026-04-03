<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="8"
      lg="6">
      <VCard>
        <VCardTitle class="text-headline-large">{{ t('auth.title') }}</VCardTitle>
        <VCardText>{{ t('auth.subtitle') }}</VCardText>
        <VCardActions>
          <VBtn
            color="primary"
            to="/auth/login">{{ t('auth.login') }}</VBtn>
          <VBtn
            variant="outlined"
            to="/auth/register">{{ t('auth.register') }}</VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
