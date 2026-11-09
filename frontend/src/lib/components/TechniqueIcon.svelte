<script>import {techniqueIcon} from '#lib/utils/design-labels.js';export let id;export let size=64;export let eager=false;</script>
<img class="technique-icon" src={techniqueIcon(id)} alt="" width={size} height={size} loading={eager?'eager':'lazy'} decoding="async" aria-hidden="true" />
<style>.technique-icon{display:block;flex-shrink:0;object-fit:contain;max-width:100%;}</style>
