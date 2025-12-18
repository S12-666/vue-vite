import request from "./request";

export function getSpecData(params) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getKeyIndicatorsByTime/all',
        method: 'get',
        params // get请求参数一般放在 params 里
    })
}

export function getSpecCountByTime(params) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getSpecCountByTime/all',
        method: 'get',
        params
    })
}

export function getHeatingReport(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getHeatingReport',
        method: 'post',
        data
    })
}