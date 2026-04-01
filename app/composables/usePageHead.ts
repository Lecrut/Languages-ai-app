export const usePageHead = () => {
  const appName = 'Languages AI'

  const setPageTitle = (title: string) => {
    useHead({
      title: `${title} | ${appName}`,
      meta: [
        {
          property: 'og:title',
          content: `${title} | ${appName}`,
        },
      ],
    })
  }

  const setPageDescription = (description: string) => {
    useHead({
      meta: [
        {
          name: 'description',
          content: description,
        },
        {
          property: 'og:description',
          content: description,
        },
      ],
    })
  }

  const setPageMeta = (title: string, description: string) => {
    useHead({
      title: `${title} | ${appName}`,
      meta: [
        {
          name: 'description',
          content: description,
        },
        {
          property: 'og:title',
          content: `${title} | ${appName}`,
        },
        {
          property: 'og:description',
          content: description,
        },
      ],
    })
  }

  return { setPageTitle, setPageDescription, setPageMeta, appName }
}
