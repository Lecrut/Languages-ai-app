<script setup lang="ts">
import { useAuthStore } from '../../stores/use-auth-store'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleRegister = async () => {
  try {
    await authStore.register(email.value, password.value)
    await router.push('/user/profile')
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
        <VCardTitle class="text-h5">{{ t('register.title') }}</VCardTitle>
        <VCardText>
          <VAlert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ authStore.error }}
          </VAlert>
          <VTextField v-model="email" :label="t('register.email')" type="email" variant="outlined" class="mb-3" />
          <VTextField v-model="password" :label="t('register.password')" type="password" variant="outlined" />
        </VCardText>
        <VCardActions>
          <VBtn
            color="primary"
            block
            :loading="authStore.loading"
            :disabled="!email || !password"
            @click="handleRegister"
          >
            {{ t('register.submit') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
