<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    await router.push(localePath('/user'))
  }
  catch {
    // Error message is handled in the store and shown in the alert.
  }
}
</script>

<template>
  <VRow class="justify-center">
    <VCol cols="12" sm="10" md="8" lg="5">
      <VCard>
        <VCardTitle class="text-h5 text-center my-3">{{ t('login.title') }}</VCardTitle>
        <VCardText>
          <VAlert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ authStore.error }}
          </VAlert>
          <VTextField v-model="email" :label="t('login.email')" type="email" variant="outlined" class="mb-3" />
          <VTextField v-model="password" :label="t('login.password')" type="password" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="!email || !password"
            @click="handleLogin"
          >
            {{ t('login.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-2">{{ t('login.noAccount') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/register')">
            {{ t('login.registerNow') }}
          </VBtn>

          <div class="text-body-2 mt-2">{{ t('login.forgotPasswordPrompt') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/reset-password')">
            {{ t('login.resetPassword') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
