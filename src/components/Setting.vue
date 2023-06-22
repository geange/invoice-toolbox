<template>
    <el-icon class="is-loading" size="30px">
        <Setting />
    </el-icon>
    <el-divider />
    <el-form :model="settings" label-width="30px">
        <el-form-item label="AK">
            <el-input v-model="settings.ak" placeholder="请填写你的 API Key" />
        </el-form-item>
        <el-form-item label="SK">
            <el-input v-model="settings.sk" type="password" placeholder="请填写你的 Secret Key" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="handleSave" :plain=true :dark="isDark">保存</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { configDir } from '@tauri-apps/api/path'
import { exists, createDir, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/api/fs'

// 设置
const settings = ref({
    ak: '',
    sk: '',
})

const loadConfig = async () => {
    await createDir('', { dir: BaseDirectory.App, recursive: true })
    
    await readTextFile('app.json', { dir: BaseDirectory.App }).then(contents => {
        settings.value = JSON.parse(contents)
    }).catch(err => {

        console.log(err)
    })

}
loadConfig()

const isDark = useDark()

const handleSave = async () => {
    // 创建目录
    await createDir('', { dir: BaseDirectory.App, recursive: true })

    const content = JSON.stringify(settings.value)
    await writeTextFile('app.json', content, { dir: BaseDirectory.App }).then(_ => {

    }).catch(err => {
        console.log(err)
    })
}

const configDirPath = ref('')
const getConfigDirPath = async () => {
    const value = await configDir()
    configDirPath.value = value
}
getConfigDirPath()


</script>