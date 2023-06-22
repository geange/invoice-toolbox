
// 将 uint8Array 转 base64
export const Base64 = (array) => {
    var binary = ''
    for (var len = array.byteLength, i = 0; i < len; i++) {
        binary += String.fromCharCode(array[i])
    }
    return window.btoa(binary)
}