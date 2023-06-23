<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="20%">
        <el-menu :default-active="activeIndex" @open="handleOpen" @close="handleClose">
          <el-sub-menu index="1">
            <template #title>
              <el-icon>
                <location />
              </el-icon>
              <span>功能</span>
            </template>
            <el-menu-item index="1-1" @click="handleClick">发票识别</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>
              <el-icon>
                <document />
              </el-icon>
              <span>设置</span>
            </template>
            <el-menu-item index="2-1" @click="handleClick">密钥</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="3" @click="handleClick">
            <el-icon>
              <setting />
            </el-icon>
            <span>关于</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-main>
          <div v-if="activeIndex == '1-1'">
            <Invoice />
          </div>
          <div v-if="activeIndex == '2-1'">
            <KeySetting />
          </div>
          <div v-if="activeIndex == '3'">
            <About />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import Invoice from './components/Invoice.vue'
import KeySetting from './components/KeySetting.vue'
import About from './components/About.vue'
import { isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';

// 检查
const checkPermission = async () => {
  let permissionGranted = await isPermissionGranted()
  if (!permissionGranted) {
    const permission = await requestPermission()
    permissionGranted = permission === 'granted'
  }
}
checkPermission()

const activeIndex = ref('1-1')

const handleOpen = (key, keyPath) => {
  console.log(key, keyPath)
}
const handleClose = (key, keyPath) => {

  console.log(key, keyPath)
}

const handleClick = (proxy) => {
  activeIndex.value = proxy.index
}

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
