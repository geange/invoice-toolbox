<template>
    <div>
        <el-container>
            <el-header>
                <el-button @click="selectDirectory">
                    打开文件夹
                </el-button>
                <el-button v-if="multipleSelection.length > 0" @click="identify">识别</el-button>
                <el-button v-if="multipleSelection.length > 0" @click="handleExport">导出CSV</el-button>
                <el-button v-if="multipleSelection.length > 0" @click="handleRename">批量重命名</el-button>
            </el-header>
            <el-main style="height: 100%">
                <el-table ref="multipleTableRef" :data="tableData" style="width: 100%; height: 500px;"
                    @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column property="path" label="图片">
                        <template #default="scope">
                            <el-image style="width: 50px; height: 50px" :src="scope.row.url" fit="scale-down"
                                :preview-src-list="[scope.row.url]" :initial-index="0" preview-teleported />
                        </template>
                    </el-table-column>
                    <el-table-column property="name" label="名称" width="250" />
                    <el-table-column label="状态">
                        <template #default="scope">
                            <el-button v-if="scope.row.scan" type="success" size="small" :icon="Check" circle :plain=true
                                :dark="isDark" />
                            <el-button v-if="!scope.row.scan" type="danger" size="small" :icon="Close" circle :plain=true
                                :dark="isDark" />
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <!-- <template #default="scope">
                            <el-button @click="showImageResult(scope.row)">详细</el-button>
                        </template> -->

                    </el-table-column>
                </el-table>
            </el-main>
        </el-container>
    </div>

    <el-dialog v-model="centerDialogVisible" width="60%" align-center>
        <div style="text-align: center;">
            <el-progress type="line" :stroke-width="10" :percentage="percentage" :color="colors" :status="getStatus()" />
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button v-if="percentage !== 100" @click="handlePause()">停止</el-button>
                <el-button :disabled="percentage !== 100 && !pause" @click="saveResult()">保存结果</el-button>
            </span>
        </template>
    </el-dialog>

    <el-drawer v-model="openDrawer" size="100%" direction="ltr" :before-close="closeDrawer" :show-close="true">
        <InvoiceView />
    </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { open } from '@tauri-apps/api/dialog'
import { appDir, join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useDark } from '@vueuse/core'
import { exists, createDir, readDir, readTextFile, renameFile, BaseDirectory, writeTextFile } from '@tauri-apps/api/fs'
import { sendNotification } from '@tauri-apps/api/notification'
import { getToken, getVatInvoice } from '../api/baidu'
import InvoiceView from './InvoiceView.vue'
import { stringify } from 'csv-stringify/browser/esm/sync'

const multipleTableRef = ref({})
const multipleSelection = ref([])
const tableData = ref([])
// 识别结果
const invoiceResult = ref({})

const handleSelectionChange = (val) => {
    multipleSelection.value = val
}

const isDark = useDark()

const baseDir = ref('')


const centerDialogVisible = ref(false)
const pause = ref(false)

