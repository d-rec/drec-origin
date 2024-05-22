<template>
  <div>
    <p><strong>Owned by:</strong> {{ owner }}</p>
    <p><strong>Last updated:</strong> {{ lastUpdated }}</p>
    <p><strong>Read time:</strong> {{ readTime }}</p>
    <p><strong>Views:</strong> {{ views }}</p>
  </div>
</template>

<script>
export default {
  data() {