import axios from "axios";
import {ElMessage} from 'element-plus';
import config from "@/config";
const service = axios.create({
    baseURL : config.baseApi,
});

// 添加请求拦截器
service.interceptors.request.use(
    function (config) {
    // 在发送请求之前做些什么
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
service.interceptors.response.use((res) => {
    const {code, data, msg} = res.data;
    if(code === 200){
        return data;
    }else{
        const NET_WORK_ERROR = "net error";
        ElMessage.error(msg || NET_WORK_ERROR);
        return Promise.reject(msg || NET_WORK_ERROR);
    }
});
function isTrue(value) {
    return value === true;
}
function request(options){
    options.method = options.method || 'get';
    // 关于get请求参数的调整
    if(options.method.toLowerCase() === 'get'){
        options.params = options.data;
    };
    // 对mock的开关处理
    let isMock = config.mock;
    if(typeof options.mock !== 'undefined'){
        isMock = options.mock;
    };
    if(config.env === 'prod') {
        // 不能用mock
        service.defaults.baseURL = config.baseApi;
    }else{
        // 判断mock是否启用
        // console.log("Mock_State:",isTrue(isMock));
        service.defaults.baseURL = isMock ? config.mockApi : config.baseApi;
    };
    return service(options);
};

export default request;