const selectDirectory = async () => {
    await open({
        directory: true,
        multiple: false,
        defaultPath: await appDir(),
    }).then(async (res) => {
        baseDir.value = res

        tableData.value = await readAllFiles()

        const path = await join(baseDir.value, "result.json")
        await readTextFile(path, {}).then(contents => {
            invoiceResult.value = JSON.parse(contents)

            for (let i in tableData.value) {
                if (hasInvoiceResult(tableData.value[i].name)) {
                    tableData.value[i].scan = true
                }
            }
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
}



const readAllFiles = async () => {
    const files = await readDir(baseDir.value, { recursive: false })

    let filters = []
    for (const idx in files) {
        let name = files[idx].name
        if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) {
            files[idx].url = convertFileSrc(files[idx].path)
            filters.push(files[idx])
        }
    }
    return filters
}

const settings = ref({
    ak: '',
    sk: '',
})

const loadConfig = async () => {
    await createDir('', { dir: BaseDirectory.App, recursive: true })

    const contents = await readTextFile('app.json', { dir: BaseDirectory.App })
    settings.value = JSON.parse(contents)
    await getToken(settings.value.ak, settings.value.sk).then(resp => {
        token.value = resp.data.access_token
        console.log(token.value)
    }).catch(err => {
        console.log(err)
        sendNotification({ title: 'invoice-toolbox', body: '获取Token失败:' + err })
    })
}
loadConfig()

// 获取处理结果
const loadInvoiceResult = async () => {

}


const token = ref('')
// 获取token 信息
const identify = async () => {
    centerDialogVisible.value = true
    await dealInvoice()
}

const percentage = ref(0)
const colors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#6f7ad3', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#5cb87a', percentage: 100 },
]

const dialogTitle = () => {
    if (percentage.value < 100) {
        return '处理中，请稍后'
    }
    return '处理完成！'
}

const handlePause = () => {
    pause.value = true
}

const dealInvoice = async () => {
    let i = 0
    let size = multipleSelection.value.length
    for (let idx in multipleSelection.value) {
        if (pause.value) {
            return
        }

        const path = multipleSelection.value[idx].path
        const name = multipleSelection.value[idx].name
        const isScan = multipleSelection.value[idx].scan

        if (!isScan) {
            await getVatInvoice(token.value, path).then(res => {
                invoiceResult.value[name] = res.data
                multipleSelection.value[idx].scan = true
            }).catch(err => {
                sendNotification({
                    title: 'invoice-toolbox',
                    body: name + '识别失败:' + err
                })
            })
        }

        i++
        percentage.value = parseInt(i / size * 100)
    }
}

const getStatus = () => {
    if (percentage.value < 100) {
        return ''
    }
    return 'success'
}

const hasInvoiceResult = (name) => {
    return invoiceResult.value[name] != undefined
}

const getInvoiceResult = (name) => {
    return invoiceResult.value[name]
}

const saveResult = async () => {
    const data = JSON.stringify(invoiceResult.value)
    const path = await join(baseDir.value, "result.json")
    await writeTextFile(path, data, {}).then(_ => {
        centerDialogVisible.value = false
        percentage.value = 0
        pause.value = false
    }).catch(err => {
        console.log(err)
    })
}

const currentResult = ref({})
const imageInfo = ref({
    path: '',
    width: 0,
    height: 0,
})
const openDrawer = ref(false)
const showImageResult = (item) => {
    openDrawer.value = true
    currentResult.value = getInvoiceResult(item.name)

    const path = convertFileSrc(item.path)

    console.log(path)

    let newImage = new Image()
    newImage.src = path

    imageInfo.value = {
        path: path,
        height: newImage.height,
        width: newImage.width,
    }
    console.log(newImage.height)
    console.log(newImage.width)
}

const closeDrawer = () => {
    openDrawer.value = false
    currentResult.value = {}
    imageInfo.value = {
        path: '',
        width: 0,
        height: 0,
    }
}

const handleExport = async () => {
    let records = []

    records.push([
        "发票代号",
        "发票号码",
        "日期",
        "货物名",
        "金额",
        "税额",
        "价税合计",
        "销售方名称",
        "购买方",
        "购买方地址",
        "税号"
    ])

    for (let i in multipleSelection.value) {
        let name = multipleSelection.value[i].name

        if (invoiceResult.value[name] === undefined) {
            continue
        }

        console.log(invoiceResult.value[name])

        let result = invoiceResult.value[name].words_result

        let commodityName = ''
        for (let k in result.CommodityName) {
            if (commodityName === '') {
                commodityName = result.CommodityName[k].word
            } else {
                commodityName += ',' + result.CommodityName[k].word
            }
        }

        records.push([
            result.InvoiceCode,
            result.InvoiceNum,
            result.InvoiceDate,
            commodityName,
            result.TotalAmount,
            result.TotalTax,
            result.AmountInFiguers,
            result.SellerName,
            result.PurchaserName,
            result.PurchaserAddress,
            result.PurchaserRegisterNum,
        ])
    }

    let data = stringify(records)

    const csvPath = await join(baseDir.value, "out.csv")
    await writeTextFile(csvPath, data, {}).then(_ => {
        sendNotification({ title: 'invoice-toolbox', body: '导出文件成功' })
    }).catch(err => {
        console.log(err)
    })
}

// 批量重命名
const handleRename = async () => {
    for (let i in multipleSelection.value) {
        let name = multipleSelection.value[i].name
        let path = multipleSelection.value[i].path

        if (invoiceResult.value[name] === undefined) {
            continue
        }

        let value = invoiceResult.value[name]
        delete invoiceResult.value[name]

        let invoice_num = value.words_result.InvoiceNum

        let ext = ""
        if (name.endsWith(".jpg")) {
            ext = ".jpg"
        } else if (name.endsWith(".jpeg")) {
            ext = ".jpeg"
        } else if (name.endsWith(".png")) {
            ext = ".png"
        }

        if (ext == "") {
            continue
        }

        let newName = invoice_num + ext

        invoiceResult.value[newName] = value

        const newPath = await join(baseDir.value, newName)
        await renameFile(path, newPath, {})
        multipleSelection.value[i].name = newName
    }
    await saveResult()
    multipleSelection.value = {}
    reloadDir()
}

const reloadDir = async () => {
    tableData.value = await readAllFiles()

    const path = await join(baseDir.value, "result.json")
    await readTextFile(path, {}).then(contents => {
        invoiceResult.value = JSON.parse(contents)

        for (let i in tableData.value) {
            if (hasInvoiceResult(tableData.value[i].name)) {
                tableData.value[i].scan = true
            }
        }
    }).catch(err => {
        console.log(err)
    })
}

</script> 

<script>
</script>
  