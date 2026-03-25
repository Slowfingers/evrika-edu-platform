<script>
  import InteractiveTarget from '$lib/components/InteractiveTarget.svelte';
  import { t } from '$lib/stores/lang.js';
</script>

<svelte:head>
  <title>{$t('title_target')}</title>
</svelte:head>

<InteractiveTarget />
