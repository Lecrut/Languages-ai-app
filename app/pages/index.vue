<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { setPageMeta } = usePageHead()

onMounted(() => {
  setPageMeta(t('app.title'), t('home.quote'))
})
</script>

<template>
  <VRow
    class="justify-center align-center"
    style="min-height: 70vh;">
    <VCol
      cols="12"
      sm="11"
      md="9"
      lg="7"
      xl="6">
      <VCard
        rounded="xl"
        elevation="10">
        <VImg
          src="/images/socrates.png"
          :alt="t('home.imageAlt')"
          height="280"
          cover
          class="align-end"
          :rounded="0"
        >
          <template #error>
            <div class="d-flex align-center justify-center h-100 bg-primary">
              <VIcon
                icon="mdi-image-off-outline"
                size="44"
                color="white" />
            </div>
          </template>
        </VImg>

        <VCardText class="pa-6 pa-md-10 text-center">
          <blockquote class="text-headline-large font-weight-medium mb-4">
            "{{ t('home.quote') }}"
          </blockquote>
          <div class="text-body-large text-medium-emphasis mb-8">~ {{ t('home.author') }}</div>

          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :to="localePath('/auth/login')">
            {{ t('home.cta') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
