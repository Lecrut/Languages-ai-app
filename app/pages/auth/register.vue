<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordsMismatch = computed(() => Boolean(confirmPassword.value) && password.value !== confirmPassword.value)
const isRegisterDisabled = computed(() => !username.value || !email.value || !password.value || !confirmPassword.value || passwordsMismatch.value)

const handleRegister = async () => {
  if (passwordsMismatch.value) {
    return
  }

  try {
    await authStore.register(email.value, password.value)
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
        <VCardTitle class="text-h5 text-center my-3">{{ t('register.title') }}</VCardTitle>
        <VCardText>
          <VAlert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ authStore.error }}
          </VAlert>

          <VAlert
            v-if="passwordsMismatch"
            type="warning"
            variant="tonal"
            class="mb-3"
          >
            {{ t('register.passwordMismatch') }}
          </VAlert>

          <VTextField v-model="username" :label="t('register.username')" variant="outlined" class="mb-3" />
          <VTextField v-model="email" :label="t('register.email')" type="email" variant="outlined" class="mb-3" />
          <VTextField v-model="password" :label="t('register.password')" type="password" variant="outlined" class="mb-3" />
          <VTextField v-model="confirmPassword" :label="t('register.confirmPassword')" type="password" variant="outlined" />
        </VCardText>

        <VCardActions class="justify-center pt-0">
          <VBtn
            color="primary"
            size="large"
            class="px-10"
            :loading="authStore.loading"
            :disabled="isRegisterDisabled"
            @click="handleRegister"
          >
            {{ t('register.submit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-2 pb-4 d-flex flex-column align-center text-center ga-1">
          <div class="text-body-2">{{ t('register.haveAccount') }}</div>
          <VBtn variant="text" size="small" color="secondary" :to="localePath('/auth/login')">
            {{ t('register.loginNow') }}
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
