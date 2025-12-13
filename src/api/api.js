import request from "./request";

export function getUserData(data) {
    return request({
        url: "/home/getUserData",
        method: "get",
        data,
    });
}

export function deleteUser(data) {
    return request({
        url: '/user/deleteUser',
        method: 'get',
        data,
    })
}

export function addUser(data) {
    return request({
        url: '/user/addUser',
        method: 'post',
        data,
    })
}

export function editUser(data) {
    return request({
        url: '/user/editUser',
        method: 'post',
        data,
    })
}

export function getMenu(params) {
    return request({
        url: '/permission/getMenu',
        method: 'post',
        data: params
    })
}

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