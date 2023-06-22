<template>
  <el-tabs v-model="activeName" class="demo-tabs" tab-position="right">
    <el-tab-pane label="发票" name="invoice">
      <Invoice />
    </el-tab-pane>
    <el-tab-pane label="设置" name="setting">
      <Setting />
    </el-tab-pane>
    <el-tab-pane label="关于" name="about">
      <About />
    </el-tab-pane>
  </el-tabs>
</template>


<script setup>
import { ref } from 'vue'
import Invoice from './components/Invoice.vue'
import Setting from './components/Setting.vue'
import About from './components/About.vue'
import { isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';

const activeName = ref('invoice')

// 检查
const checkPermission = async () => {
  let permissionGranted = await isPermissionGranted()
  if (!permissionGranted) {
    const permission = await requestPermission()
    permissionGranted = permission === 'granted'
  }
}
checkPermission()
</script>

<style>
.custom-tabs>.el-tabs__content {
  padding-left: 32px;
  padding-right: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>
