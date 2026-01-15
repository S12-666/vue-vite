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

export function getRollingReport(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getRollingReport',
        method: 'post',
        data
    })
}

export function getCoolingReport(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getCoolingReport',
        method: 'post',
        data
    })
}

export function getFQCReport(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getFQCReport',
        method: 'post',
        data
    })
}

export function getHeatingDetial(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getHeatingDetial',
        method: 'post',
        data
    })
}

export function getRollingDetial(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getRollingDetial',
        method: 'post',
        data
    })
}

export function getCoolingDetial(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getCoolingDetial',
        method: 'post',
        data
    })
}

export function getFQCDetial(data) {
    return request({
        url: '/newbaogangapi/v1.0/pidas/getFQCDetial',
        method: 'post',
        data
    })
}

export function getPredictionUpid(params) {
    return request({
        url: '/newbaogangapi/v1.0/prediction/getPredictionUpid',
        method: 'get',
        params
    })
}

export function getPredictionResult(data) {
    return request({
        url: '/newbaogangapi/v1.0/prediction/singelplate',
        method: 'post',
        data,
        timeout: 60000
    })
}